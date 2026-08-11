import LoginForm from "@/components/LoginForm";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
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
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      {/* Lapisan 3: Kotak Form Glassmorphism */}
      <div className="relative z-20 w-full max-w-md p-4">
        <LoginForm />
      </div>
    </main>
  );
}