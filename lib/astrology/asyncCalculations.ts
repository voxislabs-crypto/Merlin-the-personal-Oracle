// lib/astrology/asyncCalculations.ts
import {
  createAsyncCalculation,
  getLoadingMessage,
  handleCalculationError,
} from "./utils";
import { calculateBirthChart } from "../engine";
import { BirthChartData } from "@/types/astrology";

export interface CalculationProgress {
  stage: string;
  progress: number;
  message: string;
}

export interface AsyncCalculationResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  progress: CalculationProgress | null;
}

export class AsyncBirthChartCalculator {
  private abortController: AbortController | null = null;

  async calculateBirthChart(
    birthData: {
      date: Date;
      time?: string;
      lat?: number;
      lon?: number;
    },
    onProgress?: (progress: CalculationProgress) => void
  ): Promise<AsyncCalculationResult<BirthChartData>> {
    this.abortController = new AbortController();

    try {
      const stages = [
        {
          stage: "validation",
          progress: 10,
          message: "Validating birth data...",
        },
        { stage: "julian", progress: 20, message: "Calculating Julian Day..." },
        {
          stage: "planets",
          progress: 40,
          message: "Computing planetary positions...",
        },
        {
          stage: "houses",
          progress: 60,
          message: "Calculating house positions...",
        },
        { stage: "aspects", progress: 80, message: "Analyzing aspects..." },
        {
          stage: "advanced",
          progress: 95,
          message: "Computing advanced features...",
        },
        {
          stage: "complete",
          progress: 100,
          message: "Chart calculation complete!",
        },
      ];

      const result = await createAsyncCalculation(async () => {
        for (const stage of stages) {
          if (this.abortController?.signal.aborted) {
            throw new Error("Calculation cancelled");
          }

          onProgress?.(stage);

          // Simulate processing time for demonstration
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        return calculateBirthChart(
          birthData.date.toISOString().split("T")[0],
          birthData.time,
          birthData.lat,
          birthData.lon
        );
      }, 10000);

      return {
        data: result,
        loading: false,
        error: null,
        progress: null,
      };
    } catch (error) {
      const calcError = handleCalculationError(error);
      return {
        data: null,
        loading: false,
        error: calcError.message,
        progress: null,
      };
    }
  }

  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
  }
}

// Utility function for creating async calculation hooks
export const createAsyncCalculationHook = <T>(
  calculation: () => Promise<T>,
  dependencies: any[] = []
) => {
  return {
    execute: async (): Promise<AsyncCalculationResult<T>> => {
      try {
        const result = await createAsyncCalculation(calculation);
        return {
          data: result,
          loading: false,
          error: null,
          progress: null,
        };
      } catch (error) {
        const calcError = handleCalculationError(error);
        return {
          data: null,
          loading: false,
          error: calcError.message,
          progress: null,
        };
      }
    },
  };
};
