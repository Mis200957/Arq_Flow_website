export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="skeleton h-12 w-96 rounded-2xl" />
      <div className="card skeleton h-64 max-w-lg" />
    </div>
  );
}
