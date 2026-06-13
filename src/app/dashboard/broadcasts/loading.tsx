export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-end"><div className="skeleton h-10 w-44 rounded-xl" /></div>
      {[...Array(5)].map((_, i) => <div key={i} className="card skeleton h-24" />)}
    </div>
  );
}
