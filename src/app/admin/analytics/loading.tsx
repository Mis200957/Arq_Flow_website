export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-40 rounded-xl" />
        <div className="skeleton h-4 w-56 rounded-lg" />
      </div>
      <div className="card p-6 space-y-4">
        <div className="skeleton h-5 w-48 rounded-lg" />
        <div className="skeleton h-56 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="card p-6 space-y-4">
            <div className="skeleton h-5 w-36 rounded-lg" />
            <div className="skeleton h-48 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="card p-6 space-y-4">
            <div className="skeleton h-5 w-36 rounded-lg" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-2 w-3/4 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
