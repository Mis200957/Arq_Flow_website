export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="skeleton h-10 rounded-xl max-w-sm" />
      <div className="card">
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-14 m-3 rounded-xl" />)}
      </div>
    </div>
  );
}
