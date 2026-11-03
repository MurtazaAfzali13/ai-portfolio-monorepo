import { FacebookSkeleton } from "@/components/ui/facebook-skeleton";

export default function HeroSkeleton() {
  return (
    <section className="mb-16 px-4 flex flex-col items-center gap-6">
      <FacebookSkeleton className="h-16 w-72 md:w-96" />
      <FacebookSkeleton className="h-10 w-80 md:w-[28rem]" />
      <FacebookSkeleton className="h-24 w-full max-w-3xl rounded-2xl" />
    </section>
  );
}
