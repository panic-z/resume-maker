# Custom Resume Backgrounds Design

## Goal

Extend the existing background system so users can create their own resume backgrounds instead of being limited to built-in presets.

The custom background feature must apply consistently in:

- live preview
- exported HTML
- print / PDF export where the browser supports background printing

The design should keep readability ahead of decoration and should preserve the current preset workflow.

## User Experience

Backgrounds remain a style choice, not a template choice.

Users can choose among three background modes:

- `preset`: current built-in backgrounds
- `custom-gradient`: user-defined CSS gradient background
- `custom-image`: uploaded image background with readability controls

The selected mode updates the resume preview immediately and uses the same rendered background in exported HTML.

### Background Modes

#### Preset

The current preset cards remain available and continue to work the same way they do now.

#### Custom Gradient

Users can define a restrained custom paper look without writing CSS directly.

The first version includes:

- two color stops
- gradient direction
- decoration softness / opacity control

This mode should still generate tasteful, low-contrast results by default.

#### Custom Image

Users can upload a background image and control how it sits behind the resume content.

The first version includes:

- upload image
- replace image
- remove image
- fit mode: `cover`, `contain`, `repeat`
- image opacity
- white overlay opacity

The image should never be rendered without a readability control available alongside it.

## Visual Direction

The current preset visual language remains intact.

Custom backgrounds should feel consistent with the existing product:

- professional rather than decorative-first
- low visual noise behind text
- readable on both light and medium-complexity images
- export-safe and stable

For custom images, the product defaults should bias toward readable resumes:

- a visible white overlay by default
- non-destructive controls
- no requirement to understand CSS syntax

## Architecture

### Unified Background Model

Replace the current single-field background state with a unified background configuration model.

The style state should include:

- `backgroundMode`
- `backgroundPreset`
- `customGradient`
- `customImage`

`backgroundPreset` remains in use for preset mode so existing saved resumes continue to load cleanly.

`customGradient` stores only the fields needed to generate the gradient background.

`customImage` stores only the fields needed to render the uploaded image and readability overlay.

### Shared Background Generator

Add a shared background generator in the existing background module layer so all modes resolve through one path.

This generator is responsible for producing:

- preview card metadata for built-in presets
- CSS-ready paper background layers
- CSS-ready overlay layers
- mode-aware background sizing / repeat / position rules

Preview and export must both consume the same generated output so the rendered result stays aligned.

### Background Configuration Shape

The model should be explicit rather than overloaded. A representative shape is:

```ts
type BackgroundMode = "preset" | "custom-gradient" | "custom-image";

type BackgroundFit = "cover" | "contain" | "repeat";

interface CustomGradientBackground {
  fromColor: string;
  toColor: string;
  direction: "to-bottom" | "to-bottom-right" | "to-right";
  softness: number;
}

interface CustomImageBackground {
  dataUrl: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  fit: BackgroundFit;
  imageOpacity: number;
  overlayOpacity: number;
}
```

Exact field names can vary in implementation, but the separation of concerns should remain the same.

## Storage and Persistence

### Local Persistence

Custom background settings persist in the same style storage as other resume style controls.

This includes:

- selected background mode
- selected preset id
- custom gradient parameters
- custom image configuration

### Image Storage Format

Uploaded background images should be converted to a data URL and stored in local style state so they survive reloads in the same browser.

This also allows standalone HTML export to embed the same background without additional assets.

### Storage Guardrails

Custom images need safety limits because they can exhaust local storage or create oversized export files.

The first version should include:

- accepted image types limited to PNG, JPEG, and WebP
- file size limit before import, initially `1.5 MB`
- user-facing error state when import is rejected

If local persistence fails due to storage limits:

- the editor should keep the current in-memory background as long as the page session survives
- the app should not crash
- the UI should explain that the image could not be saved for future reloads

## Preview and Export Integration

### Preview

The resume preview container should render the background generated from the selected mode.

Custom gradient and custom image backgrounds should use the same background composition contract as presets:

- paper layer
- decorative or image layer
- readability overlay where needed

### Export

`buildStandaloneHtml()` should embed the same background output used in preview.

For custom image backgrounds, the exported HTML should include the same data URL stored in state so a downloaded HTML file remains self-contained.

### Print / PDF

PDF export continues to rely on the standalone HTML print flow.

The system should retain the current print-color-adjust safeguards, but the product should only promise:

- custom backgrounds are included in exported HTML
- PDF / print keeps them when the browser honors background printing

The implementation should not claim identical rendering across every print engine for very large or complex images.

## UI Design

The existing background section in the style panel becomes a mode-based editor.

### Mode Switcher

At the top of the background section, users choose:

- preset
- custom gradient
- custom image

This should be a simple segmented control or compact button group that matches the current style panel language.

### Preset Mode UI

Keep the existing visual preset cards.

### Custom Gradient UI

Show form-style controls for:

- primary color
- secondary color
- direction
- softness / opacity

The preview should update instantly as the controls change.

### Custom Image UI

Show controls for:

- upload
- replace
- remove
- fit mode
- image opacity
- white overlay opacity

Also show a short note that image backgrounds can increase export size.

## Data Flow

1. User selects a background mode.
2. User adjusts preset, gradient, or image controls.
3. `onChange()` updates the background portion of style state.
4. `useResume()` persists the updated style object where possible.
5. The shared background generator converts the active mode into renderable CSS layers.
6. Preview rerenders with the new background.
7. Export functions reuse the same generated background output.

## Error Handling and Compatibility

- Older saved resumes with only `backgroundPreset` should load as `preset` mode automatically.
- Unknown background modes should fall back to `preset` with `plain`.
- Invalid custom gradient fields should fall back to safe defaults.
- Invalid or missing image payloads should fall back to `plain` or the nearest safe state instead of breaking rendering.
- Upload rejection should be handled in UI without losing the rest of the style state.
- Removing a custom image should switch the editor back to `preset` mode with the `plain` background.

## Testing

### Unit Tests

- storage restores old preset-only payloads into the new background model
- storage validates unknown modes and invalid image payloads
- background generator returns stable output for preset, custom-gradient, and custom-image modes
- standalone export includes embedded custom image data when present

### Component Tests

- style panel renders the background mode switcher
- preset mode still updates preset backgrounds
- custom gradient controls send the correct style patch
- custom image upload and remove actions update style state
- preview receives and applies generated custom background layers

### End-to-End Coverage

- switching from preset to custom gradient updates the visible preview
- custom gradient persists after reload
- uploading a custom image updates the preview
- custom image persists after reload when within storage limits
- exported HTML contains the selected custom image data URL
- invalid image uploads show an error and do not corrupt existing style state

## Scope Boundaries

Included:

- keep built-in presets
- add custom gradient backgrounds
- add custom image backgrounds
- local persistence for custom background state
- self-contained HTML export for custom image backgrounds
- readability controls for image backgrounds

Not included:

- remote image URLs
- server-side asset storage or sync
- drag-to-position image editor
- cropping tools
- per-template default custom backgrounds
- background animation
- arbitrary freeform CSS background text input
