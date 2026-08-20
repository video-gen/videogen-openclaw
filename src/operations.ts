const TERMINAL_STATUSES = new Set(["succeeded", "failed", "cancelled", "canceled"]);
const DEFAULT_POLL_INTERVAL_MS = 3000;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

export type PollControls = {
  wait?: boolean;
  pollIntervalMs?: number;
  timeoutMs?: number;
};

/**
 * Prepares a parsed tool-arguments object for a typed SDK request: strips
 * `undefined` keys and pins the loose runtime shape to the SDK's precise request
 * type `T`. Optional tool fields arrive as `T | undefined`, but the SDK's
 * request types declare optionals as plain `T?` which, under
 * `exactOptionalPropertyTypes`, rejects an explicit `undefined` — so the empty
 * keys are dropped. The API validates every field, so this boundary assertion
 * only bridges the JSON-Schema wire shape to the SDK type. Mirrors the VideoGen
 * MCP server's approach.
 */
export function sdkRequest<T>(obj: object): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result as unknown as T;
}

/** Normalizes optional poll-control inputs (which may be undefined) into a compact PollControls object. */
export function extractControls(args: {
  wait?: boolean | undefined;
  pollIntervalMs?: number | undefined;
  timeoutMs?: number | undefined;
}): PollControls {
  return {
    ...(args.wait != null ? { wait: args.wait } : {}),
    ...(args.pollIntervalMs != null ? { pollIntervalMs: args.pollIntervalMs } : {}),
    ...(args.timeoutMs != null ? { timeoutMs: args.timeoutMs } : {}),
  };
}

function readStringField(data: unknown, key: string): string | undefined {
  if (typeof data !== "object" || data == null) {
    return undefined;
  }

  const value = (data as Record<string, unknown>)[key];

  return typeof value === "string" ? value : undefined;
}

function getIsTerminal(data: unknown): boolean {
  const status = readStringField(data, "status");

  if (status != null && TERMINAL_STATUSES.has(status.toLowerCase())) {
    return true;
  }

  return readStringField(data, "downloadUrl") != null;
}

/**
 * A repeated `signal?.aborted` read looks to the compiler like an impossible
 * comparison after the loop condition, so wrap it to keep the live-getter read
 * from being narrowed away across an `await`.
 */
function isAborted(signal: AbortSignal | null | undefined): boolean {
  return signal?.aborted === true;
}

function delay(ms: number, signal: AbortSignal | null | undefined): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted === true) {
      resolve();

      return;
    }

    const timer = setTimeout(resolve, ms);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/**
 * Starts an async operation, then (unless `wait` is false) polls it until it
 * reaches a terminal status, returning the final snapshot. When `wait` is false
 * or no id is returned, returns the start response so the caller can poll later.
 */
export async function runComposite(args: {
  start: () => Promise<unknown>;
  poll: (id: string) => Promise<unknown>;
  idKey: "workflowRunId" | "toolExecutionId" | "exportId";
  controls: PollControls;
  signal?: AbortSignal | undefined;
}): Promise<unknown> {
  const started = await args.start();
  const id = readStringField(started, args.idKey);

  if (args.controls.wait === false || id == null) {
    return started;
  }

  const intervalMs = args.controls.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const deadline = Date.now() + (args.controls.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let snapshot = await args.poll(id);

  while (!getIsTerminal(snapshot) && Date.now() < deadline && !isAborted(args.signal)) {
    await delay(intervalMs, args.signal);

    if (isAborted(args.signal)) {
      break;
    }

    snapshot = await args.poll(id);
  }

  return snapshot;
}

/**
 * Polls an already-identified resource until `isReady` (e.g. a freshly uploaded
 * file whose renditions have finished processing). Throws when the resource
 * never becomes ready within the timeout so the model does not treat a
 * still-processing file as done.
 */
export async function awaitReady(args: {
  poll: () => Promise<unknown>;
  isReady: (snapshot: unknown) => boolean;
  controls: PollControls;
  signal?: AbortSignal | undefined;
}): Promise<unknown> {
  const intervalMs = args.controls.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const deadline = Date.now() + (args.controls.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let snapshot = await args.poll();

  while (!args.isReady(snapshot) && Date.now() < deadline && !isAborted(args.signal)) {
    await delay(intervalMs, args.signal);

    if (isAborted(args.signal)) {
      break;
    }

    snapshot = await args.poll();
  }

  if (!args.isReady(snapshot)) {
    throw new Error(
      `The file is still processing and did not become ready in time. Try get_file again in a moment, or increase timeoutMs. Latest state:\n${JSON.stringify(snapshot, null, 2)}`,
    );
  }

  return snapshot;
}
