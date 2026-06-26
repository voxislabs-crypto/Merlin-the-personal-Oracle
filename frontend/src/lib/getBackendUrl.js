import { trackedFetch } from "../utils/requestTracker.js";

let cachedBackendUrl = null;

export async function getBackendUrl() {
  // Check global injected by backend first
  if (window.__VOXIS_BACKEND_URL__) {
    return window.__VOXIS_BACKEND_URL__;
  }

  if (cachedBackendUrl) {
    return cachedBackendUrl;
  }

  try {
    const res = await trackedFetch("/ports.json", {}, { cause: "getBackendUrl:ports" });
    if (!res.ok) {
      throw new Error("Cannot find backend port config");
    }

    const data = await res.json();
    cachedBackendUrl = `http://localhost:${data.backend}`;
    return cachedBackendUrl;
  } catch (error) {
    console.error("[getBackendUrl] Failed to fetch port config:", error);
    // Fallback to default port
    return "http://localhost:3101";
  }
}

export function clearBackendUrlCache() {
  cachedBackendUrl = null;
}
