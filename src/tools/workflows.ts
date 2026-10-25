import { Type } from "typebox";

import { extractControls, runComposite, sdkRequest } from "../operations";
import {
  actorEntityIdField,
  aspectRatioSchema,
  avatarQualitySchema,
  captionStyleSchema,
  cursorField,
  imageQualitySchema,
  languageField,
  limitField,
  logoFileIdField,
  pollControlProperties,
  remixActionsSchema,
  selfOnlyField,
  visualPacingSchema,
  visualStyleSchema,
  voiceIdField,
  voiceSpeedField,
  workflowAgentContextField,
} from "../schemas";
import type { DefinedTool, ToolFactory } from "../toolTypes";
import { getVideoGenClient } from "../videoGenClient";

export function buildWorkflowTools(tool: ToolFactory): DefinedTool[] {
  return [
    tool({
      name: "script_to_video",
      label: "Script to video",
      description:
        "Turn a script into a finished narrated video with visuals and captions. The script is narrated verbatim (not rewritten). Starts the workflow and, by default, waits for the finished render. Provide at least two remixActions (e.g. ENABLE_CAPTIONS + SET_BACKGROUND_MUSIC) for a polished result.",
      parameters: Type.Object({
        script: Type.String({
          description: "The narration script. Narrated verbatim; not rewritten.",
        }),
        visualStyle: visualStyleSchema,
        aspectRatio: Type.Optional(aspectRatioSchema),
        visualPacing: Type.Optional(visualPacingSchema),
        quality: Type.Optional(imageQualitySchema),
        language: languageField,
        voiceId: voiceIdField,
        voiceSpeed: voiceSpeedField,
        actorEntityId: actorEntityIdField,
        avatarQuality: Type.Optional(avatarQualitySchema),
        featuredBRollFileIds: Type.Optional(
          Type.Array(Type.String(), {
            description: "Uploaded image/video file ids to feature as B-roll.",
          }),
        ),
        workflowAgentContext: workflowAgentContextField,
        remixActions: Type.Optional(remixActionsSchema),
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runComposite({
          start: () => client.workflows.scriptToVideo(sdkRequest(rest)),
          poll: (workflowRunId) => client.workflows.getWorkflowRun({ workflowRunId }),
          idKey: "workflowRunId",
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "voiceover_to_video",
      label: "Voiceover to video",
      description:
        "Build a narrated video from an already-uploaded voiceover audio file. Upload the audio first with upload_file, then pass its fileId. Starts the workflow and, by default, waits for the finished render.",
      parameters: Type.Object({
        fileId: Type.String({ description: "Uploaded voiceover audio file id (vg_file_...)." }),
        visualStyle: visualStyleSchema,
        aspectRatio: Type.Optional(aspectRatioSchema),
        visualPacing: Type.Optional(visualPacingSchema),
        quality: Type.Optional(imageQualitySchema),
        language: languageField,
        captionStyle: Type.Optional(captionStyleSchema),
        logoFileId: logoFileIdField,
        workflowAgentContext: workflowAgentContextField,
        remixActions: Type.Optional(remixActionsSchema),
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runComposite({
          start: () => client.workflows.voiceoverToVideo(sdkRequest(rest)),
          poll: (workflowRunId) => client.workflows.getWorkflowRun({ workflowRunId }),
          idKey: "workflowRunId",
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "slideshow_to_video",
      label: "Slideshow to video",
      description:
        "Build a narrated video from an already-uploaded PDF or slideshow file. Upload the file first with upload_file, then pass its fileId. Starts the workflow and, by default, waits for the finished render. ADD_TRANSITIONS + CONVERT_IMAGES_TO_VIDEOS make strong remixActions here.",
      parameters: Type.Object({
        fileId: Type.String({ description: "Uploaded PDF/slideshow file id (vg_file_...)." }),
        slideScripts: Type.Optional(
          Type.Array(Type.String(), {
            description: "Optional per-slide narration scripts, in slide order.",
          }),
        ),
        aspectRatio: Type.Optional(aspectRatioSchema),
        language: languageField,
        voiceId: voiceIdField,
        voiceSpeed: voiceSpeedField,
        actorEntityId: actorEntityIdField,
        avatarQuality: Type.Optional(avatarQualitySchema),
        slideshowThemeEntityId: Type.Optional(
          Type.String({
            description:
              "Optional id of a SLIDESHOW_THEME entity (vg_enti_...) whose reference board defines the shared slide design system. Omit when converting an uploaded deck's original pages.",
          }),
        ),
        captionStyle: Type.Optional(captionStyleSchema),
        logoFileId: logoFileIdField,
        remixActions: Type.Optional(remixActionsSchema),
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runComposite({
          start: () => client.workflows.slideshowToVideo(sdkRequest(rest)),
          poll: (workflowRunId) => client.workflows.getWorkflowRun({ workflowRunId }),
          idKey: "workflowRunId",
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "storyboard_to_video",
      label: "Storyboard to video",
      description:
        "Build a video from a structured storyboard of scenes. Starts the workflow and, by default, waits for the finished render. This workflow does not accept remixActions.",
      parameters: Type.Object({
        scenes: Type.Array(Type.Record(Type.String(), Type.Unknown()), {
          description:
            "Ordered storyboard scenes. Each scene describes its narration/text and how its visual is generated.",
        }),
        defaultGeneration: Type.Optional(
          Type.Union([Type.Record(Type.String(), Type.Unknown()), Type.Null()], {
            description:
              "Default per-scene generation settings applied when a scene omits its own.",
          }),
        ),
        defaultDurationSeconds: Type.Optional(
          Type.Number({
            minimum: 0,
            description:
              "Default duration in seconds for scenes that omit their own. Omit for Auto (estimated at generate time).",
          }),
        ),
        quality: Type.Optional(imageQualitySchema),
        aspectRatio: Type.Optional(aspectRatioSchema),
        workflowAgentContext: workflowAgentContextField,
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runComposite({
          start: () => client.workflows.storyboardToVideo(sdkRequest(rest)),
          poll: (workflowRunId) => client.workflows.getWorkflowRun({ workflowRunId }),
          idKey: "workflowRunId",
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "prompt_to_video_clip",
      label: "Prompt to video",
      description:
        "Generate one short AI video clip (1-30 seconds) from a text prompt inside an editable project. VideoGen generates an opening frame (optionally guided by reference images), then animates it into a video. Starts the workflow and, by default, waits for the finished render. Does not accept remixActions. For a standalone clip without a project, use generate_video_clip. For longer narrated multi-scene videos, use script_to_video.",
      parameters: Type.Object({
        prompt: Type.String({
          description:
            "Text prompt describing the video to generate (e.g. 'A golden retriever running through a sunlit meadow in slow motion, cinematic').",
        }),
        imageFileIds: Type.Optional(
          Type.Array(Type.String(), {
            maxItems: 4,
            description: "Uploaded reference image file ids that guide the opening frame.",
          }),
        ),
        durationSeconds: Type.Optional(
          Type.Integer({
            minimum: 1,
            maximum: 30,
            description:
              "Desired clip length in whole seconds (1-30). Defaults to 10. Clamped to the selected quality's supported range.",
          }),
        ),
        aspectRatio: Type.Optional(aspectRatioSchema),
        quality: Type.Optional(
          Type.Union(
            [
              Type.Literal("LOW"),
              Type.Literal("STANDARD"),
              Type.Literal("HIGH"),
              Type.Literal("MAX"),
            ],
            {
              description: "Video (and opening-frame) quality tier. Defaults to STANDARD.",
            },
          ),
        ),
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runComposite({
          start: () => client.workflows.promptToVideoClip(sdkRequest(rest)),
          poll: (workflowRunId) => client.workflows.getWorkflowRun({ workflowRunId }),
          idKey: "workflowRunId",
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "video_to_video",
      label: "Video to video",
      description:
        "Restyle an existing video from a text prompt inside an editable project, keeping its length and timing. Pass exactly one of videoFileId (an uploaded video) or videoUrl (a public link, which the run imports itself). Up to 120 seconds is restyled per run. Starts the workflow and, by default, waits for the finished render. Provide at least two remixActions (e.g. ENABLE_CAPTIONS + ADD_TRANSITIONS) for a polished result.",
      parameters: Type.Object({
        videoFileId: Type.Optional(
          Type.String({
            description: "Uploaded video file id (vg_file_...). Provide this or videoUrl.",
          }),
        ),
        videoUrl: Type.Optional(
          Type.String({
            maxLength: 2048,
            description:
              "Public http(s) link to a video page or video file. The run imports it; do not import it first. Provide this or videoFileId.",
          }),
        ),
        prompt: Type.String({
          minLength: 1,
          description:
            "How the restyled video should look (e.g. 'Hand-made claymation with soft studio lighting').",
        }),
        trimStartSeconds: Type.Optional(
          Type.Number({
            minimum: 0,
            description: "Second where the restyled part starts. Defaults to 0.",
          }),
        ),
        trimEndSeconds: Type.Optional(
          Type.Number({
            minimum: 0,
            description:
              "Second where the restyled part ends. Defaults to trimStartSeconds + 120, capped at the end of the video. The part must be 2-120 seconds long.",
          }),
        ),
        imageFileIds: Type.Optional(
          Type.Array(Type.String(), {
            maxItems: 10,
            description: "Uploaded reference image file ids that guide the look.",
          }),
        ),
        aspectRatio: Type.Optional(aspectRatioSchema),
        quality: Type.Optional(
          Type.Union(
            [
              Type.Literal("LOW"),
              Type.Literal("STANDARD"),
              Type.Literal("HIGH"),
              Type.Literal("MAX"),
            ],
            {
              description:
                "Restyle quality (LOW, STANDARD, HIGH, or MAX). Higher tiers cost more and follow the source more faithfully. Defaults to HIGH.",
            },
          ),
        ),
        audio: Type.Optional(
          Type.Union([Type.Literal("KEEP_ORIGINAL"), Type.Literal("GENERATE")], {
            description:
              "Keep the source soundtrack or generate new audio. Defaults to KEEP_ORIGINAL.",
          }),
        ),
        remixActions: Type.Optional(remixActionsSchema),
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runComposite({
          start: () => client.workflows.videoToVideo(sdkRequest(rest)),
          poll: (workflowRunId) => client.workflows.getWorkflowRun({ workflowRunId }),
          idKey: "workflowRunId",
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "list_workflow_runs",
      label: "List workflow runs",
      description: "List workflow runs, most recent first.",
      parameters: Type.Object({
        cursor: cursorField,
        limit: limitField,
        selfOnly: selfOnlyField,
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.workflows.listWorkflowRuns(sdkRequest(params));
      },
    }),

    tool({
      name: "get_workflow_run",
      label: "Get workflow run",
      description: "Fetch the current status and result of a single workflow run.",
      parameters: Type.Object({
        workflowRunId: Type.String({ description: "Workflow run id (vg_work_...)." }),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.workflows.getWorkflowRun({ workflowRunId: params.workflowRunId });
      },
    }),

    tool({
      name: "cancel_workflow_run",
      label: "Cancel workflow run",
      description: "Request cancellation of an in-progress workflow run.",
      parameters: Type.Object({
        workflowRunId: Type.String({ description: "Workflow run id (vg_work_...)." }),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.workflows.cancelWorkflowRun({ workflowRunId: params.workflowRunId });
      },
    }),
  ];
}
