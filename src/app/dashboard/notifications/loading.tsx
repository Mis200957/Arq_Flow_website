export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-3"><div className="skeleton h-9 w-48 rounded-xl" /><div className="skeleton h-9 w-32 rounded-xl" /></div>
      <div className="card divide-y divide-[var(--border)]">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 m-3 rounded-lg" />)}
      </div>
    </div>
  );
}
