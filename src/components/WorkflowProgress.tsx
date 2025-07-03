"use client";

import { useReservationStore, WorkflowStep } from "@/store/useReservationStore";
import { Card, CardContent } from "@/components/ui/card";
import { Package, MapPin, CheckCircle, Clock } from "lucide-react";

interface WorkflowProgressProps {
  currentStep: WorkflowStep;
  className?: string;
}

export const WorkflowProgress = ({
  currentStep,
  className,
}: WorkflowProgressProps) => {
  const { reservation } = useReservationStore();

  const steps = [
    {
      key: "product" as WorkflowStep,
      title: "Select Product",
      icon: Package,
      description: "Choose your product and quantity",
      isComplete: !!(reservation?.productName && reservation?.quantity),
    },
    {
      key: "branch" as WorkflowStep,
      title: "Select Branch",
      icon: MapPin,
      description: "Choose pickup location",
      isComplete: !!reservation?.branchName,
    },
    {
      key: "confirmation" as WorkflowStep,
      title: "Confirmation",
      icon: CheckCircle,
      description: "Review and confirm",
      isComplete: !!reservation?.reservationId,
    },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex((step) => step.key === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center max-w-3xl w-full">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCurrentStep = step.key === currentStep;
              const isCompleted = step.isComplete;
              const isPastStep = index < currentStepIndex;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center w-full">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all
                        ${
                          isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : isCurrentStep
                            ? "bg-blue-500 border-blue-500 text-white"
                            : isPastStep
                            ? "bg-gray-300 border-gray-300 text-gray-600"
                            : "bg-gray-100 border-gray-300 text-gray-400"
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : isCurrentStep ? (
                        <Clock className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="mt-3 text-center min-w-0 px-2">
                      <div
                        className={`
                          text-sm font-medium truncate
                          ${
                            isCurrentStep
                              ? "text-blue-600"
                              : isCompleted
                              ? "text-green-600"
                              : "text-gray-500"
                          }
                        `}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 hidden md:block">
                        {step.description}
                      </div>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-4 bg-gray-200 relative">
                      <div
                        className={`
                          h-full transition-all duration-300
                          ${
                            isPastStep || isCompleted
                              ? "bg-green-500"
                              : "bg-gray-200"
                          }
                        `}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Status */}
        {reservation && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-sm">
              <strong>Current Selection:</strong>
              {reservation.productName && (
                <span className="ml-2">
                  {reservation.productName} × {reservation.quantity}
                </span>
              )}
              {reservation.branchName && (
                <span className="ml-2 text-blue-600">
                  → {reservation.branchName}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
