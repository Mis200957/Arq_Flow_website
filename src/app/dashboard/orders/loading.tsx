export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-8 w-20 rounded-full" />)}
      </div>
      <div className="card">
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-14 m-3 rounded-xl" />)}
      </div>
    </div>
  );
}
