"use client";

import { useEffect, useState } from "react";
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
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { CheckCircle, Package, MapPin, Hash } from "lucide-react";
import { logger } from "@/lib/logger";
import { CONSTANTS } from "@/lib/constants";

export default function ConfirmationPage() {
  const { reservation, clearReservation, currentStep, setStep } =
    useReservationStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
      logger.log("Confirmation page mounted, reservation data:", reservation);
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

  const handleNewReservation = () => {
    clearReservation();
    router.push("/");
  };

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

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-green-700">
              Reservation Confirmed!
            </h1>
            <p className="text-lg text-muted-foreground">
              Your Gold-Coated Paper reservation has been successfully processed
            </p>
          </div>

          {/* Reservation Summary Card */}
          <Card className="mb-8 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Reservation Summary
              </CardTitle>
              <CardDescription>
                Please keep this information for your records
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
            <Button
              onClick={handleNewReservation}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Make Another Reservation
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
