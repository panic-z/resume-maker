import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadContent, saveContent, loadTemplate, saveTemplate, loadLanguage, loadStyle } from "./storage";
import { readBackgroundImage } from "./background-utils";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockNavigatorLanguage(language: string, languages = [language]) {
  vi.stubGlobal("navigator", {
    language,
    languages,
  });
}

describe("loadContent", () => {
  it("returns null when nothing is stored", () => {
    expect(loadContent()).toBeNull();
  });

  it("returns stored content", () => {
    localStorage.setItem("resume-maker:content", "# Hello");
    expect(loadContent()).toBe("# Hello");
  });
});

describe("saveContent", () => {
  it("saves content to localStorage", () => {
    saveContent("# Test");
    expect(localStorage.getItem("resume-maker:content")).toBe("# Test");
  });
});

describe("loadTemplate", () => {
  it("returns 'classic' when nothing is stored", () => {
    expect(loadTemplate()).toBe("classic");
  });

  it("returns stored template", () => {
    localStorage.setItem("resume-maker:template", "modern");
    expect(loadTemplate()).toBe("modern");
  });
});

describe("saveTemplate", () => {
  it("saves template to localStorage", () => {
    saveTemplate("modern");
    expect(localStorage.getItem("resume-maker:template")).toBe("modern");
  });
});

describe("loadStyle", () => {
  it("loads old preset-only payloads as preset mode", () => {
    localStorage.setItem("resume-maker:style", JSON.stringify({ backgroundPreset: "grid-wash" }));

    expect(loadStyle()).toMatchObject({
      backgroundMode: "preset",
      backgroundPreset: "grid-wash",
    });
  });

  it("restores a stored background preset when valid", () => {
    localStorage.setItem("resume-maker:style", JSON.stringify({ backgroundPreset: "grid-wash" }));
    expect(loadStyle()).toMatchObject({ backgroundPreset: "grid-wash" });
  });

  it("falls back to the plain background for unknown stored presets", () => {
    localStorage.setItem("resume-maker:style", JSON.stringify({ backgroundPreset: "mystery" }));
    expect(loadStyle()).toMatchObject({ backgroundPreset: "plain" });
  });

  it("falls back to preset mode while preserving a valid stored preset when a custom image payload is invalid", () => {
    localStorage.setItem(
      "resume-maker:style",
      JSON.stringify({
        backgroundMode: "custom-image",
        backgroundPreset: "grid-wash",
        customImage: {
          src: "",
          fit: "zoom",
        },
      }),
    );

    expect(loadStyle()).toMatchObject({
      backgroundMode: "preset",
      backgroundPreset: "grid-wash",
      customImage: null,
    });
  });

  it("restores a stored custom image payload when valid", () => {
    localStorage.setItem(
      "resume-maker:style",
      JSON.stringify({
        backgroundMode: "custom-image",
        backgroundPreset: "soft-arc",
        customImage: {
          mode: "custom-image",
          src: "data:image/png;base64,abc123",
          fit: "contain",
        },
      }),
    );

    expect(loadStyle()).toMatchObject({
      backgroundMode: "custom-image",
      backgroundPreset: "soft-arc",
      customImage: {
        mode: "custom-image",
        src: "data:image/png;base64,abc123",
        fit: "contain",
      },
    });
  });

  it("falls back to preset mode when a stored custom image src is not a supported data URL", () => {
    localStorage.setItem(
      "resume-maker:style",
      JSON.stringify({
        backgroundMode: "custom-image",
        backgroundPreset: "grid-wash",
        customImage: {
          mode: "custom-image",
          src: "https://example.com/background.png",
          fit: "cover",
        },
      }),
    );

    expect(loadStyle()).toMatchObject({
      backgroundMode: "preset",
      backgroundPreset: "grid-wash",
      customImage: null,
    });
  });

  it("preserves inactive custom backgrounds while preset mode is selected", () => {
    localStorage.setItem(
      "resume-maker:style",
      JSON.stringify({
        backgroundMode: "preset",
        backgroundPreset: "corner-frame",
        customGradient: {
          mode: "custom-gradient",
          direction: "to-right",
          from: "#112233",
          to: "#445566",
        },
        customImage: {
          mode: "custom-image",
          src: "data:image/png;base64,abc123",
          fit: "contain",
        },
      }),
    );

    expect(loadStyle()).toMatchObject({
      backgroundMode: "preset",
      backgroundPreset: "corner-frame",
      customGradient: {
        mode: "custom-gradient",
        direction: "to-right",
        from: "#112233",
        to: "#445566",
      },
      customImage: {
        mode: "custom-image",
        src: "data:image/png;base64,abc123",
        fit: "contain",
      },
    });
  });
});

describe("loadLanguage", () => {
  it("returns stored language when present", () => {
    localStorage.setItem("resume-maker:language", "zh");
    mockNavigatorLanguage("en-US");
    expect(loadLanguage()).toBe("zh");
  });

  it("falls back to browser english by default", () => {
    mockNavigatorLanguage("en-US");
    expect(loadLanguage()).toBe("en");
  });

  it("falls back to chinese when browser language is chinese", () => {
    mockNavigatorLanguage("zh-CN");
    expect(loadLanguage()).toBe("zh");
  });
});

describe("readBackgroundImage", () => {
  it("rejects unsupported background image mime types", async () => {
    const file = new File(["hello"], "background.gif", { type: "image/gif" });

    await expect(readBackgroundImage(file)).resolves.toEqual({
      ok: false,
      code: "unsupported-type",
    });
  });

  it("rejects background images larger than 1.5 MB", async () => {
    const file = new File([new Uint8Array(1_500_001)], "background.png", { type: "image/png" });

    await expect(readBackgroundImage(file)).resolves.toEqual({
      ok: false,
      code: "file-too-large",
    });
  });

  it("returns a data url when the uploaded image is decodable", async () => {
    class MockImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_value: string) {
        queueMicrotask(() => {
          this.onload?.();
        });
      }
    }

    vi.stubGlobal("Image", MockImage);

    const file = new File(["hello"], "background.png", { type: "image/png" });

    await expect(readBackgroundImage(file)).resolves.toMatchObject({
      ok: true,
      mimeType: "image/png",
      dataUrl: "data:image/png;base64,aGVsbG8=",
    });
  });

  it("rejects a labeled image when it cannot be decoded", async () => {
    class MockImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_value: string) {
        queueMicrotask(() => {
          this.onerror?.();
        });
      }
    }

    vi.stubGlobal("Image", MockImage);

    const file = new File(["not a real png"], "background.png", { type: "image/png" });

    await expect(readBackgroundImage(file)).resolves.toEqual({
      ok: false,
      code: "read-failed",
    });
  });
});
