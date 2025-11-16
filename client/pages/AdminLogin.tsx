import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Loader2, User, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTheme } from "@/hooks/use-theme";

const ADMIN_EMAIL = "admin@textsewak.com";
const ADMIN_PASSWORD = "textsewak2025";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (password !== ADMIN_PASSWORD) {
        setError("Invalid admin password. Please try again.");
        setPassword("");
        setIsLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      localStorage.setItem("admin_authenticated", "true");
      toast.success("Logged in to admin panel!");
      navigate("/admin/dashboard");
    } catch (error: any) {
      console.error("Admin login failed:", error);
      if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password") {
        setError("Invalid admin password. Please try again.");
      } else if (error?.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Failed to login. Invalid admin credentials.");
      }
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F37f62c68d722453c918104e8c9b5c77d%2F3bebbd34f64b43a2a0d1c98721eccce1?format=webp&width=800"
                alt="TextSewak"
                className="h-12 sm:h-16 w-auto"
              />
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F37f62c68d722453c918104e8c9b5c77d%2F7b1fcc3f1a0840cca478ce303fafa3e4?format=webp&width=800"
                alt="TextSewak Logo"
                className="h-8 sm:h-10 w-auto"
              />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Extract text from any file in seconds
            </p>
          </div>

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
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
            >
              <User size={18} />
              <span className="hidden sm:inline">Login as User</span>
              <span className="sm:hidden">User Login</span>
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-center mb-2">Admin Panel</h1>
            <p className="text-center text-muted-foreground mb-8">
              Enter admin password to access
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Admin Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  required
                  placeholder="Enter admin password"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-2 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  "Access Admin Panel"
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
