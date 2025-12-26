// lib/astrology/utils.ts
import { utc_to_jd, constants } from "sweph";

// Utility functions to reduce code duplication

export const dateToJulianDay = (date: Date): number => {
  return utc_to_jd(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    constants.SE_GREG_CAL
  ).data[0];
};

export const createAsyncCalculation = <T>(
  calculation: () => Promise<T> | T,
  timeout: number = 5000
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Calculation timeout"));
    }, timeout);

    try {
      const result = calculation();
      if (result instanceof Promise) {
        result
          .then(resolve)
          .catch(reject)
          .finally(() => clearTimeout(timer));
      } else {
        clearTimeout(timer);
        resolve(result);
      }
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
};

export const validateCoordinates = (lat: number, lon: number): boolean => {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

export const validateBirthData = (date: string, time: string): boolean => {
  // Validate date format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  // Validate time format HH:MM
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(time)) return false;

  // Validate actual date values
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  const dateObj = new Date(year, month - 1, day, hour, minute);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day &&
    dateObj.getHours() === hour &&
    dateObj.getMinutes() === minute
  );
};

export const getLoadingMessage = (calculationType: string): string => {
  const messages: Record<string, string> = {
    birthChart: "Calculating your birth chart...",
    aspects: "Analyzing planetary aspects...",
    houses: "Calculating house positions...",
    transits: "Computing current transits...",
    progressions: "Calculating progressed chart...",
    electional: "Finding favorable dates...",
    midpoints: "Computing planetary midpoints...",
    fixedStars: "Analyzing fixed star influences...",
  };

  return messages[calculationType] || "Calculating...";
};

export const formatInterpretation = (
  type: string,
  planet: string,
  sign: string,
  quality: number
): string => {
  const templates: Record<string, string> = {
    dignity: `${planet} in ${sign} shows ${
      quality > 50 ? "strong" : "challenging"
    } expression`,
    aspect: `The ${type} aspect creates ${
      quality > 70 ? "harmonious" : "tense"
    } energy`,
    house: `${planet} in the ${sign} house focuses on ${
      quality > 60 ? "growth" : "lessons"
    }`,
    transit: `Current transit brings ${
      quality > 65 ? "opportunity" : "challenge"
    } for ${planet} themes`,
  };

  return (
    templates[type] || `${planet} in ${sign} creates significant influence`
  );
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Responsive design utilities
export const getBreakpoint = (width: number): string => {
  if (width < 640) return "mobile";
  if (width < 768) return "tablet";
  if (width < 1024) return "desktop";
  return "large";
};

export const getChartSize = (breakpoint: string): number => {
  const sizes: Record<string, number> = {
    mobile: 300,
    tablet: 400,
    desktop: 500,
    large: 600,
  };
  return sizes[breakpoint] || 400;
};

// Error handling utilities
export class AstrologyCalculationError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = "AstrologyCalculationError";
  }
}

export const handleCalculationError = (
  error: unknown
): AstrologyCalculationError => {
  if (error instanceof AstrologyCalculationError) {
    return error;
  }

  if (error instanceof Error) {
    return new AstrologyCalculationError(error.message, "CALCULATION_ERROR", {
      originalError: error.name,
    });
  }

  return new AstrologyCalculationError(
    "An unknown error occurred during calculation",
    "UNKNOWN_ERROR"
  );
};
