import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { appDeepLinkActionFromToolArgs, buildAppDeepLinkUrl } from "./appDeepLink";

let savedVideogenEnv: string | undefined;

beforeEach(() => {
  savedVideogenEnv = process.env.VIDEOGEN_ENV;
  delete process.env.VIDEOGEN_ENV;
});

afterEach(() => {
  if (savedVideogenEnv == null) {
    delete process.env.VIDEOGEN_ENV;
    return;
  }

  process.env.VIDEOGEN_ENV = savedVideogenEnv;
});

void test("appDeepLinkActionFromToolArgs omits retired locale suggestions", () => {
  assert.deepEqual(
    appDeepLinkActionFromToolArgs({
      action: "OPEN_LANGUAGE_SELECTOR",
      suggestedLocale: "nl",
    }),
    {
      type: "OPEN_LANGUAGE_SELECTOR",
      suggestedLocale: null,
    },
  );
  assert.deepEqual(
    appDeepLinkActionFromToolArgs({
      action: "OPEN_LANGUAGE_SELECTOR",
      suggestedLocale: "zz",
    }),
    {
      type: "OPEN_LANGUAGE_SELECTOR",
      suggestedLocale: null,
    },
  );
  assert.deepEqual(
    appDeepLinkActionFromToolArgs({
      action: "OPEN_LANGUAGE_SELECTOR",
      suggestedLocale: "es",
    }),
    {
      type: "OPEN_LANGUAGE_SELECTOR",
      suggestedLocale: "es",
    },
  );
});

void test("buildAppDeepLinkUrl never emits a retired or unknown locale suggestion", () => {
  assert.equal(
    buildAppDeepLinkUrl(
      {
        type: "OPEN_LANGUAGE_SELECTOR",
        suggestedLocale: "nl",
      },
      { apiBaseUrl: "https://api.videogen.io" },
    ),
    "https://app.videogen.io/settings/account?vg_action=OPEN_LANGUAGE_SELECTOR",
  );
  assert.equal(
    buildAppDeepLinkUrl(
      {
        type: "OPEN_LANGUAGE_SELECTOR",
        suggestedLocale: "zz",
      },
      { apiBaseUrl: "https://api.videogen.io" },
    ),
    "https://app.videogen.io/settings/account?vg_action=OPEN_LANGUAGE_SELECTOR",
  );
  assert.equal(
    buildAppDeepLinkUrl(
      {
        type: "OPEN_LANGUAGE_SELECTOR",
        suggestedLocale: "es",
      },
      { apiBaseUrl: "https://api.videogen.io" },
    ),
    "https://app.videogen.io/settings/account?vg_action=OPEN_LANGUAGE_SELECTOR&vg_locale=es",
  );
});

void test("API host matching is hostname-exact, not a URL substring", () => {
  assert.equal(
    buildAppDeepLinkUrl(
      {
        type: "OPEN_LANGUAGE_SELECTOR",
        suggestedLocale: "es",
      },
      { apiBaseUrl: "https://dev.api.videogen.io" },
    ),
    "https://dev.app.videogen.io/settings/account?vg_action=OPEN_LANGUAGE_SELECTOR&vg_locale=es",
  );
  assert.equal(
    buildAppDeepLinkUrl(
      {
        type: "OPEN_LANGUAGE_SELECTOR",
        suggestedLocale: "es",
      },
      { apiBaseUrl: "https://preview.api.videogen.io" },
    ),
    "http://localhost:3000/settings/account?vg_action=OPEN_LANGUAGE_SELECTOR&vg_locale=es",
  );
});
