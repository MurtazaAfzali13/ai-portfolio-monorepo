import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff6ef] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-orange-500/15 blur-[120px]" />
      <SignUp
        appearance={{
          variables: {
            colorPrimary: "#f97316",
            colorBackground: "#ffffff",
            colorForeground: "#2b1a10",
            colorMutedForeground: "#78716c",
            colorInput: "#fffaf5",
            colorInputForeground: "#2b1a10",
            borderRadius: "16px",
          },
        }}
      />
    </main>
  );
}