import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReadingPreferences } from "@/components/ReadingPreferences";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In / Register — ReadAble" },
      {
        name: "description",
        content:
          "Sign in or create an account to start reading complex documents with personalized AI assistance, listening tools, and customizable accessibility.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [comfortable, setComfortable] = useState(false);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [contact, setContact] = useState<"email" | "mobile">("email");

  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [contactValue, setContactValue] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--read-scale", String(scale));
    root.style.setProperty("--read-leading", comfortable ? "1.9" : "1.6");
    root.style.setProperty("--read-tracking", comfortable ? "0.02em" : "0em");
    root.style.setProperty(
      "--read-word-spacing",
      comfortable ? "0.12em" : "normal"
    );
  }, [scale, comfortable]);

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
          : "Please enter your mobile number."
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

    // Mock submission flow
    window.setTimeout(() => {
      setSubmitting(false);

      setFormSuccess(
        mode === "signin"
          ? `Welcome back! You are signed in. Redirecting to dashboard...`
          : "Account created successfully. Redirecting to dashboard..."
      );

      setPassword("");
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1200);
    }, 900);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 px-6 py-12 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
            {/* Left promo column */}
            <div className="lg:col-span-5 lg:pt-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft/60 px-3.5 py-1 text-xs font-bold text-brand">
                <Sparkles className="size-3.5" />
                ReadAble Account
              </span>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                {mode === "signin"
                  ? "Welcome back to ReadAble"
                  : "Start reading smarter today"}
              </h1>

              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                {mode === "signin"
                  ? "Sign in to access your uploaded documents, personal reading preferences, AI summaries, and adaptive audio."
                  : "Join ReadAble to transform how you read research papers, complex textbooks, financial reports, and technical guides."}
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Personalized document dashboard & history",
                  "AI-assisted explanations & instant summaries",
                  "Natural voice read-aloud playback",
                  "Adaptive font, spacing, and lighting controls",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-6 text-brand" />
                  <div>
                    <h4 className="text-sm font-bold">Privacy & Accessibility First</h4>
                    <p className="text-xs text-muted-foreground">
                      Your documents are processed securely and your preferences stay saved.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Form Card */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
                {/* SIGN IN / SIGN UP SWITCH */}
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-1">
                  {(["signin", "signup"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => switchMode(value)}
                      aria-pressed={mode === value}
                      className={`rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                        mode === value
                          ? "bg-brand text-brand-foreground shadow-sm"
                          : "text-foreground/70 hover:text-foreground"
                      }`}
                    >
                      {value === "signin" ? "Sign in" : "Create account"}
                    </button>
                  ))}
                </div>

                <h2 className="mt-6 text-2xl font-bold">
                  {mode === "signin"
                    ? "Sign in to your account"
                    : "Create your ReadAble account"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mode === "signin"
                    ? "Enter your credentials below to continue."
                    : "Quick registration — get started in under a minute."}
                </p>

                {/* READING PREFERENCES */}
                <div className="mt-6">
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
                  {/* EMAIL / MOBILE TOGGLE */}
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
                          className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors ${
                            contact === value
                              ? "border-brand bg-brand-soft text-accent-foreground"
                              : "border-border bg-secondary text-foreground/80"
                          }`}
                        >
                          <Icon className="size-4" aria-hidden="true" />
                          {value === "email" ? "Email address" : "Mobile number"}
                        </button>
                      );
                    })}
                  </div>

                  {/* NAME */}
                  {mode === "signup" && (
                    <div>
                      <label htmlFor="name" className="text-sm font-semibold">
                        Full name
                      </label>
                      <input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g. Alex Morgan"
                        autoComplete="name"
                      />
                    </div>
                  )}

                  {/* CONTACT */}
                  <div>
                    <label htmlFor="contact" className="text-sm font-semibold">
                      {contact === "email" ? "Email address" : "Mobile number"}
                    </label>
                    <input
                      id="contact"
                      type={contact === "email" ? "email" : "tel"}
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                      placeholder={
                        contact === "email"
                          ? "alex@example.com"
                          : "+1 (555) 000-0000"
                      }
                      autoComplete={contact === "email" ? "email" : "tel"}
                    />
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label htmlFor="password" className="text-sm font-semibold">
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
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="size-5" aria-hidden="true" />
                        ) : (
                          <Eye className="size-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* REMEMBER / FORGOT PASSWORD */}
                  {mode === "signin" && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
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
                            "Password reset instructions have been sent if an account exists for this contact detail."
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
                    {submitting ? (
                      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    ) : (
                      <>
                        <span>{mode === "signin" ? "Sign in" : "Create account"}</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* SWITCH ACCOUNT MODE */}
                <div className="mt-6 border-t border-border pt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {mode === "signin"
                      ? "Don't have an account yet? "
                      : "Already have a ReadAble account? "}
                    <button
                      type="button"
                      onClick={() =>
                        switchMode(mode === "signin" ? "signup" : "signin")
                      }
                      className="font-bold text-brand underline underline-offset-4"
                    >
                      {mode === "signin" ? "Create an account" : "Sign in"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
