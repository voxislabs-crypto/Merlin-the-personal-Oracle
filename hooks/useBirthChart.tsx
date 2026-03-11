import { useState, useCallback, useEffect, useMemo } from "react";
import {
  BirthData,
  BirthChartData,
} from "@/components/astrology/BirthChartCalculator";
import { BirthChart, BirthChartProps } from "@/components/astrology/BirthChart";
import { calculateBirthChartClient } from "@/lib/astrology/client-calculate";

interface UseBirthChartOptions {
  /**
   * Initial birth data to calculate the chart for
   */
  initialData?: Partial<BirthData>;

  /**
   * Whether to automatically calculate the chart when the hook mounts or when initialData changes
   * @default true
   */
  autoCalculate?: boolean;

  /**
   * Callback when the chart is successfully calculated
   */
  onSuccess?: (data: BirthChartData) => void;

  /**
   * Callback when an error occurs during chart calculation
   */
  onError?: (error: Error) => void;
}

export function useBirthChart(options: UseBirthChartOptions = {}) {
  const {
    initialData: initialDataProp = {},
    autoCalculate = true,
    onSuccess,
    onError,
  } = options;

  const [chartData, setChartData] = useState<BirthChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setChartData(null);
    setError(null);
  }, []);

  const calculateChart = useCallback(
    async (data: BirthData): Promise<BirthChartData> => {
      setLoading(true);
      setError(null);

      try {
        // Validate required fields
        if (
          !data.date ||
          !data.time ||
          data.latitude == null ||
          data.longitude == null
        ) {
          throw new Error("Missing required birth data");
        }

        const chartData = await calculateBirthChartClient({
          birthDate: data.date,
          birthTime: data.time,
          latitude: data.latitude,
          longitude: data.longitude,
          houseSystem: data.houseSystem || "Placidus",
          zodiac: data.zodiac || "Tropical",
        });
        setChartData(chartData);
        onSuccess?.(chartData);
        return chartData;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Unknown error occurred");
        setError(error);
        onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  // Auto-calculate if initialData is provided and autoCalculate is true
  useEffect(() => {
    if (
      autoCalculate &&
      initialDataProp?.date &&
      initialDataProp?.time &&
      initialDataProp.latitude != null &&
      initialDataProp.longitude != null
    ) {
      calculateChart(initialDataProp as BirthData).catch(() => {
        // Error is already handled in calculateChart
      });
    }
  }, [autoCalculate, initialDataProp, calculateChart]);

  // Create a memoized version of the BirthChart component with the current state
  const BirthChartComponent = useMemo(() => {
    const WrappedBirthChart = (
      props: Omit<BirthChartProps, "initialData" | "onChartCalculated">
    ) => {
      const handleChartCalculated = useCallback(
        (data: BirthChartData) => {
          setChartData(data);
          onSuccess?.(data);
        },
        [onSuccess]
      );

      return (
        <BirthChart
          {...props}
          initialData={initialDataProp}
          onChartCalculated={handleChartCalculated}
        />
      );
    };

    return WrappedBirthChart;
  }, [initialDataProp, onSuccess]);

  return {
    chartData,
    loading,
    error,
    calculateChart,
    BirthChart: BirthChartComponent,
    reset,
  };
}
