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
    keepLang: false,
    removeComments: true,
    removeOfficeMarkup: true,
    removeEmptySpans: true,
    semanticFormatting: true
  });
  const FILTER_ORDER = [
    "keepInlineStyles",
    "keepClasses",
    "keepLinks",
    "keepImages",
    "keepTables",
    "keepLang",
    "removeComments",
    "removeOfficeMarkup",
    "removeEmptySpans",
    "semanticFormatting"
  ];
  const FORMATTING_ITEMS = [
    { analysisKey: "styles", filterKey: "keepInlineStyles" },
    { analysisKey: "classes", filterKey: "keepClasses" },
    { analysisKey: "links", filterKey: "keepLinks" },
    { analysisKey: "images", filterKey: "keepImages" },
    { analysisKey: "tables", filterKey: "keepTables" },
    { analysisKey: "lang", filterKey: "keepLang" },
    { analysisKey: "comments", filterKey: "removeComments" },
    { analysisKey: "office", filterKey: "removeOfficeMarkup" },
    { analysisKey: "spans", filterKey: "removeEmptySpans" },
    { analysisKey: "semantic", filterKey: "semanticFormatting" },
    { analysisKey: "unsafe", mode: "auto" }
  ];

  let modalState = null;

  function getOptions() {
    const configured = window.Joomla?.getOptions?.(OPTIONS_KEY) || {};
    const strings = configured.strings || {};
    const buttons = strings.buttons || {};
    const counts = strings.counts || {};
    const optionLabels = strings.options || {};
    const optionTitles = strings.optionTitles || {};

    return {
      strings: {
        title: String(strings.title || "SmartPaste"),
        titleDetail: String(strings.titleDetail || "Paste, review, clean, insert"),
        selectionLoaded: String(strings.selectionLoaded || "The current editor selection was loaded as the starting source."),
        pasteLabel: String(strings.pasteLabel || "Paste Pad"),
        pasteHint: String(strings.pasteHint || "Paste rich content here."),
        pastePlaceholder: String(strings.pastePlaceholder || "Paste rich content here..."),
        htmlLabel: String(strings.htmlLabel || "Captured HTML"),
        htmlHint: String(strings.htmlHint || "Optional raw HTML view for direct edits."),
        unsafeNotice: String(strings.unsafeNotice || "Unsafe tags such as scripts and iframes are always stripped."),
        formattingTitle: String(strings.formattingTitle || "Formatting & Cleanup"),
        previewTitle: String(strings.previewTitle || "Clean Preview"),
        previewEmpty: String(strings.previewEmpty || "The cleaned preview will appear here."),
        outputLabel: String(strings.outputLabel || "Generated HTML"),
        outputHint: String(strings.outputHint || "This is the HTML that will be inserted into the active editor."),
        buttons: {
          useSelection: String(buttons.useSelection || "Use Selection"),
          showHtml: String(buttons.showHtml || "Show HTML"),
          showPaste: String(buttons.showPaste || "Show Paste"),
          showPreview: String(buttons.showPreview || "Show Preview"),
          clear: String(buttons.clear || "Clear"),
          reset: String(buttons.reset || "Reset"),
          cancel: String(buttons.cancel || "Cancel"),
          insert: String(buttons.insert || "Insert Cleaned HTML"),
          close: String(buttons.close || "Close"),
          yes: String(buttons.yes || "Yes"),
          no: String(buttons.no || "No"),
          auto: String(buttons.auto || "Auto")
        },
        counts: {
          styles: String(counts.styles || "Styles"),
          classes: String(counts.classes || "Classes"),
          links: String(counts.links || "Links"),
          images: String(counts.images || "Images"),
          tables: String(counts.tables || "Tables"),
          lang: String(counts.lang || "Lang"),
          comments: String(counts.comments || "Comments"),
          office: String(counts.office || "Office"),
          spans: String(counts.spans || "Spans"),
          semantic: String(counts.semantic || "Semantic"),
          unsafe: String(counts.unsafe || "Unsafe")
        },
        options: {
          keepInlineStyles: String(optionLabels.keepInlineStyles || "Styles"),
          keepClasses: String(optionLabels.keepClasses || "Classes"),
          keepLinks: String(optionLabels.keepLinks || "Links"),
          keepImages: String(optionLabels.keepImages || "Images"),
          keepTables: String(optionLabels.keepTables || "Tables"),
          keepLang: String(optionLabels.keepLang || "Lang"),
          removeComments: String(optionLabels.removeComments || "Comments"),
          removeOfficeMarkup: String(optionLabels.removeOfficeMarkup || "Office"),
          removeEmptySpans: String(optionLabels.removeEmptySpans || "Spans"),
          semanticFormatting: String(optionLabels.semanticFormatting || "Semantic"),
          unsafe: String(optionLabels.unsafe || "Unsafe")
        },
        optionTitles: {
          keepInlineStyles: String(optionTitles.keepInlineStyles || "Keep inline styles"),
          keepClasses: String(optionTitles.keepClasses || "Keep CSS classes"),
          keepLinks: String(optionTitles.keepLinks || "Keep links"),
          keepImages: String(optionTitles.keepImages || "Keep images"),
          keepTables: String(optionTitles.keepTables || "Keep tables"),
          keepLang: String(optionTitles.keepLang || "Keep lang attributes"),
          removeComments: String(optionTitles.removeComments || "Remove HTML comments"),
          removeOfficeMarkup: String(optionTitles.removeOfficeMarkup || "Remove Office-specific markup"),
          removeEmptySpans: String(optionTitles.removeEmptySpans || "Unwrap empty or generic spans"),
          semanticFormatting: String(optionTitles.semanticFormatting || "Convert <b>/<i> to semantic tags"),
          unsafe: String(optionTitles.unsafe || "Unsafe tags are always stripped")
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

  function sanitiseLangValue(value) {
    const lang = String(value || "").trim();

    if (!lang) {
      return "";
    }

    return /^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$/.test(lang) ? lang : "";
  }

  function countElements(root, predicate) {
    return Array.from(root.querySelectorAll("*")).reduce((total, element) => {
      return total + (predicate(element) ? 1 : 0);
    }, 0);
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

      if (name === "lang" || name === "xml:lang") {
        if (!filters.keepLang) {
          element.removeAttribute(attribute.name);
          return;
        }

        const safeLang = sanitiseLangValue(value);

        if (safeLang) {
          element.setAttribute(attribute.name, safeLang);
        } else {
          element.removeAttribute(attribute.name);
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
      lang: countElements(fragment, (element) => element.hasAttribute("lang") || element.hasAttribute("xml:lang")),
      comments: countComments(fragment),
      office: (html.match(/(?:mso-|class\s*=\s*["'][^"']*Mso|<o:p|<\/?w:|<\/?v:|<\/?x:)/gi) || []).length,
      spans: fragment.querySelectorAll("span").length,
      semantic: fragment.querySelectorAll("b, i").length,
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

  function updateFormattingPanel(modal, analysis) {
    FORMATTING_ITEMS.forEach((item) => {
      const row = modal.formattingRows[item.analysisKey];

      if (!row) {
        return;
      }

      const count = Number(analysis?.[item.analysisKey] || 0);
      row.count.textContent = String(count);
      row.element.classList.toggle("is-inactive", count === 0);
    });
  }

  function readFilters(modal) {
    return FILTER_ORDER.reduce((result, key) => {
      result[key] = Boolean(modal.filterInputs[key]?.yes?.checked);
      return result;
    }, {});
  }

  function applyFiltersToInputs(modal, filters) {
    FILTER_ORDER.forEach((key) => {
      if (modal.filterInputs[key]?.yes && modal.filterInputs[key]?.no) {
        modal.filterInputs[key].yes.checked = Boolean(filters[key]);
        modal.filterInputs[key].no.checked = !Boolean(filters[key]);
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

    updateFormattingPanel(modal, analysis);
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

  function setSourceHtmlVisibility(modal, isVisible) {
    const visible = Boolean(isVisible);

    modal.sourceHtmlVisible = visible;
    modal.pasteView.hidden = visible;
    modal.sourceHtmlView.hidden = !visible;
    modal.sourceToggleButton.textContent = visible
      ? modal.options.strings.buttons.showPaste
      : modal.options.strings.buttons.showHtml;
    modal.sourceToggleButton.setAttribute("aria-expanded", String(visible));
  }

  function setPreviewHtmlVisibility(modal, isVisible) {
    const visible = Boolean(isVisible);

    modal.previewHtmlVisible = visible;
    modal.previewView.hidden = visible;
    modal.previewHtmlView.hidden = !visible;
    modal.previewToggleButton.textContent = visible
      ? modal.options.strings.buttons.showPreview
      : modal.options.strings.buttons.showHtml;
    modal.previewToggleButton.setAttribute("aria-expanded", String(visible));
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

  function buildFormattingControls(modal) {
    const list = createElement("div", "sjx-smartpaste-formatting-grid");

    FORMATTING_ITEMS.forEach((item, index) => {
      const labelKey = item.filterKey || item.analysisKey;
      const title = modal.options.strings.optionTitles[labelKey] || modal.options.strings.counts[item.analysisKey];
      const row = createElement("div", "sjx-smartpaste-formatting-row");
      const count = createElement("strong", "sjx-smartpaste-formatting-row__count", "0");
      const copy = createElement("div", "sjx-smartpaste-formatting-row__copy");
      const label = createElement("span", "sjx-smartpaste-formatting-row__label", modal.options.strings.options[labelKey] || modal.options.strings.counts[item.analysisKey]);

      row.title = title;
      copy.title = title;
      label.title = title;
      copy.appendChild(label);

      if (item.filterKey) {
        const controls = createElement("div", "sjx-smartpaste-formatting-row__controls btn-group");
        const name = `sjx-smartpaste-filter-${item.filterKey}`;
        const yesId = `${name}-yes-${index}`;
        const noId = `${name}-no-${index}`;
        const yesInput = document.createElement("input");
        const noInput = document.createElement("input");
        const yesLabel = createElement("label", "btn btn-outline-success btn-sm sjx-smartpaste-toggle__button", modal.options.strings.buttons.yes);
        const noLabel = createElement("label", "btn btn-outline-secondary btn-sm sjx-smartpaste-toggle__button", modal.options.strings.buttons.no);

        controls.setAttribute("role", "group");
        controls.setAttribute("aria-label", title);

        yesInput.type = "radio";
        yesInput.className = "btn-check sjx-smartpaste-toggle__input";
        yesInput.name = name;
        yesInput.id = yesId;
        yesInput.autocomplete = "off";
        yesInput.checked = Boolean(modal.defaultFilters[item.filterKey]);

        noInput.type = "radio";
        noInput.className = "btn-check sjx-smartpaste-toggle__input";
        noInput.name = name;
        noInput.id = noId;
        noInput.autocomplete = "off";
        noInput.checked = !Boolean(modal.defaultFilters[item.filterKey]);

        yesInput.addEventListener("change", () => {
          if (yesInput.checked) {
            updateWorkspace(modal);
          }
        });

        noInput.addEventListener("change", () => {
          if (noInput.checked) {
            updateWorkspace(modal);
          }
        });

        yesLabel.htmlFor = yesId;
        noLabel.htmlFor = noId;
        yesLabel.title = title;
        noLabel.title = title;

        modal.filterInputs[item.filterKey] = {
          yes: yesInput,
          no: noInput
        };

        controls.append(yesInput, yesLabel, noInput, noLabel);
        row.append(count, copy, controls);
      } else {
        const fixed = createElement("span", "sjx-smartpaste-formatting-row__fixed", modal.options.strings.buttons.auto);
        fixed.title = title;
        row.append(count, copy, fixed);
      }

      modal.formattingRows[item.analysisKey] = {
        element: row,
        count
      };

      list.appendChild(row);
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
    const sourceHtmlId = "sjx-smartpaste-source-html-panel";
    const previewHtmlId = "sjx-smartpaste-preview-html-panel";
    const backdrop = createElement("div", "sjx-smartpaste-modal-backdrop");
    backdrop.hidden = true;

    const dialog = createElement("section", "sjx-smartpaste-modal");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", titleId);
    dialog.tabIndex = -1;

    const header = createElement("header", "sjx-smartpaste-modal__header");
    const titleGroup = createElement("div", "sjx-smartpaste-modal__title-group");
    const title = createElement("h2", "sjx-smartpaste-modal__title", options.strings.title);
    title.id = titleId;
    const titleDetail = createElement("span", "sjx-smartpaste-modal__title-detail", options.strings.titleDetail);
    const closeButton = createElement("button", "sjx-smartpaste-modal__close btn btn-link");
    closeButton.type = "button";
    closeButton.textContent = options.strings.buttons.close;
    closeButton.setAttribute("aria-label", options.strings.buttons.close);
    titleGroup.append(title, titleDetail);
    header.append(titleGroup, closeButton);

    const body = createElement("div", "sjx-smartpaste-modal__body");
    const status = createElement("p", "sjx-smartpaste-status");
    status.hidden = true;

    const workspace = createElement("div", "sjx-smartpaste-workspace");
    const topRow = createElement("div", "sjx-smartpaste-workspace__top");

    const sourcePanel = createElement("section", "sjx-smartpaste-panel sjx-smartpaste-panel--source");
    const sourceHeader = createElement("div", "sjx-smartpaste-panel__header");
    const sourceTitle = createElement("h3", "sjx-smartpaste-panel__title", options.strings.pasteLabel);
    sourceHeader.appendChild(sourceTitle);

    const sourceStage = createElement("div", "sjx-smartpaste-panel__stage");
    const pasteView = createElement("div", "sjx-smartpaste-pane sjx-smartpaste-pane--visual");
    const pasteHint = createElement("p", "sjx-smartpaste-panel__hint", options.strings.pasteHint);
    const pasteSurface = createElement("div", "sjx-smartpaste-paste-surface");
    pasteSurface.id = pasteId;
    pasteSurface.contentEditable = "true";
    pasteSurface.setAttribute("data-placeholder", options.strings.pastePlaceholder);
    pasteView.append(pasteHint, pasteSurface);

    const sourceHtmlView = createElement("div", "sjx-smartpaste-pane sjx-smartpaste-pane--html");
    sourceHtmlView.id = sourceHtmlId;
    sourceHtmlView.hidden = true;
    const htmlLabel = createElement("label", "sjx-smartpaste-field__label", options.strings.htmlLabel);
    htmlLabel.setAttribute("for", sourceId);
    const htmlHint = createElement("p", "sjx-smartpaste-field__hint", options.strings.htmlHint);
    const sourceTextarea = createElement("textarea", "sjx-smartpaste-source");
    sourceTextarea.id = sourceId;
    sourceTextarea.rows = 12;
    sourceTextarea.placeholder = options.strings.pastePlaceholder;
    sourceHtmlView.append(htmlLabel, htmlHint, sourceTextarea);
    sourceStage.append(pasteView, sourceHtmlView);

    const sourceActions = createElement("div", "sjx-smartpaste-panel__actions sjx-smartpaste-panel__actions--footer");
    const useSelectionButton = createElement("button", "btn btn-sm btn-outline-secondary");
    useSelectionButton.type = "button";
    useSelectionButton.textContent = options.strings.buttons.useSelection;
    const sourceToggleButton = createElement("button", "btn btn-sm btn-outline-secondary");
    sourceToggleButton.type = "button";
    sourceToggleButton.textContent = options.strings.buttons.showHtml;
    sourceToggleButton.setAttribute("aria-controls", sourceHtmlId);
    sourceToggleButton.setAttribute("aria-expanded", "false");
    const clearButton = createElement("button", "btn btn-sm btn-outline-secondary");
    clearButton.type = "button";
    clearButton.textContent = options.strings.buttons.clear;
    sourceActions.append(useSelectionButton, sourceToggleButton, clearButton);
    sourcePanel.append(sourceHeader, sourceStage, sourceActions);

    const previewPanel = createElement("section", "sjx-smartpaste-panel sjx-smartpaste-panel--preview");
    const previewHeader = createElement("div", "sjx-smartpaste-panel__header");
    const previewTitle = createElement("h3", "sjx-smartpaste-panel__title", options.strings.previewTitle);
    previewHeader.appendChild(previewTitle);
    const previewStage = createElement("div", "sjx-smartpaste-panel__stage");
    const previewView = createElement("div", "sjx-smartpaste-pane sjx-smartpaste-pane--visual");
    const preview = createElement("div", "sjx-smartpaste-preview");
    previewView.appendChild(preview);
    const previewHtmlView = createElement("div", "sjx-smartpaste-pane sjx-smartpaste-pane--html");
    previewHtmlView.id = previewHtmlId;
    previewHtmlView.hidden = true;
    const outputLabel = createElement("label", "sjx-smartpaste-field__label", options.strings.outputLabel);
    outputLabel.setAttribute("for", outputId);
    const outputHint = createElement("p", "sjx-smartpaste-field__hint", options.strings.outputHint);
    const outputTextarea = createElement("textarea", "sjx-smartpaste-output");
    outputTextarea.id = outputId;
    outputTextarea.rows = 8;
    outputTextarea.readOnly = true;
    previewHtmlView.append(outputLabel, outputHint, outputTextarea);
    previewStage.append(previewView, previewHtmlView);
    const previewActions = createElement("div", "sjx-smartpaste-panel__actions sjx-smartpaste-panel__actions--footer");
    const previewToggleButton = createElement("button", "btn btn-sm btn-outline-secondary");
    previewToggleButton.type = "button";
    previewToggleButton.textContent = options.strings.buttons.showHtml;
    previewToggleButton.setAttribute("aria-controls", previewHtmlId);
    previewToggleButton.setAttribute("aria-expanded", "false");
    previewActions.appendChild(previewToggleButton);
    previewPanel.append(previewHeader, previewStage, previewActions);

    const formattingPanel = createElement("section", "sjx-smartpaste-panel");
    const formattingHeader = createElement("div", "sjx-smartpaste-panel__header");
    const formattingTitle = createElement("h3", "sjx-smartpaste-panel__title", options.strings.formattingTitle);
    formattingHeader.appendChild(formattingTitle);

    topRow.append(sourcePanel, previewPanel);
    workspace.append(topRow, formattingPanel);

    body.append(status, workspace);

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
      titleDetail,
      closeButton,
      status,
      pasteSurface,
      pasteView,
      sourceHtmlView,
      sourceToggleButton,
      sourceTextarea,
      preview,
      previewView,
      previewHtmlView,
      previewToggleButton,
      outputTextarea,
      useSelectionButton,
      clearButton,
      resetButton,
      cancelButton,
      insertButton,
      filterInputs: {},
      formattingRows: {},
      options,
      defaultFilters: cloneDefaultFilters(),
      editor: null,
      sourceHtmlVisible: false,
      previewHtmlVisible: false,
      initialSource: "",
      selectionSource: "",
      previousActiveElement: null
    };

    formattingPanel.append(formattingHeader, buildFormattingControls(modalState));

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
      modalState.pasteSurface.innerHTML = normaliseSourceHtml(modalState.sourceTextarea.value);
      updateWorkspace(modalState);
    });

    sourceToggleButton.addEventListener("click", () => {
      setSourceHtmlVisibility(modalState, !modalState.sourceHtmlVisible);

      if (modalState.sourceHtmlVisible) {
        modalState.sourceTextarea.focus();
      } else {
        modalState.pasteSurface.focus();
      }
    });

    previewToggleButton.addEventListener("click", () => {
      setPreviewHtmlVisibility(modalState, !modalState.previewHtmlVisible);

      if (modalState.previewHtmlVisible) {
        modalState.outputTextarea.focus();
      } else {
        modalState.previewToggleButton.focus();
      }
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
    modal.titleDetail.textContent = modal.options.strings.titleDetail;
    modal.closeButton.textContent = modal.options.strings.buttons.close;
    modal.closeButton.setAttribute("aria-label", modal.options.strings.buttons.close);
    modal.useSelectionButton.textContent = modal.options.strings.buttons.useSelection;
    modal.clearButton.textContent = modal.options.strings.buttons.clear;
    modal.resetButton.textContent = modal.options.strings.buttons.reset;
    modal.cancelButton.textContent = modal.options.strings.buttons.cancel;
    modal.insertButton.textContent = modal.options.strings.buttons.insert;
    modal.pasteSurface.setAttribute("data-placeholder", modal.options.strings.pastePlaceholder);
    modal.sourceTextarea.placeholder = modal.options.strings.pastePlaceholder;
    modal.outputTextarea.placeholder = modal.options.strings.previewEmpty;
    modal.useSelectionButton.disabled = selectionSource.trim() === "";
    setSourceHtmlVisibility(modal, false);
    setPreviewHtmlVisibility(modal, false);

    applyFiltersToInputs(modal, modal.defaultFilters);
    loadSourceIntoWorkspace(modal, selectionSource, { syncSurface: true });
    setStatus(modal, selectionSource ? modal.options.strings.selectionLoaded : "");

    modal.backdrop.hidden = false;
    modal.backdrop.classList.add("is-active");
    document.body.classList.add("sjx-smartpaste-modal-open");

    window.setTimeout(() => {
      modal.dialog.focus();

      modal.pasteSurface.focus();
    }, 0);
  }

  JoomlaEditorButton.registerAction("supersoft-smartpaste", (editor) => {
    openModal(editor);
  });
})();
