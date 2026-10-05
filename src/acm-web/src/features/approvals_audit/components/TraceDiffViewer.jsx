import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function TraceDiffViewer({ studentAnswer = '', expectedStandard = '', missingConcepts = [] }) {
	return (
		<div className="w-full min-w-0 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 font-mono text-sm shadow-inner">
			<div className="mb-2 flex min-w-0 items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
				<span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" />
				<span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
				<span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
				<span className="min-w-0">Evidence trace / normalized diff</span>
			</div>
			<div className="grid min-w-0 gap-3 md:grid-cols-2">
				<div className="min-w-0 w-full rounded-lg border-l-2 border-rose-500 bg-rose-50 p-4">
					<div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-rose-700">
						<AlertTriangle className="h-4 w-4 shrink-0" />
						<span>Student Submission</span>
					</div>
					<p className="mt-3 max-h-[350px] w-full overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-6 text-rose-900">
						{studentAnswer || 'No answer recorded.'}
					</p>
				</div>
				<div className="min-w-0 w-full rounded-lg border-l-2 border-emerald-500 bg-emerald-50 p-4">
					<div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-emerald-700">
						<CheckCircle2 className="h-4 w-4 shrink-0" />
						<span>Expected Standard</span>
					</div>
					<p className="mt-3 max-h-[350px] w-full overflow-y-auto whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-6 text-emerald-900">
						{expectedStandard || 'No rubric supplied.'}
					</p>
				</div>
			</div>
			{missingConcepts.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{missingConcepts.map((concept) => (
						<span key={concept} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
							Missing: {concept}
						</span>
					))}
				</div>
			)}
		</div>
	);
}
