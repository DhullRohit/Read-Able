import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  FileText,
  Headphones,
  HelpCircle,
  Layers,
  Sparkles,
  Sliders,
  Zap,
  Eye,
  Type,
  Play,
  Volume2,
  Cpu,
  GraduationCap,
  Microscope,
  Code2,
  Heart,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReadAble — Intelligent & Accessible Digital Reader" },
      {
        name: "description",
        content:
          "ReadAble helps you read, understand, listen, and adapt complex documents. Elevate academic papers, PDFs, and technical reports with personalized AI assistance.",
      },
      {
        property: "og:title",
        content: "ReadAble — Read. Understand. Listen. Adapt.",
      },
      {
        property: "og:description",
        content:
          "Intelligent digital reading platform. Transform complex PDFs and documents into easy, accessible knowledge.",
      },
    ],
  }),
  component: Homepage,
});

export function Homepage() {
  // Scroll animations observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll("[data-animate]");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Live accessibility demo preview state
  const [demoScale, setDemoScale] = useState(1);
  const [demoComfort, setDemoComfort] = useState(false);
  const [demoTheme, setDemoTheme] = useState<"normal" | "lowlight">("normal");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-brand-soft selection:text-brand">
      <Navbar />

      <main className="flex-1">
        {/* ==========================================
            SECTION 1: HERO SECTION
           ========================================== */}
        <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-background via-card/30 to-background px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left Column Text */}
              <div className="lg:col-span-6" data-animate>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft/70 px-4 py-1.5 text-xs font-bold text-brand">
                  <Sparkles className="size-4 animate-pulse" />
                  <span>READ → UNDERSTAND → LISTEN → ADAPT</span>
                </div>

                <h1 className="mt-6 text-4xl font-extrabold tracking-tight leading-[1.1] sm:text-5xl lg:text-6xl">
                  Read Without Limits. <br />
                  <span className="text-brand">Understand Any Document.</span>
                </h1>

                <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                  ReadAble is an intelligent digital reading platform that turns dense academic papers, complex PDFs, and technical reports into clear, accessible knowledge tailored to your learning style.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2.5 rounded-2xl bg-brand px-6 py-4 text-base font-bold text-brand-foreground shadow-lg shadow-brand/20 transition-all hover:opacity-90 hover:shadow-brand/30"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="size-5" />
                  </Link>

                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-4 text-base font-semibold transition-colors hover:bg-secondary"
                  >
                    <span>Explore Features</span>
                    <ChevronRight className="size-5" />
                  </a>
                </div>

                </div>

              {/* Right Column Product Mockup */}
              <div className="lg:col-span-6" data-animate data-animate-delay="2">
                <div className="relative rounded-3xl border border-border bg-card p-3 shadow-2xl">
                  {/* Mockup Title bar */}
                  <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-secondary/80 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-red-400/80" />
                      <div className="size-3 rounded-full bg-yellow-400/80" />
                      <div className="size-3 rounded-full bg-green-400/80" />
                      <span className="ml-2 text-xs font-medium text-muted-foreground">
                        Quantum_Mechanics_Paper_2026.pdf
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
                        AI Active
                      </span>
                    </div>
                  </div>

                  {/* Mockup Content Grid */}
                  <div className="mt-3 grid gap-3 sm:grid-cols-12">
                    {/* Left Document View */}
                    <div className="rounded-2xl border border-border/40 bg-background p-4 sm:col-span-7">
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                        <span>Page 12 of 34</span>
                        <span className="text-brand">Section 3.2</span>
                      </div>
                      <h4 className="mt-2 text-sm font-bold text-foreground">
                        Quantum Entanglement & Superposition State
                      </h4>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        When two particles interact in such a way that the quantum state of each particle cannot be described independently of the state of the other...
                      </p>
                      <div className="mt-3 rounded-xl border border-brand/30 bg-brand-soft/40 p-2.5 text-xs text-brand-foreground font-medium">
                        ✨ <span className="font-bold">Highlight:</span> Entangled states persist regardless of distance separating the physical particles.
                      </div>
                    </div>

                    {/* Right AI Drawer Mockup */}
                    <div className="space-y-2 sm:col-span-5">
                      <div className="rounded-2xl border border-brand/30 bg-brand-soft/30 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-brand">
                          <Sparkles className="size-3.5" />
                          <span>Simplified Explanation</span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/90 leading-normal">
                          Think of entangled particles like two magical paired dice. Roll one in London and get a 6, the dice in Tokyo instantly turns to 6!
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary/50 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <Volume2 className="size-3.5 text-brand" />
                          <span>Audio Narration</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex size-6 items-center justify-center rounded-full bg-brand text-brand-foreground">
                            <Play className="size-3 fill-current" />
                          </div>
                          <div className="h-1.5 flex-1 rounded-full bg-border overflow-hidden">
                            <div className="h-full w-2/3 bg-brand" />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">1.25x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 2: PROBLEM SECTION
           ========================================== */}
        <section className="border-b border-border/40 bg-card/40 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center" data-animate>
              <span className="text-xs font-bold tracking-widest text-brand uppercase">The Challenge</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Complex documents shouldn't be a barrier to understanding.
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                Traditional readers treat every user the same, forcing readers to struggle through impenetrable text and tiring visual layouts.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: AlertCircle,
                  title: "Dense Academic Jargon",
                  desc: "Research papers and technical manuals hide essential knowledge behind overly complicated syntax and technical terms.",
                },
                {
                  icon: FileText,
                  title: "Static PDF Limitations",
                  desc: "Standard PDF viewers offer zero help when you're stuck on a confusing paragraph or mathematical equation.",
                },
                {
                  icon: Eye,
                  title: "Reading & Eye Fatigue",
                  desc: "Fixed small fonts, bright white backgrounds, and cramped line spacing cause severe cognitive overload and fatigue.",
                },
                {
                  icon: Zap,
                  title: "Information Overload",
                  desc: "Extracting core takeaways from 50-page reports takes hours of tedious manual skim reading and note-taking.",
                },
                {
                  icon: MessageSquare,
                  title: "Context Switching",
                  desc: "Constantly copying text back and forth to external generic chatbots destroys your focus and reading flow.",
                },
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
                  data-animate
                  data-animate-delay={idx + 1}
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                    <item.icon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 3: WHAT IS READABLE
           ========================================== */}
        <section className="border-b border-border/40 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5" data-animate>
                <span className="text-xs font-bold tracking-widest text-brand uppercase">Reimagined Reading</span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  More than a document reader. Your intelligent reading companion.
                </h2>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  ReadAble unifies document viewing, contextual AI, text-to-speech audio, and personalized accessibility into a single seamless interface.
                </p>

                <div className="mt-6 space-y-4">
                  {[
                    "Deep document context awareness",
                    "No manual copying or prompting required",
                    "Adapts visual display to your specific sight & focus needs",
                  ].map((bullet) => (
                    <div key={bullet} className="flex items-center gap-3">
                      <div className="flex size-6 items-center justify-center rounded-full bg-brand-soft text-brand">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <span className="text-sm font-semibold">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Pipeline diagram */}
              <div className="lg:col-span-7" data-animate data-animate-delay="2">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-lg sm:p-8">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    The ReadAble Intelligence Pipeline
                  </h3>

                  <div className="mt-6 space-y-4">
                    {[
                      {
                        step: "01",
                        title: "Document Ingestion & Parsing",
                        desc: "PDFs, EPUBs, and text are converted into structured interactive sections.",
                        icon: FileText,
                      },
                      {
                        step: "02",
                        title: "Structural & Semantic Analysis",
                        desc: "AI identifies key concepts, jargon terms, tables, and complex arguments.",
                        icon: Brain,
                      },
                      {
                        step: "03",
                        title: "Contextual AI Assistance",
                        desc: "Generates instant inline explanations, section summaries, and simplified rewrites.",
                        icon: Sparkles,
                      },
                      {
                        step: "04",
                        title: "Multimodal & Accessible Output",
                        desc: "Delivers natural speech narration, high-contrast themes, and customizable font scaling.",
                        icon: Layers,
                      },
                    ].map((pipe) => (
                      <div
                        key={pipe.step}
                        className="flex items-start gap-4 rounded-2xl border border-border/60 bg-secondary/50 p-4 transition-all hover:bg-secondary"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-xs font-bold text-brand-foreground">
                          {pipe.step}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <span>{pipe.title}</span>
                          </h4>
                          <p className="mt-1 text-xs text-muted-foreground">{pipe.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 4: HOW IT WORKS (4 STEPS)
           ========================================== */}
        <section id="how-it-works" className="border-b border-border/40 bg-card/30 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center" data-animate>
              <span className="text-xs font-bold tracking-widest text-brand uppercase">Four Core Pillars</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Read. Understand. Listen. Adapt.
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                How ReadAble transforms your reading experience from start to finish.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  num: "01",
                  badge: "READ",
                  icon: BookOpen,
                  title: "Upload & Clean View",
                  desc: "Import any PDF or document into a distraction-free reader optimized for deep focus.",
                },
                {
                  num: "02",
                  badge: "UNDERSTAND",
                  icon: Brain,
                  title: "AI Explanations",
                  desc: "Get instant paragraph summaries, jargon definitions, and simplified breakdowns with one click.",
                },
                {
                  num: "03",
                  badge: "LISTEN",
                  icon: Headphones,
                  title: "Read Aloud TTS",
                  desc: "Listen to natural voice audio narration synchronized with visual word-level highlighting.",
                },
                {
                  num: "04",
                  badge: "ADAPT",
                  icon: Sliders,
                  title: "Personalized Controls",
                  desc: "Adjust typography, line height, low-light dark themes, and playback speed to suit your preferences.",
                },
              ].map((step, idx) => (
                <div
                  key={step.badge}
                  className="relative rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-brand/40"
                  data-animate
                  data-animate-delay={idx + 1}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-brand/40">{step.num}</span>
                    <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-extrabold text-brand">
                      {step.badge}
                    </span>
                  </div>
                  <div className="mt-6 flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                    <step.icon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 5: MAJOR FEATURES
           ========================================== */}
        <section id="features" className="border-b border-border/40 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center" data-animate>
              <span className="text-xs font-bold tracking-widest text-brand uppercase">Feature Suite</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Engineered for maximum comprehension
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                Everything you need to digest complex research papers, technical specs, and books effortlessly.
              </p>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: "Explain & Simplify",
                  desc: "Highlight any sentence or complex paragraph to generate clear, plain-language explanations instantly.",
                },
                {
                  icon: FileText,
                  title: "Smart Section Summaries",
                  desc: "Get key takeaway bullet points for individual sections or full documents without missing crucial details.",
                },
                {
                  icon: Cpu,
                  title: "Visuals & Equations Assistant",
                  desc: "Deconstruct complex mathematical equations, scientific diagrams, and charts into step-by-step concepts.",
                },
                {
                  icon: Headphones,
                  title: "Synced Audio Read Aloud",
                  desc: "Listen with natural voice synthesis while visual cursor highlighting follows along word-by-word.",
                },
                {
                  icon: Sliders,
                  title: "Personalized Accessibility",
                  desc: "Tailor font scaling, line height, letter spacing, dyslexia-friendly fonts, and low-light themes.",
                },
                {
                  icon: MessageSquare,
                  title: "Document-Grounded Chat",
                  desc: "Ask specific questions directly about your uploaded paper with precise citation and page references.",
                },
              ].map((feat, idx) => (
                <div
                  key={feat.title}
                  className="group rounded-3xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
                  data-animate
                  data-animate-delay={idx % 3}
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand group-hover:bg-brand group-hover:text-brand-foreground transition-colors">
                    <feat.icon className="size-7" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{feat.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 6: READER EXPERIENCE SHOWCASE
           ========================================== */}
        <section className="border-b border-border/40 bg-card/40 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center" data-animate>
              <span className="text-xs font-bold tracking-widest text-brand uppercase">Live Product Interface</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Experience the ReadAble Reader View
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                A clean dual-pane view combining document reading with contextual intelligence.
              </p>
            </div>

            {/* Detailed CSS Product Showcase Component */}
            <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl" data-animate>
              {/* Top Reader Toolbar */}
              <div className="flex flex-wrap items-center justify-between border-b border-border bg-secondary/80 px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 text-xs font-bold text-brand">
                    <BookOpen className="size-4" />
                    <span>Neural_Networks_Deep_Learning.pdf</span>
                  </span>
                  <span className="rounded-full bg-border px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    PDF Document
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs">
                    <Type className="size-3.5 text-muted-foreground" />
                    <span className="font-semibold">Text Size: 100%</span>
                  </div>
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs">
                    <Volume2 className="size-3.5 text-brand" />
                    <span className="font-semibold">Audio: Playing (1.0x)</span>
                  </div>
                </div>
              </div>

              {/* Main Reader Workspace */}
              <div className="grid gap-0 lg:grid-cols-12">
                {/* Left Document Content Pane */}
                <div className="p-6 lg:col-span-7 lg:border-r lg:border-border sm:p-8">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Chapter 4 • Transformers & Attention Mechanisms</span>
                    <span>Reading time: 8 mins left</span>
                  </div>

                  <h3 className="mt-4 text-2xl font-extrabold text-foreground">
                    4.1 Self-Attention and Context Representation
                  </h3>

                  <p className="mt-4 text-sm text-foreground/90 leading-relaxed">
                    The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism.
                  </p>

                  <div className="mt-4 rounded-2xl border border-brand/40 bg-brand-soft/50 p-4">
                    <p className="text-xs font-semibold text-brand">
                      ✨ Selected for Explanation:
                    </p>
                    <p className="mt-1 text-sm font-medium italic text-foreground">
                      "We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output."
                    </p>
                  </div>

                  <p className="mt-4 text-sm text-foreground/90 leading-relaxed">
                    The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight GPUs.
                  </p>
                </div>

                {/* Right AI Drawer Pane */}
                <div className="bg-secondary/20 p-6 lg:col-span-5 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-brand" />
                      <h4 className="text-sm font-bold">ReadAble AI Assistant</h4>
                    </div>
                    <span className="text-[11px] font-semibold text-brand bg-brand-soft px-2.5 py-0.5 rounded-full">
                      Section Context
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <h5 className="text-xs font-bold text-brand uppercase tracking-wider">Key Takeaway</h5>
                      <p className="mt-1 text-xs text-foreground/90 leading-relaxed">
                        Transformers process entire sentences at once instead of word-by-word (recurrent), making training dramatically faster and understanding long sentences much better.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4">
                      <h5 className="text-xs font-bold text-brand uppercase tracking-wider">Simplified Term</h5>
                      <div className="mt-2 text-xs font-semibold text-foreground">
                        "Eschewing recurrence" → <span className="text-muted-foreground font-normal">Replacing repetitive loops with parallel processing.</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-xl bg-brand px-3 py-2 text-xs font-bold text-brand-foreground text-center"
                      >
                        Ask Question
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground text-center"
                      >
                        Listen Section
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 7: TARGET USERS
           ========================================== */}
        <section className="border-b border-border/40 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center" data-animate>
              <span className="text-xs font-bold tracking-widest text-brand uppercase">Designed For You</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Who uses ReadAble?
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                Tailored reading assistance for diverse goals, backgrounds, and learning styles.
              </p>
            </div>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: GraduationCap,
                  title: "Students & Academics",
                  desc: "Digest dense research papers, textbook chapters, and lecture notes in half the time.",
                },
                {
                  icon: Microscope,
                  title: "Researchers & Analysts",
                  desc: "Extract key takeaways, methodology summaries, and core conclusions across large PDF archives.",
                },
                {
                  icon: Code2,
                  title: "Technical & STEM Learners",
                  desc: "Deconstruct complex formulas, algorithms, software documentation, and engineering papers.",
                },
                {
                  icon: Heart,
                  title: "Accessible Readers",
                  desc: "Custom font sizes, low-light contrast, dyslexia fonts, and audio narration for ADHD and low-vision readers.",
                },
              ].map((user, idx) => (
                <div
                  key={user.title}
                  className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:border-brand/40"
                  data-animate
                  data-animate-delay={idx + 1}
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <user.icon className="size-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{user.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{user.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 8: PERSONALIZATION & ML
           ========================================== */}
        <section className="border-b border-border/40 bg-card/30 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6" data-animate>
                <span className="text-xs font-bold tracking-widest text-brand uppercase">Adaptive Intelligence</span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Personalized to your unique reading pace & preferences
                </h2>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                  ReadAble doesn't just display text; it learns how you consume information. Adjust explanation depth, technical detail, audio speed, and visual formatting dynamically.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    {
                      title: "Adaptive Depth Tuning",
                      desc: "Choose between Concise Bullet Points, Simplified Layman Terms, or In-depth Technical Analysis.",
                    },
                    {
                      title: "Reading Speed Estimation",
                      desc: "Tracks your individual reading velocity to give precise remaining time estimates.",
                    },
                    {
                      title: "Persistent Preference Memory",
                      desc: "Your font choices, dark mode, audio speed, and layout options stay saved across all devices.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-border bg-card p-4">
                      <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Machine learning visualization card */}
              <div className="lg:col-span-6" data-animate data-animate-delay="2">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="size-5 text-brand" />
                      <h4 className="text-sm font-bold">Personalization Engine</h4>
                    </div>
                    <span className="text-xs font-bold text-brand">Adaptive Mode</span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span>Explanation Complexity Level</span>
                        <span className="text-brand">Simplified (Level 2/5)</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-secondary">
                        <div className="h-full w-2/5 rounded-full bg-brand" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span>Audio Playback Speed</span>
                        <span className="text-brand">1.25x Speed</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-secondary">
                        <div className="h-full w-3/5 rounded-full bg-brand" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold">
                        <span>Text Size Scale</span>
                        <span className="text-brand">110% Enlarged</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-secondary">
                        <div className="h-full w-1/2 rounded-full bg-brand" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl bg-brand-soft/50 p-4 text-xs font-medium text-brand-foreground">
                    💡 <span className="font-bold">Active Recommendation:</span> ReadAble has adjusted line height to 1.9 for optimal readability based on your session duration.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 9: ACCESSIBILITY & DEMO CONTROLS
           ========================================== */}
        <section className="border-b border-border/40 px-6 py-16 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center" data-animate>
              <span className="text-xs font-bold tracking-widest text-brand uppercase">Accessibility Showcase</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Test the ReadAble Display Controls
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                Try out text sizing, line spacing, and lighting controls live right here.
              </p>
            </div>

            {/* Interactive Demo Box */}
            <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8" data-animate>
              {/* Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                {/* Text Size Control */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Text Size:</span>
                  <div className="flex items-center rounded-xl border border-border bg-secondary p-1">
                    <button
                      type="button"
                      onClick={() => setDemoScale(0.9)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        demoScale === 0.9 ? "bg-brand text-brand-foreground" : "text-muted-foreground"
                      }`}
                    >
                      90%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoScale(1.0)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        demoScale === 1.0 ? "bg-brand text-brand-foreground" : "text-muted-foreground"
                      }`}
                    >
                      100%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDemoScale(1.15)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        demoScale === 1.15 ? "bg-brand text-brand-foreground" : "text-muted-foreground"
                      }`}
                    >
                      115%
                    </button>
                  </div>
                </div>

                {/* Line Spacing Control */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Spacing:</span>
                  <button
                    type="button"
                    onClick={() => setDemoComfort((v) => !v)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      demoComfort
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    {demoComfort ? "Comfortable Spacing" : "Standard Spacing"}
                  </button>
                </div>

                {/* Lighting Theme Control */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Lighting:</span>
                  <button
                    type="button"
                    onClick={() => setDemoTheme((t) => (t === "normal" ? "lowlight" : "normal"))}
                    className="rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-bold transition-all"
                  >
                    {demoTheme === "normal" ? "☀️ Normal Mode" : "🌙 Low-Light Mode"}
                  </button>
                </div>
              </div>

              {/* Sample Live Output Box */}
              <div
                className={`mt-6 rounded-2xl border p-6 transition-all ${
                  demoTheme === "lowlight"
                    ? "border-border bg-[oklch(0.21_0.014_175)] text-[oklch(0.93_0.012_90)]"
                    : "border-border bg-background text-foreground"
                }`}
                style={{
                  fontSize: `${demoScale}rem`,
                  lineHeight: demoComfort ? 1.9 : 1.6,
                  letterSpacing: demoComfort ? "0.02em" : "0em",
                }}
              >
                <h4 className="font-extrabold text-brand">Sample Preview Paragraph</h4>
                <p className="mt-2">
                  ReadAble ensures every word is clear and readable regardless of your vision or reading environment.
                  Adjusting font scaling, spacing, and contrast reduces eye strain during long study sessions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            SECTION 10: FINAL CALL-TO-ACTION (CTA)
           ========================================== */}
        <section className="bg-gradient-to-b from-background to-brand-soft/40 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl text-center" data-animate>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-4 py-1.5 text-xs font-bold text-brand">
              <Zap className="size-4" />
              Start Reading Smarter Today
            </span>

            <h2 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Make complex reading effortless.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Join students, researchers, and everyday readers using ReadAble to read faster, understand deeper, and listen anywhere.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2.5 rounded-2xl bg-brand px-8 py-4 text-lg font-bold text-brand-foreground shadow-xl shadow-brand/20 transition-all hover:opacity-90 hover:scale-105"
              >
                <span>Get Started Free</span>
                <ArrowRight className="size-5" />
              </Link>

              <Link
                to="/help"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-8 py-4 text-lg font-semibold transition-colors hover:bg-secondary"
              >
                <HelpCircle className="size-5" />
                <span>Visit Help & FAQ</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}