import { FacebookSkeleton } from "@/components/ui/facebook-skeleton";

export default function FeaturedProjectSkeleton() {
  return (
    <section className="max-w-6xl mx-auto px-4 mb-16">
      <div className="rounded-2xl p-8 border border-white/20 bg-white/10 grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <FacebookSkeleton className="h-8 w-2/3" />
          <FacebookSkeleton className="h-4 w-full" />
          <FacebookSkeleton className="h-4 w-5/6" />
          <FacebookSkeleton className="h-4 w-4/6" />

          <div className="flex gap-3 pt-4">
            <FacebookSkeleton className="h-10 w-32 rounded-full" />
            <FacebookSkeleton className="h-10 w-32 rounded-full" />
          </div>
        </div>

        <FacebookSkeleton className="h-64 w-full rounded-2xl" />
      </div>
    </section>
  );
}
