"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReservationStore } from "@/store/useReservationStore";
import { BranchList } from "./components/BranchList";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SelectBranchPage() {
  const router = useRouter();
  const { reservation, currentStep, setStep } = useReservationStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set current step when component mounts
  useEffect(() => {
    setStep("branch");
  }, [setStep]);

  // Redirect if no product selected
  useEffect(() => {
    if (mounted && !reservation?.productName) {
      router.push("/select-product");
    }
  }, [mounted, reservation, router]);

  // Show loading while checking
  if (!mounted || !reservation?.productName) {
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
        <div className="max-w-4xl mx-auto">
          {/* Workflow Progress */}
          <WorkflowProgress currentStep={currentStep} className="mb-8" />

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Select Branch
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              Choose a branch to collect your product: {reservation.productName}{" "}
              ({reservation.quantity} units)
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/select-product")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Change Product or Quantity
            </Button>
          </div>

          {/* Branch Selection */}
          <BranchList />
        </div>
      </div>
    </main>
  );
}
