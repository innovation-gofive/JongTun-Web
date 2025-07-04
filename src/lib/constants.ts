// Constants for the application
export const CONSTANTS = {
  // API Configuration
  API_DELAY: 500, // ms - Reduced for better performance
  API_FAILURE_RATE: 0.1, // 10% chance of failure for testing (reduced from 30%)

  // Query Configuration
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_BASE: 1000, // ms
  RETRY_DELAY_MAX: 30000, // ms

  // Product Configuration
  DEFAULT_QUANTITY: 1,
  STOCK_RANGE: {
    A4_PAPER: { min: 10, max: 59 },
    CONTINUOUS_PAPER: { min: 5, max: 34 },
  },

  // Branch Configuration - Increased capacity for 5,000 users
  BRANCH_CAPACITY: {
    DOWNTOWN: 150,
    RIVERSIDE: 100,
    UPTOWN: 120,
    SUBURBAN: 80,
  },

  // Cache Configuration
  CACHE_TIMES: {
    PRODUCTS: 2 * 60 * 1000, // 2 minutes
    BRANCHES: 5 * 60 * 1000, // 5 minutes
    GC_TIME: 10 * 60 * 1000, // 10 minutes
  },

  // Reservation Configuration
  RESERVATION_HOLD_TIME: 24, // hours
  RESERVATION_ID_PREFIX: "GCP-",

  // Queue Configuration - For 5,000 concurrent users
  QUEUE: {
    MAX_SIZE: 5000,
    RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
    RATE_LIMIT_MAX_REQUESTS: 50, // Higher limit for high load
    PROCESSING_BATCH_SIZE: 10, // Process 10 users at a time
    POLL_INTERVAL: 5000, // 5 seconds between polls
  },
} as const;

// Product types
export const PRODUCT_TYPES = {
  A4_GOLD: "a4-gold",
  CONTINUOUS_GOLD: "continuous-gold",
} as const;

// Branch types
export const BRANCH_IDS = {
  DOWNTOWN: "1",
  RIVERSIDE: "2",
  UPTOWN: "3",
  SUBURBAN: "4",
} as const;
