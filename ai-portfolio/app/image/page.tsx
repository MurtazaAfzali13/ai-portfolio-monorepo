import Image from "next/image";
import Link from "next/link";

export default function ImageModalPage() {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="relative bg-gray-900 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl transform transition-transform duration-300 hover:scale-105">
        {/* Back / Close button */}
        <Link
          href="/"
          className="absolute top-3 left-3 text-white text-2xl hover:text-yellow-400 z-10 bg-black/50 rounded-full w-9 h-9 flex items-center justify-center shadow-md"
        >
          ←
        </Link>

        {/* Image container */}
        <div className="p-4">
          <Image
            src="/images/murtazaafzali.png"
            alt="Murtaza Afzali"
            width={400}  // سایز کمی بزرگ‌تر
            height={400}
            className="rounded-xl object-contain w-full h-auto shadow-lg"
            priority
          />
        </div>
      </div>
    </div>
  );
}