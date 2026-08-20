import { Type, type TSchema } from "typebox";

/**
 * Loose object/array schemas for large SDK request unions (remix actions,
 * caption styles, storyboard scenes, pronunciation replacements) we do not
 * re-model field by field. They advertise a permissive JSON Schema for the wire
 * format; the VideoGen API validates the real shape. Mirrors the VideoGen MCP
 * server's `sdkFieldSchema` approach.
 */
export const looseObject = (): TSchema => Type.Record(Type.String(), Type.Unknown());

export const looseObjectArray = (description: string): TSchema =>
  Type.Array(looseObject(), { description });

/** Control fields shared by composite (start + poll) tools. Spread into a tool's parameter object. */
export const pollControlProperties = {
  wait: Type.Optional(
    Type.Boolean({
      description:
        "Whether to block until the operation reaches a terminal state (succeeded/failed/cancelled). Defaults to true. Set false to return immediately with the run/execution id.",
    }),
  ),
  pollIntervalMs: Type.Optional(
    Type.Integer({ minimum: 1, description: "How often to poll while waiting, in milliseconds." }),
  ),
  timeoutMs: Type.Optional(
    Type.Integer({
      minimum: 1,
      description: "Maximum time to wait for a terminal state before giving up, in milliseconds.",
    }),
  ),
};

export const cursorField = Type.Optional(
  Type.String({ description: "Pagination cursor from a previous response's `nextCursor`." }),
);

export const limitField = Type.Optional(
  Type.Integer({ minimum: 1, maximum: 100, description: "Maximum number of items to return." }),
);

export const selfOnlyField = Type.Optional(
  Type.Boolean({
    description:
      "When true, restrict results to items created by the API key owner rather than the whole team.",
  }),
);

export const aspectRatioSchema = Type.Object(
  {
    width: Type.Number({ minimum: 0, description: "Aspect-ratio width (e.g. 16 for 16:9)." }),
    height: Type.Number({ minimum: 0, description: "Aspect-ratio height (e.g. 9 for 16:9)." }),
  },
  { description: "Output aspect ratio as a width:height pair (e.g. { width: 16, height: 9 })." },
);

export const visualStyleSchema = Type.Object(
  {
    type: Type.Union([Type.Literal("STOCK"), Type.Literal("AI_IMAGE"), Type.Literal("ENTITY")], {
      description:
        "STOCK pulls stock footage/images; AI_IMAGE generates a styled image per section; ENTITY matches a visual-style entity's reference images.",
    }),
    aiStyle: Type.Optional(
      Type.String({
        description:
          "Required when type is AI_IMAGE: free-form description of the look for every image.",
      }),
    ),
    entityId: Type.Optional(
      Type.String({
        description: "Required when type is ENTITY: id of a VISUAL_STYLE entity (vg_enti_...).",
      }),
    ),
    restyleFeaturedBRollWithAiStyle: Type.Optional(
      Type.Boolean({
        description:
          "When true (AI_IMAGE only), re-render featured b-roll images in the chosen style.",
      }),
    ),
  },
  { description: "Visual style for the generated b-roll." },
);

export const visualPacingSchema = Type.Union(
  [Type.Literal("FAST"), Type.Literal("MEDIUM"), Type.Literal("SLOW")],
  { description: "How quickly visuals change. Defaults to MEDIUM." },
);

export const imageQualitySchema = Type.Union(
  [Type.Literal("LOW"), Type.Literal("STANDARD"), Type.Literal("HIGH"), Type.Literal("MAX")],
  {
    description:
      "AI image generation quality tier. LOW is fastest/cheapest; MAX is highest quality. When omitted, your workspace's Default AI quality is used.",
  },
);

export const avatarQualitySchema = {
  ...imageQualitySchema,
  description:
    "Avatar generation quality tier. Applies when actorEntityId is provided. Optional; when omitted, your account's Default AI quality for avatars is used.",
};

export const videoQualitySchema = Type.Union(
  [Type.Literal("LOW"), Type.Literal("STANDARD"), Type.Literal("HIGH"), Type.Literal("MAX")],
  {
    description:
      "Video generation quality tier (LOW, STANDARD, HIGH, or MAX). When omitted, your workspace's Default AI quality for video is used.",
  },
);

export const watermarkModeSchema = Type.Union(
  [Type.Literal("NONE"), Type.Literal("VIDEO_GEN"), Type.Literal("AUTO")],
  { description: "Whether to apply a VideoGen watermark to the output." },
);

export const remixActionsSchema = looseObjectArray(
  "Edits applied to the project, each an object with a `type`: SET_BACKGROUND_MUSIC, SET_LOGO, ENABLE_CAPTIONS, DISABLE_CAPTIONS, ADD_TRANSITIONS, ADD_ZOOM, RESIZE_PROJECT, CLEAN_UP_TRANSCRIPT, CONVERT_IMAGES_TO_VIDEOS, or CHANGE_NARRATOR (plus that action's own fields). CHANGE_NARRATOR accepts actorEntityId and optional avatarQuality. Provide at least two for a polished result, e.g. [{ type: 'ENABLE_CAPTIONS' }, { type: 'SET_BACKGROUND_MUSIC' }].",
);

export const captionStyleSchema = Type.Union([looseObject(), Type.Null()], {
  description:
    "Caption style overrides object, or null to hide captions. Omit for the default caption style.",
});

export const numResultsField = Type.Optional(
  Type.Integer({ minimum: 1, description: "Number of result variations to generate." }),
);

export const isOutputTemporaryField = Type.Optional(
  Type.Boolean({
    description: "When true, the output is temporary and not persisted to your library.",
  }),
);

export const startFrameFileIdField = Type.Optional(
  Type.String({
    description:
      "Opening-frame still file id (vg_file_...). Used as the first frame of the clip.",
  }),
);

export const spokenDialogueField = Type.Optional(
  Type.String({
    description:
      "Exact line the subject should speak as native lip-synced speech. The model synthesizes the voice from this text.",
  }),
);

export const voiceDescriptionField = Type.Optional(
  Type.String({
    description:
      "Natural-language description of the voice that speaks spokenDialogue. Used when spokenDialogue is set.",
  }),
);

export const imageFileIdsField = Type.Optional(
  Type.Array(Type.String(), {
    description: "Source image file ids (vg_file_...) for image-conditioned generation.",
  }),
);

export const entityIdsField = Type.Optional(
  Type.Array(Type.String(), {
    description:
      "Optional actor, product, or visual-style entity ids (vg_enti_...) used as identity/reference.",
  }),
);

export const videoFileIdsField = Type.Optional(
  Type.Array(Type.String(), {
    description: "Source video file ids (vg_file_...) for video-conditioned generation.",
  }),
);

export const languageField = Type.Optional(
  Type.String({
    description: "Output language as a BCP-47 code (e.g. 'en', 'es', 'fr'). Defaults to English.",
  }),
);

export const voiceIdField = Type.Optional(
  Type.String({ description: "Text-to-speech voice id (vg_voic_...)." }),
);

export const voiceSpeedField = Type.Optional(
  Type.Number({ minimum: 0, description: "Speech rate multiplier." }),
);

export const actorEntityIdField = Type.Optional(
  Type.String({
    description:
      "Recommended. Optional id of an ACTOR entity (vg_enti_...) with an image reference. When set, narration is delivered by that actor avatar.",
  }),
);

export const logoFileIdField = Type.Optional(
  Type.String({ description: "Uploaded logo image file id (vg_file_...) to overlay." }),
);

export const workflowAgentContextField = Type.Optional(
  Type.String({
    description: "Production notes for the AI (visual direction that is never spoken).",
  }),
);
