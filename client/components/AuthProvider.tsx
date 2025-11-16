import { useState, useEffect, ReactNode } from "react";
import { AuthContext } from "@/hooks/use-auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { toast } from "sonner";
import { User } from "@/lib/firebase";
import { collection, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

      setUser(appUser);
      toast.success("Signed in successfully!");
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      setIsLoading(true);
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
