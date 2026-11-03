import { FacebookSkeleton } from "@/components/ui/facebook-skeleton";

export default function ProjectCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
      <FacebookSkeleton className="h-40 w-full rounded-xl" />

      <FacebookSkeleton className="h-6 w-3/4" />
      <FacebookSkeleton className="h-4 w-full" />
      <FacebookSkeleton className="h-4 w-5/6" />

      <div className="flex gap-2 pt-2">
        <FacebookSkeleton className="h-6 w-16 rounded-full" />
        <FacebookSkeleton className="h-6 w-14 rounded-full" />
        <FacebookSkeleton className="h-6 w-12 rounded-full" />
      </div>
    </div>
  );
}
