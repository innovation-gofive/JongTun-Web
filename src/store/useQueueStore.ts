import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Define queue status types
export type QueueStatus = "idle" | "joining" | "waiting" | "allowed" | "error";

// Define queue data interface
export interface QueueData {
  status: QueueStatus;
  position?: number;
  totalInQueue?: number;
  estimatedWaitMinutes?: number;
  message?: string;
  userId?: string;
  joinedAt?: number;
  lastUpdated?: number;
  error?: string;
}

// Define queue store interface
interface QueueStore {
  queue: QueueData;

  // Actions
  setQueueStatus: (status: QueueStatus) => void;
  updateQueueData: (data: Partial<QueueData>) => void;
  setError: (error: string) => void;
  clearError: () => void;
  clearQueue: () => void;

  // Queue management
  joinQueue: (captchaToken?: string | null) => Promise<void>;
  checkQueueStatus: () => Promise<void>;

  // Helpers
  isInQueue: () => boolean;
  isAllowed: () => boolean;
  hasError: () => boolean;
  getTimeInQueue: () => number; // minutes
}

// Create the Zustand queue store
export const useQueueStore = create<QueueStore>()(
  persist(
    (set, get) => ({
      queue: {
        status: "idle",
        position: undefined,
        totalInQueue: undefined,
        estimatedWaitMinutes: undefined,
        message: undefined,
        userId: undefined,
        joinedAt: undefined,
        lastUpdated: undefined,
        error: undefined,
      },

      // Actions
      setQueueStatus: (status: QueueStatus) => {
        set((state) => ({
          queue: {
            ...state.queue,
            status,
            lastUpdated: Date.now(),
            error: status === "error" ? state.queue.error : undefined,
          },
        }));
      },

      updateQueueData: (data: Partial<QueueData>) => {
        set((state) => ({
          queue: {
            ...state.queue,
            ...data,
            lastUpdated: Date.now(),
          },
        }));
      },

      setError: (error: string) => {
        set((state) => ({
          queue: {
            ...state.queue,
            status: "error",
            error,
            lastUpdated: Date.now(),
          },
        }));
      },

      clearError: () => {
        set((state) => ({
          queue: {
            ...state.queue,
            error: undefined,
            status:
              state.queue.status === "error" ? "idle" : state.queue.status,
          },
        }));
      },

      clearQueue: () => {
        set({
          queue: {
            status: "idle",
            position: undefined,
            totalInQueue: undefined,
            estimatedWaitMinutes: undefined,
            message: undefined,
            userId: undefined,
            joinedAt: undefined,
            lastUpdated: undefined,
            error: undefined,
          },
        });
      },

      // Queue management functions
      joinQueue: async (captchaToken?: string | null) => {
        const state = get();

        try {
          state.setQueueStatus("joining");
          state.clearError();

          // Generate CSRF token
          const csrfToken = "mock-csrf-token-" + Date.now();

          console.log("[ZUSTAND] Joining queue...", {
            timestamp: new Date().toISOString(),
            hasCaptcha: !!captchaToken,
          });

          // Prepare headers
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          };

          // Add CAPTCHA token if provided
          if (captchaToken) {
            headers["X-Captcha-Token"] = captchaToken;
          }

          const response = await fetch("/api/queue/join", {
            method: "POST",
            headers,
            credentials: "include",
          });

          const data = await response.json();

          if (response.ok && data.success) {
            if (data.status === "allowed") {
              state.updateQueueData({
                status: "allowed",
                message: data.message,
                userId: data.userId,
                joinedAt: Date.now(),
              });

              console.log("[ZUSTAND] User allowed to proceed", {
                status: data.status,
              });
            } else if (data.status === "waiting") {
              state.updateQueueData({
                status: "waiting",
                position: data.position,
                totalInQueue: data.totalInQueue,
                estimatedWaitMinutes: data.estimatedWaitMinutes,
                message: data.message,
                userId: data.userId,
                joinedAt: Date.now(),
              });

              console.log("[ZUSTAND] User added to queue", {
                position: data.position,
                totalInQueue: data.totalInQueue,
              });
            }
          } else {
            // Handle errors
            let errorMessage =
              data.message ||
              `Error ${response.status}: ${data.error || "Unknown error"}`;

            if (response.status === 429) {
              errorMessage =
                "Too many requests. Please wait a moment before trying again.";
            } else if (response.status === 503) {
              errorMessage =
                "Queue service is temporarily unavailable. Please try again in a few moments.";
            }

            state.setError(errorMessage);
            console.error("[ZUSTAND] Queue join error:", {
              status: response.status,
              error: data.error,
              code: data.code,
            });
          }
        } catch (error) {
          const errorMessage =
            "Unable to connect to queue service. Please check your connection and try again.";
          state.setError(errorMessage);
          console.error("[ZUSTAND] Network error:", error);
        }
      },

      checkQueueStatus: async () => {
        const state = get();

        try {
          console.log("[ZUSTAND] Checking queue status...");

          const response = await fetch("/api/queue/join", {
            method: "GET",
            credentials: "include",
          });

          const data = await response.json();

          if (response.ok && data.success) {
            state.updateQueueData({
              status: data.status,
              position: data.position,
              totalInQueue: data.totalInQueue,
              estimatedWaitMinutes: data.estimatedWaitMinutes,
              message: data.message,
            });

            console.log("[ZUSTAND] Queue status updated", {
              status: data.status,
              position: data.position,
            });
          } else {
            const errorMessage =
              data.message ||
              `Error ${response.status}: ${data.error || "Unknown error"}`;
            state.setError(errorMessage);
            console.error("[ZUSTAND] Queue status check error:", {
              status: response.status,
              error: data.error,
            });
          }
        } catch (error) {
          const errorMessage =
            "Unable to check queue status. Please check your connection.";
          state.setError(errorMessage);
          console.error("[ZUSTAND] Network error:", error);
        }
      },

      // Helper functions
      isInQueue: () => {
        const state = get();
        return (
          state.queue.status === "waiting" || state.queue.status === "joining"
        );
      },

      isAllowed: () => {
        const state = get();
        return state.queue.status === "allowed";
      },

      hasError: () => {
        const state = get();
        return state.queue.status === "error" || !!state.queue.error;
      },

      getTimeInQueue: () => {
        const state = get();
        if (!state.queue.joinedAt) return 0;
        return Math.floor((Date.now() - state.queue.joinedAt) / 60000); // minutes
      },
    }),
    {
      name: "queue-store", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        queue: {
          ...state.queue,
          // Don't persist error state
          error: undefined,
        },
      }),
    }
  )
);
