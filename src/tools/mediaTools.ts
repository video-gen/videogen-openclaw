import { Type } from "typebox";

import { extractControls, type PollControls, runComposite, sdkRequest } from "../operations";
import {
  aspectRatioSchema,
  avatarQualitySchema,
  cursorField,
  imageFileIdsField,
  entityIdsField,
  startFrameFileIdField,
  spokenDialogueField,
  voiceDescriptionField,
  imageQualitySchema,
  isOutputTemporaryField,
  limitField,
  numResultsField,
  pollControlProperties,
  selfOnlyField,
  videoFileIdsField,
  videoQualitySchema,
  watermarkModeSchema,
} from "../schemas";
import type { DefinedTool, ToolFactory } from "../toolTypes";
import { getVideoGenClient } from "../videoGenClient";
import type { VideoGenClient } from "@videogen/sdk";

const imageFileIdField = Type.String({ description: "Source image file id (vg_file_...)." });
const videoFileIdField = Type.String({ description: "Source video file id (vg_file_...)." });

/** Runs a media tool's start call and polls its tool execution to a terminal state. */
function runToolComposite(args: {
  client: VideoGenClient;
  start: () => Promise<unknown>;
  controls: PollControls;
  signal?: AbortSignal | undefined;
}): Promise<unknown> {
  return runComposite({
    start: args.start,
    poll: (toolExecutionId) => args.client.tools.getToolExecutionInfo({ toolExecutionId }),
    idKey: "toolExecutionId",
    controls: args.controls,
    signal: args.signal,
  });
}

