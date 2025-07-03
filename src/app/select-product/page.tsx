"use client";

import { ProductList } from "./components/ProductList";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { useReservationStore } from "@/store/useReservationStore";
import { useEffect } from "react";

export default function SelectProductPage() {
  const { currentStep, setStep } = useReservationStore();

  // Set current step when component mounts
  useEffect(() => {
    setStep("product");
  }, [setStep]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Workflow Progress */}
          <WorkflowProgress currentStep={currentStep} className="mb-8" />

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Select Gold-Coated Paper
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose the type and quantity of gold-coated paper you want to
              reserve. You can change your selection at any time.
            </p>
          </div>

          {/* Product Selection */}
          <ProductList />
        </div>
      </div>
    </main>
  );
}
