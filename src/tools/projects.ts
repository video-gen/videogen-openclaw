import { Type } from "typebox";

import { extractControls, runComposite, sdkRequest } from "../operations";
import {
  cursorField,
  limitField,
  pollControlProperties,
  remixActionsSchema,
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
      description:
        "List projects. API-created projects only by default; pass includeUiProjects to also include dashboard projects.",
      parameters: Type.Object({
        cursor: cursorField,
        limit: limitField,
        selfOnly: selfOnlyField,
        includeUiProjects: Type.Optional(
          Type.Boolean({
            description:
              "Include projects created in the VideoGen dashboard, not just API-created ones.",
          }),
        ),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.projects.listProjects(sdkRequest(params));
      },
    }),

    tool({
      name: "get_project",
      label: "Get project",
      description: "Fetch metadata and the shareable URL for a single project.",
      parameters: Type.Object({ projectId: projectIdField }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.projects.getProject({ projectId: params.projectId });
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
        ...pollControlProperties,
      }),
      execute: async (params, config, context) => {
        const { projectId, wait, pollIntervalMs, timeoutMs, ...rest } = params;
        const client = getVideoGenClient(config);

        return runComposite({
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

        return client.projects.getProjectExport({
          projectId: params.projectId,
          exportId: params.exportId,
        });
      },
    }),

    tool({
      name: "remix_project",
      label: "Remix project",
      description:
        "Apply remix actions (music, logo, captions, transitions, natural-language edits) to an existing project. Poll with list_project_remix_actions for status.",
      parameters: Type.Object({
        projectId: Type.String({ description: "Project id to remix." }),
        remixActions: remixActionsSchema,
        saveAsNewProject: Type.Optional(
          Type.Boolean({
            description:
              "When true, save the remixed result as a new project instead of editing in place.",
          }),
        ),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.projects.remixProject(sdkRequest(params));
      },
    }),

    tool({
      name: "list_project_remix_actions",
      label: "List project remix actions",
      description: "List the status of remix actions applied to a project.",
      parameters: Type.Object({ projectId: projectIdField }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.projects.listProjectRemixActions({ projectId: params.projectId });
      },
    }),
  ];
}
