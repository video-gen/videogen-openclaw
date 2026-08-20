import type { DefineToolPluginOptions } from "openclaw/plugin-sdk/tool-plugin";

import type { CONFIG_SCHEMA } from "./config";

// The tool-plugin factory and defined-tool types are internal to OpenClaw's SDK,
// so we recover them from the exported `DefineToolPluginOptions["tools"]`
// callback signature (its parameter is the `tool(...)` factory; its return is
// the defined-tool array). This keeps each tool builder strongly typed against
// the plugin's config schema.
type ToolsCallback = DefineToolPluginOptions<typeof CONFIG_SCHEMA>["tools"];

export type ToolFactory = Parameters<ToolsCallback>[0];

export type DefinedTool = ReturnType<ToolsCallback>[number];
