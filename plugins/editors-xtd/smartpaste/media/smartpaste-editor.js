import { JoomlaEditorButton } from "editor-api";

(() => {
  if (window.__SmartPasteWorkspaceLoaded) {
    return;
  }

  window.__SmartPasteWorkspaceLoaded = true;

  const OPTIONS_KEY = "plg_editors_xtd_smartpaste";
  const DEFAULT_FILTERS = Object.freeze({
    keepInlineStyles: false,
    keepClasses: false,
    keepLinks: true,
    keepImages: true,
    keepTables: true,
    removeComments: true,
    removeOfficeMarkup: true,
    removeEmptySpans: true,
    semanticFormatting: true
  });
  const STAT_ORDER = ["styles", "classes", "links", "images", "tables", "comments", "office", "unsafe"];
  const FILTER_ORDER = [
    "keepInlineStyles",
    "keepClasses",
    "keepLinks",
    "keepImages",
    "keepTables",
    "removeComments",
    "removeOfficeMarkup",
    "removeEmptySpans",
    "semanticFormatting"
  ];

  let modalState = null;

  function getOptions() {
    const configured = window.Joomla?.getOptions?.(OPTIONS_KEY) || {};
    const strings = configured.strings || {};
    const buttons = strings.buttons || {};
    const counts = strings.counts || {};
    const optionLabels = strings.options || {};

    return {
      strings: {
        title: String(strings.title || "SmartPaste"),
        intro: String(strings.intro || "Paste or edit source content, review detected formatting, choose what survives, and insert cleaned HTML into the active editor."),
        note: String(strings.note || "Unsafe tags are always stripped before preview and insert."),
        selectionLoaded: String(strings.selectionLoaded || "The current editor selection was loaded as the starting source."),
        pasteLabel: String(strings.pasteLabel || "Paste Pad"),
        pasteHint: String(strings.pasteHint || "Paste rich content here and inspect the HTML below."),
        pastePlaceholder: String(strings.pastePlaceholder || "Paste rich content here..."),
        htmlLabel: String(strings.htmlLabel || "Captured HTML"),
        htmlHint: String(strings.htmlHint || "Edit the captured HTML directly before insertion."),
        analysisTitle: String(strings.analysisTitle || "Detected Formatting"),
        analysisEmpty: String(strings.analysisEmpty || "Paste or load content to see the detected formatting groups."),
        unsafeNotice: String(strings.unsafeNotice || "Unsafe tags such as scripts and iframes are always stripped."),
        optionsTitle: String(strings.optionsTitle || "Cleanup Options"),
        previewTitle: String(strings.previewTitle || "Clean Preview"),
        previewEmpty: String(strings.previewEmpty || "The cleaned preview will appear here."),
        outputLabel: String(strings.outputLabel || "Generated HTML"),
        outputHint: String(strings.outputHint || "This is the HTML that will be inserted into the active editor."),
        buttons: {
          useSelection: String(buttons.useSelection || "Use Selection"),
          clear: String(buttons.clear || "Clear"),
          reset: String(buttons.reset || "Reset"),
          cancel: String(buttons.cancel || "Cancel"),
          insert: String(buttons.insert || "Insert Cleaned HTML"),
          close: String(buttons.close || "Close")
        },
        counts: {
          styles: String(counts.styles || "Inline styles"),
          classes: String(counts.classes || "CSS classes"),
          links: String(counts.links || "Links"),
          images: String(counts.images || "Images"),
          tables: String(counts.tables || "Tables"),
          comments: String(counts.comments || "Comments"),
          office: String(counts.office || "Office markup"),
          unsafe: String(counts.unsafe || "Unsafe tags")
        },
        options: {
          keepInlineStyles: String(optionLabels.keepInlineStyles || "Keep inline styles"),
          keepClasses: String(optionLabels.keepClasses || "Keep CSS classes"),
          keepLinks: String(optionLabels.keepLinks || "Keep links"),
          keepImages: String(optionLabels.keepImages || "Keep images"),
          keepTables: String(optionLabels.keepTables || "Keep tables"),
          removeComments: String(optionLabels.removeComments || "Remove HTML comments"),
          removeOfficeMarkup: String(optionLabels.removeOfficeMarkup || "Remove Office-specific markup"),
          removeEmptySpans: String(optionLabels.removeEmptySpans || "Unwrap empty or generic spans"),
          semanticFormatting: String(optionLabels.semanticFormatting || "Convert <b>/<i> to semantic tags")
        }
      }
    };
  }

  function cloneDefaultFilters() {
    return {
      ...DEFAULT_FILTERS
    };
  }

  function createElement(tagName, className = "", textContent = "") {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    if (textContent) {
      element.textContent = textContent;
    }

    return element;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normaliseWhitespace(value) {
    return String(value ?? "")
      .replace(/\u200B/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function looksLikeHtml(value) {
    return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
  }

  function textToHtml(value) {
    const text = String(value ?? "").replace(/\r\n/g, "\n").trim();

    if (!text) {
      return "";
    }

    return text
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
      .join("");
  }

  function normaliseSourceHtml(value) {
    const raw = String(value ?? "").trim();

    if (!raw) {
      return "";
    }

    return looksLikeHtml(raw) ? raw : textToHtml(raw);
  }

  function parseHtmlFragment(value) {
    const template = document.createElement("template");
    template.innerHTML = normaliseSourceHtml(value);
    return template.content;
  }

  function fragmentToHtml(fragment) {
    const container = document.createElement("div");
    container.appendChild(fragment.cloneNode(true));
    return container.innerHTML.trim();
  }

  function countComments(root) {
    const walker = document.createTreeWalker(root, window.NodeFilter.SHOW_COMMENT);
    let total = 0;

    while (walker.nextNode()) {
      total += 1;
    }

    return total;
  }

  function isMeaningfulNode(node) {
    if (!node) {
      return false;
    }

    if (node.nodeType === window.Node.TEXT_NODE) {
      return normaliseWhitespace(node.textContent) !== "";
    }

    if (node.nodeType !== window.Node.ELEMENT_NODE) {
      return false;
    }

    const tagName = node.tagName.toLowerCase();

    if (["img", "picture", "table", "hr", "video", "audio"].includes(tagName)) {
      return true;
    }

    return Array.from(node.childNodes || []).some(isMeaningfulNode);
  }

  function hasMeaningfulContent(fragmentOrElement) {
    return Array.from(fragmentOrElement.childNodes || []).some(isMeaningfulNode);
  }

  function unwrapElement(element) {
    const parent = element?.parentNode;

    if (!parent) {
      return;
    }

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }

    parent.removeChild(element);
  }

  function replaceElementTag(element, tagName) {
    const parent = element?.parentNode;

    if (!parent) {
      return null;
    }

    const replacement = document.createElement(tagName);

    Array.from(element.attributes || []).forEach((attribute) => {
      replacement.setAttribute(attribute.name, attribute.value);
    });

    while (element.firstChild) {
      replacement.appendChild(element.firstChild);
    }

    parent.replaceChild(replacement, element);

    return replacement;
  }

  function replaceElementWithFragment(element, fragment) {
    const parent = element?.parentNode;

    if (!parent) {
      return;
    }

    parent.insertBefore(fragment, element);
    parent.removeChild(element);
  }

  function sanitiseUrl(value, allowDataImage = false) {
    const url = String(value || "").trim();

    if (!url) {
      return "";
    }

    if (/^(?:javascript|vbscript):/i.test(url)) {
      return "";
    }

    if (/^data:/i.test(url)) {
      return allowDataImage && /^data:image\//i.test(url) ? url : "";
    }

    return url;
  }

  function stripOfficeClasses(value) {
    return String(value || "")
      .split(/\s+/)
      .filter((className) => className && !/^(?:Mso|WordSection|Section\d+)/i.test(className))
      .join(" ");
  }

  function stripOfficeStyles(value) {
    return String(value || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => !/^mso-/i.test(part) && !/\bmso-/i.test(part))
      .join("; ");
  }

  function tableToParagraphs(table) {
    const fragment = document.createDocumentFragment();

    Array.from(table.querySelectorAll("tr")).forEach((row) => {
      const cells = Array.from(row.querySelectorAll("th, td"))
        .map((cell) => normaliseWhitespace(cell.textContent))
        .filter(Boolean);

      if (!cells.length) {
        return;
      }

      const paragraph = document.createElement("p");
      paragraph.textContent = cells.join(" | ");
      fragment.appendChild(paragraph);
    });

    return fragment;
  }

  function removeComments(root) {
    const walker = document.createTreeWalker(root, window.NodeFilter.SHOW_COMMENT);
    const comments = [];

    while (walker.nextNode()) {
      comments.push(walker.currentNode);
    }

    comments.forEach((comment) => comment.parentNode?.removeChild(comment));
  }

  function cleanupEmptyElements(root) {
    const candidates = root.querySelectorAll("span, p, div, strong, em, a, figure, section, article, font");

    Array.from(candidates).forEach((element) => {
      const tagName = element.tagName.toLowerCase();

      if (tagName === "a" && !element.getAttribute("href")) {
        unwrapElement(element);
        return;
      }

      if (!hasMeaningfulContent(element)) {
        element.remove();
      }
    });
  }

  function cleanupGenericSpans(root) {
    Array.from(root.querySelectorAll("span")).forEach((span) => {
      if (span.attributes.length > 0) {
        return;
      }

      if (!hasMeaningfulContent(span)) {
        span.remove();
        return;
      }

      unwrapElement(span);
    });
  }

  function sanitizeElementAttributes(element, filters) {
    const tagName = element.tagName.toLowerCase();

    Array.from(element.attributes || []).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (name.startsWith("on")
        || name === "srcdoc"
        || name === "formaction"
        || name === "contenteditable"
        || name === "draggable"
        || name.startsWith("data-")) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === "href") {
        const safeHref = sanitiseUrl(value, false);

        if (!safeHref) {
          element.removeAttribute(attribute.name);
          return;
        }

        element.setAttribute("href", safeHref);

        if (element.getAttribute("target") === "_blank" && !element.getAttribute("rel")) {
          element.setAttribute("rel", "noopener noreferrer");
        }

        return;
      }

      if (name === "src") {
        const safeSrc = sanitiseUrl(value, tagName === "img");

        if (!safeSrc) {
          element.removeAttribute(attribute.name);
          return;
        }

        element.setAttribute("src", safeSrc);
        return;
      }

      if (name === "class") {
        if (!filters.keepClasses) {
          element.removeAttribute(attribute.name);
          return;
        }

        if (filters.removeOfficeMarkup) {
          const filteredClassValue = stripOfficeClasses(value);

          if (filteredClassValue) {
            element.setAttribute("class", filteredClassValue);
          } else {
            element.removeAttribute("class");
          }
        }

        return;
      }

      if (name === "style") {
        if (!filters.keepInlineStyles) {
          element.removeAttribute(attribute.name);
          return;
        }

        const filteredStyleValue = filters.removeOfficeMarkup ? stripOfficeStyles(value) : String(value || "").trim();

        if (filteredStyleValue) {
          element.setAttribute("style", filteredStyleValue);
        } else {
          element.removeAttribute("style");
        }

        return;
      }
    });

    if (filters.removeOfficeMarkup && tagName.includes(":")) {
      if (hasMeaningfulContent(element)) {
        unwrapElement(element);
      } else {
        element.remove();
      }
    }
  }

  function cleanHtml(sourceHtml, filters) {
    const fragment = parseHtmlFragment(sourceHtml);

    if (!hasMeaningfulContent(fragment)) {
      return "";
    }

    if (filters.removeComments) {
      removeComments(fragment);
    }

    Array.from(fragment.querySelectorAll("script, noscript, style, iframe, object, embed, link, meta, base, form, input, button, textarea, select, option, applet, canvas, svg, xml")).forEach((element) => {
      element.remove();
    });

    if (filters.semanticFormatting) {
      Array.from(fragment.querySelectorAll("b")).forEach((element) => replaceElementTag(element, "strong"));
      Array.from(fragment.querySelectorAll("i")).forEach((element) => replaceElementTag(element, "em"));
    }

    Array.from(fragment.querySelectorAll("font")).forEach((element) => {
      if (filters.keepInlineStyles || filters.keepClasses) {
        replaceElementTag(element, "span");
        return;
      }

      unwrapElement(element);
    });

    if (!filters.keepTables) {
      Array.from(fragment.querySelectorAll("table")).forEach((table) => {
        replaceElementWithFragment(table, tableToParagraphs(table));
      });
    }

    if (!filters.keepImages) {
      Array.from(fragment.querySelectorAll("picture, source, img")).forEach((element) => element.remove());
    }

    if (!filters.keepLinks) {
      Array.from(fragment.querySelectorAll("a")).forEach((anchor) => unwrapElement(anchor));
    }

    Array.from(fragment.querySelectorAll("*")).forEach((element) => {
      sanitizeElementAttributes(element, filters);
    });

    if (filters.removeEmptySpans) {
      cleanupGenericSpans(fragment);
    }

    cleanupEmptyElements(fragment);

    return fragmentToHtml(fragment);
  }

  function analyzeHtml(sourceHtml) {
    const fragment = parseHtmlFragment(sourceHtml);
    const html = normaliseSourceHtml(sourceHtml);

    if (!html || !hasMeaningfulContent(fragment)) {
      return null;
    }

    return {
      styles: fragment.querySelectorAll("[style]").length,
      classes: fragment.querySelectorAll("[class]").length,
      links: fragment.querySelectorAll("a[href]").length,
      images: fragment.querySelectorAll("img").length,
      tables: fragment.querySelectorAll("table").length,
      comments: countComments(fragment),
      office: (html.match(/(?:mso-|class\s*=\s*["'][^"']*Mso|<o:p|<\/?w:|<\/?v:|<\/?x:)/gi) || []).length,
      unsafe: fragment.querySelectorAll("script, noscript, style, iframe, object, embed, form, input, button, textarea, select, option, canvas, svg").length
    };
  }

  function extractCurrentSelectionHtml(editor) {
    if (editor?.getSelection) {
      const selection = String(editor.getSelection() || "");

      if (selection.trim()) {
        return selection;
      }
    }

    const tinyEditor = window.tinymce?.activeEditor || null;

    try {
      return String(tinyEditor?.selection?.getContent?.({ format: "html" }) || "");
    } catch (error) {
      return "";
    }
  }

  function capturePasteSurfaceHtml(surface) {
    const html = String(surface?.innerHTML || "");

    if (!html) {
      return "";
    }

    return hasMeaningfulContent(parseHtmlFragment(html)) ? html.trim() : "";
  }

  function insertMarkup(editor, markup) {
    if (editor?.replaceSelection) {
      editor.replaceSelection(markup);
      return;
    }

    if (editor?.insertHtml) {
      editor.insertHtml(markup);
      return;
    }

    if (editor?.insert) {
      editor.insert(markup);
      return;
    }

    if (editor?.setValue && editor?.getValue) {
      editor.setValue(`${editor.getValue()}${markup}`);
    }
  }

  function renderAnalysis(modal, analysis) {
    modal.analysisBody.innerHTML = "";

    if (!analysis) {
      const empty = createElement("p", "sjx-smartpaste-empty", modal.options.strings.analysisEmpty);
      modal.analysisBody.appendChild(empty);
      return;
    }

    const grid = createElement("div", "sjx-smartpaste-analysis-grid");

    STAT_ORDER.forEach((key) => {
      const card = createElement("div", "sjx-smartpaste-analysis-card");
      const label = createElement("span", "sjx-smartpaste-analysis-card__label", modal.options.strings.counts[key]);
      const value = createElement("strong", "sjx-smartpaste-analysis-card__value", String(analysis[key] || 0));

      card.append(label, value);
      grid.appendChild(card);
    });

    modal.analysisBody.appendChild(grid);
  }

  function readFilters(modal) {
    return FILTER_ORDER.reduce((result, key) => {
      result[key] = Boolean(modal.filterInputs[key]?.checked);
      return result;
    }, {});
  }

  function applyFiltersToInputs(modal, filters) {
    FILTER_ORDER.forEach((key) => {
      if (modal.filterInputs[key]) {
        modal.filterInputs[key].checked = Boolean(filters[key]);
      }
    });
  }

  function updateWorkspace(modal) {
    const rawSource = modal.sourceTextarea.value;
    const cleanedHtml = cleanHtml(rawSource, readFilters(modal));
    const analysis = analyzeHtml(rawSource);

    modal.preview.innerHTML = cleanedHtml
      ? cleanedHtml
      : `<p class="sjx-smartpaste-empty">${escapeHtml(modal.options.strings.previewEmpty)}</p>`;
    modal.outputTextarea.value = cleanedHtml;
    modal.insertButton.disabled = cleanedHtml.trim() === "";

    renderAnalysis(modal, analysis);
  }

  function setStatus(modal, text) {
    const content = String(text || "").trim();

    if (!content) {
      modal.status.hidden = true;
      modal.status.textContent = "";
      return;
    }

    modal.status.hidden = false;
    modal.status.textContent = content;
  }

  function loadSourceIntoWorkspace(modal, source, options = {}) {
    const rawSource = String(source || "").trim();
    const syncSurface = options.syncSurface !== false;
    const normalizedForSurface = normaliseSourceHtml(rawSource);

    modal.sourceTextarea.value = rawSource;

    if (syncSurface) {
      modal.pasteSurface.innerHTML = normalizedForSurface;
    }

    updateWorkspace(modal);
  }

  function resetWorkspace(modal) {
    applyFiltersToInputs(modal, modal.defaultFilters);
    loadSourceIntoWorkspace(modal, modal.initialSource, { syncSurface: true });
    setStatus(modal, modal.initialSource ? modal.options.strings.selectionLoaded : "");
  }

  function buildFilterControls(modal) {
    const list = createElement("div", "sjx-smartpaste-options-grid");

    FILTER_ORDER.forEach((key) => {
      const label = createElement("label", "sjx-smartpaste-option");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(modal.defaultFilters[key]);

      const copy = createElement("span", "sjx-smartpaste-option__label", modal.options.strings.options[key]);

      input.addEventListener("change", () => {
        updateWorkspace(modal);
      });

      modal.filterInputs[key] = input;
      label.append(input, copy);
      list.appendChild(label);
    });

    return list;
  }

  function ensureModal() {
    if (modalState) {
      return modalState;
    }

    const options = getOptions();
    const titleId = "sjx-smartpaste-modal-title";
    const pasteId = "sjx-smartpaste-paste-surface";
    const sourceId = "sjx-smartpaste-source-html";
    const outputId = "sjx-smartpaste-output-html";
    const backdrop = createElement("div", "sjx-smartpaste-modal-backdrop");
    backdrop.hidden = true;

    const dialog = createElement("section", "sjx-smartpaste-modal");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", titleId);
    dialog.tabIndex = -1;

    const header = createElement("header", "sjx-smartpaste-modal__header");
    const title = createElement("h2", "sjx-smartpaste-modal__title", options.strings.title);
    title.id = titleId;
    const closeButton = createElement("button", "sjx-smartpaste-modal__close btn btn-link");
    closeButton.type = "button";
    closeButton.textContent = options.strings.buttons.close;
    closeButton.setAttribute("aria-label", options.strings.buttons.close);
    header.append(title, closeButton);

    const body = createElement("div", "sjx-smartpaste-modal__body");
    const intro = createElement("p", "sjx-smartpaste-modal__intro", options.strings.intro);
    const note = createElement("p", "sjx-smartpaste-modal__note", options.strings.note);
    const status = createElement("p", "sjx-smartpaste-status");
    status.hidden = true;

    const workspace = createElement("div", "sjx-smartpaste-workspace");

    const sourcePanel = createElement("section", "sjx-smartpaste-panel sjx-smartpaste-panel--source");
    const sourceHeader = createElement("div", "sjx-smartpaste-panel__header");
    const sourceTitle = createElement("h3", "sjx-smartpaste-panel__title", options.strings.pasteLabel);
    const sourceActions = createElement("div", "sjx-smartpaste-panel__actions");
    const useSelectionButton = createElement("button", "btn btn-sm btn-outline-secondary");
    useSelectionButton.type = "button";
    useSelectionButton.textContent = options.strings.buttons.useSelection;
    const clearButton = createElement("button", "btn btn-sm btn-outline-secondary");
    clearButton.type = "button";
    clearButton.textContent = options.strings.buttons.clear;
    sourceActions.append(useSelectionButton, clearButton);
    sourceHeader.append(sourceTitle, sourceActions);

    const pasteHint = createElement("p", "sjx-smartpaste-panel__hint", options.strings.pasteHint);
    const pasteSurface = createElement("div", "sjx-smartpaste-paste-surface");
    pasteSurface.id = pasteId;
    pasteSurface.contentEditable = "true";
    pasteSurface.setAttribute("data-placeholder", options.strings.pastePlaceholder);

    const htmlLabel = createElement("label", "sjx-smartpaste-field__label", options.strings.htmlLabel);
    htmlLabel.setAttribute("for", sourceId);
    const htmlHint = createElement("p", "sjx-smartpaste-field__hint", options.strings.htmlHint);
    const sourceTextarea = createElement("textarea", "sjx-smartpaste-source");
    sourceTextarea.id = sourceId;
    sourceTextarea.rows = 12;

    sourcePanel.append(sourceHeader, pasteHint, pasteSurface, htmlLabel, htmlHint, sourceTextarea);

    const sideColumn = createElement("div", "sjx-smartpaste-side");

    const analysisPanel = createElement("section", "sjx-smartpaste-panel");
    const analysisHeader = createElement("div", "sjx-smartpaste-panel__header");
    const analysisTitle = createElement("h3", "sjx-smartpaste-panel__title", options.strings.analysisTitle);
    analysisHeader.appendChild(analysisTitle);
    const analysisNotice = createElement("p", "sjx-smartpaste-field__hint", options.strings.unsafeNotice);
    const analysisBody = createElement("div", "sjx-smartpaste-analysis");
    analysisPanel.append(analysisHeader, analysisNotice, analysisBody);

    const optionsPanel = createElement("section", "sjx-smartpaste-panel");
    const optionsHeader = createElement("div", "sjx-smartpaste-panel__header");
    const optionsTitle = createElement("h3", "sjx-smartpaste-panel__title", options.strings.optionsTitle);
    optionsHeader.appendChild(optionsTitle);
    optionsPanel.append(optionsHeader);

    const previewPanel = createElement("section", "sjx-smartpaste-panel sjx-smartpaste-panel--preview");
    const previewHeader = createElement("div", "sjx-smartpaste-panel__header");
    const previewTitle = createElement("h3", "sjx-smartpaste-panel__title", options.strings.previewTitle);
    previewHeader.appendChild(previewTitle);
    const preview = createElement("div", "sjx-smartpaste-preview");
    const outputLabel = createElement("label", "sjx-smartpaste-field__label", options.strings.outputLabel);
    outputLabel.setAttribute("for", outputId);
    const outputHint = createElement("p", "sjx-smartpaste-field__hint", options.strings.outputHint);
    const outputTextarea = createElement("textarea", "sjx-smartpaste-output");
    outputTextarea.id = outputId;
    outputTextarea.rows = 10;
    outputTextarea.readOnly = true;
    previewPanel.append(previewHeader, preview, outputLabel, outputHint, outputTextarea);

    sideColumn.append(analysisPanel, optionsPanel, previewPanel);
    workspace.append(sourcePanel, sideColumn);

    body.append(intro, note, status, workspace);

    const footer = createElement("footer", "sjx-smartpaste-modal__footer");
    const footerLeft = createElement("div", "sjx-smartpaste-modal__footer-group");
    const resetButton = createElement("button", "btn btn-secondary");
    resetButton.type = "button";
    resetButton.textContent = options.strings.buttons.reset;
    footerLeft.appendChild(resetButton);

    const footerRight = createElement("div", "sjx-smartpaste-modal__footer-group");
    const cancelButton = createElement("button", "btn btn-secondary");
    cancelButton.type = "button";
    cancelButton.textContent = options.strings.buttons.cancel;
    const insertButton = createElement("button", "btn btn-primary");
    insertButton.type = "button";
    insertButton.textContent = options.strings.buttons.insert;
    footerRight.append(cancelButton, insertButton);
    footer.append(footerLeft, footerRight);

    dialog.append(header, body, footer);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    modalState = {
      backdrop,
      dialog,
      title,
      closeButton,
      intro,
      note,
      status,
      pasteSurface,
      sourceTextarea,
      analysisBody,
      preview,
      outputTextarea,
      useSelectionButton,
      clearButton,
      resetButton,
      cancelButton,
      insertButton,
      filterInputs: {},
      options,
      defaultFilters: cloneDefaultFilters(),
      editor: null,
      initialSource: "",
      selectionSource: "",
      previousActiveElement: null
    };

    optionsPanel.appendChild(buildFilterControls(modalState));

    const close = () => {
      backdrop.hidden = true;
      backdrop.classList.remove("is-active");
      document.body.classList.remove("sjx-smartpaste-modal-open");

      if (modalState?.previousActiveElement?.focus) {
        modalState.previousActiveElement.focus();
      }
    };

    closeButton.addEventListener("click", close);
    cancelButton.addEventListener("click", close);

    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        close();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modalState && !modalState.backdrop.hidden) {
        close();
      }
    });

    pasteSurface.addEventListener("input", () => {
      modalState.sourceTextarea.value = capturePasteSurfaceHtml(pasteSurface);
      updateWorkspace(modalState);
    });

    pasteSurface.addEventListener("paste", () => {
      window.setTimeout(() => {
        modalState.sourceTextarea.value = capturePasteSurfaceHtml(pasteSurface);
        updateWorkspace(modalState);
      }, 0);
    });

    sourceTextarea.addEventListener("input", () => {
      updateWorkspace(modalState);
    });

    clearButton.addEventListener("click", () => {
      loadSourceIntoWorkspace(modalState, "", { syncSurface: true });
      setStatus(modalState, "");
    });

    useSelectionButton.addEventListener("click", () => {
      if (!modalState.selectionSource) {
        return;
      }

      loadSourceIntoWorkspace(modalState, modalState.selectionSource, { syncSurface: true });
      setStatus(modalState, modalState.options.strings.selectionLoaded);
    });

    resetButton.addEventListener("click", () => {
      resetWorkspace(modalState);
    });

    insertButton.addEventListener("click", () => {
      const cleanedHtml = modalState.outputTextarea.value.trim();

      if (!cleanedHtml || !modalState.editor) {
        close();
        return;
      }

      insertMarkup(modalState.editor, cleanedHtml);
      close();
    });

    return modalState;
  }

  function openModal(editor) {
    const modal = ensureModal();
    const selectionSource = extractCurrentSelectionHtml(editor);

    modal.editor = editor || null;
    modal.options = getOptions();
    modal.previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.selectionSource = selectionSource;
    modal.initialSource = selectionSource;

    modal.title.textContent = modal.options.strings.title;
    modal.closeButton.textContent = modal.options.strings.buttons.close;
    modal.closeButton.setAttribute("aria-label", modal.options.strings.buttons.close);
    modal.intro.textContent = modal.options.strings.intro;
    modal.note.textContent = modal.options.strings.note;
    modal.useSelectionButton.textContent = modal.options.strings.buttons.useSelection;
    modal.clearButton.textContent = modal.options.strings.buttons.clear;
    modal.resetButton.textContent = modal.options.strings.buttons.reset;
    modal.cancelButton.textContent = modal.options.strings.buttons.cancel;
    modal.insertButton.textContent = modal.options.strings.buttons.insert;
    modal.pasteSurface.setAttribute("data-placeholder", modal.options.strings.pastePlaceholder);
    modal.useSelectionButton.disabled = selectionSource.trim() === "";

    applyFiltersToInputs(modal, modal.defaultFilters);
    loadSourceIntoWorkspace(modal, selectionSource, { syncSurface: true });
    setStatus(modal, selectionSource ? modal.options.strings.selectionLoaded : "");

    modal.backdrop.hidden = false;
    modal.backdrop.classList.add("is-active");
    document.body.classList.add("sjx-smartpaste-modal-open");

    window.setTimeout(() => {
      modal.dialog.focus();

      if (selectionSource) {
        modal.sourceTextarea.focus();
        modal.sourceTextarea.setSelectionRange(0, modal.sourceTextarea.value.length);
      } else {
        modal.pasteSurface.focus();
      }
    }, 0);
  }

  JoomlaEditorButton.registerAction("supersoft-smartpaste", (editor) => {
    openModal(editor);
  });
})();
