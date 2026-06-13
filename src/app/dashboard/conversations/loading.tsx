export default function Loading() {
  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] animate-pulse">
      <div className="w-80 shrink-0 space-y-3">
        <div className="skeleton h-10 rounded-xl" />
        <div className="skeleton h-8 rounded-xl" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
      <div className="flex-1 card skeleton" />
    </div>
  );
}
