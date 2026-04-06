# SmartPaste Product Direction

## Goal

SmartPaste is a Joomla-native smart paste and controlled content import tool for editors. The future workflow is not "clean everything automatically" and not "paste raw HTML blindly". It is a guided import flow where the user pastes rich content, sees what formatting was detected, chooses what should survive, and inserts controlled HTML into the active editor.

## Target Use Cases

- Paste content from Microsoft Word while removing layout junk but preserving intended structure.
- Import fragments from websites without carrying over brittle inline styles, tracking markup, or widget wrappers.
- Reuse content from email editors and newsletter tools while deciding whether colors, tables, and spacing rules should stay.
- Import content from Google Docs or similar editors into Joomla without locking the workflow to one specific editor integration.
- Give site builders an intentional import flow for controlled HTML rather than depending on whatever the browser paste result happens to be.

## Current Workspace Status

This repository currently provides:

- a Joomla package manifest for `pkg_smartpaste`
- an `editors-xtd` plugin for `plg_editors_xtd_smartpaste`
- a working editor button action id and client-side SmartPaste workspace
- a build script that packages the plugin zip and the package zip

The current workspace already includes a rich paste pad, raw HTML editing, detected-formatting counts, cleanup toggles, a cleaned preview, and final HTML insertion back into the editor. It is still intentionally client-side and early-stage, but it now exercises the real modal workflow rather than a placeholder.

## Practical V1 Scope

The first real product version should aim for:

- one Joomla-native modal launched from the editor toolbar
- a paste/input area that accepts rich pasted content and raw HTML
- a lightweight normalization pass that extracts structure and detects obvious formatting groups
- user-facing toggles for common keep/remove decisions such as inline styles, font families, colors, classes, tables, empty spans, and office-specific markup
- preview of the cleaned result before insertion
- insertion of controlled HTML back into the active editor through the Joomla editor API

V1 should stay focused on reliable import decisions and transparent output, not on solving every rich-text edge case.

## Future Ideas

- grouped formatting analysis with counts and friendly labels
- separate presets for Word-heavy content, website content, and email content
- reusable cleanup profiles per site
- optional safe block transformations for tables, callouts, and legacy layout fragments
- diff view between original and cleaned result
- import warnings for unsupported embeds or script-heavy fragments

## Key Technical Decisions

- Keep the workflow Joomla-native and editor-agnostic through `editors-xtd` plus the shared editor API.
- Treat the modal as the center of the UX, not as a thin editor-specific popup.
- Keep the initial plugin client-side and self-contained until the real parsing and cleaning requirements justify server-side services.
- Use Joomla-native asset loading and namespaced plugin code from the start to avoid retrofitting Joomla 5/6 conventions later.
- Keep package assembly simple: repo source at the top level, installable zips produced into `build/output`.

## Non-Goals

- No JCE-specific implementation.
- No fake AI or fake formatting analysis in the scaffold stage.
- No speculative AJAX endpoints, background services, or database schema before the import model is clear.
- No attempt to become a generic clipboard cleaner divorced from the controlled-import product goal.
