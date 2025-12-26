"use client";

import React, { useState, useEffect } from "react";
import { calculateBirthChart } from "@/lib/engine-fallback";
import { BirthChartData } from "@/types/astrology";
import { GeocodingService, GeocodingResult } from "@/lib/astrology/geocoding";

interface BirthData {
  date: string;
  time: string;
  city: string;
  state: string;
}

export default function AstroCalculator() {
  const [birthData, setBirthData] = useState<BirthData>({
    date: "",
    time: "",
    city: "",
    state: "",
  });

  const [chartData, setChartData] = useState<BirthChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<GeocodingResult[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<GeocodingResult | null>(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Search for locations when query changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (locationQuery.length >= 2) {
        searchLocations(locationQuery);
      } else {
        setLocationResults([]);
        setShowLocationDropdown(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [locationQuery]);

  const searchLocations = async (query: string) => {
    setLocationLoading(true);
    try {
      const results = await GeocodingService.searchLocations(query);
      console.log("Real-world search results:", results);
      setLocationResults(results);
      setShowLocationDropdown(results.length > 0);
    } catch (error) {
      console.error("Location search error:", error);
      setLocationResults([]);
      setShowLocationDropdown(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleLocationSelect = (location: GeocodingResult) => {
    console.log("Location selected:", location);
    setSelectedLocation(location);
    setBirthData((prev) => ({
      ...prev,
      city: location.city,
      state: location.state,
    }));
    setLocationQuery(location.displayName);
    setShowLocationDropdown(false);
  };

  const handleInputChange = (
    field: keyof BirthData,
    value: string | number
  ) => {
    setBirthData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateChart = async () => {
    console.log("calculateChart called", { birthData, selectedLocation });

    if (!birthData.date || !birthData.time || !birthData.city) {
      console.log("Missing required fields:", {
        date: birthData.date,
        time: birthData.time,
        city: birthData.city,
      });
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get coordinates from selected location or validate city/state
      let latitude = 0;
      let longitude = 0;

      console.log("Getting coordinates...");

      if (selectedLocation) {
        latitude = selectedLocation.latitude;
        longitude = selectedLocation.longitude;
        console.log("Using selected location:", { latitude, longitude });
      } else {
        const location = await GeocodingService.validateLocation(
          birthData.city,
          birthData.state
        );
        console.log("Validated location:", location);
        if (!location) {
          setError(
            "Invalid location. Please select from the dropdown or try a more specific search."
          );
          return;
        }
        latitude = location.latitude;
        longitude = location.longitude;
        setSelectedLocation(location);
      }

      console.log("Calling calculateBirthChart with:", {
        birthData,
        latitude,
        longitude,
      });
      const result = await calculateBirthChart(
        birthData.date,
        birthData.time,
        latitude,
        longitude
      );
      console.log("Chart calculated successfully:", result);
      setChartData(result);
    } catch (err) {
      console.error("Error calculating chart:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (chartData) {
      navigator.clipboard.writeText(JSON.stringify(chartData, null, 2));
    }
  };

  const clearData = () => {
    setBirthData({
      date: "",
      time: "",
      city: "",
      state: "",
    });
    setChartData(null);
    setError(null);
    setSelectedLocation(null);
    setLocationQuery("");
    setShowLocationDropdown(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Astrology Calculator
        </h1>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Birth Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={birthData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Time (HH:MM)
              </label>
              <input
                type="time"
                value={birthData.time}
                onChange={(e) => handleInputChange("time", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Location (Real-world search)
              </label>
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                onFocus={() => setShowLocationDropdown(true)}
                placeholder="Start typing any city name worldwide..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {locationLoading && (
                <div className="absolute right-2 top-9">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Location Dropdown */}
              {showLocationDropdown && locationResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {locationResults.map((location, index) => (
                    <div
                      key={index}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleLocationSelect(location);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {location.displayName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Lat: {location.latitude.toFixed(4)}, Lon:{" "}
                        {location.longitude.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Province (Optional - helps with accuracy)
              </label>
              <input
                type="text"
                value={birthData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="e.g., NY, CA, Texas, Bavaria"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Selected Location Display */}
          {selectedLocation && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-green-800">
                    Selected Location:
                  </span>
                  <span className="ml-2 text-sm text-green-700">
                    {selectedLocation.displayName}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedLocation(null);
                    setLocationQuery("");
                    setBirthData((prev) => ({ ...prev, city: "", state: "" }));
                  }}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-4">
            <button
              onClick={calculateChart}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Calculating..." : "Calculate Chart"}
            </button>

            <button
              onClick={clearData}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Results Display */}
        {chartData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Raw Chart Data</h2>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Copy to Clipboard
              </button>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(chartData, null, 2)}
              </pre>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Planetary Positions
                </h3>
                <p className="text-blue-700">
                  {chartData.positions.length} planets calculated
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-semibold text-green-900 mb-2">
                  House Positions
                </h3>
                <p className="text-green-700">
                  {chartData.houses.length} houses calculated
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded">
                <h3 className="font-semibold text-purple-900 mb-2">Aspects</h3>
                <p className="text-purple-700">
                  {chartData.aspects.length} aspects found
                </p>
              </div>
            </div>

            {/* Quick Reference */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3">Quick Reference</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Planets</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {chartData.positions.map((planet, index) => (
                      <li key={index}>
                        {planet.name}: {planet.sign} {planet.degree}°
                        {planet.minute}' ({planet.longitude.toFixed(2)}°)
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Houses</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {chartData.houses.map((house, index) => (
                      <li key={index}>
                        House {house.house}: {house.sign} {house.degree}°
                        {house.minute}' ({house.longitude?.toFixed(2)}°)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
