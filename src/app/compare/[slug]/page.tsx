import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Slug =
  | "userguiding-alternative"
  | "appcues-alternative"
  | "chameleon-alternative"
  | "intro-js-alternative";

interface CompareRow {
  feature: string;
  ontheway: string;
  other: string;
  note?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface PageData {
  slug: Slug;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  subheading: string;
  intro: string;
  competitor: string;
  competitorPrice: string;
  rows: CompareRow[];
  benefits: { title: string; description: string }[];
  faqs: FAQ[];
  keywords: string[];
}

const pages: Record<Slug, PageData> = {
  "userguiding-alternative": {
    slug: "userguiding-alternative",
    seoTitle:
      "OnTheWay vs UserGuiding — Free UserGuiding Alternative for Product Tours",
    metaDescription:
      "Looking for a free UserGuiding alternative? OnTheWay creates product tours with AI, costs $0/mo, and deploys with one line of code. No seat limits, no MAU tracking.",
    h1: "The UserGuiding Alternative That's Actually Free",
    subheading:
      "AI-powered product tours. No per-seat pricing. No MAU limits on free tier.",
    intro:
      "UserGuiding is a solid product adoption platform — but the Starter plan costs $249/mo with a 2,500 MAU cap. If you're an early-stage team or indie developer, that's a steep price for product tours. OnTheWay takes a different approach: a generous free tier, a tiny ~5KB SDK, and AI that generates tour steps from a simple text description. No monthly per-seat charges, no complex analytics dashboards you don't need yet.",
    competitor: "UserGuiding",
    competitorPrice: "$249/mo",
    rows: [
      {
        feature: "Starting price",
        ontheway: "Free ($0/mo)",
        other: "Free tier / $249/mo Starter",
        note: "OnTheWay Pro is $19/mo",
      },
      {
        feature: "SDK size",
        ontheway: "~5KB gzipped",
        other: "~150KB+",
        note: "OnTheWay loads Driver.js on demand",
      },
      {
        feature: "AI tour generation",
        ontheway: "✅ Built-in — describe in plain text",
        other: "✅ AI assistant",
        note: "",
      },
      {
        feature: "Visual recorder",
        ontheway: "✅ Click-to-capture",
        other: "✅ No-code builder",
        note: "",
      },
      {
        feature: "React SDK",
        ontheway: "✅ Provider, hooks, components",
        other: "❌ Script-based only",
        note: "",
      },
      {
        feature: "Self-hostable",
        ontheway: "✅ Open-source SDK",
        other: "❌ SaaS only",
        note: "",
      },
      {
        feature: "Per-seat pricing",
        ontheway: "❌ No seat limits",
        other: "✅ 1–5 seats per plan",
        note: "",
      },
      {
        feature: "MAU / view limits",
        ontheway: "1K free / 50K Pro",
        other: "Unlimited free / 2.5K Starter",
        note: "",
      },
      {
        feature: "Install method",
        ontheway: "NPM, CDN, or script tag",
        other: "Script tag only",
        note: "OnTheWay works with any bundler",
      },
      {
        feature: "Framework support",
        ontheway: "React, Vue, Angular, vanilla JS",
        other: "Framework-agnostic (script)",
        note: "",
      },
    ],
    benefits: [
      {
        title: "Free tier that actually works",
        description:
          "3 projects, 5 tours per project, and 1,000 views/month — enough to onboard your first users without paying a dime. No credit card required.",
      },
      {
        title: "AI writes your tour steps",
        description:
          'Describe what the tour should do in plain language — "Guide users to create their first project" — and OnTheWay generates the steps, selectors, and descriptions automatically.',
      },
      {
        title: "Tiny footprint, zero impact",
        description:
          "OnTheWay's SDK is ~5KB gzipped and lazy-loads the tour engine. Your app's bundle size barely changes. UserGuiding's script is significantly heavier.",
      },
      {
        title: "First-class React support",
        description:
          "OnTheWayProvider, useOnTheWay hook, HelpMenu and HelpTrigger components. Not just a script tag — real React integration with hooks and context.",
      },
    ],
    faqs: [
      {
        question: "Is OnTheWay really free?",
        answer:
          "Yes. The free tier includes 3 projects, 5 tasks per project, and 1,000 views/month. No credit card required, no time limit. Pro is $19/mo for unlimited projects and 50K views.",
      },
      {
        question: "Can OnTheWay do everything UserGuiding does?",
        answer:
          "OnTheWay focuses on product tours, tooltips, and onboarding flows. UserGuiding also offers resource centers, NPS surveys, and advanced segmentation. If you primarily need tours and onboarding, OnTheWay covers that at a fraction of the cost.",
      },
      {
        question: "Does OnTheWay support analytics?",
        answer:
          "Yes. OnTheWay tracks tour completions and drop-off points. Pro tier includes a full analytics dashboard. For advanced behavioral analytics, UserGuiding may offer more depth.",
      },
      {
        question: "Can I migrate from UserGuiding to OnTheWay?",
        answer:
          "Yes. Export your tour definitions and recreate them in OnTheWay using the visual recorder or AI generator. The AI can generate equivalent tours from your existing step descriptions.",
      },
    ],
    keywords: [
      "userguiding alternative",
      "userguiding alternative free",
      "free product tour tool",
      "userguiding pricing",
      "product tour software free",
    ],
  },

  "appcues-alternative": {
    slug: "appcues-alternative",
    seoTitle:
      "OnTheWay vs Appcues — Lightweight Appcues Alternative Starting at $0",
    metaDescription:
      "Appcues starts at $300/mo. OnTheWay starts at $0. AI-powered product tours, ~5KB SDK, React integration. The lightweight Appcues alternative for growing teams.",
    h1: "The Appcues Alternative for Teams That Ship Fast",
    subheading:
      "Same product tours. 15x less cost. AI-powered step generation.",
    intro:
      "Appcues is a powerful product-led growth platform — but at $300/month for just 1,000 MAUs, it's built for well-funded teams. If you need product tours without the enterprise price tag, OnTheWay delivers AI-generated tours, a visual recorder, and a React SDK — starting at $0/month. Install in 30 seconds, not 30 minutes.",
    competitor: "Appcues",
    competitorPrice: "$300/mo",
    rows: [
      {
        feature: "Starting price",
        ontheway: "Free ($0/mo)",
        other: "$300/mo (1,000 MAUs)",
        note: "OnTheWay Pro is $19/mo",
      },
      {
        feature: "SDK size",
        ontheway: "~5KB gzipped",
        other: "~200KB+",
        note: "OnTheWay lazy-loads Driver.js",
      },
      {
        feature: "AI tour generation",
        ontheway: "✅ Built-in — plain text to tour",
        other: "✅ Appcues AI (Grow tier)",
        note: "OnTheWay AI included in free tier",
      },
      {
        feature: "Visual recorder",
        ontheway: "✅ Click-to-capture",
        other: "✅ WYSIWYG builder",
        note: "",
      },
      {
        feature: "React SDK",
        ontheway: "✅ Provider, hooks, components",
        other: "⚠️ JavaScript SDK only",
        note: "",
      },
      {
        feature: "Setup time",
        ontheway: "30 seconds (one script tag)",
        other: "15–30 minutes",
        note: "",
      },
      {
        feature: "Free tier",
        ontheway: "✅ 3 projects, 1K views/mo",
        other: "❌ No free tier",
        note: "",
      },
      {
        feature: "Open-source SDK",
        ontheway: "✅ MIT licensed",
        other: "❌ Proprietary",
        note: "",
      },
      {
        feature: "Multi-channel (email, push)",
        ontheway: "❌ In-app only",
        other: "✅ In-app, email, push",
        note: "Appcues stronger for multi-channel",
      },
      {
        feature: "User licenses",
        ontheway: "Unlimited",
        other: "5 licenses (Start tier)",
        note: "",
      },
    ],
    benefits: [
      {
        title: "$0 vs $300/month",
        description:
          "OnTheWay's free tier gives you 3 projects and 1,000 views/month. Appcues has no free tier and starts at $300/month. Even OnTheWay Pro at $19/mo is 15x cheaper.",
      },
      {
        title: "AI on every tier",
        description:
          "OnTheWay includes AI tour generation on the free tier. Appcues limits their AI features to the Grow plan at $750/month.",
      },
      {
        title: "Developer-first SDK",
        description:
          "OnTheWay ships a proper React SDK with Provider, hooks, and components. Install via npm, import, and go. No WYSIWYG-only workflows.",
      },
      {
        title: "Sub-5KB impact",
        description:
          "OnTheWay's SDK is ~5KB gzipped with lazy-loaded dependencies. Your Lighthouse score stays intact. Appcues' scripts are significantly heavier.",
      },
    ],
    faqs: [
      {
        question: "Is OnTheWay a full Appcues replacement?",
        answer:
          "OnTheWay covers product tours, onboarding flows, tooltips, and completion tracking. Appcues additionally offers email/push notifications, NPS surveys, and advanced segmentation. For teams focused on in-app onboarding, OnTheWay is a strong alternative.",
      },
      {
        question: "Does OnTheWay scale to enterprise?",
        answer:
          "Yes. OnTheWay offers an Enterprise tier with unlimited views, SSO/SAML, SLA, and dedicated support. Contact us for custom pricing.",
      },
      {
        question: "How does OnTheWay's AI compare to Appcues AI?",
        answer:
          "OnTheWay's AI generates tour steps from plain-text descriptions and can analyze your app pages to suggest tours. It's included on every tier. Appcues AI focuses on behavioral personalization and is limited to their Grow tier ($750/mo).",
      },
      {
        question: "Can I try OnTheWay before switching from Appcues?",
        answer:
          "Yes. Sign up for the free tier, create your first tour with AI or the visual recorder, and compare the results. No credit card needed.",
      },
    ],
    keywords: [
      "appcues alternative",
      "appcues alternative free",
      "appcues pricing",
      "cheap appcues alternative",
      "product tour tool free",
    ],
  },

  "chameleon-alternative": {
    slug: "chameleon-alternative",
    seoTitle:
      "OnTheWay vs Chameleon — Simple Chameleon Alternative from $0/mo",
    metaDescription:
      "Chameleon starts at $279/mo. OnTheWay is free. Create AI-powered product tours with a ~5KB SDK. The simpler, cheaper Chameleon alternative for product teams.",
    h1: "The Chameleon Alternative Without the Enterprise Price Tag",
    subheading:
      "Product tours in minutes, not meetings. AI-powered. Free to start.",
    intro:
      "Chameleon is a feature-rich in-app engagement platform — but at $279/month with usage-based pricing that scales with your MTUs, it's designed for mid-market and enterprise teams. OnTheWay gives you the core of what you need — product tours, tooltips, onboarding flows — with AI-powered step generation and a lightweight SDK, starting at $0/month.",
    competitor: "Chameleon",
    competitorPrice: "$279/mo",
    rows: [
      {
        feature: "Starting price",
        ontheway: "Free ($0/mo)",
        other: "$279/mo (Startup)",
        note: "OnTheWay Pro is $19/mo",
      },
      {
        feature: "Annual commitment",
        ontheway: "❌ No contracts",
        other: "✅ Growth requires annual ($12K/yr)",
        note: "",
      },
      {
        feature: "SDK size",
        ontheway: "~5KB gzipped",
        other: "~200KB+ script",
        note: "",
      },
      {
        feature: "AI tour generation",
        ontheway: "✅ Text-to-tour, page analysis",
        other: "✅ Copilot Agent",
        note: "",
      },
      {
        feature: "Visual recorder",
        ontheway: "✅ Click-to-capture",
        other: "✅ No-code builder",
        note: "",
      },
      {
        feature: "React SDK",
        ontheway: "✅ Full React integration",
        other: "❌ Script-based",
        note: "",
      },
      {
        feature: "Free tier",
        ontheway: "✅ 3 projects, 1K views/mo",
        other: "❌ No free tier",
        note: "",
      },
      {
        feature: "Seat limits",
        ontheway: "Unlimited",
        other: "6 seats (Startup)",
        note: "",
      },
      {
        feature: "A/B testing",
        ontheway: "❌ Not yet",
        other: "✅ Growth tier",
        note: "Chameleon stronger for experimentation",
      },
      {
        feature: "Setup complexity",
        ontheway: "One script tag or npm install",
        other: "Requires implementation support",
        note: "",
      },
    ],
    benefits: [
      {
        title: "14x cheaper to start",
        description:
          "OnTheWay Pro costs $19/month. Chameleon Startup costs $279/month. For early-stage teams, that's the difference between shipping and budgeting.",
      },
      {
        title: "No annual contracts",
        description:
          "OnTheWay is month-to-month. Cancel anytime. Chameleon's Growth tier requires an annual commitment of $12,000/year minimum.",
      },
      {
        title: "Self-serve setup",
        description:
          "Install OnTheWay in 30 seconds with npm or a script tag. No onboarding calls, no implementation meetings, no waiting for CSM assignment.",
      },
      {
        title: "AI that generates entire tours",
        description:
          "Describe what you want in plain text. OnTheWay's AI analyzes your page and generates steps with selectors, descriptions, and positioning — automatically.",
      },
    ],
    faqs: [
      {
        question: "Does OnTheWay support microsurveys like Chameleon?",
        answer:
          "OnTheWay focuses on product tours and onboarding flows. For in-app microsurveys, Chameleon has a dedicated feature. If surveys are critical, consider keeping Chameleon for surveys while using OnTheWay for tours.",
      },
      {
        question: "Can OnTheWay handle complex onboarding flows?",
        answer:
          "Yes. OnTheWay supports conditional steps, URL pattern matching, trigger modes (auto-start, first-visit, manual), and completion tracking. For multi-step flows with branching logic, the Code & Config mode gives you full programmatic control.",
      },
      {
        question:
          "How does OnTheWay's performance compare to Chameleon's script?",
        answer:
          "OnTheWay's SDK is ~5KB gzipped and lazy-loads the tour engine only when needed. This means near-zero impact on page load times and Lighthouse scores.",
      },
      {
        question: "Is OnTheWay suitable for larger teams?",
        answer:
          "Yes. OnTheWay Enterprise offers unlimited views, SSO/SAML, SLA, and dedicated support. For teams that need governance features and role-based permissions, Chameleon may offer more granularity.",
      },
    ],
    keywords: [
      "chameleon alternative",
      "chameleon io alternative",
      "chameleon pricing",
      "cheap product tour tool",
      "chameleon alternative free",
    ],
  },

  "intro-js-alternative": {
    slug: "intro-js-alternative",
    seoTitle:
      "OnTheWay vs Intro.js — Modern Intro.js Alternative with AI & Dashboard",
    metaDescription:
      "Like Intro.js but with a dashboard, AI generation, and analytics? OnTheWay is the modern alternative — free tier, visual recorder, React SDK, and completion tracking.",
    h1: "The Modern Intro.js Alternative with AI & Analytics",
    subheading:
      "Same lightweight approach. Plus a dashboard, AI generation, and analytics.",
    intro:
      "Intro.js is a great open-source library for simple step-by-step tours — but it's a JavaScript library, not a product. You still need to write all the tour configuration by hand, build your own management UI, and track completions yourself. OnTheWay builds on the same lightweight philosophy but adds what Intro.js is missing: a visual recorder, AI-powered step generation, a management dashboard, and built-in analytics.",
    competitor: "Intro.js",
    competitorPrice: "Free (AGPL) / $9.99+",
    rows: [
      {
        feature: "Price",
        ontheway: "Free tier / $19/mo Pro",
        other: "Free (AGPL) / $9.99–$299 one-time",
        note: "Both have free options",
      },
      {
        feature: "License",
        ontheway: "MIT (SDK)",
        other: "AGPL (commercial from $9.99)",
        note: "AGPL requires source disclosure",
      },
      {
        feature: "Dashboard / UI",
        ontheway: "✅ Full management dashboard",
        other: "❌ Code-only",
        note: "OnTheWay: no coding needed",
      },
      {
        feature: "AI tour generation",
        ontheway: "✅ Text-to-tour + page analysis",
        other: "❌ Manual configuration only",
        note: "",
      },
      {
        feature: "Visual recorder",
        ontheway: "✅ Click-to-capture steps",
        other: "❌ Write JSON/JS manually",
        note: "",
      },
      {
        feature: "Analytics",
        ontheway: "✅ Completion tracking, drop-off",
        other: "❌ Build your own",
        note: "",
      },
      {
        feature: "React SDK",
        ontheway: "✅ Provider, hooks, components",
        other: "⚠️ Wrapper packages only",
        note: "",
      },
      {
        feature: "SDK size",
        ontheway: "~5KB (lazy-loads engine)",
        other: "~10KB",
        note: "Both lightweight",
      },
      {
        feature: "CDN / script tag",
        ontheway: "✅ One-line install",
        other: "✅ CDN available",
        note: "",
      },
      {
        feature: "Hosting",
        ontheway: "SaaS (or self-host SDK)",
        other: "Self-hosted only",
        note: "Intro.js: you manage everything",
      },
    ],
    benefits: [
      {
        title: "A dashboard, not just a library",
        description:
          "OnTheWay gives you a management dashboard to create, edit, and deploy tours — no code changes needed. Intro.js requires you to modify your source code for every tour update.",
      },
      {
        title: "AI generates your tours",
        description:
          "Describe what the tour should do in plain text. OnTheWay's AI analyzes your page, generates steps with CSS selectors and descriptions. With Intro.js, you write every step by hand.",
      },
      {
        title: "Built-in analytics",
        description:
          "Track tour completions, drop-off points, and user engagement out of the box. With Intro.js, you'd need to build your own tracking system.",
      },
      {
        title: "Visual recorder for non-developers",
        description:
          "Product managers can create tours by clicking through the app. No code, no selectors, no deployment pipeline. Intro.js requires developer involvement for every change.",
      },
    ],
    faqs: [
      {
        question: "Should I use Intro.js or OnTheWay?",
        answer:
          "If you want a minimal JS library and are comfortable managing tours in code, Intro.js is excellent. If you want a dashboard, AI generation, visual recording, and analytics without building infrastructure, OnTheWay is the better choice.",
      },
      {
        question: "Is OnTheWay as lightweight as Intro.js?",
        answer:
          "OnTheWay's SDK is ~5KB gzipped (Intro.js is ~10KB). Both are lightweight. OnTheWay lazy-loads the tour engine (Driver.js) only when a tour is triggered, so initial page load impact is minimal.",
      },
      {
        question: "Can I migrate from Intro.js to OnTheWay?",
        answer:
          "Yes. Your existing tour step definitions (element selectors, titles, descriptions) can be recreated in OnTheWay's dashboard or via the code API. The AI generator can also produce equivalent tours from text descriptions.",
      },
      {
        question: "Does OnTheWay require a server?",
        answer:
          "OnTheWay's SaaS version handles everything — dashboard, API, analytics. The SDK itself is client-side only, similar to Intro.js. You can also self-host the SDK and manage tour configurations locally.",
      },
    ],
    keywords: [
      "intro.js alternative",
      "introjs alternative",
      "intro js alternative",
      "intro.js with dashboard",
      "product tour library alternative",
    ],
  },
};

const allSlugs = Object.keys(pages) as Slug[];

export function generateStaticParams() {
  return allSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = pages[slug as Slug];
  if (!data) return {};

  const canonicalUrl = `https://ontheway.to/compare/${slug}`;

  return {
    title: data.seoTitle,
    description: data.metaDescription,
    keywords: data.keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: data.seoTitle,
      description: data.metaDescription,
      url: canonicalUrl,
      siteName: "OnTheWay",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: data.seoTitle,
      description: data.metaDescription,
    },
  };
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-4 w-4 shrink-0 text-green-500"
    >
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
    </svg>
  );
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = pages[slug as Slug];
  if (!data) notFound();

  const canonicalUrl = `https://ontheway.to/compare/${slug}`;

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "OnTheWay",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "AI-powered product tour builder. Record interactive tours by clicking through your app. Deploy with one line of code.",
    url: "https://ontheway.to",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const otherSlugs = allSlugs.filter((s) => s !== slug);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <header className="border-b sticky top-0 bg-white/80 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-lg sm:text-xl font-bold flex items-center gap-2"
          >
            <img
              src="/logo.svg"
              alt="OnTheWay"
              className="w-7 h-7 sm:w-8 sm:h-8"
            />
            <span>OnTheWay</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6 text-sm">
            <Link
              href="/demo"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Demo
            </Link>
            <Link
              href="/docs"
              className="text-gray-600 hover:text-black transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/dashboard"
              className="bg-black text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-3">
        <nav aria-label="breadcrumb" className="text-xs text-gray-400">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-black transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/compare/userguiding-alternative"
                className="hover:text-black transition-colors"
              >
                Compare
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-600">{data.competitor} Alternative</li>
          </ol>
        </nav>
      </div>

      {/* Hero */}
      <section className="px-4 pt-10 sm:pt-16 pb-10 sm:pb-14">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            OnTheWay vs {data.competitor}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-[1.1] tracking-tight">
            {data.h1}
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
            {data.subheading}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-all text-sm font-medium shadow-lg shadow-black/10"
            >
              Try OnTheWay Free →
            </Link>
            <Link
              href="/demo"
              className="border border-gray-300 px-8 py-3 rounded-xl hover:bg-gray-50 transition-all text-sm text-gray-700"
            >
              See Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-3xl mx-auto px-4 pb-10">
        <p className="text-base leading-relaxed text-gray-600">{data.intro}</p>
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 pb-16 sm:pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center tracking-tight">
          OnTheWay vs {data.competitor}: Side-by-Side
        </h2>
        <div className="overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">
                    Feature
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                      OnTheWay
                    </span>
                  </th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-500">
                    {data.competitor}
                  </th>
                  <th className="hidden md:table-cell px-5 py-3.5 text-left font-semibold text-gray-400">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b transition-colors hover:bg-gray-50 ${i === data.rows.length - 1 ? "border-b-0" : ""}`}
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-700">
                      {row.feature}
                    </td>
                    <td className="px-5 py-3.5">{row.ontheway}</td>
                    <td className="px-5 py-3.5 text-gray-500">{row.other}</td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-xs text-gray-400">
                      {row.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-gray-50 border-y">
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center tracking-tight">
            Why choose OnTheWay over {data.competitor}?
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
            Built for developers and product teams who ship fast
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {data.benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white rounded-xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start gap-2 mb-2">
                  <CheckIcon />
                  <h3 className="text-sm font-semibold leading-snug">
                    {benefit.title}
                  </h3>
                </div>
                <p className="pl-6 text-sm leading-relaxed text-gray-500">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing snapshot */}
      <section className="max-w-4xl mx-auto px-4 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold mb-10 text-center tracking-tight">
          Pricing Comparison
        </h2>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="rounded-xl border-2 border-black p-6 relative">
            <div className="absolute -top-3 left-4 bg-black text-white text-xs font-medium px-3 py-1 rounded-full">
              OnTheWay
            </div>
            <div className="text-3xl font-bold mb-1">
              $0
              <span className="text-base font-normal text-gray-500">/mo</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">Free tier included</p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>3 projects, 5
                tours each
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>1,000 views/mo
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>AI tour
                generation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>Pro: $19/mo
                unlimited
              </li>
            </ul>
          </div>
          <div className="rounded-xl border p-6 relative">
            <div className="absolute -top-3 left-4 bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
              {data.competitor}
            </div>
            <div className="text-3xl font-bold mb-1 text-gray-700">
              {data.competitorPrice}
            </div>
            <p className="text-sm text-gray-500 mb-4">Starting price</p>
            <ul className="text-sm text-gray-500 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">–</span>
                {data.competitor === "Intro.js"
                  ? "One-time license"
                  : "Monthly subscription"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">–</span>
                {data.competitor === "Intro.js"
                  ? "No dashboard included"
                  : "MAU/MTU-based pricing"}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">–</span>
                {data.competitor === "Intro.js"
                  ? "Self-hosted, no analytics"
                  : "Enterprise tier required for SSO"}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 border-y">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-10 text-center tracking-tight">
            Frequently Asked Questions
          </h2>
          <dl className="space-y-8">
            {data.faqs.map((faq) => (
              <div key={faq.question}>
                <dt className="text-base font-semibold mb-2">
                  {faq.question}
                </dt>
                <dd className="text-sm leading-relaxed text-gray-500">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
            Ready to try the {data.competitor} alternative?
          </h2>
          <p className="text-gray-500 mb-8">
            Start free. Build your first tour in minutes. No credit card
            required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="bg-black text-white px-8 py-3.5 rounded-xl hover:bg-gray-800 transition-all font-medium shadow-lg shadow-black/10"
            >
              Get Started — Free
            </Link>
            <Link
              href="/docs"
              className="border border-gray-300 px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-all text-gray-700"
            >
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-400">
          <Link
            href="/"
            className="hover:text-black transition-colors"
          >
            OnTheWay Home
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/docs"
            className="hover:text-black transition-colors"
          >
            Docs
          </Link>
          <span aria-hidden="true">·</span>
          {otherSlugs.map((s) => (
            <span key={s} className="contents">
              <Link
                href={`/compare/${s}`}
                className="hover:text-black transition-colors"
              >
                vs {pages[s].competitor}
              </Link>
              <span aria-hidden="true">·</span>
            </span>
          ))}
          <a
            href="https://github.com/jiusanzhou/ontheway"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 flex items-center gap-1.5">
            <img
              src="/logo.svg"
              alt="OnTheWay"
              className="w-5 h-5"
            />{" "}
            OnTheWay · Built by{" "}
            <a
              href="https://zoe.im"
              className="underline hover:text-black transition-colors"
            >
              Zoe
            </a>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link
              href="/docs"
              className="hover:text-black transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/demo"
              className="hover:text-black transition-colors"
            >
              Demo
            </Link>
            <a
              href="https://github.com/jiusanzhou/ontheway"
              className="hover:text-black transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
