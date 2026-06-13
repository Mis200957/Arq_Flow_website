export default function LogsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-4 w-56 rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="skeleton h-11 flex-1 rounded-xl" />
        <div className="skeleton h-11 w-72 rounded-xl" />
      </div>
      <div className="card overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-6 w-16 rounded-full" />
              <div className="skeleton h-6 flex-1 rounded-lg" />
              <div className="skeleton h-6 flex-1 rounded-lg" />
              <div className="skeleton h-6 w-24 rounded-lg" />
              <div className="skeleton h-6 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
