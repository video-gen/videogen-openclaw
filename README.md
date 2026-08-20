# @videogen/openclaw-plugin

An [OpenClaw](https://openclaw.ai) plugin that exposes the full [VideoGen](https://videogen.io) API as native OpenClaw tools. Once installed, any OpenClaw agent can generate and edit videos, images, voiceovers, music, and sound effects, run VideoGen workflows, and manage projects and files, all with your own VideoGen API key.

It wraps the official [`@videogen/sdk`](https://www.npmjs.com/package/@videogen/sdk) and mirrors the VideoGen [MCP server](https://docs.videogen.io) surface: the same tool set, registered as first-class OpenClaw tools via `defineToolPlugin`.

## Tools

The plugin registers the full VideoGen tool surface:

- **Workflows:** `script_to_video`, `voiceover_to_video`, `slideshow_to_video`, `storyboard_to_video`, `prompt_to_video_clip`, plus `list_workflow_runs`, `get_workflow_run`, `cancel_workflow_run`.
- **Media generation & editing:** `generate_image`, `generate_video_clip`, `text_to_speech`, `generate_sound_effect`, `generate_music`, `generate_motion_graphic`, `generate_avatar`, `vectorize_image`, `remove_image_background`, `remove_video_background`, `upscale_image`, `upscale_video`, `image_3d_effect`, plus `list_tool_executions`, `get_tool_execution`, `cancel_tool_execution`.
- **Projects:** `list_projects`, `get_project`, `export_project`, `get_project_export`, `remix_project`, `list_project_remix_actions`.
- **Files:** `upload_file`, `create_file_upload`, `get_file`, `list_files`.
- **Entities:** `list_entities`, `create_entity`, `get_entity`, `update_entity`, `archive_entity`, `add_entity_reference`, `remove_entity_reference`.
- **Resources & account:** `list_tts_voices`, `list_languages`, `get_me`, `get_app_deep_link`.

Long-running operations (workflows, media tools, project exports, file processing) start the job and, by default, poll until it reaches a terminal state before returning. Pass `wait: false` to return immediately with the run/execution id, and poll later with the matching `get_*` tool (including `get_project_export` after `export_project`).

The ChatGPT-only `open_uploader` MCP widget is intentionally omitted here; CI enforces OpenClaw ↔ MCP API tool-name parity via `pnpm --filter api run validate:integration-alignment`.

## Install

Publish (npm + ClawHub + GitHub mirror) rides the VideoGen release flow:

```bash
# One-time: ClawHub CLI + auth + @videogen publisher
npm i -g clawhub
clawhub login
clawhub whoami
clawhub publisher create videogen --display-name "VideoGen"

# From the monorepo (also part of publish:all / release:all)
# Publishes with --owner videogen (required for @videogen/openclaw-plugin)
pnpm --filter api run publish:openclaw

# Install into an OpenClaw setup
npm install @videogen/openclaw-plugin
# or: openclaw plugins install clawhub:@videogen/openclaw-plugin
# or: openclaw plugins install npm:@videogen/openclaw-plugin
```

## Configure

Get an API key from [app.videogen.io/api](https://app.videogen.io/api), then provide it via plugin config or an environment variable:

```bash
export VIDEOGEN_API_KEY=sk_videogen_live_...
```

Or set `apiKey` in the plugin's config. To point at a non-production stack (local development, staging), set `baseUrl` in config or the `VIDEOGEN_BASE_URL` environment variable (defaults to `https://api.videogen.io`):

```bash
export VIDEOGEN_BASE_URL=http://localhost:4010
```

## How it works

1. Resolves your VideoGen API key from the plugin config or `VIDEOGEN_API_KEY`, and memoizes one `VideoGenClient` per credential + base URL.
2. Each tool validates its arguments against a TypeBox schema, then calls the corresponding `@videogen/sdk` method.
3. For asynchronous operations, it starts the job and polls the matching status endpoint (`get_workflow_run`, `get_tool_execution`, `get_project` export, or file hydration) until a terminal state, then returns the final snapshot.

## Development

This is a standalone package (its own toolchain, not part of the VideoGen monorepo build). From this directory:

```bash
npm install
npm run build
npm run typecheck
npm run lint
npm test
```

Installed / ClawHub packages load `dist/index.js` (`openclaw.runtimeExtensions`). `npm run build` must produce that file before publish.

After changing the tool set or config schema, regenerate the manifest metadata:

```bash
npx openclaw plugins build
```

`npm test` exercises the pure helper functions (`src/operations.ts`) with Node's built-in test runner and no external dependencies.
