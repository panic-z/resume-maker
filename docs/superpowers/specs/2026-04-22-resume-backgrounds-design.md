# Resume Background Presets Design

## Goal

Add selectable, design-forward resume backgrounds so users are not limited to a plain white page. Background selection must apply consistently in:

- live preview
- exported HTML
- print / PDF export

The feature should feel tasteful and professional, with readability prioritized over decoration.

## User Experience

Backgrounds are a style choice, not a template choice.

- Template selection continues to control typography and layout tone.
- A new background section appears in the existing style panel.
- Users can choose from one plain option plus several geometric decorative presets.
- The selected background updates the preview immediately.
- The same selected background appears in exported HTML and PDF output.

### Background Presets

The first version includes:

- `plain`: pure white
- `corner-frame`: subtle corner framing and fine border treatment
- `soft-arc`: low-contrast curved geometric wash
- `grid-wash`: faint editorial grid / ruled structure
- `editorial-bands`: restrained side and corner bands

All presets must keep the content area readable:

- low contrast decoration
- no full-page heavy gradients
- emphasis near edges and corners
- no texture images or bitmap assets

## Visual Direction

Implementation uses pure CSS backgrounds rather than image assets or SVG files.

Reasons:

- consistent export behavior
- easier theme maintenance
- smaller implementation surface
- no asset pipeline complexity

The visual style should feel modern and intentional rather than ornamental. Decorations should sit behind the content and avoid strong color interference with text.

## Architecture

### New Shared Background Module

Add a shared background definition module, likely `src/lib/backgrounds.ts`, responsible for:

- preset ids
- localized labels
- helper data for UI preview cards
- CSS generation for each preset

This module becomes the single source of truth for:

- style panel choices
- preview styling
- export styling

### Style State

Extend `StyleSettings` with:

- `backgroundPreset`

Storage responsibilities:

- add default value
- validate loaded values against the known preset list
- persist and restore the selected preset

Existing stored style payloads without this field should fall back safely to `plain`.

### Preview Integration

The preview resume container should receive background styling from the shared background module. The background should be applied directly on the `.resume` container so it matches the exported document.

### Export Integration

`buildStandaloneHtml()` should consume the same shared background definition used by preview. This prevents drift between editor preview and exported output.

Print output should preserve the chosen background, while still avoiding layout distortion.

## UI Design

The style panel gains a new labeled section for background selection.

Presentation:

- small visual cards rather than text-only buttons
- each card previews the preset style in miniature
- selected state matches the current style panel interaction model

Behavior:

- clicking a card updates `backgroundPreset`
- reset restores the default background

## Data Flow

1. User selects a background card in the style panel.
2. `onChange()` updates `backgroundPreset` in resume state.
3. `useResume()` persists the updated style object.
4. Preview rerenders with the matching background CSS.
5. Export functions reuse the same preset when building standalone HTML.

## Error Handling and Compatibility

- Unknown stored preset values fall back to `plain`.
- Missing background fields in older saved state remain valid.
- Background generation must not depend on browser-only APIs so export helpers remain testable.

## Testing

### Unit Tests

- storage restores and validates `backgroundPreset`
- background module returns stable CSS / metadata
- standalone export includes the selected background styling

### Component Tests

- style panel renders background choices
- choosing a background sends the correct style patch
- preview receives and applies the selected background

### End-to-End Coverage

- switching backgrounds updates the visible preview
- selected background persists after reload
- exported HTML contains the selected background styling

## Scope Boundaries

Included:

- selectable geometric background presets
- preview and export consistency
- persistence

Not included:

- uploading custom background images
- per-template background defaults beyond the global default
- separate preview-only vs export-only background behavior
- animated backgrounds
