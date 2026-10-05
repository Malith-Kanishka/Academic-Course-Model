import { Check, Keyboard, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import MasteryChart from './MasteryChart';
import TraceDiffViewer from './TraceDiffViewer';

const CORRUPTED_RECOMMENDATION = /(?:topic){2,}|(?:module){2,}|standard:\s*topic\s*\d+\s*(?:topic)+/i;

const sanitizeRecommendation = (value, topicName) => {
  if (typeof value !== 'string') return '';
  if (!CORRUPTED_RECOMMENDATION.test(value)) return value.trim();

  const name = typeof topicName === 'string' && topicName.trim() ? topicName.trim() : 'this topic';
  return `Review core concepts for ${name} and revisit key dialogue steps regarding student queries.`;
};

const initialPlanSummary = (approval) => {
  const summary = approval.remedialPlanSummary ?? approval.planSummary;
  if (typeof summary === 'string') return sanitizeRecommendation(summary, approval.topicName);

  const rawPlan = approval.actionItems ?? approval.ActionItems ?? approval.remedialPlan ?? approval.plan ?? [];
  const items = Array.isArray(rawPlan) ? rawPlan : [rawPlan];
  return items
    .map((item) => sanitizeRecommendation(
      typeof item === 'string' ? item : item?.description ?? item?.text ?? '',
      approval.topicName,
    ))
    .filter((item) => item.trim())
    .join('\n');
};

export default function ApprovalModal(props) {
  const { approval } = props;
  if (!approval) return null;
  return <ApprovalModalContent key={approval.id ?? approval.approvalId ?? approval.planId ?? 'approval'} {...props} />;
}

function ApprovalModalContent({ approval, onClose, onDecision }) {
  const [editedPlanSummary, setEditedPlanSummary] = useState(() => initialPlanSummary(approval));
  const [lecturerNotes, setLecturerNotes] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const expectedStandard = [approval.expectedStandard, approval.rubric]
    .find((value) => typeof value === 'string') ?? '';
  const sanitizedExpectedStandard =
    typeof expectedStandard === 'string'
      && (expectedStandard.toLowerCase().includes('topictopic')
        || expectedStandard.toLowerCase().includes('modulemodule'))
      ? 'Demonstrate core conceptual mastery and provide complete explanations for this topic.'
      : expectedStandard;

  const submit = useCallback(async (decision) => {
    if (!approval || submitting) return;
    const id = approval.id ?? approval.approvalId;
    setSubmitting(true);
    try {
      await onDecision(id, decision, {
        editedPlanSummary,
        lecturerNotes: decision === 'Rejected' ? feedback : lecturerNotes,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [approval, editedPlanSummary, feedback, lecturerNotes, onClose, onDecision, submitting]);

  useEffect(() => {
    const listener = (event) => {
      if (event.key === 'Escape') onClose();
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && approval) {
        event.preventDefault();
        void submit('Approved');
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [approval, onClose, submit]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="ml-auto flex h-full w-full max-w-6xl flex-col overflow-y-auto border-l border-slate-200 bg-white/95 shadow-2xl shadow-slate-400/30">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Review workspace / {approval.urgency ?? 'Pending'} risk
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {approval.studentName ?? 'Student'} <span className="font-normal text-slate-500">/ {approval.courseModule ?? approval.module}</span>
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close review">
            <X className="h-5 w-5" />
          </button>
        </header>

        <main className="grid min-w-0 flex-1 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="min-w-0 space-y-5 border-b border-slate-200 p-6 lg:border-b-0 lg:border-r">
            <MasteryChart score={approval.masteryScore ?? approval.score} breakdown={approval.breakdown ?? []} />
            <section className="rounded-xl border border-indigo-200 bg-indigo-50/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">AI recommendation</p>
                  <h3 className="mt-1 text-lg font-bold text-indigo-950">Remedial plan summary</h3>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-indigo-600">{approval.planVersion ?? 'AI Draft'}</span>
              </div>
              <label htmlFor="edited-plan-summary" className="sr-only">Edit remedial plan summary</label>
              <textarea
                id="edited-plan-summary"
                value={editedPlanSummary}
                onChange={(event) => setEditedPlanSummary(event.target.value)}
                rows={6}
                className="mt-4 w-full resize-y rounded-lg border border-indigo-200 bg-white/90 p-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                aria-label="Remedial plan summary"
              />
            </section>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Review context</p>
              <p className="mt-2 leading-6">The plan was triggered after the learner missed {approval.missingConcepts?.length ?? 1} assessed concept(s). Confirm the evidence before publishing.</p>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-5 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Evidence trace</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">Submission vs expected standard</h3>
            </div>
            <TraceDiffViewer studentAnswer={approval.studentSubmission ?? approval.studentAnswer ?? approval.answer} expectedStandard={sanitizedExpectedStandard} missingConcepts={approval.missingConcepts ?? []} />
            <label htmlFor="lecturer-notes" className="block text-sm font-semibold text-slate-800">Lecturer Notes / Custom Feedback</label>
            <textarea
              id="lecturer-notes"
              value={lecturerNotes}
              onChange={(event) => setLecturerNotes(event.target.value)}
              rows={4}
              placeholder="Add guidance for the student or context for this decision..."
              className="-mt-3 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            {rejecting && (
              <textarea
                autoFocus
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Explain what should be revised before approval..."
                className="min-h-28 w-full rounded-lg border border-rose-200 bg-rose-50/50 p-3 text-sm text-slate-700 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                aria-label="Rejection feedback"
              />
            )}
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Decision note</p>
              <p className="mt-2 text-sm text-slate-600">Approving activates the remedial plan and records your decision in the audit trail.</p>
            </div>
          </div>
        </main>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/80 p-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
            <Keyboard className="h-3.5 w-3.5" /> Ctrl + Enter to approve
          </span>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="button" disabled={submitting} onClick={() => rejecting ? submit('Rejected') : setRejecting(true)} className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60">{rejecting ? 'Submit rejection' : 'Reject with feedback'}</button>
            <button type="button" disabled={submitting} onClick={() => submit('Approved')} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
              <Check className="h-4 w-4" />{submitting ? 'Submitting...' : 'Approve plan'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}