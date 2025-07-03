import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CONSTANTS } from "@/lib/constants";

// Define the types for our reservation data
export interface ReservationData {
  productName: string;
  productId: string;
  quantity: number;
  branchName: string;
  branchId?: string;
  reservationId?: string;
  status?: "pending" | "confirmed" | "completed";
}

// Define workflow step types
export type WorkflowStep = "product" | "branch" | "confirmation" | "complete";

// Define the store interface
interface ReservationStore {
  reservation: ReservationData | null;
  selectedProductId: string | null; // Track which product is selected
  currentStep: WorkflowStep; // Track current workflow step

  // Actions
  setQuantity: (quantity: number) => void;
  setBranch: (branchName: string, branchId?: string) => void;
  setReservationId: (reservationId: string) => void;
  setStatus: (status: ReservationData["status"]) => void;
  clearReservation: () => void;
  setStep: (step: WorkflowStep) => void;

  // Workflow helpers
  canProceedToNextStep: () => boolean;
  updateProductAndQuantity: (
    productName: string,
    productId: string,
    quantity: number
  ) => void;

  // Getters for easy access
  isComplete: () => boolean;
  isProductSelected: (productId: string) => boolean;
  getCurrentQuantity: () => number;
}

// Create the Zustand store with persistence
export const useReservationStore = create<ReservationStore>()(
  persist(
    (set, get) => ({
      reservation: null,
      selectedProductId: null,
      currentStep: "product" as WorkflowStep,

      // Set quantity
      setQuantity: (quantity: number) =>
        set((state) => ({
          reservation: state.reservation
            ? { ...state.reservation, quantity }
            : null,
        })),

      // Set branch information
      setBranch: (branchName: string, branchId?: string) =>
        set((state) => ({
          currentStep: "branch" as WorkflowStep,
          reservation: state.reservation
            ? { ...state.reservation, branchName, branchId }
            : null,
        })),

      // Set reservation ID after successful booking
      setReservationId: (reservationId: string) =>
        set((state) => ({
          currentStep: "complete" as WorkflowStep,
          reservation: state.reservation
            ? { ...state.reservation, reservationId, status: "confirmed" }
            : null,
        })),

      // Update status
      setStatus: (status: ReservationData["status"]) =>
        set((state) => ({
          reservation: state.reservation
            ? { ...state.reservation, status }
            : null,
        })),

      // Clear all reservation data
      clearReservation: () =>
        set({
          reservation: null,
          selectedProductId: null,
          currentStep: "product" as WorkflowStep,
        }),

      // Set workflow step
      setStep: (step: WorkflowStep) => set({ currentStep: step }),

      // Workflow helpers
      canProceedToNextStep: () => {
        const { reservation, currentStep } = get();
        switch (currentStep) {
          case "product":
            return !!(reservation?.productName && reservation?.quantity);
          case "branch":
            return !!reservation?.branchName;
          case "confirmation":
            return !!reservation?.reservationId;
          default:
            return false;
        }
      },

      // Update product and quantity in one action
      updateProductAndQuantity: (
        productName: string,
        productId: string,
        quantity: number
      ) =>
        set((state) => ({
          selectedProductId: productId,
          currentStep: "product" as WorkflowStep,
          reservation: {
            ...state.reservation,
            productName,
            productId,
            quantity,
            // Keep branch info if it exists, but it will be validated later
            branchName: state.reservation?.branchName || "",
            branchId: state.reservation?.branchId || "",
          } as ReservationData,
        })),

      // Check if reservation has all required fields
      isComplete: () => {
        const { reservation } = get();
        return !!(
          reservation?.productName &&
          reservation?.quantity &&
          reservation?.branchName
        );
      },

      // Check if a specific product is selected
      isProductSelected: (productId: string) => {
        const { selectedProductId } = get();
        return selectedProductId === productId;
      },

      // Get current quantity
      getCurrentQuantity: () => {
        const { reservation } = get();
        return reservation?.quantity || CONSTANTS.DEFAULT_QUANTITY;
      },
    }),
    {
      name: "reservation-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage
      // Clear the store when the page loads with a new session
      partialize: (state) => ({
        reservation: state.reservation,
        selectedProductId: state.selectedProductId,
        currentStep: state.currentStep,
      }),
    }
  )
);
