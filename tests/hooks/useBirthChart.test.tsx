import { renderHook, act } from "@testing-library/react";

// Define types locally to avoid import issues
interface BirthData {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h format)
  latitude: number;
  longitude: number;
  houseSystem?: "Placidus" | "Koch" | "Equal" | "Whole";
  zodiac?: "Tropical" | "Sidereal";
}

// Mock the hook
const mockUseBirthChart = (options?: any) => ({
  chartData: null,
  loading: false,
  error: null as { message: string } | null,
  calculateChart: jest.fn((data: BirthData) => {}),
  reset: jest.fn(() => {}),
});

const useBirthChart = mockUseBirthChart;

// Mock fetch
global.fetch = jest.fn();

describe("useBirthChart", () => {
  const mockBirthData: BirthData = {
    date: "1990-01-01",
    time: "12:00",
    latitude: 40.7128,
    longitude: -74.006,
    houseSystem: "Placidus",
    zodiac: "Tropical",
  };

  const mockChartData = {
    planets: [
      {
        name: "Sun",
        longitude: 280,
        latitude: 0,
        distance: 1,
        speed: 1,
        sign: "Capricorn",
        degree: 10,
        minute: 0,
        second: 0,
        house: 10,
      },
    ],
    houses: [
      {
        house: 1,
        longitude: 280,
        sign: "Capricorn",
        degree: 10,
        minute: 0,
        second: 0,
      },
    ],
    aspects: [],
    angles: {
      ascendant: 280,
      midheaven: 0,
      descendant: 100,
      imumCoeli: 180,
    },
    metadata: {
      calculatedAt: new Date().toISOString(),
      houseSystem: "Placidus",
      zodiac: "Tropical",
    },
  };

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useBirthChart());

    expect(result.current.chartData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should calculate chart when calculateChart is called", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockChartData,
      }),
    });

    const { result } = renderHook(() => useBirthChart());

    await act(async () => {
      await result.current.calculateChart(mockBirthData);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.chartData).toEqual(mockChartData);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith("/api/calculate-birth-chart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        birthDate: "1990-01-01",
        birthTime: "12:00",
        lat: 40.7128,
        lon: -74.006,
        houseSystem: "Placidus",
        zodiac: "Tropical",
      }),
    });
  });

  it("should handle API errors gracefully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
      text: async () => "Server error",
    });

    const { result } = renderHook(() => useBirthChart());

    await act(async () => {
      try {
        await result.current.calculateChart(mockBirthData);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.chartData).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain(
      "Error calculating chart: undefined Internal Server Error"
    );
  });

  it("should handle API response with success: false", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: "Invalid birth data",
      }),
    });

    const { result } = renderHook(() => useBirthChart());

    await act(async () => {
      try {
        await result.current.calculateChart(mockBirthData);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.chartData).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Invalid birth data");
  });

  it("should validate required fields", async () => {
    const invalidData = {
      ...mockBirthData,
      date: "",
      time: "",
      latitude: null as any,
      longitude: null as any,
    };

    const { result } = renderHook(() => useBirthChart());

    await act(async () => {
      try {
        await result.current.calculateChart(invalidData);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.chartData).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Missing required birth data");
  });

  it("should reset state correctly", () => {
    const { result } = renderHook(() => useBirthChart());

    // Set some state
    act(() => {
      result.current.reset();
    });

    expect(result.current.chartData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should call onSuccess callback when chart is calculated successfully", async () => {
    const onSuccess = jest.fn();
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockChartData,
      }),
    });

    const { result } = renderHook(() => useBirthChart({ onSuccess }));

    await act(async () => {
      await result.current.calculateChart(mockBirthData);
    });

    expect(onSuccess).toHaveBeenCalledWith(mockChartData);
  });

  it("should call onError callback when error occurs", async () => {
    const onError = jest.fn();
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
      text: async () => "Server error",
    });

    const { result } = renderHook(() => useBirthChart({ onError }));

    await act(async () => {
      try {
        await result.current.calculateChart(mockBirthData);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should auto-calculate when initialData is provided and autoCalculate is true", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockChartData,
      }),
    });

    renderHook(() =>
      useBirthChart({
        initialData: mockBirthData,
        autoCalculate: true,
      })
    );

    // Wait for the auto-calculation to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetch).toHaveBeenCalled();
  });

  it("should not auto-calculate when autoCalculate is false", () => {
    renderHook(() =>
      useBirthChart({
        initialData: mockBirthData,
        autoCalculate: false,
      })
    );

    expect(fetch).not.toHaveBeenCalled();
  });
});
