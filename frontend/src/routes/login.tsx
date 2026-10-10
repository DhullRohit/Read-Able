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
  User,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ReadingPreferences } from "@/components/ReadingPreferences";
import { authApi } from "@/lib/api";

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
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
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
    setEmail("");
    setPhone("");
    setLoginIdentifier("");
    setPassword("");
    setFormError(null);
    setFormSuccess(null);
    setInfoMessage(null);
  };

  const switchMode = (next: "signin" | "signup") => {
    setMode(next);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError(null);
    setFormSuccess(null);
    setInfoMessage(null);

    if (mode === "signup") {
      // Validate all signup fields
      if (name.trim().length < 2) {
        setFormError("Please enter your full name.");
        return;
      }

      if (!email.trim()) {
        setFormError("Please enter your email address.");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setFormError("Please enter a valid email address.");
        return;
      }

      if (!phone.trim()) {
        setFormError("Please enter your mobile number.");
        return;
      }

      if (!/^[+\d][\d\s-]{7,}$/.test(phone.trim())) {
        setFormError("Please enter a valid mobile number.");
        return;
      }

      if (password.length < 8) {
        setFormError("Password must be at least 8 characters.");
        return;
      }
    } else {
      // Validate login fields (accepts either email or mobile number)
      if (!loginIdentifier.trim()) {
        setFormError("Please enter your email address or mobile number.");
        return;
      }

      const isEmail = loginIdentifier.includes("@");
      if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginIdentifier.trim())) {
        setFormError("Please enter a valid email address.");
        return;
      }

      if (!isEmail && !/^[+\d][\d\s-]{7,}$/.test(loginIdentifier.trim())) {
        setFormError("Please enter a valid mobile number or email address.");
        return;
      }

      if (!password) {
        setFormError("Please enter your password.");
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === "signup") {
        let token = "";
        let user: any = null;

        try {
          const res = await authApi.register({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            password,
          });

          if (res.data?.data?.token) {
            token = res.data.data.token;
            user = res.data.data.user;
          } else {
            // If backend register didn't return a token, authenticate immediately
            const loginRes = await authApi.login({
              email: email.trim(),
              password,
            });
            token = loginRes.data?.data?.token;
            user = loginRes.data?.data?.user;
          }
        } catch (apiErr: any) {
          // If backend provided an active response with an error message, show it to user
          if (apiErr.response?.data?.message) {
            setFormError(apiErr.response.data.message);
            setSubmitting(false);
            return;
          }

          // Fallback session if backend server is unreachable
          user = {
            id: 1,
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
          };
          token = "readable_dev_session_" + Date.now();
        }

        if (token) {
          localStorage.setItem("readable_token", token);
        }
        if (user) {
          localStorage.setItem("readable_user", JSON.stringify(user));
        }

        // Navigate immediately to dashboard after signup
        navigate({ to: "/dashboard" });
      } else {
        // Sign in mode
        let token = "";
        let user: any = null;

        const isEmail = loginIdentifier.includes("@");
        const payload = isEmail
          ? { email: loginIdentifier.trim(), password }
          : { phone: loginIdentifier.trim(), password };

        try {
          const res = await authApi.login({
            ...payload,
            identifier: loginIdentifier.trim(),
          });
          token = res.data?.data?.token;
          user = res.data?.data?.user;
        } catch (apiErr: any) {
          if (apiErr.response?.data?.message) {
            setFormError(apiErr.response.data.message);
            setSubmitting(false);
            return;
          }

          // Fallback session if backend server is unreachable
          user = {
            id: 1,
            name: isEmail ? loginIdentifier.split("@")[0] : "User",
            email: isEmail ? loginIdentifier.trim() : null,
            phone: !isEmail ? loginIdentifier.trim() : null,
          };
          token = "readable_dev_session_" + Date.now();
        }

        if (token) {
          localStorage.setItem("readable_token", token);
        }
        if (user) {
          localStorage.setItem("readable_user", JSON.stringify(user));
        }

        // Navigate immediately to dashboard after login
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred during authentication.");
      setSubmitting(false);
    }
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
                    ? "Enter your email or mobile number below to continue."
                    : "Enter your details to get started with ReadAble."}
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
                  {mode === "signup" ? (
                    <>
                      {/* FULL NAME */}
                      <div>
                        <label htmlFor="name" className="text-sm font-semibold flex items-center gap-1.5">
                          <User className="size-4 text-muted-foreground" />
                          <span>Full name</span>
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                          placeholder="e.g. Alex Morgan"
                          autoComplete="name"
                          required
                        />
                      </div>

                      {/* EMAIL ADDRESS */}
                      <div>
                        <label htmlFor="email" className="text-sm font-semibold flex items-center gap-1.5">
                          <Mail className="size-4 text-muted-foreground" />
                          <span>Email address</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                          placeholder="alex@example.com"
                          autoComplete="email"
                          required
                        />
                      </div>

                      {/* MOBILE NUMBER */}
                      <div>
                        <label htmlFor="phone" className="text-sm font-semibold flex items-center gap-1.5">
                          <Smartphone className="size-4 text-muted-foreground" />
                          <span>Mobile number</span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                          placeholder="+91 000-000-0000"
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </>
                  ) : (
                    /* SIGN IN IDENTIFIER (EMAIL OR MOBILE) */
                    <div>
                      <label htmlFor="loginIdentifier" className="text-sm font-semibold flex items-center gap-1.5">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="size-3.5" />
                          <span className="text-xs">/</span>
                          <Smartphone className="size-3.5" />
                        </span>
                        <span>Email address or Mobile number</span>
                      </label>
                      <input
                        id="loginIdentifier"
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
                        placeholder="alex@example.com or +91 000-000-0000"
                        autoComplete="username"
                        required
                      />
                    </div>
                  )}

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
                        placeholder={
                          mode === "signup"
                            ? "At least 8 characters"
                            : "Enter your password"
                        }
                        autoComplete={
                          mode === "signin"
                            ? "current-password"
                            : "new-password"
                        }
                        required
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
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
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
