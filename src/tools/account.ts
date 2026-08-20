import { Type } from "typebox";

import type { DefinedTool, ToolFactory } from "../toolTypes";
import { getVideoGenClient } from "../videoGenClient";

export function buildAccountTools(tool: ToolFactory): DefinedTool[] {
  return [
    tool({
      name: "get_me",
      label: "Get account",
      description:
        "Fetch the authenticated team's account details, including the current credit balance.",
      parameters: Type.Object({}),
      execute: async (_params, config) => {
        const client = getVideoGenClient(config);

        return client.account.getMe();
      },
    }),
  ];
}
