import { useState } from 'react';
import { X } from 'lucide-react';
import { curriculumService } from '../../../services/curriculumService';

export default function EnrollmentAssignmentModal({ module, onClose }) {
  const [studentEmail, setStudentEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const assignStudent = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const result = await curriculumService.assignStudent(module.id ?? module.Id, studentEmail.trim());
      setMessage(`${result.studentEmail ?? studentEmail} is enrolled in ${result.moduleTitle ?? module.title ?? module.name}.`);
      setStudentEmail('');
    } catch (requestError) {
      const responseMessage = requestError.response?.data?.message;
      setError(typeof responseMessage === 'string' ? responseMessage : 'Could not assign this student.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="enrollment-dialog-title" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Module enrollment</p>
            <h2 id="enrollment-dialog-title" className="mt-1 text-lg font-bold text-slate-900">{module.title ?? module.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{module.code}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close enrollment dialog" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </header>
        <form onSubmit={assignStudent} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Student email
            <input
              required
              type="email"
              autoComplete="email"
              value={studentEmail}
              onChange={(event) => setStudentEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="student@university.edu"
            />
          </label>
          {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Close</button>
            <button type="submit" disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Assigning…' : 'Assign student'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}