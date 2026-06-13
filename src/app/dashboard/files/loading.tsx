export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="card skeleton h-16" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => <div key={i} className="card skeleton h-36" />)}
      </div>
    </div>
  );
}
