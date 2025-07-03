"use client";

import { JoinQueueButton } from "@/components/JoinQueueButton";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GlassContainer, glassClasses } from "@/components/ui/glass";

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
      {/* Overlay temporarily removed to test background image */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-purple-50/30 to-pink-50/30 z-10"></div> */}

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col relative z-20">
        <div className="max-w-5xl mx-auto flex-1 flex flex-col">
          {" "}
          {/* Hero Glass Card - True Apple Liquid Glass Material */}
          <GlassContainer
            variant="primary"
            padding="xl"
            className="mb-8 overflow-hidden"
          >
            <div className="relative z-10">
              <div className="text-center">
                {/* Title Section - Apple style text on glass */}
                <div className="mb-8">
                  <h1
                    className={`text-7xl md:text-8xl font-bold tracking-tight mb-8 leading-tight pb-4 ${glassClasses.text.primary}`}
                  >
                    Jong Tun
                  </h1>
                </div>

                {/* Subtitle with proper contrast on glass */}
                <p
                  className={`text-2xl md:text-3xl mb-8 max-w-3xl mx-auto leading-relaxed font-light ${glassClasses.text.secondary}`}
                >
                  tun gor jong mai tun gor mai tong jong
                </p>
              </div>
            </div>
          </GlassContainer>
          {/* Countdown Timer Glass Container - Apple Liquid Glass */}
          <GlassContainer variant="secondary" padding="md" className="mb-8">
            <div className="relative z-10">
              <CountdownTimer />
            </div>
          </GlassContainer>
          {/* Join Queue Section - Apple Liquid Glass */}
          <div className="flex-1 flex items-center justify-center">
            <GlassContainer
              variant="secondary"
              padding="lg"
              className="text-center max-w-md w-full hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300"
            >
              <div className="relative z-10">
                <JoinQueueButton />
              </div>
            </GlassContainer>
          </div>
        </div>
      </div>
      {/* Enhanced CSS for True iOS 26 Liquid Glass animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.9;
          }
          33% {
            transform: translateY(-20px) rotate(3deg) scale(1.02);
            opacity: 1;
          }
          66% {
            transform: translateY(-12px) rotate(-2deg) scale(0.98);
            opacity: 0.95;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) scaleX(1);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
            transform: translateX(0%) scaleX(1.2);
          }
          100% {
            transform: translateX(100%) scaleX(1);
            opacity: 0;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.05);
          }
          to {
            transform: rotate(360deg) scale(1);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(0.95);
          }
          to {
            transform: rotate(0deg) scale(1);
          }
        }

        @keyframes spin-slow-reverse {
          from {
            transform: rotate(180deg) scale(1);
          }
          to {
            transform: rotate(-180deg) scale(1);
          }
        }

        /* Enhanced backdrop blur with iOS 26 liquid glass properties */
        .backdrop-blur-lg {
          backdrop-filter: blur(20px) saturate(110%) brightness(102%);
        }

        .backdrop-blur-xl {
          backdrop-filter: blur(30px) saturate(110%) brightness(102%);
        }

        .backdrop-blur-2xl {
          backdrop-filter: blur(40px) saturate(115%) brightness(104%);
        }

        .backdrop-blur-3xl {
          backdrop-filter: blur(50px) saturate(120%) brightness(105%);
        }

        /* iOS 26 liquid glass morphing effects */
        .group:hover .backdrop-blur-xl {
          backdrop-filter: blur(35px) saturate(115%) brightness(104%);
          transition: backdrop-filter 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .group:hover .backdrop-blur-2xl {
          backdrop-filter: blur(45px) saturate(125%) brightness(106%);
          transition: backdrop-filter 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Advanced glass refraction effects */
        .group:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08),
            0 0 20px rgba(255, 255, 255, 0.05) inset,
            0 1px 0 rgba(255, 255, 255, 0.08) inset;
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* Simple animations for liquid glass */
        .animate-float {
          animation: float 12s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .animate-shimmer {
          animation: shimmer 4s ease-in-out infinite;
        }

        /* Enhanced delay classes for staggered animations */
        .animate-float.delay-300 {
          animation-delay: 0.3s;
        }
        .animate-float.delay-700 {
          animation-delay: 0.7s;
        }
        .animate-float.delay-800 {
          animation-delay: 0.8s;
        }
        .animate-float.delay-1000 {
          animation-delay: 1s;
        }
        .animate-float.delay-1200 {
          animation-delay: 1.2s;
        }
        .animate-float.delay-1500 {
          animation-delay: 1.5s;
        }

        /* Radial gradient utility */
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </main>
  );
}
