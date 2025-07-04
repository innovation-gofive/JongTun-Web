"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useReservationStore } from "@/store/useReservationStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, Plus, Minus, RefreshCw } from "lucide-react";
import { logger } from "@/lib/logger";
import { CONSTANTS, PRODUCT_TYPES } from "@/lib/constants";
import Image from "next/image";

// Product interface
interface Product {
  id: string;
  name: string;
  description: string;
  unit: string;
  stock: number;
  maxPerOrder: number;
  icon: string;
}

// Mock API function - simulates external product API
const fetchProducts = async (): Promise<Product[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, CONSTANTS.API_DELAY));

  // Simulate random API failures for testing resilience
  if (Math.random() < CONSTANTS.API_FAILURE_RATE) {
    throw new Error(
      "Product service temporarily unavailable. Please try again."
    );
  }

  return [
    {
      id: PRODUCT_TYPES.A4_GOLD,
      name: "A4 Gold-Coated Paper",
      description:
        "Premium A4 paper with luxurious gold coating finish. Perfect for certificates, invitations, and special documents.",
      unit: "ream",
      stock:
        Math.floor(
          Math.random() *
            (CONSTANTS.STOCK_RANGE.A4_PAPER.max -
              CONSTANTS.STOCK_RANGE.A4_PAPER.min +
              1)
        ) + CONSTANTS.STOCK_RANGE.A4_PAPER.min,
      maxPerOrder: 10,
      icon: "/A4.svg",
    },
    {
      id: PRODUCT_TYPES.CONTINUOUS_GOLD,
      name: "Continuous Gold-Coated Paper",
      description:
        "High-quality continuous form paper with gold coating. Ideal for bulk printing and business applications.",
      unit: "box",
      stock:
        Math.floor(
          Math.random() *
            (CONSTANTS.STOCK_RANGE.CONTINUOUS_PAPER.max -
              CONSTANTS.STOCK_RANGE.CONTINUOUS_PAPER.min +
              1)
        ) + CONSTANTS.STOCK_RANGE.CONTINUOUS_PAPER.min,
      maxPerOrder: 5,
      icon: "/Continuous.svg",
    },
  ];
};

// Loading skeleton component
const ProductSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-10" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

