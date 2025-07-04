"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassButton, glassClasses } from "@/components/ui/glass";
import { AlertTriangle } from "lucide-react";
import { useQueueStore } from "@/store/useQueueStore";
import { useCaptchaStore } from "@/store/useCaptchaStore";

export function JoinQueueButton() {
  const router = useRouter();
  const { queue, joinQueue, isInQueue, hasError, clearError } = useQueueStore();
  const captcha = useCaptchaStore();
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Local loading state

  // Wait for hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize metrics collection for bot detection
  useEffect(() => {
    if (!mounted) return;

    // Phase 3: Collect user behavior metrics for bot detection
    const collectUserMetrics = () => {
      try {
        // Collect basic metrics
        const metrics = {
          userAgent: navigator.userAgent,
          timeOnPage:
            Date.now() -
            (window.performance?.timing?.navigationStart || Date.now()),
          mouseMovement: false, // Will be updated by mouse events
          keyboardInput: false, // Will be updated by keyboard events
          requestFrequency: 1,
        };

        // Import and use bot detection service
        import("@/lib/bot-detection")
          .then(({ BotDetectionService }) => {
            const botDetection = BotDetectionService.getInstance();
            const userId = queue.userId || "anonymous";
            botDetection.collectMetrics(userId, metrics);
          })
          .catch(() => {
            // Silent fail - don't break user experience
          });

        // Add event listeners for user interactions
        const handleMouseMove = () => {
          import("@/lib/bot-detection")
            .then(({ BotDetectionService }) => {
              const botDetection = BotDetectionService.getInstance();
              const userId = queue.userId || "anonymous";
              botDetection.collectMetrics(userId, { mouseMovement: true });
            })
            .catch(() => {});
        };

        const handleKeyboard = () => {
          import("@/lib/bot-detection")
            .then(({ BotDetectionService }) => {
              const botDetection = BotDetectionService.getInstance();
              const userId = queue.userId || "anonymous";
              botDetection.collectMetrics(userId, { keyboardInput: true });
            })
            .catch(() => {});
        };

        // Add listeners (with cleanup)
        document.addEventListener("mousemove", handleMouseMove, { once: true });
        document.addEventListener("keydown", handleKeyboard, { once: true });

        // Return cleanup function
        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("keydown", handleKeyboard);
        };
      } catch {
        // Silent fail - don't break user experience
        return () => {};
      }
    };

    const cleanup = collectUserMetrics();
    return cleanup;
  }, [mounted, queue.userId]);

  const handleJoinQueue = async () => {
    clearError(); // Clear any previous errors
    setIsProcessing(true); // Start local loading state

    try {
      // Phase 2: Execute CAPTCHA if enabled (fail-safe)
      const token = await captcha.execute("join_queue");

      // Always proceed with queue join (with or without CAPTCHA)
      await joinQueue(token);

      // Redirect immediately after successful join
      router.push("/waiting-room");
    } catch (error) {
      // CAPTCHA error shouldn't block user - fail open
      console.warn("CAPTCHA execution failed, proceeding anyway:", error);
      try {
        await joinQueue(); // Proceed without CAPTCHA token

        // Redirect immediately after successful join
        router.push("/waiting-room");
      } catch (joinError) {
        console.error("Failed to join queue:", joinError);
        // Error will be shown by the error display section
        setIsProcessing(false); // Stop loading if error
      }
    }
  };

  const isLoading = isProcessing || queue.status === "joining";
  const error = queue.error;

  // Prevent hydration mismatch by using mounted state
  const showInQueueState = mounted && isInQueue();

  return (
    <div className="relative z-10">
      <div className="space-y-4">
        <GlassButton
          size="xl"
          className="font-bold backdrop-blur-md bg-white/20 border-white/30 text-white hover:bg-white/30 hover:border-white/50 hover:text-white transition-all duration-500 ease-out transform hover:scale-105 animate-[pulseGlow_4s_ease-in-out_infinite,gentleFloat_6s_ease-in-out_infinite] hover:animate-[backgroundPulse_2s_ease-in-out_infinite] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:w-[50%] before:h-full before:transform before:animate-[shimmer_3.5s_ease-in-out_infinite] before:transition-all before:duration-500 disabled:before:animate-none disabled:animate-[pulseGlow_4s_ease-in-out_infinite] disabled:transform-none disabled:hover:scale-100 disabled:opacity-75"
          disabled={isLoading || showInQueueState}
          onClick={handleJoinQueue}
        >
          {isLoading
            ? "Processing..."
            : showInQueueState
            ? "Already in Queue"
            : "Reserve Now"}
        </GlassButton>

        {/* Show queue status */}
        {mounted && queue.status === "waiting" && (
          <div className={`p-3 rounded-lg ${glassClasses.secondary}`}>
            <div className="text-center">
              <div className="text-sm text-blue-400 mb-1">
                Queue Position: {queue.position} of {queue.totalInQueue}
              </div>
              <div className="text-xs text-gray-400">
                Estimated wait: {queue.estimatedWaitMinutes} minutes
              </div>
            </div>
          </div>
        )}

        {/* Show error messages */}
        {mounted && hasError() && error && (
          <div
            className={`flex items-center gap-2 text-sm p-3 rounded-lg ${glassClasses.secondary}`}
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <span className="text-red-600">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
