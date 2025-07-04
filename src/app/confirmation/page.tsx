"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReservationStore } from "@/store/useReservationStore";
import { useQueueStore } from "@/store/useQueueStore";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import {
  CheckCircle,
  Package,
  MapPin,
  Hash,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { logger } from "@/lib/logger";
import { CONSTANTS } from "@/lib/constants";
import { ConfirmationDialog } from "@/components/ui/dialog";

export default function ConfirmationPage() {
  const {
    reservation,
    clearReservation,
    currentStep,
    setStep,
    setReservationId,
  } = useReservationStore();
  const { clearQueue } = useQueueStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(
    null
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);

  // Wait for hydration before doing any checks
  useEffect(() => {
    setMounted(true);
  }, []);

  // Set current step when component mounts
  useEffect(() => {
    setStep("confirmation");
  }, [setStep]);

  // Debug logging
  useEffect(() => {
    if (mounted) {
      logger.log(
        "Confirmation page mounted, reservation data:",
        reservation ? { reservation } : undefined
      );
    }
  }, [mounted, reservation]);

  // Redirect if no reservation data (only after mount to avoid hydration issues)
  useEffect(() => {
    if (
      mounted &&
      (!reservation || !reservation.productName || !reservation.branchName)
    ) {
      logger.log("No reservation data found, redirecting to home");
      router.push("/");
    }
  }, [reservation, router, mounted]);

  const handleConfirmReservation = async () => {
    if (!reservation || isConfirming || isConfirmed) return;

    setIsConfirming(true);
    setConfirmationError(null);

    try {
      const response = await fetch("/api/reservation/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branchName: reservation.branchName,
          productName: reservation.productName,
          quantity: reservation.quantity,
          userId: "user-" + Date.now(), // In real app, get from auth
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update reservation with confirmed ID
        setReservationId(result.reservation.id);
        setIsConfirmed(true);

        logger.log("Reservation confirmed successfully", {
          reservationId: result.reservation.id,
        });
      } else {
        // Handle different error types
        let errorMessage = result.message || "Failed to confirm reservation";

        if (result.error === "INSUFFICIENT_STOCK") {
          errorMessage = result.message;
          if (result.suggestedAction) {
            errorMessage += "\n\n" + result.suggestedAction;
          }
        }

        setConfirmationError(errorMessage);
        logger.warn("Reservation confirmation failed", {
          error: result.error,
          message: result.message,
        });
      }
    } catch (error) {
      const errorMessage =
        "Network error. Please check your connection and try again.";
      setConfirmationError(errorMessage);
      logger.warn("Reservation confirmation error", {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleNewReservation = useCallback(() => {
    clearReservation(); // เคลียร์ข้อมูล reservation
    clearQueue(); // เคลียร์ queue state ด้วย
    router.push("/");
  }, [clearReservation, clearQueue, router]);

  const handleRetry = () => {
    setConfirmationError(null);
  };

  const handleDialogConfirm = () => {
    setShowBackDialog(false);
    // Remove event listeners before redirecting
    if (isConfirmed) {
      // Clean up event listeners
      const currentWindow = window as Window & {
        _handleBeforeUnload?: EventListener;
        _handlePopState?: EventListener;
        _handleKeyDown?: EventListener;
      };

      if (currentWindow._handleBeforeUnload) {
        window.removeEventListener(
          "beforeunload",
          currentWindow._handleBeforeUnload
        );
      }
      if (currentWindow._handlePopState) {
        window.removeEventListener("popstate", currentWindow._handlePopState);
      }
      if (currentWindow._handleKeyDown) {
        window.removeEventListener("keydown", currentWindow._handleKeyDown);
      }
    }
    handleNewReservation();
  };

  const handleDialogCancel = () => {
    setShowBackDialog(false);
  };

  // Prevent browser back navigation after successful confirmation
  useEffect(() => {
    if (isConfirmed) {
      // Method 1: Push multiple history entries to make it harder to go back
      window.history.pushState(null, "", "/confirmation");
      window.history.pushState(null, "", "/confirmation");

      // Method 2: Handle beforeunload and popstate events
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue =
          "Your reservation is already confirmed. Are you sure you want to leave?";
        return e.returnValue;
      };

      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();

        // Push state back to current page
        window.history.pushState(null, "", "/confirmation");

        // Show beautiful dialog instead of browser confirm
        setShowBackDialog(true);
      };

      // Method 3: Intercept keyboard shortcuts (Backspace, Alt+Left Arrow)
      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent Backspace navigation (when not in input field)
        if (
          e.key === "Backspace" &&
          e.target &&
          !(e.target as HTMLElement).closest(
            "input, textarea, [contenteditable]"
          )
        ) {
          e.preventDefault();
        }

        // Prevent Alt+Left Arrow (back) and Alt+Right Arrow (forward)
        if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
          e.preventDefault();
        }
      };

      // Add all event listeners
      window.addEventListener("beforeunload", handleBeforeUnload);
      window.addEventListener("popstate", handlePopState);
      window.addEventListener("keydown", handleKeyDown);

      // Cleanup function
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isConfirmed, handleNewReservation]);

  // Show loading state while checking reservation data or before mount
  if (!mounted || !reservation) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Workflow Progress */}
          <WorkflowProgress currentStep={currentStep} className="mb-8" />

          {/* Error State */}
          {confirmationError && (
            <Card className="mb-8 border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Reservation Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 whitespace-pre-line mb-4">
                  {confirmationError}
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Try Again
                  </Button>
                  <Button onClick={handleNewReservation} variant="outline">
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success State */}
          {isConfirmed && (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-16 h-16 text-green-600" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight mb-4 text-green-700">
                  Reservation Confirmed!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Your Gold-Coated Paper reservation has been successfully
                  processed
                </p>
              </div>
            </>
          )}

          {/* Pending State */}
          {!isConfirmed && !confirmationError && (
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Package className="w-16 h-16 text-blue-600" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-4 text-blue-700">
                Ready to Confirm
              </h1>
              <p className="text-lg text-muted-foreground">
                Review your reservation details and confirm to proceed
              </p>
            </div>
          )}

          {/* Reservation Summary Card */}
          <Card
            className={`mb-8 ${
              isConfirmed
                ? "border-green-200 bg-green-50/50"
                : "border-blue-200 bg-blue-50/50"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Reservation Summary
              </CardTitle>
              <CardDescription>
                {isConfirmed
                  ? "Your confirmed reservation details"
                  : "Please review your reservation details"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Information */}
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">Product</div>
                  <div className="text-lg">{reservation.productName}</div>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">Quantity</div>
                  <div className="text-lg">{reservation.quantity}</div>
                </div>
              </div>

              {/* Branch Information */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">
                    Pickup Location
                  </div>
                  <div className="text-lg">{reservation.branchName}</div>
                </div>
              </div>

              {/* Reservation ID (if available) */}
              {reservation.reservationId && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      Reservation ID
                    </div>
                    <div className="text-lg font-mono">
                      {reservation.reservationId}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Steps Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                What to do next with your reservation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>Visit your selected branch during business hours</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>Bring a valid ID for pickup verification</div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    Your reserved Gold-Coated Paper will be held for{" "}
                    {CONSTANTS.RESERVATION_HOLD_TIME} hours
                  </div>
                </div>
                {reservation.reservationId && (
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>Show your Reservation ID to the staff</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-center">
            {isConfirmed ? (
              <Button
                onClick={handleNewReservation}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Make Another Reservation
              </Button>
            ) : (
              <Button
                onClick={handleConfirmReservation}
                disabled={isConfirming}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Confirming Reservation...
                  </>
                ) : (
                  "Confirm Reservation"
                )}
              </Button>
            )}
          </div>

          {/* Confirmation Dialog */}
          <ConfirmationDialog
            open={showBackDialog}
            onOpenChange={setShowBackDialog}
            onConfirm={handleDialogConfirm}
            onCancel={handleDialogCancel}
            title="Reservation Already Confirmed"
            description="Your reservation has been successfully confirmed. Do you want to start a new reservation?"
            confirmText="Start New Reservation"
            cancelText="Stay Here"
            variant="warning"
          />
        </div>
      </div>
    </main>
  );
}
