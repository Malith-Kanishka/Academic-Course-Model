import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { curriculumService } from '../../../services/curriculumService';

export default function TopicForm({ modules = [], onCreated }) { 
  const [topic, setTopic] = useState({ name: '', moduleId: '', objective: '' }); 
  const [created, setCreated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => { 
    event.preventDefault(); 
    if (!topic.name || !topic.name.trim() || !topic.moduleId) {
      setError('Please provide a title and select a parent module.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        moduleId: topic.moduleId,
        title: topic.name,
        contentDescription: topic.objective || 'No objective provided',
        orderIndex: 1
      };

      const result = await curriculumService.createTopic(payload);
      setCreated(true);
      setLoading(false);
      if (onCreated) onCreated(result);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to create topic via API.');
    }
  }; 

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Topic builder</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Add a learning topic</h3>
          </div>
          <span className="rounded-lg bg-blue-50 p-2 text-blue-600"><Plus className="h-4 w-4" /></span>
        </div>

        {error && <div className="p-3 bg-red-100 text-red-700 text-xs rounded-lg">{error}</div>}

        <label className="block text-sm font-semibold text-slate-700">
          Topic name
          <input 
            type="text"
            value={topic.name || ''} 
            onChange={(event) => setTopic({ ...topic, name: event.target.value })} 
            placeholder="e.g. Dependency injection" 
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500" 
            required
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Parent module
          <select 
            value={topic.moduleId || ''} 
            onChange={(event) => setTopic({ ...topic, moduleId: event.target.value })} 
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
            required
          >
            <option value="">-- Select Module --</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.title} ({m.code})</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Learning objective / Content Description
          <textarea 
            value={topic.objective || ''} 
            onChange={(event) => setTopic({ ...topic, objective: event.target.value })} 
            placeholder="What should students be able to demonstrate? (AI audit target)" 
            className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500" 
          />
        </label>

        <button 
          type="submit" 
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create draft topic'}
        </button>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Preview</p>
        {created ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex justify-between">
              <p className="font-semibold text-slate-800">{topic.name}</p>
              <button type="button" onClick={() => setCreated(false)} className="text-slate-400"><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-2 text-xs font-semibold text-blue-600">Saved to Database</p>
            <p className="mt-3 text-sm text-slate-600">{topic.objective || 'Add an objective to guide the AI mapping.'}</p>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-slate-500">Your draft topic preview and AI alignment suggestions will appear here.</p>
        )}
      </div>
    </form>
  );
}