"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
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
import {
  AlertTriangle,
  MapPin,
  RefreshCw,
  Shield,
  WifiOff,
  Clock,
} from "lucide-react";
import { logger } from "@/lib/logger";
import { CONSTANTS, BRANCH_IDS } from "@/lib/constants";
import { useClientRateLimit } from "@/lib/client-rate-limit";
import { useQueueTabSync } from "@/lib/tab-sync";

interface Branch {
  id: string;
  name: string;
  location: string;
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
      currentStock: 12,
      description: "Our flagship location in the heart of the city",
    },
    {
      id: BRANCH_IDS.RIVERSIDE,
      name: "Riverside Branch",
      location: "Riverside Plaza",
      currentStock: 0,
      description: "Scenic location by the waterfront",
    },
    {
      id: BRANCH_IDS.UPTOWN,
      name: "Uptown Branch",
      location: "Business District",
      currentStock: 8,
      description: "Modern facility in the business center",
    },
    {
      id: BRANCH_IDS.SUBURBAN,
      name: "Suburban Branch",
      location: "Green Valley Mall",
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

  // Security: Rate limiting for branch selection
  const { checkRateLimit } = useClientRateLimit({
    maxRequests: 3, // Allow only 3 branch selections per 30 seconds
    windowMs: 30000, // 30 second window
    blockDurationMs: 60000, // Block for 1 minute if exceeded
  });

  // Security: Tab synchronization to prevent multi-tab abuse
  const { tabId, notifyQueueJoined, checkExistingQueueSession } =
    useQueueTabSync();

  // Network status detection
  const [isOnline, setIsOnline] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check if branch has enough stock for the selected quantity
  const requiredQuantity = reservation?.quantity || 0;

  // Security: Validate quantity to prevent manipulation
  const validatedQuantity = Math.max(0, Math.min(requiredQuantity, 10)); // Max 10 units
  const hasEnoughStock = branch.currentStock >= validatedQuantity;
  const isAvailable = hasEnoughStock && branch.currentStock > 0 && isOnline;

  // Security: Detect if user already has an active session in another tab
  const existingSession = useCallback(() => {
    return checkExistingQueueSession();
  }, [checkExistingQueueSession]);

  const handleSelectBranch = useCallback(async () => {
    if (!isAvailable || isProcessing) return;

    // Security: Check rate limit
    const rateLimitResult = checkRateLimit("branch-selection");
    if (!rateLimitResult.canProceed) {
      logger.warn("Branch selection rate limit exceeded", {
        tabId,
        remainingRequests: rateLimitResult.remainingRequests,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        isBlocked: rateLimitResult.isBlocked,
      });

      // Show user-friendly message
      alert(
        rateLimitResult.isBlocked
          ? "Too many attempts. Please wait before trying again."
          : `Please wait ${Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000
            )} seconds before selecting another branch.`
      );
      return;
    }

    // Security: Check for existing session in other tabs
    const currentExistingSession = existingSession();
    if (currentExistingSession) {
      logger.warn("Detected existing queue session in another tab", {
        tabId,
        existingSession: currentExistingSession,
      });

      // Clear existing session and continue (user friendly approach)
      // Remove the blocking behavior for better UX
      try {
        localStorage.removeItem("dev-war-queue_last");
        logger.warn("Cleared existing session, continuing with current tab", {
          tabId,
        });
      } catch (error) {
        logger.warn("Failed to clear existing session", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Optional: Show a brief notification instead of blocking
      // This is more user-friendly while still maintaining security logging
    }

    // Security: Additional validation
    if (validatedQuantity !== requiredQuantity) {
      logger.warn("Quantity validation failed", {
        original: requiredQuantity,
        validated: validatedQuantity,
      });
      alert("Invalid quantity detected. Please refresh and try again.");
      return;
    }

    setIsProcessing(true);

    try {
      logger.log("Selecting branch:", {
        branchName: branch.name,
        branchId: branch.id,
        tabId,
        quantity: validatedQuantity,
        securityCheck: "passed",
      });

      // Save branch info to Zustand store
      setBranch(branch.name, branch.id);

      // Generate a mock reservation ID for demo
      const mockReservationId = `${CONSTANTS.RESERVATION_ID_PREFIX}${Date.now()
        .toString()
        .slice(-6)}`;

      logger.log("Generated reservation ID:", {
        reservationId: mockReservationId,
        tabId,
      });

      setReservationId(mockReservationId);
      setStatus("confirmed");

      // Notify other tabs about the reservation
      notifyQueueJoined({
        branchId: branch.id,
        branchName: branch.name,
        reservationId: mockReservationId,
        quantity: validatedQuantity,
      });

      logger.log("Navigating to confirmation...", {
        action: "navigate_to_confirmation",
        tabId,
      });

      // Navigate to confirmation page
      router.push("/confirmation");
    } catch (error) {
      logger.error(
        "Error selecting branch:",
        error instanceof Error ? error : new Error(String(error))
      );
      alert("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    isAvailable,
    isProcessing,
    branch,
    checkRateLimit,
    validatedQuantity,
    requiredQuantity,
    setBranch,
    setReservationId,
    setStatus,
    notifyQueueJoined,
    router,
    tabId,
    existingSession,
  ]);

  return (
    <Card
      className={`w-full transition-all hover:shadow-md ${
        !isAvailable ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {branch.name}
            {/* Stock indicator icon */}
            {branch.currentStock === 0 ? (
              <span
                className="w-3 h-3 bg-red-500 rounded-full"
                title="Out of stock"
              ></span>
            ) : branch.currentStock < 5 ? (
              <span
                className="w-3 h-3 bg-orange-500 rounded-full"
                title="Low stock"
              ></span>
            ) : (
              <span
                className="w-3 h-3 bg-green-500 rounded-full"
                title="In stock"
              ></span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {branch.location}
            </div>
            {/* Enhanced status badges */}
            {!hasEnoughStock &&
              requiredQuantity > 0 &&
              branch.currentStock > 0 && (
                <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  Need {requiredQuantity - branch.currentStock} more units
                </div>
              )}
            {branch.currentStock === 0 && (
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                Out of Stock
              </div>
            )}
            {hasEnoughStock && requiredQuantity > 0 && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Available
              </div>
            )}
          </div>
        </CardTitle>
        <CardDescription>{branch.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Enhanced Stock Information */}
          <div className="space-y-3">
            {/* Stock Status Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Stock Availability
              </span>
              <div className="flex items-center gap-2">
                {branch.currentStock === 0 ? (
                  <div className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Out of Stock
                  </div>
                ) : branch.currentStock < 5 ? (
                  <div className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Low Stock
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    In Stock
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Stock Information */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Available Units:</span>
                <span
                  className={`font-semibold text-lg ${
                    branch.currentStock === 0
                      ? "text-red-600"
                      : branch.currentStock < 5
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {branch.currentStock === 0
                    ? "0 units"
                    : `${branch.currentStock} units available`}
                </span>
              </div>

              {requiredQuantity > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">You need:</span>
                    <span className="font-medium text-blue-600">
                      {requiredQuantity} units
                    </span>
                  </div>

                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Order Status:</span>
                      {hasEnoughStock ? (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <span className="text-green-500">✓</span>
                          Can fulfill your order
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600 font-medium">
                          <span className="text-red-500">✗</span>
                          Cannot fulfill ({branch.currentStock} available, need{" "}
                          {requiredQuantity})
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!isAvailable || isProcessing}
              className={`w-full sm:w-auto ${
                !isOnline
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : !isAvailable
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : hasEnoughStock
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              onClick={handleSelectBranch}
            >
              {!isOnline ? (
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4" />
                  Offline
                </div>
              ) : isProcessing ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : branch.currentStock === 0 ? (
                "Out of Stock"
              ) : !hasEnoughStock && validatedQuantity > 0 ? (
                `Need ${validatedQuantity - branch.currentStock} more units`
              ) : hasEnoughStock && validatedQuantity > 0 ? (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Select This Branch
                </div>
              ) : (
                "Select Branch"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const BranchList = () => {
  // Security: Rate limiting for API calls
  const { checkRateLimit } = useClientRateLimit({
    maxRequests: 10, // Allow 10 API calls per minute
    windowMs: 60000, // 1 minute window
    blockDurationMs: 120000, // Block for 2 minutes if exceeded
  });

  // Security: Tab synchronization
  const { subscribeToQueueEvents } = useQueueTabSync();

  // Network status
  const [isOnline, setIsOnline] = useState(true);
  const [tabSyncActive, setTabSyncActive] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Monitor cross-tab activities
  useEffect(() => {
    const unsubscribe = subscribeToQueueEvents(
      (data) => {
        logger.log("Queue activity detected in another tab", {
          tabData: data,
          timestamp: Date.now(),
        });
        setTabSyncActive(true);
        setTimeout(() => setTabSyncActive(false), 3000); // Show indicator for 3 seconds
      },
      () => {
        logger.log("Queue left in another tab");
        setTabSyncActive(false);
      }
    );

    return unsubscribe;
  }, [subscribeToQueueEvents]);

  // Enhanced fetchBranches with security checks
  const secureFetchBranches = useCallback(async (): Promise<Branch[]> => {
    // Security: Check rate limit before API call
    const rateLimitResult = checkRateLimit("branches-fetch");
    if (!rateLimitResult.canProceed) {
      const timeToWait = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000
      );
      throw new Error(
        `Rate limit exceeded. Please wait ${timeToWait} seconds before trying again.`
      );
    }

    // Security: Check network status
    if (!isOnline) {
      throw new Error(
        "No internet connection. Please check your network and try again."
      );
    }

    return fetchBranches();
  }, [checkRateLimit, isOnline]);

  const {
    data: branches,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Branch[], Error>({
    queryKey: ["branches"],
    queryFn: secureFetchBranches,
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
      {/* Security Status Indicator */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700">
            Security Status
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {isOnline ? (
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-gray-600">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                tabSyncActive ? "bg-orange-500" : "bg-gray-300"
              }`}
            ></span>
            <span className="text-xs text-gray-600">
              {tabSyncActive ? "Multi-tab detected" : "Tab sync active"}
            </span>
          </div>
        </div>
      </div>

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
