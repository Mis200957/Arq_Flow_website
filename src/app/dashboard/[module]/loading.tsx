export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 flex-1 rounded-xl" />
        <div className="skeleton h-10 w-32 rounded-xl" />
        <div className="skeleton h-10 w-24 rounded-xl" />
      </div>
      <div className="card p-0 overflow-hidden">
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-12 m-3 rounded-lg" />)}
      </div>
    </div>
  );
}
