import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn(email, password);
      navigate("/");
    } catch (error: any) {
      console.error("Login failed:", error);
      // Handle different Firebase error codes
      if (error?.code === "auth/user-not-found" || error?.code === "auth/wrong-password" || error?.code === "auth/invalid-credential") {
        setError("Incorrect email or password. Please try again.");
      } else if (error?.code === "auth/invalid-email") {
        setError("Invalid email address. Please check your email format.");
      } else if (error?.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else if (error?.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Incorrect email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = () => {
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-background to-gray-50 dark:from-background dark:via-background dark:to-background text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border-2 border-border/50 dark:border-border rounded-xl p-8 shadow-xl dark:shadow-lg backdrop-blur-sm bg-opacity-95 dark:bg-opacity-100">
            <h1 className="text-3xl font-bold text-center mb-2 text-foreground">Sign In</h1>
            <p className="text-center text-muted-foreground mb-6 text-sm">Welcome back! Please sign in to continue.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    handleInputChange();
                  }}
                  required
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-background/80 dark:bg-background border-2 border-border/60 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    handleInputChange();
                  }}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-background/80 dark:bg-background border-2 border-border/60 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-primary hover:underline font-semibold transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
