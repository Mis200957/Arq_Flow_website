export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse max-w-2xl">
      {[...Array(4)].map((_, i) => <div key={i} className="card skeleton h-40" />)}
    </div>
  );
}
