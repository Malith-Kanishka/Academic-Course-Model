import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  CreditCard,
  GraduationCap,
  KeyRound,
  Languages,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import approvalService from '../services/approvalService';
import { authService } from '../services/authService';
import { curriculumService } from '../services/curriculumService';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { getUserRole, hasRole } from '../utils/roles';
import StudentRemedialPlanCard from '../components/common/StudentRemedialPlanCard';

const COPY = {
  en: {
    eyebrow: 'Academic intelligence', overview: 'Overview', welcome: 'Good to see you',
    live: 'Live workspace', studentSnapshot: 'Your learning snapshot', facultySnapshot: 'Academic operations',
    enrolled: 'Enrolled modules', mastery: 'Average AI mastery', remedial: 'Active remedial plans', semester: 'Semester progress',
    managed: 'Managed modules', approvals: 'Pending HITL approvals', risk: 'Students at risk',
    notAvailable: 'Not available from current academic records', moduleData: 'Enrollment data is not connected',
    masteryData: 'No mastery report available', remedialData: 'Student plan status is not available', creditsData: 'Credit progress is not available',
    topics: 'topics', modules: 'modules', students: 'students', inReview: 'In the review queue',
    activeModules: 'Active modules', catalog: 'Course progress', catalogSub: 'Explore the current course catalog and continue with an AI-assisted study session.',
    noModules: 'No modules are available yet.', noEnrolledModules: 'No enrolled modules are linked to this account.', loading: 'Loading academic data…', retry: 'Retry',
    launch: 'Launch AI Assistant', openCurriculum: 'Open curriculum', completion: 'Completion', progressUnavailable: 'Progress not reported',
    alertTitle: 'AI safety & remedial status', reviewNeeded: (count) => `Action needed: ${count} remedial plan${count === 1 ? '' : 's'} awaiting human review.`,
    clearReviews: 'No pending HITL reviews. New evaluation updates will appear here.', studentPlan: 'Your remedial-plan status is not available from this account yet.',
    profile: 'Profile & account', identity: 'Identity', department: 'Department', computing: 'Computing',
    accountSecurity: 'Account security', changePassword: 'Change password', currentPassword: 'Current password', newPassword: 'New password',
    confirmPassword: 'Confirm new password', savePassword: 'Update password', saving: 'Updating…', passwordSuccess: 'Password updated successfully.',
    passwordMismatch: 'New passwords do not match.', passwordLength: 'Use at least 8 characters for your new password.',
    passwordError: 'Could not update password. Check your current password and try again.',
    session: 'Session', activeSession: 'This device is signed in', signOutAll: 'Sign out of all devices', signingOut: 'Signing out…',
    signOutConfirm: 'Sign out this account on every device? You will need to sign in again here.',
    sessionError: 'Could not sign out other sessions. Please try again.', preferences: 'Preferences', language: 'Language',
    emailAlerts: 'Email alerts', emailAlertsSub: 'Email me when AI remedial plans are approved', enabled: 'On', disabled: 'Off',
    student: 'Student', lecturer: 'Lecturer', teacher: 'Teacher', departmentHead: 'Department Head', admin: 'Administrator',
    shortId: 'University ID', email: 'University email', facultyModules: (count) => `${count} active ${count === 1 ? 'module' : 'modules'}`,
    ofTopics: (count) => `${count} ${count === 1 ? 'topic' : 'topics'} mapped`, pendingCount: (count) => `${count} awaiting review`,
    available: 'Available', profileFallback: 'Academic member',
  },
  si: {
    eyebrow: 'ශාස්ත්‍රීය බුද්ධිය', overview: 'දළ විශ්ලේෂණය', welcome: 'ඔබව නැවත දැකීම සතුටක්',
    live: 'සජීවී වැඩබිම', studentSnapshot: 'ඔබේ ඉගෙනුම් සාරාංශය', facultySnapshot: 'ශාස්ත්‍රීය මෙහෙයුම්',
    enrolled: 'ලියාපදිංචි මොඩියුල', mastery: 'සාමාන්‍ය AI ප්‍රවීණතාව', remedial: 'සක්‍රීය පුනරීක්ෂණ සැලසුම්', semester: 'අධ්‍යයන වාර ප්‍රගතිය',
    managed: 'කළමනාකරණ මොඩියුල', approvals: 'අනුමැතිය බලාපොරොත්තු වන සැලසුම්', risk: 'අවදානම් සිසුන්',
    notAvailable: 'දැනට පවතින අධ්‍යයන දත්තවල නොමැත', moduleData: 'ලියාපදිංචි දත්ත සම්බන්ධ කර නැත',
    masteryData: 'ප්‍රවීණතා වාර්තාවක් නොමැත', remedialData: 'ශිෂ්‍ය සැලසුම් තත්ත්වය නොමැත', creditsData: 'ණය ප්‍රගතිය නොමැත',
    topics: 'මාතෘකා', modules: 'මොඩියුල', students: 'සිසුන්', inReview: 'සමාලෝචනය වෙමින්',
    activeModules: 'සක්‍රීය මොඩියුල', catalog: 'පාඨමාලා ප්‍රගතිය', catalogSub: 'පාඨමාලා නාමාවලිය ගවේෂණය කර AI සහාය ඇති අධ්‍යයනයක් අරඹන්න.',
    noModules: 'තවම මොඩියුල නොමැත.', noEnrolledModules: 'මෙම ගිණුමට ලියාපදිංචි මොඩියුල සම්බන්ධ කර නැත.', loading: 'අධ්‍යයන දත්ත පූරණය වෙමින්…', retry: 'නැවත උත්සාහ කරන්න',
    launch: 'AI සහායකය අරඹන්න', openCurriculum: 'විෂයමාලාව විවෘත කරන්න', completion: 'සම්පූර්ණතාව', progressUnavailable: 'ප්‍රගතිය වාර්තා කර නැත',
    alertTitle: 'AI ආරක්ෂාව සහ පුනරීක්ෂණ තත්ත්වය', reviewNeeded: (count) => `අවශ්‍ය ක්‍රියාව: සැලසුම් ${count}ක් මානව සමාලෝචනය බලාපොරොත්තු වේ.`,
    clearReviews: 'මානව සමාලෝචන බලාපොරොත්තුවෙන් නැත. නව යාවත්කාලීන මෙහි පෙන්වනු ඇත.', studentPlan: 'මෙම ගිණුමෙන් ඔබේ සැලසුම් තත්ත්වය ලබාගත නොහැක.',
    profile: 'පැතිකඩ සහ ගිණුම', identity: 'හැඳුනුම', department: 'අංශය', computing: 'පරිගණක අංශය',
    accountSecurity: 'ගිණුම් ආරක්ෂාව', changePassword: 'මුරපදය වෙනස් කරන්න', currentPassword: 'වත්මන් මුරපදය', newPassword: 'නව මුරපදය',
    confirmPassword: 'නව මුරපදය තහවුරු කරන්න', savePassword: 'මුරපදය යාවත්කාලීන කරන්න', saving: 'යාවත්කාලීන වෙමින්…', passwordSuccess: 'මුරපදය සාර්ථකව යාවත්කාලීන කරන ලදී.',
    passwordMismatch: 'නව මුරපද ගැළපෙන්නේ නැත.', passwordLength: 'නව මුරපදය අවම වශයෙන් අක්ෂර 8ක් විය යුතුය.',
    passwordError: 'මුරපදය වෙනස් කළ නොහැක. වත්මන් මුරපදය පරීක්ෂා කරන්න.',
    session: 'සැසිය', activeSession: 'මෙම උපාංගය පුරනය වී ඇත', signOutAll: 'සියලු උපාංගවලින් ඉවත් වන්න', signingOut: 'ඉවත් වෙමින්…',
    signOutConfirm: 'සියලු උපාංගවලින් ඉවත් වීමට අවශ්‍යද? නැවත පුරනය වීමට සිදුවේ.',
    sessionError: 'අනෙකුත් සැසිවලින් ඉවත් කළ නොහැක. නැවත උත්සාහ කරන්න.', preferences: 'අභිරුචි', language: 'භාෂාව',
    emailAlerts: 'විද්‍යුත් තැපැල් දැනුම්දීම්', emailAlertsSub: 'AI පුනරීක්ෂණ සැලසුම් අනුමත වූ විට දැනුම් දෙන්න', enabled: 'සක්‍රීයයි', disabled: 'අක්‍රීයයි',
    student: 'ශිෂ්‍ය', lecturer: 'කථිකාචාර්ය', teacher: 'ගුරුවරයා', departmentHead: 'අංශ ප්‍රධානී', admin: 'පරිපාලක',
    shortId: 'විශ්වවිද්‍යාල හැඳුනුම් අංකය', email: 'විශ්වවිද්‍යාල විද්‍යුත් තැපෑල', facultyModules: (count) => `සක්‍රීය මොඩියුල ${count}`,
    ofTopics: (count) => `මාතෘකා ${count}ක් සිතියම්ගතයි`, pendingCount: (count) => `සමාලෝචනයට ${count}ක්`,
    available: 'පවතී', profileFallback: 'අධ්‍යයන සාමාජික',
  },
};

