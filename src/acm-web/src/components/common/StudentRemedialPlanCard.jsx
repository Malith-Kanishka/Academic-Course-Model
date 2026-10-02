const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getPlanDay = (approvedAt) => {
  if (!approvedAt) return 1;
  const start = new Date(approvedAt);
  if (Number.isNaN(start.getTime())) return 1;
  const today = new Date();
  const elapsedDays = Math.floor((today.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / DAY_IN_MS);
  return Math.min(7, Math.max(1, elapsedDays + 1));
};

export default function StudentRemedialPlanCard({ plan }) {
  const approvedAt = plan.approvedAt ?? plan.ApprovedAt;
  const tasks = plan.actionItems ?? plan.ActionItems ?? plan.remedialPlan ?? [];
  const day = getPlanDay(approvedAt);

  return (
    <section aria-labelledby={`remedial-plan-${plan.id}-title`} className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Approved study plan</p>
          <h2 id={`remedial-plan-${plan.id}-title`} className="mt-1 text-lg font-bold text-slate-900">
            Active 7-Day Remedial Plan (Day {day} of 7)
          </h2>
        </div>
        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Active</span>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-800">Approved study schedule</h3>
        {tasks.length > 0 ? (
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
            {tasks.map((task, index) => <li key={`${index}-${task}`}>{task}</li>)}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No study tasks were included in this plan.</p>
        )}
      </div>
    </section>
  );
}
