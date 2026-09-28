import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  CheckCircle2,
  Eye,
  EyeOff,
  FileUp,
  Headphones,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  Moon,
  Smartphone,
  Sparkles,
  SlidersHorizontal,
  Sun,
  UserRound,
} from "lucide-react";

import logo from "@/assets/readable-logo.png";
import { ReadingPreferences } from "@/components/ReadingPreferences";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReadAble — Read Without Limits" },
      {
        name: "description",
        content:
          "ReadAble helps you access, understand and enjoy any content your way: upload documents, listen aloud and customize text size, spacing and lighting.",
      },
      {
        property: "og:title",
        content: "ReadAble — Read Without Limits",
      },
      {
        property: "og:description",
        content:
          "Upload, listen, customize. Accessible reading with adjustable text size, comfortable spacing and low-light mode.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),
  component: Index,
});

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Features", href: "#" },
  { name: "How it works", href: "#" },
];

const perks = [
  {
    icon: FileUp,
    title: "Upload",
    sub: "Any Document",
  },
  {
    icon: Headphones,
    title: "Listen",
    sub: "Read Aloud",
  },
  {
    icon: SlidersHorizontal,
    title: "Customize",
    sub: "Your Reading",
  },
  {
    icon: UserRound,
    title: "Accessible",
    sub: "for Everyone",
  },
];

const steps = [
  {
    icon: LogIn,
    title: "Step 1",
    label: "Login / Signup",
  },
  {
    icon: LayoutDashboard,
    title: "Step 2",
    label: "Our interactive dashboard",
  },
  {
    icon: Sparkles,
    title: "Step 3",
    label: "Access multiple features",
  },
  {
    icon: LogOut,
    title: "Step 4",
    label: "Logout / Thank you",
  },
];

