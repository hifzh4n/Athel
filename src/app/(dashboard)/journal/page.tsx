export default function JournalPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Trading Journal</h1>
      </div>
      <div className="border rounded-xl p-6 bg-card text-card-foreground shadow-sm min-h-[400px]">
        <h2 className="font-semibold text-lg mb-4">Performance Metrics</h2>
        <div className="text-muted-foreground">
          Win rate, RR, and session performance will go here.
        </div>
      </div>
    </div>
  );
}
