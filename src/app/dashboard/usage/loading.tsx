export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card skeleton h-28" />)}
      </div>
      <div className="card skeleton h-64" />
      <div className="card skeleton h-56" />
    </div>
  );
}
