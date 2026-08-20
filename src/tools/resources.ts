import { Type } from "typebox";

import { sdkRequest } from "../operations";
import { cursorField, limitField } from "../schemas";
import type { DefinedTool, ToolFactory } from "../toolTypes";
import { getVideoGenClient } from "../videoGenClient";

const catalogueQueryField = Type.Optional(
  Type.String({
    description:
      "Optional case-insensitive substring filter across each item's searchable text fields.",
  }),
);

export function buildResourceTools(tool: ToolFactory): DefinedTool[] {
  return [
    tool({
      name: "list_tts_voices",
      label: "List text-to-speech voices",
      description:
        "List available text-to-speech voices for narration, text_to_speech, and workflows.",
      parameters: Type.Object({
        cursor: cursorField,
        limit: limitField,
        includeDeprecatedVoices: Type.Optional(
          Type.Boolean({ description: "Include deprecated voices in the results." }),
        ),
        query: catalogueQueryField,
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.resources.listTtsVoices(sdkRequest(params));
      },
    }),

    tool({
      name: "list_languages",
      label: "List languages",
      description: "List supported languages for narration and captions.",
      parameters: Type.Object({
        query: catalogueQueryField,
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.resources.listLanguages(sdkRequest(params));
      },
    }),
  ];
}
