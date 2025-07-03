"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useReservationStore } from "@/store/useReservationStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, MapPin, Users, RefreshCw } from "lucide-react";
import { logger } from "@/lib/logger";
import { CONSTANTS, BRANCH_IDS } from "@/lib/constants";

interface Branch {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentStock: number;
  description?: string;
}

// Mock API function - replace with actual API call
const fetchBranches = async (): Promise<Branch[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, CONSTANTS.API_DELAY));

  // Simulate random API failures for testing resilience
  if (Math.random() < CONSTANTS.API_FAILURE_RATE) {
    throw new Error("Network error: Unable to fetch branches");
  }

  return [
    {
      id: BRANCH_IDS.DOWNTOWN,
      name: "Downtown Branch",
      location: "Central District",
      capacity: CONSTANTS.BRANCH_CAPACITY.DOWNTOWN,
      currentStock: 12,
      description: "Our flagship location in the heart of the city",
    },
    {
      id: BRANCH_IDS.RIVERSIDE,
      name: "Riverside Branch",
      location: "Riverside Plaza",
      capacity: CONSTANTS.BRANCH_CAPACITY.RIVERSIDE,
      currentStock: 0,
      description: "Scenic location by the waterfront",
    },
    {
      id: BRANCH_IDS.UPTOWN,
      name: "Uptown Branch",
      location: "Business District",
      capacity: CONSTANTS.BRANCH_CAPACITY.UPTOWN,
      currentStock: 8,
      description: "Modern facility in the business center",
    },
    {
      id: BRANCH_IDS.SUBURBAN,
      name: "Suburban Branch",
      location: "Green Valley Mall",
      capacity: CONSTANTS.BRANCH_CAPACITY.SUBURBAN,
      currentStock: 15,
      description: "Family-friendly location with ample parking",
    },
  ];
};

const BranchSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-24" />
      </div>
    </CardContent>
  </Card>
);

const ErrorCard = ({
  onRetry,
  error,
}: {
  onRetry: () => void;
  error: Error;
}) => (
  <Card className="w-full border-destructive/50 bg-destructive/5">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        Unable to Load Branches
      </CardTitle>
      <CardDescription className="text-destructive/80">
        {error.message ||
          "Something went wrong while fetching the branch information."}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Don&apos;t worry! This is likely a temporary issue. You can try again
          or contact support if the problem persists.
        </p>
        <Button
          onClick={onRetry}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </CardContent>
  </Card>
);

const BranchCard = ({ branch }: { branch: Branch }) => {
  const router = useRouter();
  const { setBranch, setReservationId, setStatus, reservation } =
    useReservationStore();

  // Check if branch has enough stock for the selected quantity
  const requiredQuantity = reservation?.quantity || 0;
  const hasEnoughStock = branch.currentStock >= requiredQuantity;
  const isAvailable = hasEnoughStock && branch.currentStock > 0;

  const handleSelectBranch = () => {
    if (!isAvailable) return;

    logger.log("Selecting branch:", branch.name, "ID:", branch.id);

    // Save branch info to Zustand store
    setBranch(branch.name, branch.id);

    // Generate a mock reservation ID for demo
    const mockReservationId = `${CONSTANTS.RESERVATION_ID_PREFIX}${Date.now()
      .toString()
      .slice(-6)}`;
    logger.log("Generated reservation ID:", mockReservationId);

    setReservationId(mockReservationId);
    setStatus("confirmed");

    logger.log("Navigating to confirmation...");
    // Navigate to confirmation page
    router.push("/confirmation");
  };

  return (
    <Card
      className={`w-full transition-all hover:shadow-md ${
        !isAvailable ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{branch.name}</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {branch.location}
            </div>
            {!hasEnoughStock && requiredQuantity > 0 && (
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                Insufficient Stock
              </div>
            )}
            {branch.currentStock === 0 && (
              <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                Out of Stock
              </div>
            )}
          </div>
        </CardTitle>
        <CardDescription>{branch.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stock Information */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Available stock:</span>
              <span
                className={`font-medium ${
                  branch.currentStock > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {branch.currentStock} units
              </span>
            </div>

            {requiredQuantity > 0 && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span>Required quantity:</span>
                  <span className="font-medium text-blue-600">
                    {requiredQuantity} units
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Status:</span>
                  <span
                    className={`font-medium ${
                      hasEnoughStock ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {hasEnoughStock ? "✓ Available" : "✗ Insufficient"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Capacity Information */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Branch capacity:</span>
            </div>
            <span className="text-muted-foreground">
              {branch.capacity} people
            </span>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!isAvailable}
              className="w-full sm:w-auto"
              onClick={handleSelectBranch}
            >
              {!hasEnoughStock && requiredQuantity > 0
                ? "Insufficient Stock"
                : branch.currentStock === 0
                ? "Out of Stock"
                : "Select Branch"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const BranchList = () => {
  const {
    data: branches,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Branch[], Error>({
    queryKey: ["branches"],
    queryFn: fetchBranches,
    retry: CONSTANTS.RETRY_ATTEMPTS,
    retryDelay: (attemptIndex) =>
      Math.min(
        CONSTANTS.RETRY_DELAY_BASE * 2 ** attemptIndex,
        CONSTANTS.RETRY_DELAY_MAX
      ),
    staleTime: CONSTANTS.CACHE_TIMES.BRANCHES,
    gcTime: CONSTANTS.CACHE_TIMES.GC_TIME,
  });

  // Loading State - Show Skeleton components
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, index) => (
            <BranchSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Error State - Show user-friendly error with retry option
  if (isError) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <ErrorCard onRetry={() => refetch()} error={error} />
        </div>
      </div>
    );
  }

  // Success State - Display branches
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {branches?.map((branch) => (
          <BranchCard key={branch.id} branch={branch} />
        ))}
      </div>

      {branches?.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">
              No branches are currently available. Please check back later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
