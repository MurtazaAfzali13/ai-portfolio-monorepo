"use client";

export default function DownloadCV() {
  return (
    <button
      onClick={() => {
        const a = document.createElement("a");
        a.href = "/Murtaza_Afzali.pdf";
        a.download = "My-CV.pdf";
        a.click();
      }}
      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600  cursor-pointer
      text-white font-semibold rounded-2xl shadow-xl 
      hover:shadow-[0_0_20px_rgba(99,102,241,0.7)] 
      hover:scale-105 active:scale-95 transition-all"
    >
      Download CV 🚀
    </button>
  );
}