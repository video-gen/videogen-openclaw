import { Type } from "typebox";

import { extractControls, runComposite, sdkRequest } from "../operations";
import {
  cursorField,
  limitField,
  pollControlProperties,
  videoEditsSchema,
  selfOnlyField,
} from "../schemas";
import type { DefinedTool, ToolFactory } from "../toolTypes";
import { getVideoGenClient } from "../videoGenClient";

const projectIdField = Type.String({ description: "Project id." });

export function buildProjectTools(tool: ToolFactory): DefinedTool[] {
  return [
    tool({
      name: "list_projects",
      label: "List projects",
      description: "List projects, including projects created in the dashboard.",
      parameters: Type.Object({
        cursor: cursorField,
        limit: limitField,
        selfOnly: selfOnlyField,
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return await client.projects.listProjects(sdkRequest(params));
      },
    }),

    tool({
      name: "get_project",
      label: "Get project",
      description: "Fetch metadata and the shareable URL for a single project.",
      parameters: Type.Object({ projectId: projectIdField }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return await client.projects.getProject({ projectId: params.projectId });
      },
    }),

    tool({
      name: "export_project",
      label: "Export project",
      description:
        "Export a project to an MP4. Starts the export and, by default, waits until the download URL is ready. Pass wait:false and poll with get_project_export when the connection may time out.",
      parameters: Type.Object({
        projectId: Type.String({ description: "Project id to export." }),
        quality: Type.Optional(
          Type.Union(
            [
              Type.Literal("STANDARD"),
              Type.Literal("HIGH"),
              Type.Literal("FULL_HIGH"),
              Type.Literal("ULTRA_HIGH"),
            ],
            { description: "Export quality tier." },
          ),
        ),
        editableVideoId: Type.Optional(
          Type.String({
            description:
              "Editable video to export (vg_vide_...), from a workflow run's outputs. Defaults to the project's first video.",
          }),
        ),
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { projectId, wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return await runComposite({
          start: () => client.projects.exportProject(sdkRequest({ projectId, ...rest })),
          poll: (exportId) => client.projects.getProjectExport({ projectId, exportId }),
          idKey: "exportId",
          controls: extractControls({ wait, pollIntervalMs, timeoutMs }),
          signal: context.signal,
        });
      },
    }),

    tool({
      name: "get_project_export",
      label: "Get project export",
      description:
        "Fetch the current status of a project export. Poll until status is succeeded, failed, or cancelled.",
      parameters: Type.Object({
        projectId: Type.String({ description: "Project id that owns the export." }),
        exportId: Type.String({ description: "Export id (vg_expo_...) from export_project." }),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return await client.projects.getProjectExport({
          projectId: params.projectId,
          exportId: params.exportId,
        });
      },
    }),

    tool({
      name: "start_video_edits",
      label: "Start video edits",
      description:
        "Apply video edits (music, logo, captions, transitions) to an existing project. Poll with list_video_edits for status.",
      parameters: Type.Object({
        projectId: Type.String({ description: "Project id that owns the video." }),
        videoEdits: videoEditsSchema,
        saveAsNewProject: Type.Optional(
          Type.Boolean({
            description:
              "When true, copy the project and edit the corresponding video in the copy.",
          }),
        ),
        editableVideoId: Type.String({
          description:
            "Editable video to edit (vg_vide_...), from project artifacts or a workflow run's outputs.",
        }),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return await client.projects.startVideoEdits(sdkRequest(params));
      },
    }),

    tool({
      name: "list_video_edits",
      label: "List project video edits",
      description: "List the status of video edits applied to a project.",
      parameters: Type.Object({
        projectId: projectIdField,
        cursor: cursorField,
        limit: limitField,
        editableVideoId: Type.Optional(
          Type.String({ description: "Filter by editable video id." }),
        ),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return await client.projects.listVideoEdits(sdkRequest(params));
      },
    }),
  ];
}
