export default function OverviewLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-4 w-64 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="skeleton h-3 w-24 rounded" />
                <div className="skeleton h-7 w-16 rounded-lg" />
                <div className="skeleton h-3 w-32 rounded" />
              </div>
              <div className="skeleton w-10 h-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-4">
        <div className="skeleton h-5 w-48 rounded-lg" />
        <div className="skeleton h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}
