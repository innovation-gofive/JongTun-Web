"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassButton, glassClasses } from "@/components/ui/glass";
import { AlertTriangle } from "lucide-react";

export function JoinQueueButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoinQueue = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/queue/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        // Successfully joined queue or already allowed, redirect to waiting room
        router.push("/waiting-room");
      } else if (response.status === 429) {
        // Rate limited - show friendly message
        const errorData = await response.json().catch(() => ({}));
        setError(
          errorData.message ||
            "Too many requests. Please wait a moment before trying again."
        );
        setIsLoading(false);
      } else {
        // Other errors
        const errorData = await response.json().catch(() => ({}));
        setError(
          errorData.message ||
            `Service error (${response.status}). Please try again.`
        );
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error joining queue:", error);
      setError(
        "Unable to connect to queue service. Please check your connection and try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10">
      <div className="space-y-4">
        <GlassButton
          size="xl"
          className="font-bold"
          disabled={isLoading}
          onClick={handleJoinQueue}
        >
          {isLoading ? "Processing..." : "🎯 Join Queue"}
        </GlassButton>

        {error && (
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
