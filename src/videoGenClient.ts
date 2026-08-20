import { VideoGenClient } from "@videogen/sdk";

const DEFAULT_VIDEOGEN_BASE_URL = "https://api.videogen.io";

/** Plugin config resolved from the OpenClaw config schema (see `index.ts`). */
export type VideoGenPluginConfig = {
  apiKey?: string;
  baseUrl?: string;
};

/**
 * Resolves the VideoGen API key. An explicit plugin-config value wins, then the
 * `VIDEOGEN_API_KEY` environment variable (the same variable the manifest's
 * setup flow populates). Returns `undefined` when nothing is configured so the
 * caller can surface a friendly setup error.
 */
export function resolveApiKey(config: VideoGenPluginConfig): string | undefined {
  const fromConfig = config.apiKey?.trim();

  if (fromConfig != null && fromConfig !== "") {
    return fromConfig;
  }

  const fromEnv = process.env.VIDEOGEN_API_KEY?.trim();

  if (fromEnv != null && fromEnv !== "") {
    return fromEnv;
  }

  return undefined;
}

/**
 * Resolves the VideoGen API base URL. An explicit plugin-config value wins, then
 * `VIDEOGEN_BASE_URL`, then the public production API. Trailing slashes are
 * stripped so request paths are joined consistently.
 */
export function resolveBaseUrl(config: VideoGenPluginConfig): string {
  const fromConfig = config.baseUrl?.trim();

  if (fromConfig != null && fromConfig !== "") {
    return fromConfig.replace(/\/+$/u, "");
  }

  const fromEnv = process.env.VIDEOGEN_BASE_URL?.trim();

  if (fromEnv != null && fromEnv !== "") {
    return fromEnv.replace(/\/+$/u, "");
  }

  return DEFAULT_VIDEOGEN_BASE_URL;
}

const clientCache = new Map<string, VideoGenClient>();

/**
 * Returns a `VideoGenClient` for the resolved credentials, memoized by
 * key + base URL so repeated tool calls in a session reuse one client. Throws a
 * setup error (surfaced to the model) when no API key is configured.
 */
export function getVideoGenClient(config: VideoGenPluginConfig): VideoGenClient {
  const apiKey = resolveApiKey(config);

  if (apiKey == null) {
    throw new Error(
      "VideoGen API key is not configured. Set the VIDEOGEN_API_KEY environment variable (or the plugin's apiKey config). Create a key at https://app.videogen.io/api.",
    );
  }

  const baseUrl = resolveBaseUrl(config);
  const cacheKey = `${baseUrl}\u0000${apiKey}`;

  const cached = clientCache.get(cacheKey);

  if (cached != null) {
    return cached;
  }

  const client = new VideoGenClient({ token: apiKey, baseUrl, clientId: "openclaw" });
  clientCache.set(cacheKey, client);

  return client;
}
