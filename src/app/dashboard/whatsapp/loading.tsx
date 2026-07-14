export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse max-w-2xl">
      <div className="card skeleton h-52" />
      <div className="card skeleton h-32" />
    </div>
  );
}
