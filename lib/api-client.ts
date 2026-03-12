export function resolveApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "")
    .trim()
    .replace(/\/$/, "");

  return configuredBaseUrl ? `${configuredBaseUrl}${normalizedPath}` : normalizedPath;
}

export async function readJsonResponse<T>(
  response: Response,
  context: string
): Promise<T> {
  const responseText = await response.text();
  const contentType = response.headers.get("content-type") || "unknown";

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(
      `${context} returned non-JSON content (${contentType}). ${responseText
        .slice(0, 160)
        .trim()}`
    );
  }
}