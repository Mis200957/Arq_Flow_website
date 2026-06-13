export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-28 skeleton" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 h-52 skeleton lg:col-span-2" />
        <div className="card p-5 h-52 skeleton" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5 h-48 skeleton" />
        <div className="card p-5 h-48 skeleton" />
      </div>
    </div>
  );
}
