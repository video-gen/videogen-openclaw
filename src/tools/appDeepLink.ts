import { Type } from "typebox";

import { appDeepLinkActionFromToolArgs, buildAppDeepLinkUrl } from "../appDeepLink";
import type { DefinedTool, ToolFactory } from "../toolTypes";
import { resolveBaseUrl } from "../videoGenClient";

export function buildAppDeepLinkTools(tool: ToolFactory): DefinedTool[] {
  return [
    tool({
      name: "get_app_deep_link",
      label: "Get app deep link",
      description:
        "Build a VideoGen app URL that opens a modal or navigates after the user signs in (upgrade, buy credits, invite teammates, submit feedback, integrations, account settings, or a NAVIGATE destination). Prefer this when the user needs to complete something in the VideoGen UI that tools cannot do inline. Return the url to the user so they can open it.",
      parameters: Type.Object({
        action: Type.Union(
          [
            Type.Literal("OPEN_UPGRADE"),
            Type.Literal("OPEN_ENABLE_TOP_UPS"),
            Type.Literal("OPEN_INVITE_TEAMMATES"),
            Type.Literal("OPEN_PURCHASE_CREDITS"),
            Type.Literal("OPEN_SUBMIT_FEEDBACK"),
            Type.Literal("OPEN_RATE_CARD"),
            Type.Literal("OPEN_HELP_ARTICLE"),
            Type.Literal("OPEN_MANAGE_INTEGRATION"),
            Type.Literal("OPEN_INTEGRATIONS_PICKER"),
            Type.Literal("OPEN_LANGUAGE_SELECTOR"),
            Type.Literal("NAVIGATE"),
          ],
          {
            description:
              "Assistant COMMON action to deep-link into the VideoGen app (opens a modal or navigates after sign-in).",
          },
        ),
        destination: Type.Optional(
          Type.String({
            description:
              "Required for NAVIGATE. In-app keys like PROJECTS, BILLING_SETTINGS, SUPPORT; or HELP_CENTER / API_DOCS.",
          }),
        ),
        articleSlug: Type.Optional(
          Type.String({
            description: "Required for OPEN_HELP_ARTICLE. Help-center article slug / search query.",
          }),
        ),
        provider: Type.Optional(
          Type.String({
            description:
              "Required for OPEN_MANAGE_INTEGRATION. Integration provider id (e.g. GOOGLE, SLACK).",
          }),
        ),
        capability: Type.Optional(
          Type.Union([Type.String(), Type.Null()], {
            description:
              "Optional for OPEN_INTEGRATIONS_PICKER. Capability filter (e.g. KNOWLEDGE_SOURCE), or null for all.",
          }),
        ),
        category: Type.Optional(
          Type.Union(
            [
              Type.Literal("bug"),
              Type.Literal("feature_request"),
              Type.Literal("improvement"),
              Type.Null(),
            ],
            {
              description:
                "Optional for OPEN_SUBMIT_FEEDBACK. Ticket category, or null to let the user pick.",
            },
          ),
        ),
        text: Type.Optional(
          Type.Union([Type.String(), Type.Null()], {
            description:
              "Optional for OPEN_SUBMIT_FEEDBACK. Prefills the ticket description (capped).",
          }),
        ),
        suggestedLocale: Type.Optional(
          Type.Union([Type.String(), Type.Null()], {
            description:
              "Optional for OPEN_LANGUAGE_SELECTOR. Suggested locale code (e.g. en-US).",
          }),
        ),
      }),
      execute: async (params, config) => {
        const action = appDeepLinkActionFromToolArgs(params);
        if (action == null) {
          throw new Error(
            "Invalid deep-link arguments. For NAVIGATE pass destination; for OPEN_HELP_ARTICLE pass articleSlug; for OPEN_MANAGE_INTEGRATION pass provider.",
          );
        }

        return {
          url: buildAppDeepLinkUrl(action, { apiBaseUrl: resolveBaseUrl(config) }),
          action: action.type,
        };
      },
    }),
  ];
}
