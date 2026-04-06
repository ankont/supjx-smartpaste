# SmartPaste for Joomla

SmartPaste is a Joomla-native smart paste and controlled content import project for editors.

The intended long-term workflow is:

1. Click a toolbar button in a Joomla editor.
2. Open a modal dedicated to controlled import.
3. Paste rich content from Word, websites, email editors, Google Docs, or similar sources.
4. Inspect formatting groups that were detected.
5. Choose what should be kept or removed.
6. Insert cleaned, controlled HTML back into the active editor.

This repository now provides an installable Joomla starter package plus an early working SmartPaste workspace for future development.

## What Is Included

Current extensions in this suite:

- `pkg_smartpaste`
- `plg_editors_xtd_smartpaste`

Current repository structure:

- `build/` for packaging scripts and generated installable artifacts
- `package/` for the package manifest and package language files
- `plugins/editors-xtd/smartpaste/` for the actual plugin source
- `docs/` for practical planning and product direction

## Current Status

The current package gives you:

- a Joomla 5.4+ / 6.x package manifest
- a Joomla-correct `editors-xtd` plugin manifest and namespace structure
- DI service provider wiring for Joomla 5-style plugin bootstrapping
- a working editor toolbar button registered with the action id `supersoft-smartpaste`
- a real client-side SmartPaste workspace opened from the editor toolbar
- a rich paste pad, raw HTML source area, detected-formatting summary, cleanup toggles, clean preview, and generated HTML output
- insertion of cleaned HTML back into the active editor using the shared Joomla editor button API
- English and Greek language files for the package and plugin
- a straightforward PowerShell build script for producing installable zip files

This is still an early implementation. The workspace is client-side only and intentionally conservative, but it already supports a realistic inspect-clean-preview-insert flow.

## Architectural Direction

SmartPaste is being built with these constraints in mind:

- Joomla-native first
- editor-agnostic rather than locked to one editor implementation
- centered on an `editors-xtd` modal workflow
- focused on controlled content import, not just blind paste cleanup

That means the product direction is not "clean whatever the browser pasted" and not "make a JCE-only helper". The goal is a clear import step where users can understand and control what survives.

## Roadmap

Near-term next steps:

- improve the cleanup rules with stronger Word-specific handling and better table/image transformations
- introduce presets and reusable cleanup profiles
- evolve the client-side workspace into a more explicit internal import model

Likely later work:

- cleanup presets for common paste sources
- stronger handling of Word-specific markup
- reusable import preferences
- richer preview and diff tools

## Build and Package

From the repository root, use either:

```powershell
.\build.bat
```

or:

```powershell
powershell -ExecutionPolicy Bypass -File .\build\build.ps1
```

The build creates:

- `build/output/plg_editors_xtd_smartpaste.zip`
- `build/output/pkg_smartpaste_v0.2.3.zip`

The package zip is the normal installer artifact for Joomla. The plugin zip is also produced separately for convenience.

## Install

1. Build the package.
2. In Joomla administrator, install `build/output/pkg_smartpaste_v0.2.3.zip`.
3. Enable `Button - SuperSoftJx - SmartPaste` if it is not enabled automatically.
4. Open a supported editor in the administrator area and confirm the `SmartPaste` button appears.
5. Click the button to open the SmartPaste workspace, paste test content, review the preview, and insert cleaned HTML.

## Development Notes

- No local PHP checks are run from this repository because PHP is not available in the current environment.
- No local Joomla runtime tests are included in this scaffold.
- Manual install/runtime verification is expected on a Joomla dev site.

Additional product direction is documented in [docs/plan.md](docs/plan.md).