const toItems = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.items ?? payload?.data ?? payload?.modules ?? [];
};

const roleText = (role, t) => ({
  student: t.student,
  professor: t.lecturer,
  ta: t.teacher,
  admin: t.admin,
})[role] ?? t.profileFallback;

const displayError = (error, fallback) => {
  const message = error?.response?.data?.message ?? error?.response?.data;
  return typeof message === 'string' ? message : fallback;
};

const initialEmailPreference = () => {
  try {
    return localStorage.getItem('acm-email-alerts') !== 'false';
  } catch {
    return true;
  }
};

const inputClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100';

function MetricCard({ icon: Icon, label, value, detail, tone = 'blue', link }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-5 text-3xl font-extrabold leading-none text-slate-950">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </>
  );

  return link ? (
    <Link to={link} className="group rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      {content}<ArrowUpRight className="mt-2 h-4 w-4 text-blue-600 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  ) : (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">{content}</div>
  );
}

export default function OverviewPage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const t = COPY[language] ?? COPY.en;
  const role = getUserRole(user);
  const isStudent = role === 'student';
  const canReview = hasRole(user, ['Professor', 'Admin']);
  const [modules, setModules] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moduleError, setModuleError] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [emailAlerts, setEmailAlerts] = useState(initialEmailPreference);
  const [activePlans, setActivePlans] = useState([]);

  useEffect(() => {
    if (!isStudent) return;
    approvalService.getMyActiveRemedialPlans().then(setActivePlans).catch(() => setActivePlans([]));
  }, [isStudent]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setModuleError('');
    setApprovalError('');

    const moduleRequest = curriculumService.getModules({ student: isStudent })
      .then((payload) => { if (active) setModules(toItems(payload)); })
      .catch(() => { if (active) setModuleError('Could not load course modules.'); });
    const approvalRequest = canReview
      ? approvalService.getPendingApprovals()
        .then((items) => { if (active) setPendingApprovals(items); })
        .catch(() => { if (active) setApprovalError('Could not load the HITL review queue.'); })
      : Promise.resolve();

    Promise.all([moduleRequest, approvalRequest]).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [canReview, isStudent, retryCount]);

  const activeModules = modules.filter((module) => !['inactive', 'archived', 'disabled'].includes(String(module.status ?? '').toLowerCase()));
  const totalTopics = activeModules.reduce((count, module) => count + (module.topics?.length ?? module.topicCount ?? 0), 0);
  const atRiskStudents = new Set(
    pendingApprovals
      .filter((plan) => Number(plan.masteryScore ?? plan.score) < 65)
      .map((plan) => plan.studentId ?? plan.studentName)
      .filter(Boolean),
  ).size;
  const enrolledCount = Array.isArray(user?.enrolledModules)
    ? user.enrolledModules.length
    : Number.isFinite(Number(user?.enrolledModuleCount)) ? Number(user.enrolledModuleCount) : null;
  const mastery = user?.overallMasteryScore ?? user?.averageAiMastery ?? user?.masteryScore;
  const remedialCount = user?.activeRemedialPlanCount;
  const completedCredits = user?.completedCredits;
  const totalCredits = user?.totalCredits;
  const name = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || t.profileFallback;
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AC';
  const emailPreferenceChange = (event) => {
    const nextValue = event.target.checked;
    setEmailAlerts(nextValue);
    try { localStorage.setItem('acm-email-alerts', String(nextValue)); } catch { /* Preference remains available for this session. */ }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwords.next !== passwords.confirm) {
      setPasswordError(t.passwordMismatch);
      return;
    }
    if (passwords.next.length < 8) {
      setPasswordError(t.passwordLength);
      return;
    }

    setPasswordBusy(true);
    try {
      await authService.changePassword(user?.id ?? user?.Id, passwords.current, passwords.next);
      setPasswordMessage(t.passwordSuccess);
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (error) {
      setPasswordError(displayError(error, t.passwordError));
    } finally {
      setPasswordBusy(false);
    }
  };

  const signOutEverywhere = async () => {
    if (!window.confirm(t.signOutConfirm)) return;
    setSessionBusy(true);
    setSessionError('');
    try {
      await authService.logoutAllDevices();
    } catch (error) {
      setSessionError(displayError(error, t.sessionError));
      setSessionBusy(false);
    }
  };

  const metrics = isStudent ? [
    { label: t.enrolled, value: enrolledCount === null ? '—' : `${enrolledCount}`, detail: enrolledCount === null ? t.moduleData : t.modules, icon: BookOpen, tone: 'blue' },
    { label: t.mastery, value: mastery === undefined || mastery === null ? '—' : `${Math.round(Number(mastery))}%`, detail: mastery === undefined || mastery === null ? t.masteryData : 'Overall mastery', icon: Activity, tone: 'cyan' },
    { label: t.remedial, value: remedialCount === undefined ? '—' : String(remedialCount), detail: remedialCount === undefined ? t.remedialData : t.inReview, icon: AlertTriangle, tone: 'amber' },
    { label: t.semester, value: completedCredits == null || totalCredits == null ? '—' : `${completedCredits} / ${totalCredits}`, detail: completedCredits == null || totalCredits == null ? t.creditsData : 'Credits completed', icon: CreditCard, tone: 'emerald' },
  ] : [
    { label: t.managed, value: String(activeModules.length), detail: `${totalTopics} ${t.topics}`, icon: BookOpen, tone: 'blue' },
    { label: t.approvals, value: String(pendingApprovals.length), detail: t.pendingCount(pendingApprovals.length), icon: Clock3, tone: 'amber', link: '/approvals' },
    { label: t.risk, value: String(atRiskStudents), detail: t.inReview, icon: Users, tone: 'cyan' },
  ];

  return (
    <div className="space-y-8 pb-8">
      <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-700"><Sparkles className="h-4 w-4" />{t.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">{t.overview}</h1>
          <p className="mt-1 text-sm text-slate-600">{t.welcome}, {name.split(' ')[0]}.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />{t.live}</span>
      </header>

      <section aria-labelledby="overview-metrics-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="overview-metrics-heading" className="text-lg font-bold text-slate-900">{isStudent ? t.studentSnapshot : t.facultySnapshot}</h2>
          {(moduleError || approvalError) && <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="text-sm font-semibold text-blue-700 hover:text-blue-900">{t.retry}</button>}
        </div>
        {loading && modules.length === 0 ? <p className="mb-3 text-sm text-slate-500">{t.loading}</p> : null}
        <div className={`grid gap-3 ${isStudent ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`}>
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </div>
      </section>

      {isStudent && activePlans.map((plan) => <StudentRemedialPlanCard key={plan.id} plan={plan} />)}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200/80 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{t.activeModules}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{t.catalog}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.catalogSub}</p>
          </div>
          <Link to="/curriculum" className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900">{t.openCurriculum}<ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        {moduleError && <p role="alert" className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">{moduleError}</p>}
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {activeModules.slice(0, 6).map((module, index) => {
            const code = module.code ?? module.moduleCode ?? module.shortCode ?? `MOD-${String(index + 1).padStart(3, '0')}`;
            const title = module.title ?? module.name ?? module.courseName ?? code;
            const topicCount = module.topics?.length ?? module.topicCount ?? 0;
            const rawCompletion = module.completionPercentage ?? module.progressPercentage ?? module.progress;
            const completion = Number.isFinite(Number(rawCompletion)) ? Math.min(100, Math.max(0, Number(rawCompletion))) : null;
            return (
              <article key={module.id ?? module.Id ?? code} className="flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><GraduationCap className="h-5 w-5" /></span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{topicCount} {t.topics}</span>
                </div>
                <p className="mt-4 font-mono text-xs font-bold text-blue-700">{code}</p>
                <h3 className="mt-1 line-clamp-2 min-h-12 font-semibold leading-6 text-slate-900">{title}</h3>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span>{t.completion}</span><span>{completion === null ? t.progressUnavailable : `${Math.round(completion)}%`}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${completion ?? 0}%` }} /></div>
                </div>
                <Link to="/chat" state={{ moduleId: module.id ?? module.Id, moduleCode: code }} className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                  <Sparkles className="h-4 w-4" />{t.launch}
                </Link>
              </article>
            );
          })}
          {!loading && activeModules.length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-500">{isStudent ? t.noEnrolledModules : t.noModules}</p>}
        </div>
      </section>

      <section role="status" className={`flex gap-3 rounded-2xl border p-4 ${pendingApprovals.length > 0 && canReview ? 'border-amber-200 bg-amber-50/90' : 'border-cyan-200 bg-cyan-50/80'}`}>
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${pendingApprovals.length > 0 && canReview ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'}`}>
          {pendingApprovals.length > 0 && canReview ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-slate-900">{t.alertTitle}</h2>
          <p className="mt-1 text-sm text-slate-700">{canReview ? (approvalError || (pendingApprovals.length ? t.reviewNeeded(pendingApprovals.length) : t.clearReviews)) : (isStudent ? t.studentPlan : t.clearReviews)}</p>
        </div>
        {canReview && pendingApprovals.length > 0 && <Link to="/approvals" aria-label={t.approvals} className="self-center rounded-lg p-2 text-amber-800 hover:bg-amber-100"><ArrowUpRight className="h-5 w-5" /></Link>}
      </section>

      <section aria-labelledby="profile-heading" className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">{t.profile}</p>
          <h2 id="profile-heading" className="mt-1 text-xl font-bold text-slate-950">{name}</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_1.25fr]">
          <div className="space-y-4">
            <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-lg font-bold text-white ring-4 ring-blue-50">{initials}</div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-slate-950">{name}</h3>
                  <span className="mt-1 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{roleText(role, t)}</span>
                </div>
              </div>
              <dl className="grid gap-4 pt-4 sm:grid-cols-2">
                <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.email}</dt><dd className="mt-1 break-all text-sm font-medium text-slate-800">{user?.email ?? user?.Email ?? '—'}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.department}</dt><dd className="mt-1 text-sm font-medium text-slate-800">{user?.department ?? user?.Department ?? t.computing}</dd></div>
                <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.shortId}</dt><dd className="mt-1 font-mono text-sm font-semibold text-slate-800">{user?.shortId ?? user?.ShortId ?? '—'}</dd></div>
              </dl>
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-blue-700" /><h3 className="font-bold text-slate-900">{t.accountSecurity}</h3></div>
              <form onSubmit={submitPassword} className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-slate-700">{t.currentPassword}<input required autoComplete="current-password" type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} className={inputClass} /></label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">{t.newPassword}<input required minLength={8} autoComplete="new-password" type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} className={inputClass} /></label>
                  <label className="block text-sm font-medium text-slate-700">{t.confirmPassword}<input required minLength={8} autoComplete="new-password" type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} className={inputClass} /></label>
                </div>
                {passwordError && <p role="alert" className="text-sm font-medium text-rose-700">{passwordError}</p>}
                {passwordMessage && <p role="status" className="text-sm font-medium text-emerald-700">{passwordMessage}</p>}
                <button type="submit" disabled={passwordBusy || !user?.id && !user?.Id} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                  <KeyRound className="h-4 w-4" />{passwordBusy ? t.saving : t.savePassword}
                </button>
              </form>
            </article>
          </div>

          <div className="space-y-4">
            <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-700" /><h3 className="font-bold text-slate-900">{t.session}</h3></div>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isAuthenticated ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><CheckCircle2 className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-slate-900">{isAuthenticated ? t.activeSession : 'Signed out'}</p><p className="text-xs text-slate-500">{user?.email ?? user?.Email ?? ''}</p></div></div>
                <button type="button" disabled={sessionBusy || !isAuthenticated} onClick={signOutEverywhere} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><LockKeyhole className="h-4 w-4" />{sessionBusy ? t.signingOut : t.signOutAll}</button>
              </div>
              {sessionError && <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{sessionError}</p>}
            </article>

            <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
              <div className="flex items-center gap-2"><Languages className="h-4 w-4 text-blue-700" /><h3 className="font-bold text-slate-900">{t.preferences}</h3></div>
              <div className="mt-4 divide-y divide-slate-100">
                <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                  <div><p className="text-sm font-semibold text-slate-800">{t.language}</p><p className="text-xs text-slate-500">Language is shared with AI Assistant</p></div>
                  <div className="inline-flex rounded-lg bg-slate-100 p-1" role="group" aria-label={t.language}>
                    <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')} className={`rounded-md px-3 py-1.5 text-xs font-bold ${language === 'en' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>EN</button>
                    <button type="button" aria-pressed={language === 'si'} onClick={() => setLanguage('si')} className={`rounded-md px-3 py-1.5 text-xs font-bold ${language === 'si' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>සිං</button>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center justify-between gap-4 py-3">
                  <span className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 text-cyan-700" /><span><span className="block text-sm font-semibold text-slate-800">{t.emailAlerts}</span><span className="mt-0.5 block text-xs text-slate-500">{t.emailAlertsSub}</span></span></span>
                  <span className="flex shrink-0 items-center gap-2"><span className="text-xs font-semibold text-slate-500">{emailAlerts ? t.enabled : t.disabled}</span><input type="checkbox" checked={emailAlerts} onChange={emailPreferenceChange} className="peer sr-only" /><span className={`relative h-6 w-11 rounded-full transition ${emailAlerts ? 'bg-blue-600' : 'bg-slate-300'} after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition ${emailAlerts ? 'after:translate-x-5' : ''}`} aria-hidden="true" /></span>
                </label>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}