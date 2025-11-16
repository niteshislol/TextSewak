export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            <p>Copyright © 2025 TextSewak</p>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Built with ❤️ by Team - Tachyon</p>
          </div>

          <nav className="flex gap-4">
            <a
              href="#about"
              className="text-sm text-primary hover:underline transition-colors"
            >
              About
            </a>
            <a
              href="#privacy"
              className="text-sm text-primary hover:underline transition-colors"
            >
              Privacy
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
