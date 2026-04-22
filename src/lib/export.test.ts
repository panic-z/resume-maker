import { afterEach, describe, expect, it, vi } from "vitest";
import { buildStandaloneHtml, exportPdf, resumePaperBackgroundContract, resumePaperBackgroundCssText } from "./export";
import { DEFAULT_STYLE } from "./storage";
import { resolveBackgroundLayers, type CustomGradientBackground, type CustomImageBackground } from "./backgrounds";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("buildStandaloneHtml", () => {
  it("wraps resume HTML in a standalone document", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", DEFAULT_STYLE);
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("<h1>Name</h1>");
    expect(result).toContain("template-classic");
    expect(result).toContain("<style>");
  });

  it("uses the correct template class", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "modern", DEFAULT_STYLE);
    expect(result).toContain("template-modern");
  });

  it("inlines custom style variables", () => {
    const style = { ...DEFAULT_STYLE, fontSize: 16, accentColor: "#ef4444" };
    const result = buildStandaloneHtml("<h1>Name</h1>", "modern", style);
    expect(result).toContain("--resume-font-size:16px");
    expect(result).toContain("--resume-accent:#ef4444");
  });

  it("uses the requested document language in standalone exports", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", DEFAULT_STYLE, "", "en");
    expect(result).toContain('<html lang="en">');
  });

  it("escapes inline style attribute values so exported HTML stays valid", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", DEFAULT_STYLE);
    expect(result).toContain("&quot;Noto Serif SC&quot;");
    expect(result).not.toContain('style="--resume-font-size:14px;--resume-line-height:1.6;--resume-accent:#000000;--resume-font-family:Georgia, "Noto Serif SC"');
  });

  it("scopes custom CSS with standard selectors instead of CSS nesting", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", DEFAULT_STYLE, ".resume-name { color: red; }");
    expect(result).toContain(".resume .resume-name {");
    expect(result).toContain("color: red;");
    expect(result).not.toContain(".resume {\n.resume-name { color: red; }\n}");
  });

  it("escapes closing style tags inside custom CSS so exports cannot break out of the style block", () => {
    const result = buildStandaloneHtml(
      "<h1>Name</h1>",
      "classic",
      DEFAULT_STYLE,
      ".resume-name { color: red; }</style><script>window.__resumeMakerXss = true</script><style>",
    );
    expect(result).not.toContain("</style><script>window.__resumeMakerXss = true</script><style>");
    expect(result).toContain('<\\/style><script>window.__resumeMakerXss = true</script><style>');
  });

  it("preserves valid CSS values that contain HTML-like characters", () => {
    const result = buildStandaloneHtml(
      "<h1>Name</h1>",
      "classic",
      DEFAULT_STYLE,
      '.resume-name::after { content: "> & <"; }',
    );
    expect(result).toContain('.resume .resume-name::after {');
    expect(result).toContain('content: "> & <";');
    expect(result).not.toContain('content: "&gt; &amp; &lt;";');
  });

  it("includes selected geometric background styling in standalone exports", () => {
    const style = { ...DEFAULT_STYLE, backgroundPreset: "grid-wash" } as const;
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", style);
    expect(result).toContain(resumePaperBackgroundCssText());
    expect(result).toContain(`background-color: ${resumePaperBackgroundContract.backgroundColor};`);
    expect(result).toContain(`background-image: ${resumePaperBackgroundContract.backgroundImage};`);
    expect(result).toContain("--resume-paper-background-repeat:repeat, repeat, no-repeat");
    expect(result).toContain("--resume-paper-background-size:32px 32px, 32px 32px, cover");
    expect(result).toContain(`background-repeat: ${resumePaperBackgroundContract.backgroundRepeat};`);
    expect(result).toContain(`background-size: ${resumePaperBackgroundContract.backgroundSize};`);
    expect(result).toContain(`background-position: ${resumePaperBackgroundContract.backgroundPosition};`);
    expect(result).toContain("-webkit-print-color-adjust: exact;");
    expect(result).toContain("print-color-adjust: exact;");
  });

  it("serializes a custom gradient background into standalone exports", () => {
    const customGradient = {
      mode: "custom-gradient",
      direction: "to-bottom-right",
      from: "#111827",
      to: "#f8fafc",
    } satisfies CustomGradientBackground;

    expect(resolveBackgroundLayers(customGradient)).toMatchObject({
      mode: "custom-gradient",
      id: "custom-gradient",
      paperBackground: "linear-gradient(135deg, #111827 0%, #f8fafc 100%)",
      paperOverlay: "none, none",
      backgroundRepeat: "no-repeat, no-repeat, no-repeat",
      backgroundSize: "cover, cover, cover",
    });
  });

  it("serializes repeating custom image backgrounds safely", () => {
    const customImage = {
      mode: "custom-image",
      src: 'https://example.com/image "quoted".png?x=1&y=2',
      fit: "repeat",
    } satisfies CustomImageBackground;

    const resolved = resolveBackgroundLayers(customImage);
    expect(resolved.backgroundRepeat).toBe("no-repeat, no-repeat, repeat");
    expect(resolved.paperBackground).toContain('https://example.com/image \\"quoted\\".png?x=1&y=2');
  });

  it("uses shared background output for custom image backgrounds in standalone exports", () => {
    const style = {
      ...DEFAULT_STYLE,
      backgroundMode: "custom-image" as const,
      customImage: {
        mode: "custom-image" as const,
        src: 'https://example.com/background "pattern".png?x=1&y=2',
        fit: "repeat" as const,
      },
    };

    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", style);
    expect(result).toContain('--resume-paper-background:url(&quot;https://example.com/background \\&quot;pattern\\&quot;.png?x=1&amp;y=2&quot;)');
    expect(result).toContain("--resume-paper-background-repeat:no-repeat, no-repeat, repeat");
    expect(result).toContain("--resume-paper-background-size:auto, auto, auto");
    expect(result).toContain(`background-image: ${resumePaperBackgroundContract.backgroundImage};`);
    expect(result).toContain(`background-repeat: ${resumePaperBackgroundContract.backgroundRepeat};`);
    expect(result).toContain(`background-size: ${resumePaperBackgroundContract.backgroundSize};`);
    expect(result).toContain(`background-position: ${resumePaperBackgroundContract.backgroundPosition};`);
  });

  it("uses shared background output for custom gradient backgrounds in standalone exports", () => {
    const style = {
      ...DEFAULT_STYLE,
      backgroundMode: "custom-gradient" as const,
      customGradient: {
        mode: "custom-gradient" as const,
        direction: "to-right" as const,
        from: "#111827",
        to: "#f8fafc",
      },
    };

    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", style);
    expect(result).toContain(
      "--resume-paper-background:linear-gradient(90deg, #111827 0%, #f8fafc 100%)",
    );
    expect(result).toContain("--resume-paper-overlay:none, none");
    expect(result).toContain("--resume-paper-background-repeat:no-repeat, no-repeat, no-repeat");
    expect(result).toContain("--resume-paper-background-size:cover, cover, cover");
    expect(result).toContain(`background-image: ${resumePaperBackgroundContract.backgroundImage};`);
    expect(result).toContain(`background-repeat: ${resumePaperBackgroundContract.backgroundRepeat};`);
    expect(result).toContain(`background-size: ${resumePaperBackgroundContract.backgroundSize};`);
    expect(result).toContain(`background-position: ${resumePaperBackgroundContract.backgroundPosition};`);
  });
});

