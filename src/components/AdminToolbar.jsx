import {
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
} from "@mui/x-data-grid";

export default function AdminToolbar({ isAdmin, onAddRow }) {
  return (
    <GridToolbarContainer className="flex items-center gap-2 px-4 py-2 border-b border-slate-700">
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      {isAdmin && (
        <button
          onClick={onAddRow}
          className="ml-auto flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors duration-150"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Product
        </button>
      )}
    </GridToolbarContainer>
  );
}
