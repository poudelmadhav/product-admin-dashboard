import { formatRupees } from "../utils/currency";

const stats = [
  {
    label: "Total Products",
    key: "total",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    label: "Avg. Price",
    key: "avgPrice",
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    label: "Access Level",
    key: "access",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
];

export default function StatsCards({ products, isAdmin }) {
  const values = {
    total: products.length,
    avgPrice:
      products.length > 0
        ? formatRupees(
            products.reduce((s, p) => s + p.price, 0) / products.length
          )
        : "—",
    access: isAdmin ? "Admin" : "Viewer",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-3.5 h-3.5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d={stat.icon}
              />
            </svg>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">
              {stat.label}
            </span>
          </div>
          <p className="text-lg font-bold text-slate-100">
            {values[stat.key]}
          </p>
        </div>
      ))}
    </div>
  );
}
