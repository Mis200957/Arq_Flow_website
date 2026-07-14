export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="skeleton h-8 w-36 rounded-xl" />
        <div className="skeleton h-4 w-52 rounded-lg" />
      </div>
      <div className="flex gap-3">
        <div className="skeleton h-11 flex-1 rounded-xl" />
        <div className="skeleton h-11 w-80 rounded-xl" />
      </div>
      <div className="card overflow-hidden">
        <div className="p-4 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="skeleton h-8 flex-1 rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
