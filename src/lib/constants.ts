// Constants for the application
export const CONSTANTS = {
  // API Configuration
  API_DELAY: 800, // ms
  API_FAILURE_RATE: 0.3, // 30% chance of failure for testing

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

  // Branch Configuration
  BRANCH_CAPACITY: {
    DOWNTOWN: 50,
    RIVERSIDE: 30,
    UPTOWN: 40,
    SUBURBAN: 25,
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
