"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  Clock,
  Users,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

interface QueueStatus {
  status: "allowed" | "waiting" | "rate_limited";
  position?: number;
  totalInQueue?: number;
  estimatedWaitMinutes?: number;
  message?: string;
}

// Check queue status from backend-managed queue
const checkQueueStatus = async (): Promise<QueueStatus> => {
  const response = await fetch("/api/queue/status", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      return {
        status: "rate_limited",
        message: data.message || "Too many requests. Please wait and try again",
      };
    }
    throw new Error(`Queue service error: ${response.status}`);
  }

  return response.json();
};

// Join queue function
const joinQueue = async (): Promise<QueueStatus> => {
  const response = await fetch("/api/queue/status", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      return {
        status: "rate_limited",
        message: data.message || "Too many requests. Please wait and try again",
      };
    }
    throw new Error(`Queue service error: ${response.status}`);
  }

  return response.json();
};

const QueueLoadingSkeleton = () => (
  <Card className="w-full">
    <CardHeader className="text-center">
      <Skeleton className="h-8 w-48 mx-auto mb-2" />
      <Skeleton className="h-4 w-64 mx-auto" />
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="text-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full mx-auto" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32 mx-auto" />
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center space-y-2">
          <Skeleton className="h-4 w-20 mx-auto" />
          <Skeleton className="h-8 w-16 mx-auto" />
        </div>
        <div className="text-center space-y-2">
          <Skeleton className="h-4 w-24 mx-auto" />
          <Skeleton className="h-8 w-20 mx-auto" />
        </div>
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
    <CardHeader className="text-center">
      <CardTitle className="flex items-center justify-center gap-2 text-destructive">
        <AlertTriangle className="h-6 w-6" />
        Queue Service Error
      </CardTitle>
      <CardDescription className="text-destructive/80">
        {error.message || "Unable to connect to the queue service"}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Don&apos;t worry! This is likely a temporary issue. The system will
        retry automatically, or you can refresh manually.
      </p>
      <div className="flex justify-center">
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

const RateLimitedCard = ({ message }: { message: string }) => (
  <Card className="w-full border-yellow-500/50 bg-yellow-50">
    <CardHeader className="text-center">
      <CardTitle className="flex items-center justify-center gap-2 text-yellow-700">
        <Clock className="h-6 w-6" />
        Please Wait
      </CardTitle>
      <CardDescription className="text-yellow-600">{message}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-yellow-700 text-center">
        To prevent server overload, we limit how often you can check the queue.
        The page will automatically refresh when ready.
      </p>
    </CardContent>
  </Card>
);

const JoinQueueCard = ({ onJoinQueue }: { onJoinQueue: () => void }) => (
  <Card className="w-full border-blue-500/50 bg-blue-50">
    <CardHeader className="text-center">
      <CardTitle className="flex items-center justify-center gap-2 text-blue-700">
        <Users className="h-6 w-6" />
        Join Queue
      </CardTitle>
      <CardDescription className="text-blue-600">
        You are not in the queue yet. Please join the queue to wait for your
        reservation.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-blue-700 text-center">
        Once you join the queue, you will be notified when it&apos;s your turn.
      </p>
      <div className="flex justify-center">
        <Button
          onClick={onJoinQueue}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
        >
          Join Queue
        </Button>
      </div>
    </CardContent>
  </Card>
);

const QueueDisplay = ({ queueData }: { queueData: QueueStatus }) => {
  const progressPercentage =
    queueData.position && queueData.totalInQueue
      ? ((queueData.totalInQueue - queueData.position) /
          queueData.totalInQueue) *
        100
      : 0;

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Users className="h-6 w-6 text-blue-500" />
          You&apos;re in the Queue
        </CardTitle>
        <CardDescription>{queueData.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Circle */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-current text-gray-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="2"
              />
              <path
                className="stroke-current text-blue-500 transition-all duration-1000 ease-in-out"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="2"
                strokeDasharray={`${progressPercentage}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {queueData.position || "—"}
                </div>
                <div className="text-xs text-muted-foreground">Position</div>
              </div>
            </div>
          </div>
        </div>

        {/* Queue Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total in Queue</p>
            <p className="text-2xl font-bold">
              {queueData.totalInQueue || "—"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Estimated Wait</p>
            <p className="text-2xl font-bold">
              {queueData.estimatedWaitMinutes
                ? `${queueData.estimatedWaitMinutes} min`
                : "—"}
            </p>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Real-time queue data • Updates every 10 seconds
        </div>
      </CardContent>
    </Card>
  );
};

const AllowedCard = () => (
  <Card className="w-full border-green-500/50 bg-green-50">
    <CardHeader className="text-center">
      <CardTitle className="flex items-center justify-center gap-2 text-green-700">
        <CheckCircle className="h-6 w-6" />
        Access Granted!
      </CardTitle>
      <CardDescription className="text-green-600">
        You have been granted access to make your reservation
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-green-700 text-center mb-4">
        Redirecting you to the branch selection page...
      </p>
      <div className="flex justify-center">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </CardContent>
  </Card>
);

export const WaitingRoom = () => {
  const router = useRouter();

  // Use TanStack Query to manage queue status with safe polling interval
  const {
    data: queueStatus,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<QueueStatus>({
    queryKey: ["queueStatus"],
    queryFn: checkQueueStatus, // Use GET method for checking status
    refetchInterval: (data) => {
      // Smart polling: adjust interval based on status
      if (data && "status" in data) {
        if (data.status === "allowed") return false; // Stop polling when allowed
        if (data.status === "rate_limited") return 30000; // Wait 30s if rate limited
      }
      return 10000; // Default 10s interval (safer than 5s)
    },
    refetchIntervalInBackground: true,
    retry: (failureCount, error: unknown) => {
      // Don't retry on rate limit errors immediately
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
        return failureCount < 1; // Only retry once for rate limits
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex, error) => {
      // Longer delay for rate limit errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
        return Math.min(1000 * 2 ** attemptIndex, 60000); // Up to 1 minute
      }
      return Math.min(1000 * 2 ** attemptIndex, 30000);
    },
  });

  // Function to handle joining queue
  const handleJoinQueue = async () => {
    try {
      const result = await joinQueue();
      if (result.status === "waiting") {
        // Refetch to get updated queue status
        refetch();
      }
    } catch (error) {
      console.error("Error joining queue:", error);
    }
  };

  // Auto-redirect when allowed - solving the flow completion
  useEffect(() => {
    if (queueStatus?.status === "allowed") {
      // Small delay to show the success message
      const timer = setTimeout(() => {
        router.push("/select-branch");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [queueStatus?.status, router]);

  // Loading state
  if (isLoading) {
    return <QueueLoadingSkeleton />;
  }

  // Error state with retry capability
  if (isError) {
    return <ErrorCard onRetry={() => refetch()} error={error as Error} />;
  }

  // Handle different queue states
  switch (queueStatus?.status) {
    case "allowed":
      return <AllowedCard />;

    case "rate_limited":
      return (
        <RateLimitedCard
          message={
            (queueStatus as QueueStatus).message || "Rate limit exceeded"
          }
        />
      );

    case "waiting":
      // If user has position, show queue display
      if (queueStatus.position) {
        return <QueueDisplay queueData={queueStatus} />;
      }
      // If no position, show join queue card
      return <JoinQueueCard onJoinQueue={handleJoinQueue} />;

    default:
      // Default case - show join queue card
      return <JoinQueueCard onJoinQueue={handleJoinQueue} />;
  }
};
