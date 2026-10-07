import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  BookOpen,
  Sparkles,
  Volume2,
  Sliders,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & FAQ — ReadAble" },
      {
        name: "description",
        content:
          "Find answers to frequently asked questions about ReadAble: uploading documents, using AI explanations, listening tools, accessibility settings, and account management.",
      },
    ],
  }),
  component: HelpPage,
});

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: "getting-started-1",
    category: "Getting Started",
    question: "What format of documents does ReadAble support?",
    answer:
      "ReadAble supports PDF documents, EPUB files, plain text (.txt), and Markdown documents. You can drag and drop or upload files directly from your computer or cloud storage.",
  },
  {
    id: "getting-started-2",
    category: "Getting Started",
    question: "Do I need to install any software to use ReadAble?",
    answer:
      "No! ReadAble is a web application that runs directly in your modern web browser (Chrome, Firefox, Safari, Edge). Your documents and reading preferences sync seamlessly.",
  },
  {
    id: "getting-started-3",
    category: "Getting Started",
    question: "Is ReadAble free to use?",
    answer:
      "ReadAble offers a free tier that includes standard document uploading, reader view adjustments, text-to-speech, and basic AI explanations. Premium plans unlock unlimited AI summaries and advanced voice customization.",
  },
  {
    id: "reading-1",
    category: "Reading & Experience",
    question: "How does ReadAble simplify complex text?",
    answer:
      "ReadAble analyzes dense academic or technical sentences, breaks them down into shorter structural units, highlights core concepts, and provides contextual explanations right alongside your text without losing the original meaning.",
  },
  {
    id: "reading-2",
    category: "Reading & Experience",
    question: "Can I highlight and save notes while reading?",
    answer:
      "Yes! You can select any sentence or block of text to highlight in custom colors, attach personal notes, or ask the AI assistant to explain that specific selection.",
  },
  {
    id: "reading-3",
    category: "Reading & Experience",
    question: "How does ReadAble track my reading progress?",
    answer:
      "ReadAble automatically remembers where you left off in every document, tracks estimated time remaining based on your reading speed, and records section completion.",
  },
  {
    id: "ai-1",
    category: "AI Assistance",
    question: "How is ReadAble AI different from generic chatbots like ChatGPT?",
    answer:
      "Generic chatbots require copying and pasting text into a separate chat window. ReadAble AI is deeply integrated into your reading environment: it reads in tandem with you, references exact page locations, understands document layout, and adapts its explanations to your knowledge level.",
  },
  {
    id: "ai-2",
    category: "AI Assistance",
    question: "Can ReadAble explain diagrams, charts, and mathematical equations?",
    answer:
      "Yes! ReadAble includes visual context processing. It can parse equations, diagrams, and complex tables, providing step-by-step breakdown descriptions.",
  },
  {
    id: "ai-3",
    category: "AI Assistance",
    question: "Can I ask custom questions about my uploaded document?",
    answer:
      "Absolutely. The side assistant allows you to type custom queries such as 'What are the key conclusions in section 3?' or 'Define quantum entanglement as used in this paper.'",
  },
  {
    id: "accessibility-1",
    category: "Accessibility & Audio",
    question: "What accessible options are available for readers with dyslexia or low vision?",
    answer:
      "ReadAble features adjustable font scaling (up to 200%), line height control, character and word spacing controls, low-light/dark high-contrast modes, and OpenDyslexic font options.",
  },
  {
    id: "accessibility-2",
    category: "Accessibility & Audio",
    question: "How does the Text-to-Speech (TTS) read-aloud feature work?",
    answer:
      "Click the Listen button on any document section or page. ReadAble uses natural human-like voice synthesis with word-level visual highlighting so you can listen while following along visually.",
  },
  {
    id: "accessibility-3",
    category: "Accessibility & Audio",
    question: "Can I control the audio playback speed?",
    answer:
      "Yes, you can adjust speech playback speed from 0.5x up to 2.5x speed, choose different voice options, and set automatic page turning when playback finishes.",
  },
  {
    id: "account-1",
    category: "Account & Privacy",
    question: "Is my uploaded document kept private and secure?",
    answer:
      "Yes. Your documents are stored securely with encryption and are only accessible by you. We do not use your private documents to train public AI models.",
  },
  {
    id: "account-2",
    category: "Account & Privacy",
    question: "How do I reset my password?",
    answer:
      "Go to the Login page, click 'Forgot password?', and enter your email address or mobile number. A reset link or verification code will be sent to you immediately.",
  },
];

const categories = [
  { name: "All Topics", icon: HelpCircle },
  { name: "Getting Started", icon: BookOpen },
  { name: "Reading & Experience", icon: Sliders },
  { name: "AI Assistance", icon: Sparkles },
  { name: "Accessibility & Audio", icon: Volume2 },
  { name: "Account & Privacy", icon: ShieldCheck },
];

function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Topics");
  const [openItem, setOpenItem] = useState<string | null>("getting-started-1");

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory =
        selectedCategory === "All Topics" || faq.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleItem = (id: string) => {
    setOpenItem((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero Header */}
      <section className="border-b border-border bg-card/60 px-6 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft/60 px-3.5 py-1 text-xs font-bold text-brand">
            <HelpCircle className="size-3.5" />
            Help Center & FAQ
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            How can we help you read better?
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Search our knowledge base or browse answers by category below.
          </p>

          {/* Search Bar */}
          <div className="relative mx-auto mt-8 max-w-2xl">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for answers e.g. PDF upload, Text-to-speech, AI explanations..."
              className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-base outline-none shadow-sm transition-all focus:border-brand focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pb-8">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-brand text-brand-foreground shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* FAQ Accordion List */}
          <div className="mx-auto max-w-3xl space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <HelpCircle className="mx-auto size-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-bold">No matching topics found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search query or choosing a different category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All Topics");
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-foreground"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openItem === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-brand/40"
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(faq.id)}
                      className="flex w-full items-center justify-between p-6 text-left"
                      aria-expanded={isOpen}
                    >
                      <div className="pr-4">
                        <span className="text-xs font-bold text-brand">
                          {faq.category}
                        </span>
                        <h3 className="mt-1 text-base font-bold text-foreground">
                          {faq.question}
                        </h3>
                      </div>
                      <ChevronDown
                        className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-brand" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-border/60 bg-secondary/30 px-6 py-5 text-sm text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Additional Support Banner */}
          <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-border bg-brand-soft/40 p-8 text-center sm:p-10">
            <h3 className="text-2xl font-bold">Still have questions?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ready to experience effortless reading? Head over to your dashboard or sign in to start uploading documents.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90"
              >
                <span>Get Started Now</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
