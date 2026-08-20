import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

import { CONFIG_SCHEMA } from "./src/config";
import { buildAccountTools } from "./src/tools/account";
import { buildAppDeepLinkTools } from "./src/tools/appDeepLink";
import { buildEntityTools } from "./src/tools/entities";
import { buildFileTools } from "./src/tools/files";
import { buildGuidanceTools } from "./src/tools/guidance";
import { buildMediaTools } from "./src/tools/mediaTools";
import { buildProjectTools } from "./src/tools/projects";
import { buildResourceTools } from "./src/tools/resources";
import { buildWorkflowTools } from "./src/tools/workflows";

export default defineToolPlugin({
  id: "videogen",
  name: "VideoGen",
  description:
    "Generate videos and media with VideoGen. Exposes the full VideoGen API (workflows, image/video/audio generation, media editing, projects, files) as native OpenClaw tools.",
  activation: { onStartup: true },
  configSchema: CONFIG_SCHEMA,
  tools: (tool) => [
    ...buildWorkflowTools(tool),
    ...buildMediaTools(tool),
    ...buildProjectTools(tool),
    ...buildFileTools(tool),
    ...buildEntityTools(tool),
    ...buildResourceTools(tool),
    ...buildAccountTools(tool),
    ...buildAppDeepLinkTools(tool),
    ...buildGuidanceTools(tool),
  ],
});
