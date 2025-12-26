// components/astrology/ResponsiveChart.tsx
"use client";

import React, { useState, useEffect } from "react";
import { getBreakpoint, getChartSize } from "@/lib/astrology/utils";

interface ResponsiveChartProps {
  children: (size: number, breakpoint: string) => React.ReactNode;
  className?: string;
  aspectRatio?: number;
}

export const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  children,
  className = "",
  aspectRatio = 1,
}) => {
  const [dimensions, setDimensions] = useState({
    width: 400,
    height: 400,
    breakpoint: "desktop",
  });

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const breakpoint = getBreakpoint(width);
      const chartSize = getChartSize(breakpoint);
      const height = Math.floor(chartSize / aspectRatio);

      setDimensions({
        width: chartSize,
        height,
        breakpoint,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [aspectRatio]);

  return (
    <div className={`responsive-chart ${className}`}>
      {children(dimensions.width, dimensions.breakpoint)}
      <style jsx>{`
        .responsive-chart {
          width: 100%;
          max-width: ${dimensions.width}px;
          margin: 0 auto;
        }

        @media (max-width: 640px) {
          .responsive-chart {
            padding: 0.5rem;
          }
        }

        @media (min-width: 1024px) {
          .responsive-chart {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Calculating...",
  size = "medium",
}) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
      />
      {message && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse">{message}</p>
      )}
    </div>
  );
};

interface ProgressBarProps {
  progress: number;
  message: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
  showPercentage = true,
}) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-700">{message}</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Calculation Error
          </h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
        <div className="ml-3 flex-shrink-0">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 focus:outline-none"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      {onRetry && (
        <div className="mt-3">
          <button
            onClick={onRetry}
            className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
