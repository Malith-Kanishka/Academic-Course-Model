import { CheckCircle2, FileUp, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import useCurriculum from '../hooks/useCurriculum';

export default function PdfUploader({ topics = [], onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [topicId, setTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [dragging, setDragging] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const { uploadMaterial, isUploading, uploadProgress, uploadError } = useCurriculum();

  const selectFile = (event) => setFile(event.target.files?.[0] ?? null);

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topicId) {
      setValidationError('Please select a target topic first.');
      return;
    }
    if (!title.trim()) {
      setValidationError('Please enter a material name.');
      return;
    }
    if (!file) {
      setValidationError('Please choose a file to upload.');
      return;
    }

    setValidationError('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('TopicId', topicId);
    formData.append('Title', title);
    formData.append('File', file);

    try {
      await uploadMaterial(formData);
      setSuccessMsg('Study material uploaded and processed successfully!');
      setFile(null);
      setTitle('');
      setTopicId('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUploadSuccess) onUploadSuccess();
    } catch {
      // uploadError is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Select topic */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Step 1 — Select target topic
        </p>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Topic</span>
          <select
            id="pdf-topic-select"
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            required
          >
            <option value="">-- Select a topic --</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Step 2: Material name */}
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Step 2 — Material details
        </p>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Material Name</span>
          <input
            id="pdf-material-name"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 1 Lecture Notes"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>
      </div>

      {/* Alerts */}
      {validationError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {validationError}
        </div>
      )}
      {uploadError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {uploadError}
        </div>
      )}
      {successMsg && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Step 3: Choose file */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Step 3 — Choose file
          </p>

          {/* Drop zone or selected file */}
          {file ? (
            <div className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50/60 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FileUp className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={removeFile}
                title="Remove file"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                setFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                dragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 bg-white/70 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.txt,.docx"
                onChange={selectFile}
                className="hidden"
              />
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UploadCloud className="h-7 w-7" />
              </span>
              <p className="mt-4 font-semibold text-slate-800">Drop a PDF here</p>
              <p className="mt-1 text-sm text-slate-500">or browse from your computer</p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200">
                <FileUp className="h-4 w-4" /> Choose File
              </span>
            </label>
          )}
        </div>

        {/* Upload button + pipeline info */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Parser pipeline</p>
            <div className="mt-5 space-y-5">
              {['Extract document structure', 'Map learning objectives', 'Attach to topic'].map((step, index) => (
                <div key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{step}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {index === 0
                        ? 'PDF and OCR supported'
                        : index === 1
                        ? 'AI-assisted alignment'
                        : 'Visible under module list'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              Material is linked to the selected topic.
            </div>
            {isUploading && (
              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span>Uploading &amp; Processing</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <button
              type="submit"
              id="pdf-upload-submit"
              disabled={isUploading}
              className="w-full rounded-xl bg-emerald-600 py-2.5 px-4 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {isUploading ? 'Processing Material...' : 'Upload & Process Material'}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}