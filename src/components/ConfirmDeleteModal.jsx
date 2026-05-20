export default function ConfirmDeleteModal({ deleteId, onClose, onConfirm }) {
  if (!deleteId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Delete Product
            </h3>
            <p className="text-xs text-slate-500">
              This action cannot be undone.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-5 font-mono bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700 break-all">
          ID: {deleteId}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(deleteId)}
            className="flex-1 bg-red-500 hover:bg-red-400 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
