export default function PlansLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-32 rounded-xl" />
        <div className="skeleton h-4 w-48 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-6 space-y-4">
            <div className="space-y-2">
              <div className="skeleton h-6 w-24 rounded-lg" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="skeleton h-16 rounded-xl" />
              <div className="skeleton h-16 rounded-xl" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="skeleton h-4 w-full rounded" />
              ))}
            </div>
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
