import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { getHydratedFile, uploadFile } from "@videogen/sdk";
import { Type } from "typebox";

import { awaitReady, extractControls, sdkRequest } from "../operations";
import { cursorField, limitField } from "../schemas";
import type { DefinedTool, ToolFactory } from "../toolTypes";
import { getVideoGenClient } from "../videoGenClient";

/**
 * A freshly uploaded file is usable once any downloadable or preview rendition
 * has finished processing. Mirrors the readiness check the SDK's `uploadFile`
 * helper uses after PUTting bytes.
 */
function fileHasReadySource(snapshot: unknown): boolean {
  if (typeof snapshot !== "object" || snapshot == null) {
    return false;
  }

  const record = snapshot as Record<string, unknown>;

  const statusOf = (key: string): string | undefined => {
    const source = record[key];

    if (typeof source !== "object" || source == null) {
      return undefined;
    }

    const status = (source as Record<string, unknown>).status;

    return typeof status === "string" ? status : undefined;
  };

  return statusOf("downloadSource") === "ready" || statusOf("previewSource") === "ready";
}

export function buildFileTools(tool: ToolFactory): DefinedTool[] {
  return [
    tool({
      name: "upload_file",
      label: "Upload file",
      description:
        "Upload a local file to VideoGen and wait until it is processed. Returns the file with its id (vg_file_...) and signed URLs. Use the returned fileId for voiceover_to_video, slideshow_to_video, logos, or B-roll. To upload a remote asset, download it first and pass its local path.",
      parameters: Type.Object({
        filePath: Type.String({ description: "Absolute path to a local file to upload." }),
        displayName: Type.Optional(
          Type.String({
            description: "Display name for the file. Defaults to the source file name.",
          }),
        ),
        type: Type.Optional(
          Type.Union([Type.Literal("IMAGE"), Type.Literal("VIDEO"), Type.Literal("AUDIO")], {
            description: "File type. Inferred when omitted.",
          }),
        ),
      }),
      execute: async (params, config) => {
        if (params.filePath.length === 0) {
          throw new Error("Provide a filePath (absolute path to a local file) to upload.");
        }

        const client = getVideoGenClient(config);
        const buffer = await readFile(params.filePath);
        const bytes = new Uint8Array(buffer);

        const displayName =
          params.displayName != null && params.displayName.length > 0
            ? params.displayName
            : basename(params.filePath);

        return uploadFile(client, bytes, {
          displayName,
          ...(params.type != null ? { type: params.type } : {}),
        });
      },
    }),

    tool({
      name: "create_file_upload",
      label: "Create file upload",
      description:
        "Start an upload for a large file, or when file bytes cannot be inlined. Returns { fileId, uploadUrl }. PUT the raw file bytes to uploadUrl with NO Authorization header (it is a short-lived pre-signed URL). Then call get_file with { fileId, wait: true } to wait until processing finishes, and pass the returned fileId to workflows, tools, logos, or B-roll. For small files, prefer upload_file.",
      parameters: Type.Object({
        displayName: Type.String({ description: "Display name for the file." }),
        type: Type.Optional(
          Type.Union(
            [
              Type.Literal("IMAGE"),
              Type.Literal("VIDEO"),
              Type.Literal("AUDIO"),
              Type.Literal("PDF"),
              Type.Literal("SLIDESHOW"),
            ],
            { description: "File type. Inferred after processing when omitted." },
          ),
        ),
        isTemporary: Type.Optional(
          Type.Boolean({
            description:
              "When true, the file is temporary (guaranteed available for 24 hours, not analyzed for search). Defaults to false.",
          }),
        ),
      }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.files.createFileUpload(sdkRequest(params));
      },
    }),

    tool({
      name: "get_file",
      label: "Get file",
      description:
        "Fetch a file by id with freshly hydrated (non-expired) signed URLs for its thumbnail, preview, and download renditions. Set wait: true to poll until the file finishes processing — use this right after PUTting bytes to a create_file_upload URL.",
      parameters: Type.Object({
        fileId: Type.String({ description: "File id (vg_file_...)." }),
        wait: Type.Optional(
          Type.Boolean({
            description:
              "When true, poll until the file finishes processing and a rendition is ready. Defaults to false (a single fetch).",
          }),
        ),
        pollIntervalMs: Type.Optional(
          Type.Integer({
            minimum: 1,
            description: "How often to poll while waiting, in milliseconds.",
          }),
        ),
        timeoutMs: Type.Optional(
          Type.Integer({
            minimum: 1,
            description: "Maximum time to wait for processing before giving up, in milliseconds.",
          }),
        ),
      }),
      execute: async (params, config, context) => {
        const client = getVideoGenClient(config);

        if (params.wait === true) {
          return awaitReady({
            poll: () => client.files.hydrateFile({ fileId: params.fileId }),
            isReady: fileHasReadySource,
            controls: extractControls({
              wait: params.wait,
              pollIntervalMs: params.pollIntervalMs,
              timeoutMs: params.timeoutMs,
            }),
            signal: context.signal,
          });
        }

        return getHydratedFile(client, params.fileId);
      },
    }),

    tool({
      name: "list_files",
      label: "List files",
      description: "List files visible to the current API key.",
      parameters: Type.Object({ cursor: cursorField, limit: limitField }),
      execute: async (params, config) => {
        const client = getVideoGenClient(config);

        return client.files.getFiles(sdkRequest(params));
      },
    }),
  ];
}
