import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-2 text-primary">404</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Oops! Page not found
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist. Return to the home page
            to use TextSewak.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
