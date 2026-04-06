# SmartPaste for Joomla

SmartPaste is a Joomla-native smart paste and controlled content import project for editors.

The intended long-term workflow is:

1. Click a toolbar button in a Joomla editor.
2. Open a modal dedicated to controlled import.
3. Paste rich content from Word, websites, email editors, Google Docs, or similar sources.
4. Inspect formatting groups that were detected.
5. Choose what should be kept or removed.
6. Insert cleaned, controlled HTML back into the active editor.

This repository does not implement the full product yet. It provides a clean, realistic starter scaffold for future development.

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

The scaffold currently gives you:

- a Joomla 5.4+ / 6.x package manifest
- a Joomla-correct `editors-xtd` plugin manifest and namespace structure
- DI service provider wiring for Joomla 5-style plugin bootstrapping
- a working editor toolbar button registered with the action id `supersoft-smartpaste`
- a lightweight modal placeholder workflow loaded through `WebAssetManager`
- placeholder insertion back into the active editor using the shared Joomla editor button API
- English and Greek language files for the package and plugin
- a straightforward PowerShell build script for producing installable zip files

The modal is intentionally minimal. For now it accepts pasted input and inserts escaped placeholder HTML so the end-to-end workflow can be validated safely.

## Architectural Direction

SmartPaste is being built with these constraints in mind:

- Joomla-native first
- editor-agnostic rather than locked to one editor implementation
- centered on an `editors-xtd` modal workflow
- focused on controlled content import, not just blind paste cleanup

That means the product direction is not "clean whatever the browser pasted" and not "make a JCE-only helper". The goal is a clear import step where users can understand and control what survives.

## Roadmap

Near-term next steps:

- replace the placeholder modal with a richer import workspace
- accept and normalize pasted rich HTML
- detect formatting groups and expose keep/remove choices
- preview cleaned output before insertion
- introduce a small internal model for controlled HTML generation

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
- `build/output/pkg_smartpaste_v0.1.2.zip`

The package zip is the normal installer artifact for Joomla. The plugin zip is also produced separately for convenience.

## Install

1. Build the package.
2. In Joomla administrator, install `build/output/pkg_smartpaste_v0.1.2.zip`.
3. Enable `Button - SuperSoftJx - SmartPaste` if it is not enabled automatically.
4. Open a supported editor in the administrator area and confirm the `SmartPaste` button appears.
5. Click the button to open the placeholder modal and insert test content.

## Development Notes

- No local PHP checks are run from this repository because PHP is not available in the current environment.
- No local Joomla runtime tests are included in this scaffold.
- Manual install/runtime verification is expected on a Joomla dev site.

Additional product direction is documented in [docs/plan.md](docs/plan.md).
