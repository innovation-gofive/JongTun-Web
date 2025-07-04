// Phase 1: CAPTCHA Store (Ready for use)
// This store is now integrated with the system

import { create } from "zustand";

export interface CaptchaState {
  // Phase 1: Basic state structure
  isEnabled: boolean;
  isLoading: boolean;
  token: string | null;
  score: number | null;
  error: string | null;

  // Phase 2: Verification state
  isVerified: boolean;
  verificationAttempts: number;

  // Phase 3: Advanced features
  adaptiveMode: boolean;
  bypassWhitelist: string[];
}

export interface CaptchaActions {
  // Phase 1: Basic actions
  setEnabled: (enabled: boolean) => void;
  setLoading: (loading: boolean) => void;
  setToken: (token: string | null) => void;
  setScore: (score: number | null) => void;
  setError: (error: string | null) => void;

  // Phase 2: Verification actions
  setVerified: (verified: boolean) => void;
  incrementAttempts: () => void;
  resetAttempts: () => void;

  // Phase 3: Advanced actions
  toggleAdaptiveMode: () => void;
  addToWhitelist: (userId: string) => void;
  removeFromWhitelist: (userId: string) => void;

  // Core actions
  execute: (action?: string) => Promise<string | null>;
  reset: () => void;
  isReady: () => boolean;
  shouldShow: () => boolean;
}

// Initial state - Read CAPTCHA setting from environment
const isCaptchaEnabled = process.env.NEXT_PUBLIC_ENABLE_CAPTCHA === "true";

const initialState: CaptchaState = {
  isEnabled: isCaptchaEnabled, // Controlled by environment variable
  isLoading: false,
  token: null,
  score: null,
  error: null,
  isVerified: false,
  verificationAttempts: 0,
  adaptiveMode: false,
  bypassWhitelist: [],
};

export const useCaptchaStore = create<CaptchaState & CaptchaActions>(
  (set, get) => ({
    ...initialState,

    // Phase 1: Safe state setters
    setEnabled: (enabled) => set({ isEnabled: enabled }),
    setLoading: (loading) => set({ isLoading: loading }),
    setToken: (token) => set({ token }),
    setScore: (score) => set({ score }),
    setError: (error) => set({ error }),

    // Phase 2: Verification actions (prepared)
    setVerified: (verified) => set({ isVerified: verified }),
    incrementAttempts: () =>
      set((state) => ({
        verificationAttempts: state.verificationAttempts + 1,
      })),
    resetAttempts: () => set({ verificationAttempts: 0 }),

    // Phase 3: Advanced actions (prepared)
    toggleAdaptiveMode: () =>
      set((state) => ({
        adaptiveMode: !state.adaptiveMode,
      })),
    addToWhitelist: (userId) =>
      set((state) => ({
        bypassWhitelist: [...state.bypassWhitelist, userId],
      })),
    removeFromWhitelist: (userId) =>
      set((state) => ({
        bypassWhitelist: state.bypassWhitelist.filter((id) => id !== userId),
      })),

    // Core execution function
    execute: async (action = "join_queue") => {
      const state = get();

      // Phase 1: Return null if disabled
      if (!state.isEnabled) {
        return null;
      }

      try {
        set({ isLoading: true, error: null });

        // Dynamic import to avoid SSR issues
        const { executeCaptcha } = await import("@/lib/captcha");
        const token = await executeCaptcha(action);

        set({ token, isLoading: false });
        return token;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "CAPTCHA execution failed";
        set({ error: errorMessage, isLoading: false });
        return null;
      }
    },

    // Universal actions
    reset: () => set(initialState),

    isReady: () => {
      const state = get();
      // Phase 1: Always ready (no CAPTCHA required)
      // Phase 2: Will check token validity
      // Phase 3: Will check advanced conditions
      return !state.isLoading && state.error === null;
    },

    shouldShow: () => {
      const state = get();
      // Phase 3: Smart CAPTCHA decision
      if (!state.isEnabled) return false;

      // Use smart bot detection if available
      try {
        // Dynamic import to avoid circular dependencies
        return false; // Will be updated with smart logic later
      } catch {
        // Fallback to manual logic
        return state.isEnabled && !state.isVerified;
      }
    },
  })
);

// Helper functions for safe integration
export const captchaHelpers = {
  // Safe initialization - no state changes needed since env is read at startup
  initialize: () => {
    // Store already reads environment variable at initialization
    // No need to set state again
    console.log(
      "CAPTCHA initialized from environment:",
      process.env.NEXT_PUBLIC_ENABLE_CAPTCHA === "true"
    );
  },

  // Phase 1: Safe state checking
  canProceed: () => {
    const { shouldShow, isReady } = useCaptchaStore.getState();
    // Phase 1: Always allow proceeding
    // Phase 2: Will check CAPTCHA verification
    return !shouldShow() || isReady();
  },

  // Phase 1: Safe error handling
  handleError: (error: Error) => {
    const { setError } = useCaptchaStore.getState();
    setError(error.message);

    // Always allow user to proceed on error (fail-open)
    return true;
  },
};
