# Import Feature Design

## Goal

Add a unified `Import` entry to the app that lets users bring resume data into the editor from:

- Markdown files (`.md`)
- Resume Maker project snapshots (`.json`)
- PDF files (`.pdf`, experimental)

The import flow should feel consistent with the existing export flow, stay fully client-side, and protect users from accidental overwrite.

## Scope

Included in this design:

- Toolbar import entry and file picking flow
- File-type-specific import behavior
- State restoration rules
- Validation and error handling
- PDF text extraction and Markdown conversion strategy
- Tests for parser logic, UI flow, and end-to-end happy paths

Out of scope for this iteration:

- Perfect PDF layout reconstruction
- OCR for scanned/image-only PDFs
- Batch imports
- Drag-and-drop import
- Merge/append mode
- Importing images or external assets embedded in PDFs

## User Experience

### Entry Point

Add an `Import` dropdown next to the existing `Export` dropdown in the toolbar.

Menu items:

- `Markdown`
- `Project JSON`
- `PDF (Experimental)`

Each item opens the native file picker restricted to the matching extension.

### Confirmation Rules

Before applying imported data, show a confirmation step:

- Markdown: confirm that current resume content will be replaced
- Project JSON: confirm that the full current project state will be replaced
- PDF: confirm that current resume content will be replaced and that PDF parsing is best-effort

Suggested copy intent:

- Markdown: replace current resume text only
- JSON: replace content, template, style, custom CSS, and language
- PDF: replace current resume text with extracted text converted into basic Markdown, with possible cleanup needed afterward

### Success Behavior

On success:

- Close the import menu
- Apply the imported state immediately
- Update the preview immediately
- Persist through existing autosave behavior without extra user action

### Failure Behavior

On failure:

- Keep current editor state unchanged
- Show a visible, localized error message
- Leave the user in the current workspace

## Behavior By File Type

### Markdown Import

Behavior:

- Read the file as UTF-8 text
- Replace only the current Markdown content
- Preserve template, global style, custom CSS, and language

Rationale:

- This matches the common “bring resume text in, keep current formatting setup” workflow

### Project JSON Import

Behavior:

- Parse a full Resume Maker snapshot
- Restore:
  - Markdown content
  - Template
  - Style settings
  - Custom CSS
  - Language
- Validate imported values using the same rules already used by storage loading
- Invalid or missing fields fall back safely instead of breaking the app

Rationale:

- This is the “restore my whole project” path and should round-trip cleanly with future JSON export/import workflows

### PDF Import

Behavior:

- Parse PDF text in the browser
- Extract text content in reading order as well as the library allows
- Convert extracted text into basic Markdown
- Replace only the current Markdown content
- Preserve template, style, custom CSS, and language

Limitations to state clearly in UI:

- Works best for text-based PDFs
- Complex two-column layouts may import in imperfect order
- Tables and advanced layout may flatten poorly
- Scanned PDFs may fail or produce little/no text

Rationale:

- The first useful version is “editable text recovery,” not “exact PDF reconstruction”

## Architecture

### New Import Module

Add a new import-focused module under `src/lib/`, responsible for:

- File type detection
- File reading
- JSON parsing and normalization
- PDF text extraction
- Markdown conversion
- Standardized error codes

This keeps parsing and validation logic out of React components.

Suggested responsibilities:

- `readImportedFile(file)`
- `parseImportedMarkdown(text)`
- `parseImportedProjectJson(text)`
- `parseImportedPdf(file)`
- `normalizeImportedProjectState(input)`

### State Application

Extend `useResume` with explicit import actions instead of requiring components to manually coordinate multiple setters.

Suggested actions:

- `importMarkdown(markdown: string)`
- `importProject(snapshot: ImportedProjectState)`

These actions should:

- Update the relevant state slices atomically
- Keep current autosave/persistence behavior intact

### Toolbar Integration

The toolbar should own only:

- Import menu open/close state
- Hidden file inputs or picker triggers
- Confirmation prompts
- Temporary error display
- Calling the hook’s import actions after successful parsing

The toolbar should not own parsing logic.

## Data Model

### Imported Project Snapshot Shape

The JSON import format should contain:

- `markdown`
- `template`
- `style`
- `customCss`
- `language`

Validation rules:

- `markdown`: string, fallback to existing/default content if invalid
- `template`: must be one of the known templates
- `style`: normalized with the same validation rules as `loadStyle`
- `customCss`: string fallback to empty string
- `language`: `zh` or `en`

To keep implementation focused, versioning is optional in this first pass. If added, it should be ignored safely when unknown rather than blocking import.

## PDF Parsing Strategy

### Recommended Approach

Use a browser-side PDF parsing library to extract text items from each page and join them into a rough text representation.

Conversion strategy for v1:

- Preserve blank-line-separated blocks
- Convert likely heading lines into Markdown headings when confidence is reasonable
- Preserve line breaks conservatively rather than trying to over-structure content

Practical heuristic target:

- Recover readable, editable text
- Avoid aggressive formatting guesses that create messy Markdown

If the extracted result is empty or near-empty, treat it as a failure and show the localized PDF import error.

## Error Handling

Normalize failures to stable error codes so UI messaging stays simple.

Suggested codes:

- `unsupported-type`
- `read-failed`
- `invalid-json`
- `invalid-project`
- `pdf-parse-failed`
- `pdf-empty`

UI mapping:

- Unsupported file: “Only Markdown, JSON, or PDF files are supported”
- Read failure: “Failed to read file”
- Invalid JSON/project: “Project file format is invalid”
- PDF parse failure: “Could not extract editable text from this PDF”
- Empty PDF result: “No editable text was found in this PDF”

## Testing Plan

### Unit Tests

Cover the import module for:

- Markdown import success
- JSON import success
- JSON validation fallback behavior
- Unsupported file types
- Read failures
- PDF parse success with extracted text
- PDF parse failure
- Empty PDF extraction result

### Component Tests

Cover toolbar import flow for:

- Opening import options
- Triggering file selection
- Confirmation gating
- Error display
- Applying Markdown import without changing style/template
- Applying JSON import across full project state

### End-to-End Tests

Cover:

- Import Markdown and verify preview updates
- Import JSON and verify template/style/custom CSS restoration
- Import PDF and verify extracted text appears in editor and preview

PDF E2E should use a stable fixture chosen for easy extraction rather than a complex real-world layout.

## Risks

### PDF Extraction Quality

Risk:

- Real PDFs vary wildly in structure

Mitigation:

- Label PDF import experimental
- Keep heuristics conservative
- Treat failures clearly instead of pretending success

### State Overwrite Confusion

Risk:

- Users may unintentionally lose current work

Mitigation:

- Explicit confirmation before apply
- Clear distinction between Markdown-only and full-project replacement

### Tight Toolbar Space

Risk:

- Another action in the toolbar may make compact layouts feel crowded

Mitigation:

- Mirror the existing export dropdown pattern instead of adding multiple buttons
- Reuse compact layout rules already present in the toolbar

## Recommended Implementation Order

1. Add import parsing/normalization module
2. Add hook-level import actions
3. Add toolbar import UI for Markdown and JSON
4. Add PDF parsing and experimental PDF import path
5. Add tests across unit, component, and E2E layers

## Success Criteria

The feature is complete when:

- Users can import `.md`, `.json`, and `.pdf` from the toolbar
- Markdown import replaces only Markdown content
- JSON import restores the full project state safely
- PDF import extracts editable text into Markdown with clear experimental messaging
- Invalid imports do not corrupt existing state
- The new behavior is covered by unit, component, and E2E tests
