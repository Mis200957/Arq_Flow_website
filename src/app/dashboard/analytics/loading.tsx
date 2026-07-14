export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-8 w-20 rounded-full" />)}</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="card skeleton h-24" />)}</div>
      <div className="grid lg:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="card skeleton h-60" />)}</div>
    </div>
  );
}
