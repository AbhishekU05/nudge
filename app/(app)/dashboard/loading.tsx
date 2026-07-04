import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-1 h-full min-h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-zinc-500">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        <p className="text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
