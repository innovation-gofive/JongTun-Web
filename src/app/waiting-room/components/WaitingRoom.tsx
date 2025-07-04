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
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Clock,
  Users,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useQueueStore } from "@/store/useQueueStore";

export function WaitingRoom() {
  const router = useRouter();
  const {
    queue,
    checkQueueStatus,
    isAllowed,
    hasError,
    clearError,
    getTimeInQueue,
    isInQueue,
  } = useQueueStore();
  const [mounted, setMounted] = useState(false);

  // Wait for hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-refresh queue status (เพิ่มความถี่สำหรับ Self-Service)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isInQueue()) {
        checkQueueStatus();
      }
    }, 5000); // Check every 5 seconds (เร็วขึ้นเพราะระบบ auto-process)

    return () => clearInterval(interval);
  }, [checkQueueStatus, isInQueue]);

  // Check status on mount
  useEffect(() => {
    checkQueueStatus();
  }, [checkQueueStatus]);

  // Redirect if allowed with delay to show success message
  useEffect(() => {
    if (isAllowed()) {
      const timer = setTimeout(() => {
        router.push("/select-product");
      }, 1500); // 1.5 second delay to show the success message

      return () => clearTimeout(timer);
    }
  }, [queue.status, router, isAllowed]);

  const handleRefresh = () => {
    clearError();
    checkQueueStatus();
  };

  const handleGoHome = () => {
    router.push("/");
  };

  // Show loading state
  if (queue.status === "idle" || queue.status === "joining") {
    return (
      <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (hasError()) {
    return (
      <Card className="border-red-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Queue Service Error
          </CardTitle>
          <CardDescription>
            There was an issue connecting to the queue service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-700 text-sm">{queue.error}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleGoHome} variant="default" className="flex-1">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show allowed state (brief moment before redirect)
  if (isAllowed()) {
    // Immediate redirect when allowed
    setTimeout(() => {
      router.push("/select-product");
    }, 1000); // 1 second delay to show the success message

    return (
      <Card className="border-green-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Access Granted!
          </CardTitle>
          <CardDescription>
            You are now allowed to proceed with your reservation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 text-sm">
              Redirecting to product selection...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show waiting state
  return (
    <Card className="border-blue-200 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <Clock className="h-5 w-5" />
          You&apos;re in the Queue
        </CardTitle>
        <CardDescription>
          🤖 Auto-processing active! You&apos;ll be automatically moved forward
          every 30 seconds. No need to wait for staff assistance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Queue Position */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="font-medium">Position</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {queue.position || "..."}
            </div>
            <div className="text-xs text-blue-600">
              of {queue.totalInQueue || "..."} people
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Est. Wait</span>
            </div>
            <div className="text-2xl font-bold text-indigo-900">
              {queue.estimatedWaitMinutes || "..."}
            </div>
            <div className="text-xs text-indigo-600">minutes</div>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Time Elapsed</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {getTimeInQueue()}
            </div>
            <div className="text-xs text-purple-600">minutes</div>
          </div>
        </div>

        {/* Status Message */}
        {queue.message && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-700 text-sm">{queue.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="flex-1">
            Leave Queue
          </Button>
        </div>

        {/* Last Updated */}
        {mounted && (
          <div className="text-xs text-gray-500 text-center">
            Last updated:{" "}
            {queue.lastUpdated
              ? new Date(queue.lastUpdated).toLocaleTimeString()
              : "Never"}
          </div>
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === "development" && mounted && (
          <div className="text-xs text-gray-500 p-2 bg-gray-900/50 rounded">
            Debug: Status={queue.status} | Position=
            {queue.position || "N/A"} | Total={queue.totalInQueue || "N/A"} |
            UserId={queue.userId || "N/A"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
