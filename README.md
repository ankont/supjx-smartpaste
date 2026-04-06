# supjx-smartpaste - SmartPaste for Joomla
SmartPaste is a Joomla extension concept for **smart paste** and **controlled content import** with **cleanup and formatting control** in Joomla editors.

The goal is to provide a modal-driven import workflow where users can:

* paste rich content from Word, web pages, email editors, or other sources
* inspect the formatting detected in the pasted content
* selectively keep or remove formatting groups
* insert cleaned, controlled HTML into the active editor

## 🎯 Vision

SmartPaste aims to bridge the gap between:

* fully automatic (and often destructive) paste cleanup
* and raw, unfiltered HTML import

by giving **users control over what formatting survives**.

## 🧠 Core Idea

Instead of blindly cleaning or preserving formatting, SmartPaste will:

1. Accept full pasted content
2. Analyze formatting patterns (fonts, colors, sizes, tables, etc.)
3. Present them as **user-friendly toggles**
4. Let the user decide what to keep
5. Generate clean, controlled HTML output

## 🧩 Planned Architecture

* Joomla-native implementation
* `editors-xtd` button (modal-based workflow)
* Editor-agnostic (works with JCE, TinyMCE, etc.)

## ⚙️ Early Feature Goals

* Paste/import modal
* Formatting detection summary
* Selective cleanup toggles
* Preview before insert
* Safe default cleanup for Word / HTML junk
* Optional richer import mode

## 🚧 Status

Early repository scaffold for planning and Codex-driven implementation.
