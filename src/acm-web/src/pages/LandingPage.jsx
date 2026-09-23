import { Link } from 'react-router-dom';

const navItems = ['Platform', 'Features', 'Security', 'Support'];

const featureCards = [
  {
    title: 'Curriculum & Course Planning',
    description: 'Build course structures, mapping content to topics and learning objectives with clarity.',
    accent: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Approval & Audit Trails',
    description: 'Track departmental reviews, approval workflows, and policy compliance with transparent history.',
    accent: 'from-violet-500 to-fuchsia-500',
  },
  {
    title: 'Session Monitoring & Audio Analytics',
    description: 'Review live and archived teaching sessions with transcripts and student engagement tracking.',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'User Management & Role Access',
    description: 'Control user access by role and maintain a secure and scalable academic operations model.',
    accent: 'from-amber-500 to-orange-500',
  },
];

function LogoMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-black text-white shadow-lg shadow-blue-500/30">
        A
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">ACM</p>
        <p className="text-base font-bold text-slate-900">Academic Course Model</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <LogoMark />

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-slate-300 transition hover:text-white">
                {item}
              </a>
            ))}
          </nav>

          <Link
            to="/login"
            className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.22),transparent_30%)]" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-28">
            <div className="flex flex-col justify-center">
              <span className="mb-6 inline-flex w-fit items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                Academic Intelligence Platform
              </span>

              <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Academic Course Model Portal
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                A connected academic workspace for planning curriculum, reviewing approvals, monitoring study sessions, and managing permissions across the institution.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:brightness-110"
                >
                  Access Portal
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Explore Features
                </a>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-slate-300">
                <div>
                  <p className="text-2xl font-bold text-white">4</p>
                  <p>Core modules</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">24/7</p>
                  <p>Operational visibility</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">Role-aware</p>
                  <p>Access control</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-blue-950/30 backdrop-blur-sm">
                <div className="rounded-2xl bg-slate-900 p-5 ring-1 ring-white/10">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Overview</p>
                      <h2 className="mt-2 text-xl font-bold text-white">Academic Dashboard</h2>
                    </div>
                    <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      Live
                    </span>
                  </div>

                  <div className="space-y-4">
                    {[
                      ['Curriculum', '98% aligned'],
                      ['Approvals', '12 pending'],
                      ['Sessions', '8 analyzed'],
                      ['Users', '142 accounts'],
                    ].map(([label, value], index) => (
                      <div key={label} className="rounded-xl border border-white/10 bg-slate-800/80 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">{label}</span>
                          <span className="text-xs font-medium text-blue-300">{index + 1}/4</span>
                        </div>
                        <div className="mt-3 h-2.5 rounded-full bg-slate-700">
                          <div
                            className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            style={{ width: `${70 + index * 8}%` }}
                          />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Platform Modules</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Built for every stage of academic delivery
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature) => (
              <div key={feature.title} className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-white/8">
                <div className={`mb-5 h-12 w-12 rounded-xl bg-gradient-to-br ${feature.accent} shadow-lg`} />
                <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 text-sm text-slate-400 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-semibold text-slate-200">© 2026 ACM Portal</p>
            <p className="mt-1">Academic Course Model</p>
          </div>

          <div className="flex gap-6">
            <a href="#platform" className="transition hover:text-white">Platform</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#support" className="transition hover:text-white">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
