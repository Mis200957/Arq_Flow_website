export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between"><div className="skeleton h-5 w-40 rounded" /><div className="skeleton h-8 w-24 rounded-xl" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="card skeleton h-28" />)}
      </div>
      <div className="card skeleton h-64" />
    </div>
  );
}
