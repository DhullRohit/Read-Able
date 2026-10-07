import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Sun, Moon, Menu, X } from "lucide-react";
import logo from "@/assets/readable-logo.png";

const links = [
  { label: "Home", to: "/" },
  { label: "Help", to: "/help" },
  { label: "Login", to: "/login" },
] as const;

export function Navbar() {
  const [lowLight, setLowLight] = useState(() =>
    document.documentElement.classList.contains("lowlight"),
  );
  const [open, setOpen] = useState(false);

  const { location } = useRouterState();
  const path = location.pathname;

  /* sync lowlight class on <html> */
  useEffect(() => {
    document.documentElement.classList.toggle("lowlight", lowLight);
  }, [lowLight]);

  /* close mobile menu on route change */
  useEffect(() => {
    setOpen(false);
  }, [path]);

  const isActive = (to: string) => path === to;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-3" aria-label="ReadAble home">
          <img
            src={logo}
            alt=""
            className="size-10 rounded-xl object-contain"
          />
          <span className="text-xl font-extrabold tracking-tight text-brand">
            ReadAble
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-semibold transition-colors ${
                isActive(l.to)
                  ? "text-brand"
                  : "text-foreground/70 hover:text-brand"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <div className="flex items-center rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setLowLight(false)}
              aria-pressed={!lowLight}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                !lowLight
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Normal</span>
            </button>
            <button
              type="button"
              onClick={() => setLowLight(true)}
              aria-pressed={lowLight}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                lowLight
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Low light</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <nav
          className="border-t border-border bg-background px-6 pb-4 pt-2 md:hidden"
          aria-label="Mobile"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isActive(l.to)
                  ? "bg-brand-soft text-brand"
                  : "text-foreground/70 hover:bg-secondary"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
