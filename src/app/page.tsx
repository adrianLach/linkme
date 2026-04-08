import Link from "next/link";
import {
  Link2,
  BarChart3,
  Globe,
  Zap,
  ShieldCheck,
  QrCode,
  ArrowRight,
  GitFork,
} from "lucide-react";

// ── Feature data ─────────────────────────────────────────────────────────────

const features = [
  {
    icon: Link2,
    title: "Smart URL Shortening",
    description:
      "Generate collision-free slugs with nanoid or pick a custom vanity slug for every link you create.",
  },
  {
    icon: Globe,
    title: "IP & Geo Analytics",
    description:
      "Know where your visitors come from. Every redirect logs IP, country, city, ISP, and device details.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Dashboard",
    description:
      "Interactive charts, world map, referrer tables, and a live visit feed — all in one place.",
  },
  {
    icon: QrCode,
    title: "Instant QR Codes",
    description:
      "One-click QR code generation for every link. Perfect for print campaigns and in-person sharing.",
  },
  {
    icon: Zap,
    title: "Edge-Fast Redirects",
    description:
      "Links resolve at the Vercel Edge Network in under 5 ms using a Redis/KV slug cache.",
  },
  {
    icon: ShieldCheck,
    title: "Security First",
    description:
      "Bcrypt-hashed passwords, rate limiting, CSRF protection, and optional IP anonymisation for GDPR compliance.",
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Link2 className="h-5 w-5 text-indigo-600" />
            <span>link<span className="text-indigo-600">me</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden py-24 sm:py-36">
          {/* subtle gradient blob */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
          >
            <div className="h-[600px] w-[900px] rounded-full bg-indigo-100 dark:bg-indigo-950 opacity-40 blur-3xl" />
          </div>

          <div className="mx-auto max-w-4xl px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-6">
              <Zap className="h-3 w-3" /> Open source · Self-hostable · Edge-fast
            </span>

            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Shorten links.{" "}
              <span className="text-indigo-600">Understand your audience.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              <strong className="text-zinc-900 dark:text-zinc-100">linkme</strong> is a
              full-featured URL shortener that also logs visitor IP, geolocation, device,
              and referrer data — so you always know who clicked your links.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900 hover:bg-indigo-500 transition-colors"
              >
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/adrianLach/linkme"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-7 py-3.5 text-base font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <GitFork className="h-4 w-4" /> View on GitHub
              </a>
            </div>

            {/* Demo short-link pill */}
            <div className="mt-12 inline-flex items-center gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-5 py-3 text-sm font-mono text-zinc-600 dark:text-zinc-400 shadow-sm">
              <span className="text-zinc-400 dark:text-zinc-600">https://</span>
              <span className="text-indigo-600 font-semibold">lnkm.e</span>
              <span className="text-zinc-400 dark:text-zinc-600">/</span>
              <span className="text-zinc-800 dark:text-zinc-200">my-slug</span>
              <span className="ml-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                307 →
              </span>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-24 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Everything you need in one place
              </h2>
              <p className="mt-4 text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
                From link creation to deep analytics, linkme has every feature a modern
                marketer or developer needs.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950 p-3">
                    <Icon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-16 max-w-xl mx-auto">
              Three simple steps to get from a long URL to actionable link analytics.
            </p>

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Paste your URL",
                  body: "Drop any long URL into linkme. Optionally add a custom slug, expiry date, or password.",
                },
                {
                  step: "02",
                  title: "Share your short link",
                  body: "Copy the generated short link or QR code and share it anywhere — email, social, print.",
                },
                {
                  step: "03",
                  title: "Watch the analytics roll in",
                  body: "Every click is logged with geo, device, and referrer data. Explore it in your dashboard.",
                },
              ].map(({ step, title, body }) => (
                <div key={step} className="flex flex-col items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white text-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
                    {step}
                  </div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section className="py-20 bg-indigo-600">
          <div className="mx-auto max-w-3xl px-6 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to know your audience?
            </h2>
            <p className="text-indigo-200 mb-10 text-lg">
              Create your free account and start shortening links with full analytics in
              minutes.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-indigo-700 shadow-lg hover:bg-indigo-50 transition-colors"
            >
              Get started for free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2 font-semibold text-zinc-700 dark:text-zinc-300">
            <Link2 className="h-4 w-4 text-indigo-600" />
            link<span className="text-indigo-600">me</span>
          </div>
          <p>© {new Date().getFullYear()} linkme. MIT License.</p>
          <nav className="flex gap-6">
            <a
              href="https://github.com/adrianLach/linkme"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              GitHub
            </a>
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
              Features
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

