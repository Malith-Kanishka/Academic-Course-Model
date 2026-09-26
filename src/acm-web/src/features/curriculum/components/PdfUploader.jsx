import { CheckCircle2, FileUp, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { curriculumService } from '../../../services/curriculumService'; // adjust path as needed

export default function PdfUploader({ topics = [], onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [topicId, setTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const selectFile = (event) => setFile(event.target.files?.[0] ?? null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !topicId || !title) {
      setStatus({ loading: false, error: 'Please select a topic, provide a title, and choose a file.', success: '' });
      return;
    }

    setStatus({ loading: true, error: '', success: '' });

    const formData = new FormData();
    formData.append('TopicId', topicId);
    formData.append('Title', title);
    formData.append('File', file);

    try {
      await curriculumService.uploadMaterial(formData);
      setStatus({ loading: false, error: '', success: 'Study material uploaded and parsed successfully!' });
      setFile(null);
      setTitle('');
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setStatus({ 
        loading: false, 
        error: err.response?.data?.message || 'Upload failed. Please check your connection or authentication.', 
        success: '' 
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Selection controls for Topic and Title needed for the backend */}
      <div className="grid gap-4 md:grid-cols-2 bg-white/80 p-4 rounded-2xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Target Topic</label>
          <select 
            value={topicId} 
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white"
            required
          >
            <option value="">-- Select Topic --</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Material Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 1 Lecture Notes"
            className="w-full rounded-lg border border-slate-300 p-2 text-sm"
            required
          />
        </div>
      </div>

      {status.error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg">{status.error}</div>}
      {status.success && <div className="p-3 bg-emerald-100 text-emerald-700 text-sm rounded-lg">{status.success}</div>}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <label 
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }} 
          onDragLeave={() => setDragging(false)} 
          onDrop={(event) => { 
            event.preventDefault(); 
            setDragging(false); 
            setFile(event.dataTransfer.files?.[0] ?? null); 
          }} 
          className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white/70 hover:border-blue-400 hover:bg-blue-50/50'}`}
        >
          <input type="file" accept="application/pdf,.txt,.docx" onChange={selectFile} className="hidden" />
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <UploadCloud className="h-7 w-7" />
          </span>
          <p className="mt-4 font-semibold text-slate-800">Drop a syllabus PDF here</p>
          <p className="mt-1 text-sm text-slate-500">or browse from your computer</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200">
            <FileUp className="h-4 w-4" /> Choose File
          </span>
          {file && <p className="mt-4 text-xs font-semibold text-blue-600">Selected: {file.name}</p>}
        </label>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Parser pipeline</p>
            <div className="mt-5 space-y-5">
              {['Extract document structure', 'Map learning objectives', 'Create draft topics'].map((step, index) => (
                <div key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{step}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {index === 0 ? 'PDF and OCR supported' : index === 1 ? 'AI-assisted alignment' : 'Review before publishing'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="mr-1 inline h-4 w-4" />Drafts never publish without review.
            </div>
            <button
              type="submit"
              disabled={status.loading}
              className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-xl font-semibold shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {status.loading ? 'Uploading & Processing...' : 'Upload & Process Material'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}