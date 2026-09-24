import { ArrowUpRight, Check, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const tabs = ['Academic operations', 'Human oversight', 'Institutional memory'];
const copy = [
  'Connect curriculum decisions, AI analysis, human approvals, and session evidence in one auditable workspace.',
  'Route high-risk remedial plans to the right academic reviewer with evidence, context, and decision history attached.',
  'Capture teaching conversations, classify topics, and reveal where learners need more support.',
];
const features = [
  'Curriculum intelligence',
  'Human-in-the-loop approvals',
  'Session transcript analytics',
  'Role-aware governance',
];
const overview = [
  ['Approval queue', '03', 'High-risk plans'],
  ['Mastery average', '74%', 'Across 128 topics'],
  ['Active sessions', '08', '12h analyzed'],
  ['Curriculum health', '92%', '18 modules aligned'],
];

const AuroraStyles = () => (
  <style>{`
    @keyframes aurora-flow-1 {
      0% { transform: translate3d(0px, 0px, 0px) rotate(0deg) scale(1); opacity: 0.65; }
      33% { transform: translate3d(120px, -80px, 0px) rotate(90deg) scale(1.3); opacity: 0.85; }
      66% { transform: translate3d(-60px, 90px, 0px) rotate(180deg) scale(0.9); opacity: 0.55; }
      100% { transform: translate3d(0px, 0px, 0px) rotate(360deg) scale(1); opacity: 0.65; }
    }
    @keyframes aurora-flow-2 {
      0% { transform: translate3d(0px, 0px, 0px) rotate(0deg) scale(1); opacity: 0.55; }
      50% { transform: translate3d(-140px, 100px, 0px) rotate(-180deg) scale(1.4); opacity: 0.8; }
      100% { transform: translate3d(0px, 0px, 0px) rotate(-360deg) scale(1); opacity: 0.55; }
    }
    @keyframes aurora-flow-3 {
      0%, 100% { transform: translate3d(0px, 0px, 0px) scale(0.95); opacity: 0.5; }
      50% { transform: translate3d(100px, -60px, 0px) scale(1.25); opacity: 0.75; }
    }
    .aurora-blob-1 { animation: aurora-flow-1 18s ease-in-out infinite; will-change: transform, opacity; }
    .aurora-blob-2 { animation: aurora-flow-2 24s ease-in-out infinite; will-change: transform, opacity; }
    .aurora-blob-3 { animation: aurora-flow-3 20s ease-in-out infinite; will-change: transform, opacity; }
  `}</style>
);

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC] text-slate-900">
      <AuroraStyles />
      {/* Active Aurora Moving Mesh */}
      <div className="pointer-events-none absolute inset-0 z-0 min-h-full overflow-hidden">
        {/* Cyan/Blue Blob - Top Left */}
        <div 
          className="aurora-blob-1 absolute -left-[10%] -top-[15%] h-[700px] w-[700px] rounded-full" 
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.55) 0%, rgba(59,130,246,0.35) 45%, rgba(248,250,252,0) 70%)',
            filter: 'blur(64px)',
          }}
        />

        {/* Indigo/Purple Blob - Top Right */}
        <div 
          className="aurora-blob-2 absolute -right-[10%] top-[10%] h-[750px] w-[750px] rounded-full" 
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(168,85,247,0.35) 50%, rgba(248,250,252,0) 70%)',
            filter: 'blur(68px)',
          }}
        />

        {/* Azure/Sky Blue Blob - Bottom Center */}
        <div 
          className="aurora-blob-3 absolute bottom-[-5%] left-[20%] h-[650px] w-[650px] rounded-full" 
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.45) 0%, rgba(14,165,233,0.3) 50%, rgba(248,250,252,0) 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-3 shadow-md shadow-slate-200/50 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-black text-white shadow-md shadow-blue-200">
              A
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-600">ACM / 04</p>
              <p className="font-bold text-slate-900">Academic intelligence</p>
            </div>
          </div>
          <nav className="hidden gap-8 text-sm font-medium text-slate-500 md:flex">
            <a href="#platform" className="transition-colors hover:text-blue-600">Platform</a>
            <a href="#signals" className="transition-colors hover:text-blue-600">Signals</a>
            <a href="#governance" className="transition-colors hover:text-blue-600">Governance</a>
          </nav>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-200 transition-all hover:bg-blue-700"
          >
            Sign In <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-16 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-28">
          <div className="flex flex-col justify-center">
            <span className="flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Academic AI operating system
            </span>
            <h1 className="mt-7 max-w-2xl text-5xl font-black leading-[1.04] tracking-tight text-slate-900 sm:text-6xl">
              Empowering{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-400 bg-clip-text text-transparent">
                academic intelligence.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
              ACM gives departments the intelligence layer to plan better courses, review AI recommendations, and understand learning in motion.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700"
              >
                Open the portal <ChevronRight className="h-4 w-4" />
              </Link>
              <a
                href="#platform"
                className="rounded-lg border border-slate-200 bg-white/70 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-white"
              >
                Explore platform
              </a>
            </div>

            <div className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-slate-200/80 pt-6">
              <div>
                <p className="text-2xl font-black text-slate-900">99.4%</p>
                <p className="mt-1 text-xs text-slate-500">AI analysis accuracy</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">12k+</p>
                <p className="mt-1 text-xs text-slate-500">Remedial plans generated</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">42</p>
                <p className="mt-1 text-xs text-slate-500">Institutions connected</p>
              </div>
            </div>
          </div>

          {/* Frosted glass dashboard preview */}
          <div className="relative">
            <div className="rounded-3xl border border-white/80 bg-white/55 p-3 shadow-2xl shadow-blue-200/50 backdrop-blur-xl">
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Department overview</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">Academic command center</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">Live</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {overview.map(([label, value, note], index) => (
                    <div key={label} className="rounded-xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
                      <p className={`mt-2 text-xs font-medium ${index === 0 ? 'text-rose-600' : 'text-cyan-600'}`}>
                        {note}
                      </p>
                      <div className="mt-4 h-1 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                          style={{ width: `${68 + index * 8}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Tabs */}
        <section id="platform" className="border-t border-slate-200/80 bg-white/50 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">One platform, four signals</p>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  The intelligence layer between teaching and action.
                </h2>
              </div>
              <div>
                <div className="flex flex-wrap gap-2 border-b border-slate-200/80 pb-4">
                  {tabs.map((tab, index) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(index)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                        activeTab === index
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                          : 'text-slate-500 hover:text-blue-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <p className="pt-8 text-lg leading-8 text-slate-600">{copy[activeTab]}</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/75 p-3 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      <Check className="h-4 w-4 text-emerald-600" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="governance" className="relative z-10 border-t border-slate-200/80 px-6 py-8 text-sm text-slate-500">
        <div className="mx-auto flex max-w-7xl justify-between">
          <p>© 2026 Academic Course Model</p>
          <p>Built for accountable academic AI</p>
        </div>
      </footer>
    </div>
  );
}