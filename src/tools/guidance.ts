import { Type } from "typebox";

import type { DefinedTool, ToolFactory } from "../toolTypes";

const GUIDANCE_DOCUMENTS = [
  {
    name: "get_getting_started_guidance",
    label: "Getting started guidance",
    description:
      "How to authenticate, verify with get_me, choose workflows vs media tools, and use VideoGen ids.",
    markdown:
      "# Getting started with VideoGen\n\nAuthenticate with a VideoGen API key, then call `get_me` to verify the connection. Use workflows for complete editable videos and standalone media tools for one asset. VideoGen ids are opaque `vg_...` strings; store and pass them unchanged. Upload required files before starting workflows that consume them.",
  },
  {
    name: "get_async_tasks_guidance",
    label: "Async tasks guidance",
    description: "How to handle asynchronous workflows, tool executions, and project exports.",
    markdown:
      "# Async tasks\n\nWorkflows, media tools, and exports are asynchronous. Keep the returned id and poll the matching status tool until `succeeded`, `failed`, or `cancelled`: `get_workflow_run`, `get_tool_execution`, or `get_project_export`. Use webhooks instead of polling in long-running production services.",
  },
  {
    name: "get_workflows_guidance",
    label: "Workflows guidance",
    description: "How to choose and run workflows, then remix and export the resulting project.",
    markdown:
      "# Workflows\n\nChoose `script_to_video` for narrated scripts, `voiceover_to_video` for uploaded narration, `slideshow_to_video` for a PDF or deck, `storyboard_to_video` for explicit scenes, and `prompt_to_video_clip` for one short clip in an editable project. The canonical flow is run, remix, then export. Poll each asynchronous step to completion.",
  },
  {
    name: "get_tools_vs_workflows_guidance",
    label: "Tools vs workflows guidance",
    description: "When to use standalone media tools instead of complete video workflows.",
    markdown:
      "# Tools vs workflows\n\nUse a `generate_*` or media-editing tool when the user needs one standalone image, video, audio asset, or transformation. Use a workflow when the user needs a complete editable video with scenes, narration, captions, and a project. VideoGen routes standalone generation to a suitable model automatically.",
  },
] as const;

export function buildGuidanceTools(tool: ToolFactory): DefinedTool[] {
  return GUIDANCE_DOCUMENTS.map((guidance) =>
    tool({
      name: guidance.name,
      label: guidance.label,
      description: guidance.description,
      parameters: Type.Object({}),
      execute: async () => ({ markdown: guidance.markdown }),
    }),
  );
}
