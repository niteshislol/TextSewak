import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LogOut, ChevronRight, Loader2, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useTheme } from "@/hooks/use-theme";

interface User {
  id: string;
  email: string;
  createdAt: number;
  historyCount: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupListener = () => {
      try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!isMounted) return;

            const usersList: User[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              usersList.push({
                id: data.userId,
                email: data.email,
                createdAt: data.createdAt,
                historyCount: data.historyCount || 0,
              });
            });
            setUsers(usersList);
            setIsLoading(false);
          },
          (error: any) => {
            if (!isMounted) return;

            console.error("Failed to load users:", error);
            // Don't show error toast for permission errors, as the collection might be empty
            if (error.code !== "permission-denied") {
              toast.error("Failed to load users");
            }
            setIsLoading(false);
          },
        );
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to setup listener:", error);
        setIsLoading(false);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from listener:", error);
        }
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("admin_authenticated");
      toast.success("Logged out from admin panel");
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout");
    }
  };

  const handleViewUser = (userId: string) => {
    navigate(`/admin/user/${userId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-foreground" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            Registered Users ({users.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No users registered yet
            </div>
          ) : (
            <div className="grid gap-3">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleViewUser(user.id)}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-card/80 cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined{" "}
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        OCR Operations: {user.historyCount}
                      </p>
                    </div>
                    <ChevronRight size={24} className="text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
