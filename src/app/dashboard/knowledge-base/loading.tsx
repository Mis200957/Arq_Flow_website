export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-end"><div className="skeleton h-10 w-32 rounded-xl" /></div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="card p-5">
          <div className="skeleton h-6 w-32 rounded mb-4" />
          {[...Array(3)].map((_, j) => <div key={j} className="skeleton h-12 rounded-xl mb-2" />)}
        </div>
      ))}
    </div>
  );
}
