import assert from "node:assert/strict";
import { test } from "node:test";

import { extractControls, sdkRequest } from "./operations";

void test("sdkRequest drops undefined keys and preserves the rest", () => {
  const result = sdkRequest<Record<string, unknown>>({
    prompt: "a cat",
    quality: undefined,
    numResults: 2,
    isOutputTemporary: false,
    aspectRatio: { width: 16, height: 9 },
  });

  assert.deepEqual(result, {
    prompt: "a cat",
    numResults: 2,
    isOutputTemporary: false,
    aspectRatio: { width: 16, height: 9 },
  });
  assert.ok(!("quality" in result));
});

void test("sdkRequest keeps falsy but defined values", () => {
  const result = sdkRequest<Record<string, unknown>>({
    wait: false,
    transparentBackground: false,
    limit: 0,
    cursor: "",
  });

  assert.deepEqual(result, {
    wait: false,
    transparentBackground: false,
    limit: 0,
    cursor: "",
  });
});

void test("extractControls omits undefined controls", () => {
  assert.deepEqual(extractControls({}), {});
  assert.deepEqual(extractControls({ wait: undefined, pollIntervalMs: undefined }), {});
});

void test("extractControls keeps provided controls, including wait: false", () => {
  assert.deepEqual(extractControls({ wait: false, pollIntervalMs: 1000, timeoutMs: 60000 }), {
    wait: false,
    pollIntervalMs: 1000,
    timeoutMs: 60000,
  });
});
