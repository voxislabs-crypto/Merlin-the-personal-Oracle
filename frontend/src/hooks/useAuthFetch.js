import { useCallback } from "react";
import { useAuth } from "@clerk/react";
import { trackedFetch } from "../utils/requestTracker.js";

export function useAuthFetch() {
  const { getToken } = useAuth();

  return useCallback(
    async (url, options = {}) => {
      const token = await getToken();
      const headers = {
        ...(options.headers || {}),
      };
      const cause = String(options.__voxisCause || `authFetch:${url}`).trim();

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      return trackedFetch(url, {
        ...options,
        headers,
      }, {
        cause,
        transport: "auth-fetch",
      });
    },
    [getToken],
  );
}
