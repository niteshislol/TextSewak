import { Moon, Sun, LogOut, Shield, Home, Scale, History, FileText } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Show "Login as Admin" button only on login page when not authenticated
  const showAdminLogin = !isAuthenticated && location.pathname === "/login";

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-500 ease-in-out ${!isScrolled ? "pt-5" : "pt-0"}`}>
      <header
        className={`transition-all duration-500 ease-in-out ${!isScrolled
          ? "w-full md:w-[85%] lg:w-[70%] max-w-6xl md:rounded-full border border-border bg-background/95 backdrop-blur-sm shadow-sm md:shadow-lg rounded-none border-b"
          : "w-full rounded-none border-b border-border bg-background/95 backdrop-blur-sm shadow-sm"
          }`}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <img
                src="/logo-new.png"
                alt="TextSewak Logo"
                className="h-10 sm:h-12 w-auto"
              />
              <div className="flex flex-col justify-center -mt-3">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F37f62c68d722453c918104e8c9b5c77d%2F3bebbd34f64b43a2a0d1c98721eccce1?format=webp&width=800"
                  alt="TextSewak"
                  className="h-9 sm:h-11 w-auto mb-0 object-contain object-left"
                />
                <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-none hidden sm:block -mt-1">
                  Extract text from any file in seconds
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user && (
              <div className="flex items-center gap-3">
                <nav className="hidden md:flex items-center gap-4 mr-2">
                  <Link to="/app" className="p-2 text-foreground hover:bg-muted rounded-full transition-colors" title="Home">
                    <Home size={20} />
                  </Link>
                  <Link to="/legalanalysis" className="p-2 text-foreground hover:bg-muted rounded-full transition-colors" title="BNS Legal Analyzer">
                    <Scale size={20} />
                  </Link>
                  <Link to="/generate" className="p-2 text-foreground hover:bg-muted rounded-full transition-colors" title="Generate FIR">
                    <FileText size={20} />
                  </Link>
                  <Link to="/history" className="p-2 text-foreground hover:bg-muted rounded-full transition-colors" title="History">
                    <History size={20} />
                  </Link>
                </nav>
                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-secondary/50 rounded-lg">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Logged in as</p>
                    <p className="text-sm font-medium truncate max-w-xs">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium shadow-sm text-sm"
                  title="Sign out"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}

            {showAdminLogin && (
              <Link
                to="/admin/login"
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                <Shield size={18} />
                <span className="hidden sm:inline">Login as Admin</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            )}

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
          </div>
        </div>
      </header>
    </div>
  );
}
