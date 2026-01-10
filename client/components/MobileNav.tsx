import { Link, useLocation } from "react-router-dom";
import { Home, Scale, History, FileText } from "lucide-react";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
    const scrollDirection = useScrollDirection();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    // Only show on mobile/tablet (hidden on md and up) and when authenticated
    if (!isAuthenticated) return null;

    const navItems = [
        { icon: Home, label: "Home", path: "/app" },
        { icon: Scale, label: "Legal", path: "/legalanalysis" },
        { icon: FileText, label: "Generate", path: "/generate" },
        { icon: History, label: "History", path: "/history" },
    ];

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg transition-transform duration-300 md:hidden ${scrollDirection === "down" ? "translate-y-full" : "translate-y-0"
                }`}
        >
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <item.icon size={20} className={isActive ? "fill-current" : ""} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
