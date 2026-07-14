export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <div className="skeleton h-8 w-40 rounded-xl" />
        <div className="skeleton h-4 w-56 rounded-lg" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card p-6 space-y-4">
          <div className="skeleton h-6 w-40 rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="skeleton h-10 w-40 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
