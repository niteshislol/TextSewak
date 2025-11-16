import { Moon, Sun, LogOut, Shield } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Link, useLocation } from "react-router-dom";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Show "Login as Admin" button only on login page when not authenticated
  const showAdminLogin = !isAuthenticated && location.pathname === "/login";

  return (
    <header className="border-b border-border bg-background">
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
          {isAuthenticated && user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 rounded-lg">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Logged in as</p>
                  <p className="text-sm font-medium truncate max-w-xs">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium shadow-sm"
                title="Sign out"
              >
                <LogOut size={18} />
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
  );
}
