import { useState, useEffect, ReactNode } from "react";
import { AuthContext } from "@/hooks/use-auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, db, isLocalMode } from "@/lib/firebase";
import { toast } from "sonner";
import { User } from "@/lib/firebase";
import { collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { saveOfflineCredentials, verifyOfflineCredentials, clearOfflineCredentials } from "@/utils/offlineAuth";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLocalMode) {
      // LOCAL MODE: Auto-login as Local User
      setUser({
        id: "local-user",
        email: "local@textsewak.app"
      });
      setIsLoading(false);
      return;
    }

    // Set a timeout to prevent indefinite loading if Firebase is unreachable
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      clearTimeout(timeout);
      if (firebaseUser) {
        const appUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  async function handleSignUp(email: string, password: string) {
    if (isLocalMode) {
      toast.success("Account created locally!");
      return;
    }
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const appUser: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || "",
      };

      await setDoc(doc(db, "users", userCredential.user.uid), {
        userId: userCredential.user.uid,
        email: userCredential.user.email,
        createdAt: Date.now(),
        historyCount: 0,
      });

      setUser(appUser);
      toast.success("Account created successfully!");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignIn(email: string, password: string) {
    if (isLocalMode) {
      setUser({
        id: "local-user",
        email: "local@textsewak.app"
      });
      toast.success("Signed in locally!");
      return;
    }

    // Hardcoded Offline Mode Bypass
    if (email === "offline@gmail.com" && password === "offline") {
      setUser({
        id: "offline-demo-user",
        email: "offline@gmail.com"
      });
      toast.success("Signed in via Offline Bypass");
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const appUser: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || "",
      };

      const userDocRef = doc(db, "users", userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          createdAt: Date.now(),
          historyCount: 0,
        });
      }

      // Save credentials for offline access
      await saveOfflineCredentials(appUser, password);

      setUser(appUser);
      toast.success("Signed in successfully!");
    } catch (error: any) {
      if (error.code === "auth/network-request-failed") {
        const offlineUser = await verifyOfflineCredentials(email, password);
        if (offlineUser) {
          setUser(offlineUser);
          toast.success("Signed in locally (Offline Mode)");
          return;
        }
      }

      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    if (isLocalMode) {
      // Ideally we don't sign out in local mode or we just stay logged in
      toast.info("Local mode relies on auto-login.");
      return;
    }
    try {
      setIsLoading(true);
      clearOfflineCredentials();
      await firebaseSignOut(auth);
      setUser(null);
      toast.success("Signed out successfully!");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signUp: handleSignUp,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function getErrorMessage(error: any): string {
  if (error.code === "auth/user-not-found") {
    return "User not found";
  } else if (error.code === "auth/wrong-password") {
    return "Invalid password";
  } else if (error.code === "auth/email-already-in-use") {
    return "Email already in use";
  } else if (error.code === "auth/weak-password") {
    return "Password should be at least 6 characters";
  } else if (error.code === "auth/invalid-email") {
    return "Invalid email address";
  }
  return error instanceof Error ? error.message : "An error occurred";
}
