// Read values from environment (NEXT_PUBLIC_ so they're available in the client)
const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || 'CALENDLY_URL_PLACEHOLDER';
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || 'WHATSAPP_NUMBER_PLACEHOLDER';

const site = {
  meta: {
    name: 'Parabolica',
    description:
      'Build it - then make it production ready. We build web, mobile, AI/ML, and data products. If you already have an MVP (including AI-coded builds), we refactor and harden it into a scalable, secure, observable production system — and stay on as your technical partner.',
    url: 'https://parabolica.io',
    themeColor: '#0FBAB0',
  },

  hero: {
    eyebrow: 'Design • Product • Engineering',
    title: 'We design and build products that scale businesses',
    description:
      'We build MVPs and turn existing products into production ready systems. Your technical partner from launch to scale.',
    primaryCta: { label: 'Book a quick call', href: CALENDLY_URL },
    secondaryCta: { label: 'Contact via WhatsApp', href: `https://wa.me/${WHATSAPP_NUMBER}` },
    image: '/brand/hero-illustration.png',
  },

  services: [
    {
      id: 'scale-production',
      title: 'Scale & Production Engineering',
      description:
        'Turn an MVP into a reliable product. We harden architecture, improve performance, strengthen security, and set up CI/CD + observability so your app survives real users and growth.',
      features: ['Architecture hardening', 'CI/CD pipelines', 'Observability & SRE'],
    },
    {
      id: 'mvp-build',
      title: 'MVP Build (Web & Mobile)',
      description:
        'Launch fast with a foundation you won’t replace later. We build MVPs with authentication, payments, admin tooling, and scalable patterns — ready for iteration and traction.',
      features: ['Next.js / React', 'Mobile apps', 'Auth, payments & admin'],
    },
    {
      id: 'ai-ml',
      title: 'AI/ML & LLM Features',
      description:
        'Add AI that actually ships. We build churn prediction, personalization, forecasting, and LLM workflows — integrated into your product with evaluation, monitoring, and measurable outcomes.',
      features: ['Predictive ML', 'LLM integration', 'Model monitoring (MLOps)'],
    },
    {
      id: 'data-analytics',
      title: 'Data Platforms & Analytics',
      description:
        'Make decisions using real signals. We implement tracking, dashboards, and pipelines so you can measure activation, retention, revenue, and performance — then iterate with confidence.',
      features: ['Instrumentation', 'Dashboards & BI', 'Data pipelines'],
    },
  ],

  differentiators: [
    {
      title: 'Design-led engineering',
      description:
        'We place design and product thinking at the core of engineering decisions to ship thoughtful, usable features faster.',
    },
    {
      title: 'End-to-end partnerships',
      description:
        'From discovery to launch and post-launch optimizations — we work as an extension of your team, not a vendor.',
    },
    {
      title: 'Accessibility-first',
      description:
        'Semantic HTML, ARIA when required, and strong focus styles ensure inclusive experiences for all users.',
    },
    {
      title: 'Performance & reliability',
      description:
        'We optimize for fast initial loads, smooth interactions, and resilient infrastructure so your product performs under load.',
    },
  ],

  caseStudies: [
    {
      id: 'weather-station',
      client: 'Weather Station Network',
      summary:
        'Built an IoT network and dashboard collecting 17 environmental parameters from distributed sensors with real-time visualization and alerts.',
      problem: 'Needed a resilient, low-latency pipeline to ingest sensor data from thousands of devices.',
      built:
        'Designed a resilient ingestion layer using MQTT, a time-series datastore, and a performant dashboard for visualization and alerting.',
      outcome: 'Reliable 99.9% data availability and actionable alerts, enabling faster local responses to weather events.',
      results: ['17 parameters captured', 'Real-time alerts', '99.9% availability'],
      image: '/brand/logo-1-color.png',
      cta: { label: 'Read case study', href: '/case-studies/weather-station' },
    },
    {
      id: 'padel-chief',
      client: 'Padel Chief',
      summary:
        'Launched a marketplace MVP to 10k users in three months. Improved conversion by 42% through redesign and checkout optimizations.',
      problem: 'Marketplace had low conversions and onboarding friction for new users.',
      built:
        'Reworked onboarding flows, redesigned checkout, and implemented analytics-driven experiments to validate improvements.',
      outcome: 'Conversion improved by 42% and achieved 10k MAU within 90 days.',
      results: ['+42% conversion', '10k MAU in 90 days', 'Decreased TTFB by 60%'],
      image: '/brand/padel-chief-logo.png',
      cta: { label: 'Read case study', href: '/case-studies/padel-chief' },
    },
    {
      id: 'telco-churn',
      client: 'Telco Churn Prediction',
      summary:
        'Built an ML-driven churn prediction pipeline and dashboards to help the telco reduce churn proactively.',
      problem: 'High customer churn without clear leading indicators or automated interventions.',
      built:
        'Developed feature pipelines, trained models for churn prediction, and integrated ML outputs into CRM workflows for targeted retention campaigns.',
      outcome: 'Reduced churn by double-digits in pilot cohorts and enabled automated retention outreach.',
      results: ['AI-driven predictions', 'Integrated CRM workflows', 'Double-digit churn reduction'],
      image: '/brand/logo-2-color.png',
      cta: { label: 'Read case study', href: '/case-studies/telco-churn' },
    },
  ],

  process: [
    {
      step: 1,
      title: 'Quick discovery call',
    description:
        "We understand what you're building, what's not working, and what \"success\" looks like.",
    },
    {
      step: 2,
      title: 'Plan & proposal',
      description:
        'We map the fastest path to results, agree on scope, timeline, and deliverables — then start.',
    },
    {
      step: 3,
      title: 'Build & improve',
      description:
        'We design and develop in short cycles, sharing progress often so you can guide direction early.',
    },
    {
      step: 4,
      title: 'Launch & support',
      description:
        'We help you go live smoothly and stay available to improve, fix, and scale as you grow.',
    },
  ],
  faqs: [
    {
      question: 'What is an MVP?',
      answer:
        'An MVP (Minimum Viable Product) is the simplest version of your product that can be released to early users to validate your idea. It includes only the core features needed to solve your main problem and gather user feedback so you can iterate.',
    },
    {
      question: 'What exactly do I get at the end?',
      answer:
        'Working, production-ready features, documentation, and next-step recommendations — often including CI/CD, monitoring, and handover materials so your team can operate and iterate.',
    },
    {
      question: 'Can you work with existing code?',
      answer:
        'Yes. We audit and refactor codebases, add tests and clear boundaries, and make incremental changes that reduce risk and future rewrites.',
    },
    {
      question: 'Do you build AI features?',
      answer:
        'Yes — we design and ship ML and LLM features end-to-end, with data pipelines, model integration, and production monitoring.',
    },
    {
      question: 'Can you make custom hardware?',
      answer:
        'Yes. We develop custom hardware and firmware so you own the design and IP — not locked into a third‑party vendor — and can customize it as your product evolves.',
    },
    {
      question: 'What technologies do you use?',
      answer:
        'We commonly use Next.js/React for web, React Native/Expo for mobile, Python/Go for backend, and AWS/GCP for infrastructure — choosing tools that fit the problem.',
    },
    {
      question: 'How do you deliver so fast?',
      answer:
        'By delivering the smallest valuable increments, reusing proven components, and automating CI/CD so feedback cycles are short and predictable.',
    },
    {
      question: 'What if I need changes after launch?',
      answer:
        'We provide post-launch support and iterative improvements via retainers or scoped projects to keep your product improving after release.',
    },
    {
      question: 'Do you sign NDAs?',
      answer:
        'Yes. We’re happy to sign an NDA before conversations — just mention it when you reach out.',
    },
  ],

  contact: {
    heading: 'Let’s build something meaningful',
    bullets: [
      'Schedule a quick demo. We typically reply within 4 hours.',
      'Message us on WhatsApp to start a fast convo.',
      'Prefer to talk? Call us! We can sign an NDA.',
    ],
    calendlyUrl: CALENDLY_URL,
    whatsappNumber: WHATSAPP_NUMBER,
    email: 'hello@parabolica.io',
  },

  footer: {
    columns: [
      {
        heading: 'Services',
        links: [
          { label: 'Scale & Production', href: '#services' },
          { label: 'MVP Build', href: '#services' },
          { label: 'AI/ML & LLM', href: '#services' },
          { label: 'Data & Analytics', href: '#services' },
        ],
      },
      {
        heading: 'Company',
        links: [
          { label: 'About', href: '/about' },
          { label: 'Careers', href: '/careers' },
          { label: 'Contact', href: '#contact' },
        ],
      },
      {
        heading: 'Social',
        links: [
          { label: 'LinkedIn', href: 'https://www.linkedin.com/company/parabolica-io/' },
          { label: 'Instagram', href: 'https://www.instagram.com/parabolica.io?igsh=MXV1aWpvMHFtdHFlbA==' },
          { label: 'Facebook', href: 'https://www.facebook.com/people/Parabolica/61587909052701/' },
        ],
      },
      {
        heading: 'Legal',
        links: [
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
        ],
      },
    ],
    smallPrint:
      '© ' + new Date().getFullYear() + ' Parabolica. All rights reserved. Built with accessibility and performance in mind.',
    logos: ['/brand/logo-1-color.png', '/brand/logo-2-color.png'],
  },
};

export default site;

