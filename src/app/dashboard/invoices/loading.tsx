export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="card">
        {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-14 m-3 rounded-xl" />)}
      </div>
    </div>
  );
}