export function buildMediaTools(tool: ToolFactory): DefinedTool[] {
  return [
    tool({
      name: "generate_image",
      label: "Generate image",
      description:
        "Generate an image from a text prompt, optionally conditioned on source images and actor, product, or visual-style entity ids.",
      parameters: Type.Object({
        prompt: Type.String({ description: "Text description of the image to generate." }),
        quality: Type.Optional(imageQualitySchema),
        imageFileIds: imageFileIdsField,
        entityIds: entityIdsField,
        aspectRatio: Type.Optional(aspectRatioSchema),
        watermarkMode: Type.Optional(watermarkModeSchema),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.generateImage(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "generate_video_clip",
      label: "Generate video clip",
      description:
        "Generate a video clip from a text prompt, source images, or source videos. quality is optional (LOW, STANDARD, HIGH, or MAX).",
      parameters: Type.Object({
        quality: Type.Optional(videoQualitySchema),
        prompt: Type.Optional(
          Type.String({ description: "Text description of the video to generate." }),
        ),
        startFrameFileId: startFrameFileIdField,
        imageFileIds: imageFileIdsField,
        videoFileIds: videoFileIdsField,
        audioFileIds: Type.Optional(
          Type.Array(Type.String(), {
            description:
              "Source audio file ids (vg_file_...) to lip-sync from a recording. Use spokenDialogue to have the model speak a line it generates itself.",
          }),
        ),
        spokenDialogue: spokenDialogueField,
        voiceDescription: voiceDescriptionField,
        generateAudio: Type.Optional(
          Type.Boolean({ description: "Whether to generate audio for the clip." }),
        ),
        suppressBackgroundMusic: Type.Optional(
          Type.Boolean({
            description:
              "When true, the clip will not include a musical soundtrack. Spoken dialogue and environmental sound are still allowed.",
          }),
        ),
        durationSeconds: Type.Optional(
          Type.Union([Type.Number({ minimum: 0 }), Type.Null()], {
            description: "Requested clip duration in seconds.",
          }),
        ),
        aspectRatio: Type.Optional(aspectRatioSchema),
        watermarkMode: Type.Optional(watermarkModeSchema),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.generateVideoClip(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "text_to_speech",
      label: "Text to speech",
      description: "Convert text into spoken audio using a selectable voice.",
      parameters: Type.Object({
        ttsText: Type.String({ description: "The text to speak." }),
        voiceId: Type.String({
          description:
            "Catalog display name (e.g. Matilda) or voice id from list_tts_voices (vg_voic_...).",
        }),
        speechLanguageCode: Type.Optional(
          Type.Union([Type.String(), Type.Null()], {
            description: "BCP-47 language code for the narration.",
          }),
        ),
        pronunciationReplacements: Type.Optional(
          Type.Array(Type.Record(Type.String(), Type.Unknown()), {
            description: "Custom pronunciation replacements to apply before synthesis.",
          }),
        ),
        autoExpandPronunciationReplacements: Type.Optional(
          Type.Boolean({ description: "Whether to auto-expand pronunciation replacements." }),
        ),
        voiceSpeed: Type.Optional(Type.Number({ minimum: 0, description: "Speech rate multiplier." })),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.textToSpeech(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "generate_sound_effect",
      label: "Generate sound effect",
      description: "Generate a sound effect from a text prompt.",
      parameters: Type.Object({
        prompt: Type.String({ description: "Description of the sound effect." }),
        durationSeconds: Type.Optional(
          Type.Union([Type.Number({ minimum: 0 }), Type.Null()], {
            description: "Requested duration in seconds.",
          }),
        ),
        promptInfluence: Type.Optional(
          Type.Union([Type.Number(), Type.Null()], {
            description: "How strongly the prompt guides generation (0-1).",
          }),
        ),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.generateSoundEffect(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "generate_music",
      label: "Generate music",
      description: "Generate a music track from a text prompt.",
      parameters: Type.Object({
        prompt: Type.String({ description: "Description of the music to generate." }),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.generateMusic(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "generate_motion_graphic",
      label: "Generate motion graphic",
      description:
        "Generate an animated motion graphic video from a text prompt. Best for precise text animations (typing effects, kinetic typography, lower thirds) that stock or generated footage can't express. Optionally pass reference media file ids and actor, product, or visual-style entity ids.",
      parameters: Type.Object({
        prompt: Type.String({
          description: "Description of the animated motion graphic to generate.",
        }),
        fileIds: Type.Optional(
          Type.Array(Type.String(), {
            description:
              "Optional reference media file ids (vg_file_...) the motion graphic may display or animate.",
          }),
        ),
        entityIds: entityIdsField,
        durationSeconds: Type.Optional(
          Type.Integer({
            description: "Length in seconds, a whole number from 1 to 300. Defaults to 5.",
          }),
        ),
        aspectRatio: Type.Optional(aspectRatioSchema),
        transparentBackground: Type.Optional(
          Type.Boolean({
            description:
              "Whether to render a transparent WebM overlay. Set to false for an opaque MP4. Defaults to true.",
          }),
        ),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.generateMotionGraphic(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "generate_avatar",
      label: "Generate avatar",
      description: "Generate a talking-head avatar video from an ACTOR entity and uploaded audio.",
      parameters: Type.Object({
        actorEntityId: Type.String({
          description: "The id of an ACTOR entity (vg_enti_...) with at least one image reference.",
        }),
        avatarQuality: Type.Optional(avatarQualitySchema),
        audioFileId: Type.String({
          description: "Uploaded audio file id (vg_file_...) for the avatar to lip-sync.",
        }),
        watermarkMode: Type.Optional(watermarkModeSchema),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.generateAvatar(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "vectorize_image",
      label: "Vectorize image",
      description: "Convert a raster image into a vector (SVG).",
      parameters: Type.Object({
        imageFileId: imageFileIdField,
        watermarkMode: Type.Optional(watermarkModeSchema),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.vectorizeImage(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "remove_image_background",
      label: "Remove image background",
      description: "Remove the background from an image.",
      parameters: Type.Object({
        imageFileId: imageFileIdField,
        watermarkMode: Type.Optional(watermarkModeSchema),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.removeImageBackground(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "remove_video_background",
      label: "Remove video background",
      description: "Remove the background from a video.",
      parameters: Type.Object({
        videoFileId: videoFileIdField,
        watermarkMode: Type.Optional(watermarkModeSchema),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.removeVideoBackground(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "upscale_image",
      label: "Upscale image",
      description: "Increase the resolution of an image.",
      parameters: Type.Object({
        imageFileId: imageFileIdField,
        watermarkMode: Type.Optional(watermarkModeSchema),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.upscaleImage(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "upscale_video",
      label: "Upscale video",
      description: "Increase the resolution of a video.",
      parameters: Type.Object({
        videoFileId: videoFileIdField,
        watermarkMode: Type.Optional(watermarkModeSchema),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.upscaleVideo(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "image_3d_effect",
      label: "Image 3D effect",
      description: "Add 3D parallax motion to a still image, producing a video.",
      parameters: Type.Object({
        imageFileId: imageFileIdField,
        watermarkMode: Type.Optional(watermarkModeSchema),
        numResults: numResultsField,
        isOutputTemporary: isOutputTemporaryField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runToolComposite({
          client,
          start: () => client.tools.image3DEffect(sdkRequest(rest)),
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "list_tool_executions",
      label: "List tool executions",
      description: "List past tool executions, most recent first.",
      parameters: Type.Object({
        cursor: cursorField,
        limit: limitField,
        selfOnly: selfOnlyField,
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.tools.listToolExecutions(sdkRequest(params));
      },
    }),

    tool({
      name: "get_tool_execution",
      label: "Get tool execution",
      description: "Fetch the current status and results of a single tool execution.",
      parameters: Type.Object({
        toolExecutionId: Type.String({ description: "Tool execution id (vg_tool_...)." }),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.tools.getToolExecutionInfo({ toolExecutionId: params.toolExecutionId });
      },
    }),

    tool({
      name: "cancel_tool_execution",
      label: "Cancel tool execution",
      description: "Request cancellation of an in-progress tool execution.",
      parameters: Type.Object({
        toolExecutionId: Type.String({ description: "Tool execution id (vg_tool_...)." }),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.tools.cancelToolExecution({ toolExecutionId: params.toolExecutionId });
      },
    }),
  ];
}
