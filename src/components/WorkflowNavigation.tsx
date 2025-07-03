"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReservationStore } from "@/store/useReservationStore";

interface WorkflowNavigationProps {
  currentStep: "product" | "branch" | "confirmation";
  className?: string;
}

export const WorkflowNavigation = ({
  currentStep,
  className,
}: WorkflowNavigationProps) => {
  const router = useRouter();
  const { reservation, canProceedToNextStep } = useReservationStore();

  const getNavigationConfig = () => {
    switch (currentStep) {
      case "product":
        return {
          showBack: false,
          showNext: !!(reservation?.productName && reservation?.quantity),
          nextLabel: "Continue to Branch Selection",
          nextPath: "/select-branch",
          backLabel: "",
          backPath: "",
        };
      case "branch":
        return {
          showBack: true,
          showNext: !!reservation?.branchName,
          nextLabel: "Continue to Confirmation",
          nextPath: "/confirmation",
          backLabel: "Change Product",
          backPath: "/select-product",
        };
      case "confirmation":
        return {
          showBack: true,
          showNext: false,
          nextLabel: "",
          nextPath: "",
          backLabel: "Change Branch",
          backPath: "/select-branch",
        };
      default:
        return {
          showBack: false,
          showNext: false,
          nextLabel: "",
          nextPath: "",
          backLabel: "",
          backPath: "",
        };
    }
  };

  const config = getNavigationConfig();

  if (!config.showBack && !config.showNext) {
    return null;
  }

  return (
    <div className={`flex justify-between items-center ${className}`}>
      {config.showBack ? (
        <Button
          variant="outline"
          onClick={() => router.push(config.backPath)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {config.backLabel}
        </Button>
      ) : (
        <div />
      )}

      {config.showNext && (
        <Button
          onClick={() => router.push(config.nextPath)}
          disabled={!canProceedToNextStep()}
          className="flex items-center gap-2"
        >
          {config.nextLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
