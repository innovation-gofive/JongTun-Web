"use client";

import { JoinQueueButton } from "@/components/JoinQueueButton";
import { GlassContainer } from "@/components/ui/glass";
import Image from "next/image";

export default function HomePage() {
  return (
    <main
      className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: "url('./images/backgrounds/bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Glass overlay for better text visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-purple-50/20 to-pink-50/20 z-10"></div>

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col relative z-20">
        <div className="max-w-5xl mx-auto flex-1 flex flex-col">
          {/* Hero Glass Card */}
          <GlassContainer
            variant="primary"
            padding="xl"
            className="mb-8 overflow-hidden"
          >
            <div className="relative z-10">
              <div className="text-center">
                {/* Title Section */}
                <div className="mb-8">
                  <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight text-white drop-shadow-xl">
                    Jong Tun
                  </h1>
                </div>

                {/* Subtitle */}
                <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed text-white/90 font-medium drop-shadow-lg">
                  tun gor jong mai tun gor mai tong jong
                </p>
              </div>
            </div>
          </GlassContainer>

          {/* Product Information Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <GlassContainer variant="secondary" padding="lg">
              <div className="text-center">
                <div className="mb-6">
                  <Image
                    src="/A4.svg"
                    alt="A4 Paper"
                    width={260}
                    height={260}
                    className="w-65 h-65 mx-auto"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-md">
                  A4 Gold-Coated Paper
                </h3>
                <p className="text-white/80 font-medium drop-shadow-sm">
                  Unit: Ream
                  <br />
                  For high-quality printing
                </p>
              </div>
            </GlassContainer>

            <GlassContainer variant="secondary" padding="lg">
              <div className="text-center">
                <div className="mb-6">
                  <Image
                    src="/Continuous.svg"
                    alt="Continuous Paper"
                    width={260}
                    height={260}
                    className="w-65 h-65 mx-auto"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white drop-shadow-md">
                  Continuous Gold-Coated Paper
                </h3>
                <p className="text-white/80 font-medium drop-shadow-sm">
                  Unit: Box
                  <br />
                  For large volume printing
                </p>
              </div>
            </GlassContainer>
          </div>

          {/* Join Queue Button */}
          <div className="mb-8 text-center">
            <JoinQueueButton />
          </div>
        </div>
      </div>
    </main>
  );
}
