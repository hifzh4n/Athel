import { SignalsTable } from "@/components/signals/signals-table";

export default function SignalsPage() {
  return (
    <div className="flex flex-col gap-6 pb-10 w-full min-w-0">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Trade History</h1>
      </div>
      <div className="w-full min-w-0">
        <SignalsTable />
      </div>
    </div>
  );
}
