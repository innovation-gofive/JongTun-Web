// Simple logger utility for development
export const logger = {
  log: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Jong Tun] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[Jong Tun Error] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[Jong Tun Warning] ${message}`, ...args);
    }
  },
};