describe("exportPdf", () => {
  it("waits for document fonts before printing an already-loaded export window", async () => {
    vi.useFakeTimers();

    let resolveFonts!: () => void;
    const fontsReady = new Promise<void>((resolve) => {
      resolveFonts = resolve;
    });

    const print = vi.fn();
    const printWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
        readyState: "complete",
        fonts: {
          ready: fontsReady,
        },
      },
      print,
      addEventListener: vi.fn(),
    };

    vi.spyOn(window, "open").mockReturnValue(printWindow as unknown as Window);

    exportPdf("<h1>Name</h1>", "classic", DEFAULT_STYLE);

    expect(printWindow.document.write).toHaveBeenCalled();
    expect(print).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1_999);
    expect(print).not.toHaveBeenCalled();

    resolveFonts();
    await Promise.resolve();
    await vi.runAllTimersAsync();

    expect(print).toHaveBeenCalledTimes(1);
  });

  it("falls back to printing if export window fonts never finish loading", async () => {
    vi.useFakeTimers();

    const print = vi.fn();
    const printWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
        readyState: "complete",
        fonts: {
          ready: new Promise<void>(() => {}),
        },
      },
      print,
      addEventListener: vi.fn(),
    };

    vi.spyOn(window, "open").mockReturnValue(printWindow as unknown as Window);

    exportPdf("<h1>Name</h1>", "classic", DEFAULT_STYLE);

    await vi.advanceTimersByTimeAsync(3_000);

    expect(print).toHaveBeenCalledTimes(1);
  });

  it("skips printing when the export window is closed before readiness finishes", async () => {
    vi.useFakeTimers();

    const print = vi.fn();
    const printWindow = {
      closed: false,
      document: {
        write: vi.fn(),
        close: vi.fn(),
        readyState: "complete",
        fonts: {
          ready: new Promise<void>(() => {}),
        },
      },
      print,
      addEventListener: vi.fn(),
    };

    vi.spyOn(window, "open").mockReturnValue(printWindow as unknown as Window);

    exportPdf("<h1>Name</h1>", "classic", DEFAULT_STYLE);

    printWindow.closed = true;
    await vi.advanceTimersByTimeAsync(3_000);

    expect(print).not.toHaveBeenCalled();
  });
});
