export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-end"><div className="skeleton h-10 w-32 rounded-xl" /></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="card skeleton h-44" />)}
      </div>
    </div>
  );
}
