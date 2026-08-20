import { Type } from "typebox";

/**
 * Plugin configuration. Both fields are optional: the API key falls back to the
 * `VIDEOGEN_API_KEY` environment variable (populated by the manifest setup
 * flow), and the base URL falls back to `VIDEOGEN_BASE_URL` or the public API.
 */
export const CONFIG_SCHEMA = Type.Object({
  apiKey: Type.Optional(
    Type.String({
      description:
        "VideoGen API key (sk_videogen_live_...). Falls back to the VIDEOGEN_API_KEY environment variable. Create one at https://app.videogen.io/api.",
    }),
  ),
  baseUrl: Type.Optional(
    Type.String({
      description:
        "Override the VideoGen API base URL. Falls back to VIDEOGEN_BASE_URL, then https://api.videogen.io.",
    }),
  ),
});
