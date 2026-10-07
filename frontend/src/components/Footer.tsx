import { Link } from "@tanstack/react-router";
import logo from "@/assets/readable-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt=""
              className="size-8 rounded-lg object-contain"
            />
            <span className="text-lg font-bold text-brand">ReadAble</span>
          </Link>

          <nav className="flex items-center gap-6" aria-label="Footer">
            <Link
              to="/"
              className="text-sm text-muted-foreground transition-colors hover:text-brand"
            >
              Home
            </Link>
            <Link
              to="/help"
              className="text-sm text-muted-foreground transition-colors hover:text-brand"
            >
              Help
            </Link>
            <Link
              to="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-brand"
            >
              Login
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ReadAble. Read. Understand. Listen.
            Adapt.
          </p>
        </div>
      </div>
    </footer>
  );
}