// Error card component
const ErrorCard = ({
  onRetry,
  error,
}: {
  onRetry: () => void;
  error: Error;
}) => (
  <Card className="border-red-200 bg-red-50/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-700">
        <AlertTriangle className="h-5 w-5" />
        Service Unavailable
      </CardTitle>
      <CardDescription className="text-red-600">
        {error.message}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Our product service is experiencing issues. Please try again in a
          moment.
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

// Product card component
const ProductCard = ({ product }: { product: Product }) => {
  const router = useRouter();
  const {
    updateProductAndQuantity,
    selectedProductId,
    isProductSelected,
    getCurrentQuantity,
  } = useReservationStore();

  const isInStock = product.stock > 0;
  const maxQuantity = Math.min(product.stock, product.maxPerOrder);
  const isThisProductSelected = isProductSelected(product.id);
  const hasAnySelection = selectedProductId !== null;

  // Get current quantity for this product, or default to 1
  const currentQuantity = isThisProductSelected
    ? getCurrentQuantity()
    : CONSTANTS.DEFAULT_QUANTITY;
  const [localQuantity, setLocalQuantity] = useState(currentQuantity);

  // Update local quantity when product selection changes
  useEffect(() => {
    setLocalQuantity(currentQuantity);
  }, [currentQuantity]);

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= maxQuantity) {
      setLocalQuantity(value);

      // If this product is already selected, update the store immediately
      if (isThisProductSelected) {
        updateProductAndQuantity(product.name, product.id, value);
      }
    }
  };

  const handleSelectProduct = () => {
    logger.log("Selecting product:", {
      productName: product.name,
      quantity: localQuantity,
    });
    updateProductAndQuantity(product.name, product.id, localQuantity);
  };

  const handleChangeProduct = () => {
    logger.log("Changing to product:", {
      productName: product.name,
      quantity: localQuantity,
    });
    updateProductAndQuantity(product.name, product.id, localQuantity);
  };

  const handleProceedToBranch = () => {
    logger.log("Proceeding to branch selection...", {
      action: "navigate_to_branch_selection",
    });
    router.push("/select-branch");
  };

  // Determine the UI state
  const getUIState = () => {
    if (!isInStock) return "out-of-stock";
    if (!hasAnySelection) return "initial"; // No product selected yet
    if (isThisProductSelected) return "selected"; // This product is selected
    return "other-selected"; // Another product is selected
  };

  const uiState = getUIState();

  return (
    <Card className="w-full transition-all hover:shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 flex items-center justify-center">
            <Image
              src={product.icon}
              alt={product.name}
              width={64}
              height={64}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
          <div>
            <div className="text-xl">{product.name}</div>
            <div className="text-sm font-normal text-muted-foreground">
              Unit: {product.unit}
            </div>
          </div>

          {/* Selection Status Badge */}
          {uiState === "selected" && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Selected
            </div>
          )}
          {uiState === "other-selected" && (
            <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
              Not Selected
            </div>
          )}
          {uiState === "initial" && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Available
            </div>
          )}
        </CardTitle>
        <CardDescription className="text-center">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stock Information */}
          <div className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded-lg">
            <span>Stock available:</span>
            <span
              className={`font-medium ${
                isInStock ? "text-green-600" : "text-red-600"
              }`}
            >
              {isInStock ? `${product.stock} ${product.unit}` : "Out of stock"}
            </span>
          </div>

          {/* UI based on state */}
          {uiState === "initial" && (
            <Button
              onClick={handleSelectProduct}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Select This Product
            </Button>
          )}

          {uiState === "selected" && (
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="space-y-3">
                <Label
                  htmlFor={`quantity-${product.id}`}
                  className="block text-center font-medium"
                >
                  Quantity ({product.unit})
                </Label>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(localQuantity - 1)}
                    disabled={localQuantity <= 1}
                    className="w-10 h-10 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id={`quantity-${product.id}`}
                    type="number"
                    value={localQuantity}
                    onChange={(e) =>
                      handleQuantityChange(parseInt(e.target.value) || 1)
                    }
                    min={1}
                    max={maxQuantity}
                    className="w-20 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(localQuantity + 1)}
                    disabled={localQuantity >= maxQuantity}
                    className="w-10 h-10 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Maximum {maxQuantity} {product.unit} per order
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleProceedToBranch}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Branch Selection ({localQuantity} {product.unit})
                </Button>
              </div>
            </div>
          )}

          {uiState === "other-selected" && (
            <div className="space-y-4">
              <Button
                onClick={handleChangeProduct}
                variant="outline"
                className="w-full"
              >
                Select This Product Instead
              </Button>
            </div>
          )}

          {uiState === "out-of-stock" && (
            <Button disabled className="w-full">
              Out of Stock
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ProductList = () => {
  const {
    data: products,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Product[], Error>({
    queryKey: ["products"],
    queryFn: fetchProducts,
    retry: CONSTANTS.RETRY_ATTEMPTS,
    retryDelay: (attemptIndex) =>
      Math.min(
        CONSTANTS.RETRY_DELAY_BASE * 2 ** attemptIndex,
        CONSTANTS.RETRY_DELAY_MAX
      ),
    staleTime: CONSTANTS.CACHE_TIMES.PRODUCTS,
    gcTime: CONSTANTS.CACHE_TIMES.GC_TIME,
  });

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <ProductSkeleton />
          <ProductSkeleton />
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <ErrorCard onRetry={() => refetch()} error={error} />
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {products?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products?.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No products available at the moment. Please try again later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