function Index() {
  const [lowLight, setLowLight] = useState(false);
  const [scale, setScale] = useState(1);
  const [comfortable, setComfortable] = useState(false);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [contact, setContact] = useState<"email" | "mobile">("email");

  const [showPassword, setShowPassword] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const authRef = useRef<HTMLElement | null>(null);

  const openAuth = (next: "signin" | "signup") => {
    setMode(next);
    setFormError(null);
    setFormSuccess(null);
    setInfoMessage(null);
    setShowAuth(true);
  };

  useEffect(() => {
    if (showAuth) {
      authRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [showAuth]);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("lowlight", lowLight);

    root.style.setProperty("--read-scale", String(scale));
    root.style.setProperty(
      "--read-leading",
      comfortable ? "1.9" : "1.6",
    );
    root.style.setProperty(
      "--read-tracking",
      comfortable ? "0.02em" : "0em",
    );
    root.style.setProperty(
      "--read-word-spacing",
      comfortable ? "0.12em" : "normal",
    );
  }, [lowLight, scale, comfortable]);

  const resetForm = () => {
    setName("");
    setContactValue("");
    setPassword("");
    setFormError(null);
    setFormSuccess(null);
    setInfoMessage(null);
  };

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);
    setFormSuccess(null);
    setInfoMessage(null);

    if (mode === "signup" && name.trim().length < 2) {
      setFormError("Please enter your full name.");
      return;
    }

    if (!contactValue.trim()) {
      setFormError(
        contact === "email"
          ? "Please enter your email address."
          : "Please enter your mobile number.",
      );
      return;
    }

    if (
      contact === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue.trim())
    ) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (
      contact === "mobile" &&
      !/^[+\d][\d\s-]{7,}$/.test(contactValue.trim())
    ) {
      setFormError("Please enter a valid mobile number.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    // Frontend-only mock submission
    window.setTimeout(() => {
      setSubmitting(false);

      setFormSuccess(
        mode === "signin"
          ? `Welcome back! You are signed in${
              remember ? " and will stay signed in" : ""
            }.`
          : "Account created successfully. Welcome to ReadAble!",
      );

      setPassword("");
    }, 900);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER */}
      <header className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-6">
        <a href="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="ReadAble logo"
            className="size-11 rounded-xl object-contain"
          />

          <span className="text-2xl font-extrabold tracking-tight text-brand">
            ReadAble
          </span>
        </a>

        {/* FIXED NAVIGATION MAP */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-brand"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* LIGHT MODE BUTTONS */}
        <div className="ml-auto flex items-center gap-2 rounded-full border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setLowLight(false)}
            aria-pressed={!lowLight}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              !lowLight
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="size-4" aria-hidden="true" />
            Normal
          </button>

          <button
            type="button"
            onClick={() => setLowLight(true)}
            aria-pressed={lowLight}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              lowLight
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="size-4" aria-hidden="true" />
            Low light
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto grid max-w-7xl items-start gap-12 px-6 pb-20 lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT SECTION */}
        <section className="pt-6">
          <p className="text-sm font-bold tracking-[0.2em] text-brand uppercase">
            Accessible • Smart • For everyone
          </p>

          <h1 className="mt-5 text-5xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
            Read Without Limits
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            ReadAble helps you access, understand, and enjoy any content —
            your way. Upload, listen, customize, and make reading effortless.
          </p>

          {/* PERKS */}
          <ul className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {perks.map(({ icon: Icon, title, sub }) => (
              <li key={title} className="text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <Icon className="size-6" aria-hidden="true" />
                </span>

                <p className="mt-3 text-sm font-semibold">{title}</p>

                <p className="text-sm text-muted-foreground">{sub}</p>
              </li>
            ))}
          </ul>

          {/* QUOTE */}
          <blockquote className="mt-10 max-w-lg rounded-2xl bg-brand-soft/60 p-6">
            <p className="text-lg font-medium italic">
              "Because everyone deserves a world of knowledge."
            </p>

            <footer className="mt-2 text-sm font-semibold text-brand">
              — ReadAble
            </footer>
          </blockquote>
        </section>

        {/* HOW IT WORKS */}
        <section className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <h2 className="text-2xl font-bold">How ReadAble works</h2>

          <p className="mt-1 text-muted-foreground">
            Four simple steps from sign in to sign out.
          </p>

          <ol className="mt-6">
            {steps.map(({ icon: Icon, title, label }, i) => (
              <li key={title}>
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-secondary/60 p-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>

                  <span>
                    <span className="block text-xs font-bold tracking-[0.18em] text-brand uppercase">
                      {title}
                    </span>

                    <span className="block text-base font-semibold">
                      {label}
                    </span>
                  </span>
                </div>

                {i < steps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown
                      className="size-6 text-brand"
                      aria-hidden="true"
                    />
                  </div>
                )}
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => openAuth("signin")}
            className="mt-6 w-full rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground transition-opacity hover:opacity-90"
          >
            Start with Step 1 — Login / Signup
          </button>
        </section>
      </main>

      {/* AUTH SECTION */}
      {showAuth && (
        <section
          ref={authRef}
          className="mx-auto mt-4 max-w-xl scroll-mt-6 px-6 pb-24"
        >
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
            {/* SIGN IN / SIGN UP SWITCH */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
              {(["signin", "signup"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchMode(value)}
                  aria-pressed={mode === value}
                  className={`rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                    mode === value
                      ? "bg-brand text-brand-foreground"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {value === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            {/* TITLE */}
            <h2 className="mt-6 text-2xl font-bold">
              {mode === "signin"
                ? "Welcome back"
                : "Create your account"}
            </h2>

            <p className="mt-1 text-muted-foreground">
              {mode === "signin"
                ? "Continue where you left off reading."
                : "Set up ReadAble and start reading comfortably."}
            </p>

            {/* READING PREFERENCES */}
            <div className="mt-5">
              <ReadingPreferences
                scale={scale}
                onScale={setScale}
                comfortable={comfortable}
                onComfortable={setComfortable}
              />
            </div>

            {/* SUCCESS MESSAGE */}
            {formSuccess && (
              <div
                role="status"
                className="mt-5 flex items-start gap-3 rounded-xl border border-brand/40 bg-brand-soft/70 p-4 text-sm font-medium"
              >
                <CheckCircle2
                  className="mt-0.5 size-5 shrink-0 text-brand"
                  aria-hidden="true"
                />

                <span>{formSuccess}</span>
              </div>
            )}

            {/* ERROR MESSAGE */}
            {formError && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm font-medium text-destructive"
              >
                {formError}
              </div>
            )}

            {/* INFO MESSAGE */}
            {infoMessage && (
              <div
                role="status"
                className="mt-5 rounded-xl border border-border bg-secondary p-4 text-sm font-medium text-muted-foreground"
              >
                {infoMessage}
              </div>
            )}

            {/* FORM */}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {/* EMAIL / MOBILE */}
              <div className="grid grid-cols-2 gap-3">
                {(["email", "mobile"] as const).map((value) => {
                  const Icon = value === "email" ? Mail : Smartphone;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setContact(value);
                        setFormError(null);
                      }}
                      aria-pressed={contact === value}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                        contact === value
                          ? "border-brand bg-brand-soft text-accent-foreground"
                          : "border-border bg-secondary text-foreground/80"
                      }`}
                    >
                      <Icon className="size-4" aria-hidden="true" />

                      {value === "email"
                        ? "Email"
                        : "Mobile number"}
                    </button>
                  );
                })}
              </div>

              {/* NAME */}
              {mode === "signup" && (
                <div>
                  <label
                    htmlFor="name"
                    className="text-sm font-semibold"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
              )}

              {/* CONTACT */}
              <div>
                <label
                  htmlFor="contact"
                  className="text-sm font-semibold"
                >
                  {contact === "email"
                    ? "Email address"
                    : "Mobile number"}
                </label>

                <input
                  id="contact"
                  type={contact === "email" ? "email" : "tel"}
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                  placeholder={
                    contact === "email"
                      ? "you@example.com"
                      : "+91 00000 00000"
                  }
                  autoComplete={
                    contact === "email" ? "email" : "tel"
                  }
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-semibold"
                >
                  Password
                </label>

                <div className="relative mt-1.5">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-ring"
                    placeholder="At least 8 characters"
                    autoComplete={
                      mode === "signin"
                        ? "current-password"
                        : "new-password"
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((v) => !v)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff
                        className="size-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        className="size-5"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* REMEMBER / FORGOT PASSWORD */}
              {mode === "signin" && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) =>
                        setRemember(e.target.checked)
                      }
                      className="size-4 accent-[var(--brand)]"
                    />

                    Keep me signed in
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setFormError(null);
                      setFormSuccess(null);

                      setInfoMessage(
                        "Password reset instructions would be sent to your email or mobile number.",
                      );
                    }}
                    className="text-sm font-bold text-brand underline underline-offset-4"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-base font-bold text-brand-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && (
                  <Loader2
                    className="size-5 animate-spin"
                    aria-hidden="true"
                  />
                )}

                {mode === "signin"
                  ? "Sign in"
                  : "Create account"}
              </button>
            </form>

            {/* SWITCH ACCOUNT MODE */}
            <p className="mt-4 text-sm text-muted-foreground">
              {mode === "signin"
                ? "New to ReadAble? "
                : "Already have an account? "}

              <button
                type="button"
                onClick={() =>
                  switchMode(
                    mode === "signin" ? "signup" : "signin",
                  )
                }
                className="font-bold text-brand underline underline-offset-4"
              >
                {mode === "signin"
                  ? "Create an account"
                  : "Sign in"}
              </button>
            </p>
          </div>
        </section>
      )}
    </div>
  );
}