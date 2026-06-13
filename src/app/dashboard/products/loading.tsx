export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-end"><div className="skeleton h-10 w-32 rounded-xl" /></div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="card skeleton h-48" />)}
      </div>
    </div>
  );
}
