import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black">
      {/* Lapisan 1: Video Hujan Kaca */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/hujan.mp4" type="video/mp4" />
      </video>

      {/* Lapisan 2: Overlay gelap agar form tetap terbaca */}
      <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none"></div>

      {/* Lapisan 3: Kotak Form Glassmorphism */}
      <div className="relative z-20 w-full max-w-md p-4">
        <Suspense
          fallback={
            <div className="flex h-48 w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}