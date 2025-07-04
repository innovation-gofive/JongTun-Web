import { NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/lib/error-handling";
import { logger } from "@/lib/logger";

// Mock inventory database - ในการใช้งานจริงจะเชื่อมกับ database
const mockInventory = {
  "Downtown Branch": {
    "A4 Gold-Coated Paper": 12,
    "Continuous Gold-Coated Paper": 15,
  },
  "Uptown Branch": {
    "A4 Gold-Coated Paper": 8,
    "Continuous Gold-Coated Paper": 0, // Out of stock!
  },
  "Suburban Branch": {
    "A4 Gold-Coated Paper": 15,
    "Continuous Gold-Coated Paper": 15,
  },
  "Riverside Branch": {
    "A4 Gold-Coated Paper": 0, // Out of stock!
    "Continuous Gold-Coated Paper": 0,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchName, productName, quantity, userId } = body;

    logEvent("RESERVATION_ATTEMPT", {
      branchName,
      productName,
      quantity,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Validate input
    if (!branchName || !productName || !quantity || quantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          message: "Missing required fields or invalid quantity",
        },
        { status: 400 }
      );
    }

    // Check stock availability
    const branchInventory =
      mockInventory[branchName as keyof typeof mockInventory];
    if (!branchInventory) {
      return NextResponse.json(
        {
          success: false,
          error: "BRANCH_NOT_FOUND",
          message: "Selected branch is not available",
        },
        { status: 404 }
      );
    }

    const currentStock =
      branchInventory[productName as keyof typeof branchInventory];
    if (currentStock === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "PRODUCT_NOT_FOUND",
          message: "Selected product is not available at this branch",
        },
        { status: 404 }
      );
    }

    // Check if enough stock is available
    if (currentStock < quantity) {
      logEvent("RESERVATION_FAILED_OUT_OF_STOCK", {
        branchName,
        productName,
        requestedQuantity: quantity,
        availableStock: currentStock,
        userId,
      });

      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_STOCK",
          message: `Sorry! Only ${currentStock} units available, but you requested ${quantity} units.`,
          availableStock: currentStock,
          suggestedAction:
            currentStock > 0
              ? `You can reserve up to ${currentStock} units instead.`
              : "This product is currently out of stock at this branch. Please try another branch.",
        },
        { status: 409 }
      );
    }

    // Simulate processing time (real API might check payment, etc.)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate reservation ID
    const reservationId = `RSV-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    // Update inventory (in real app, this would be atomic database operation)
    branchInventory[productName as keyof typeof branchInventory] -= quantity;

    logEvent("RESERVATION_SUCCESS", {
      reservationId,
      branchName,
      productName,
      quantity,
      userId,
      remainingStock:
        branchInventory[productName as keyof typeof branchInventory],
    });

    logger.warn("Reservation confirmed successfully", {
      reservationId,
      branchName,
      productName,
      quantity,
    });

    return NextResponse.json({
      success: true,
      message: "Reservation confirmed successfully!",
      reservation: {
        id: reservationId,
        branchName,
        productName,
        quantity,
        reservedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        status: "confirmed",
      },
      remainingStock:
        branchInventory[productName as keyof typeof branchInventory],
    });
  } catch (error) {
    logEvent("RESERVATION_API_ERROR", {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    logger.warn("Reservation API error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check current stock
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const branchName = url.searchParams.get("branch");
    const productName = url.searchParams.get("product");

    if (!branchName) {
      return NextResponse.json(
        { error: "Branch name is required" },
        { status: 400 }
      );
    }

    const branchInventory =
      mockInventory[branchName as keyof typeof mockInventory];
    if (!branchInventory) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    if (productName) {
      const stock =
        branchInventory[productName as keyof typeof branchInventory];
      return NextResponse.json({
        branchName,
        productName,
        currentStock: stock ?? 0,
        isAvailable: (stock ?? 0) > 0,
      });
    }

    // Return all products for the branch
    return NextResponse.json({
      branchName,
      inventory: branchInventory,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stock information" },
      { status: 500 }
    );
  }
}
