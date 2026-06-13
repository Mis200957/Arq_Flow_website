export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse max-w-2xl">
      <div className="card skeleton h-56" />
      <div className="card skeleton h-28" />
      <div className="grid md:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <div key={i} className="card skeleton h-36" />)}
      </div>
    </div>
  );
}
