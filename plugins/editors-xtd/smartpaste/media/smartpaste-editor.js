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
    keepDir: false,
    removeComments: true,
    removeOfficeMarkup: true,
    removeEmptySpans: true,
    unwrapContainers: true,
    semanticFormatting: true
  });
  const FILTER_ORDER = [
    "keepInlineStyles",
    "keepClasses",
    "keepLinks",
    "keepImages",
    "keepTables",
    "keepLang",
    "keepDir",
    "removeComments",
    "removeOfficeMarkup",
    "removeEmptySpans",
    "unwrapContainers",
    "semanticFormatting"
  ];
  const GENERIC_CONTAINER_TAGS = ["div", "section", "article"];
  const FORMATTING_ITEMS = [
    { analysisKey: "styles", filterKey: "keepInlineStyles", trueVerb: "keep", falseVerb: "drop", cleanValue: false },
    { analysisKey: "classes", filterKey: "keepClasses", trueVerb: "keep", falseVerb: "drop", cleanValue: false },
    { analysisKey: "links", filterKey: "keepLinks", trueVerb: "keep", falseVerb: "drop", cleanValue: false },
    { analysisKey: "images", filterKey: "keepImages", trueVerb: "keep", falseVerb: "drop", cleanValue: false },
    { analysisKey: "tables", filterKey: "keepTables", trueVerb: "keep", falseVerb: "drop", cleanValue: false },
    { analysisKey: "lang", filterKey: "keepLang", trueVerb: "keep", falseVerb: "drop", cleanValue: false },
    { analysisKey: "dir", filterKey: "keepDir", trueVerb: "keep", falseVerb: "drop", cleanValue: false },
    { analysisKey: "comments", filterKey: "removeComments", trueVerb: "remove", falseVerb: "keep", cleanValue: true },
    { analysisKey: "office", filterKey: "removeOfficeMarkup", trueVerb: "remove", falseVerb: "keep", cleanValue: true },
    { analysisKey: "spans", filterKey: "removeEmptySpans", trueVerb: "unwrap", falseVerb: "keep", cleanValue: true },
    { analysisKey: "containers", filterKey: "unwrapContainers", trueVerb: "unwrap", falseVerb: "keep", cleanValue: true },
    { analysisKey: "semantic", filterKey: "semanticFormatting", trueVerb: "convert", falseVerb: "keep", cleanValue: true },
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
        titleDetail: String(strings.titleDetail || "Controlled import workflow for pasted rich content"),
        selectionLoaded: String(strings.selectionLoaded || "Loaded the current editor selection as your starting content."),
        pasteLabel: String(strings.pasteLabel || "Paste Pad"),
        pasteHint: String(strings.pasteHint || "Paste rich content here."),
        pastePlaceholder: String(strings.pastePlaceholder || "Paste rich content here..."),
        htmlLabel: String(strings.htmlLabel || "Source HTML"),
        htmlHint: String(strings.htmlHint || "Source HTML for review or direct edits."),
        unsafeNotice: String(strings.unsafeNotice || "Unsafe tags such as scripts and iframes are always stripped."),
        formattingTitle: String(strings.formattingTitle || "Formatting & Cleanup"),
        formattingEmpty: String(strings.formattingEmpty || "Paste or load content to see the detected formatting groups."),
        previewTitle: String(strings.previewTitle || "Clean Preview"),
        previewEmpty: String(strings.previewEmpty || "The cleaned preview will appear here."),
        outputLabel: String(strings.outputLabel || "Clean HTML"),
        outputHint: String(strings.outputHint || "Cleaned HTML ready for insert."),
        buttons: {
          showHtml: String(buttons.showHtml || "View HTML"),
          showPaste: String(buttons.showPaste || "Back to Paste"),
          showPreview: String(buttons.showPreview || "Back to Preview"),
          clear: String(buttons.clear || "Clear"),
          cleanAll: String(buttons.cleanAll || "Clean More"),
          keepMore: String(buttons.keepMore || "Keep More"),
          reset: String(buttons.reset || "Reset"),
          cancel: String(buttons.cancel || "Cancel"),
          insert: String(buttons.insert || "Insert Cleaned Content"),
          keep: String(buttons.keep || "Keep"),
          drop: String(buttons.drop || "Remove"),
          remove: String(buttons.remove || "Remove"),
          unwrap: String(buttons.unwrap || "Simplify"),
          convert: String(buttons.convert || "Improve"),
          auto: String(buttons.auto || "Always")
        },
        counts: {
          styles: String(counts.styles || "Inline Styles"),
          classes: String(counts.classes || "CSS Classes"),
          links: String(counts.links || "Links"),
          images: String(counts.images || "Images"),
          tables: String(counts.tables || "Tables"),
          lang: String(counts.lang || "Language Tags"),
          dir: String(counts.dir || "Text Direction"),
          comments: String(counts.comments || "HTML Comments"),
          office: String(counts.office || "Word/Office"),
          spans: String(counts.spans || "Inline Wrappers"),
          containers: String(counts.containers || "Block Wrappers"),
          semantic: String(counts.semantic || "Bold/Italic"),
          unsafe: String(counts.unsafe || "Unsafe Content")
        },
        options: {
          keepInlineStyles: String(optionLabels.keepInlineStyles || "Inline Styles"),
          keepClasses: String(optionLabels.keepClasses || "CSS Classes"),
          keepLinks: String(optionLabels.keepLinks || "Links"),
          keepImages: String(optionLabels.keepImages || "Images"),
          keepTables: String(optionLabels.keepTables || "Tables"),
          keepLang: String(optionLabels.keepLang || "Language Tags"),
          keepDir: String(optionLabels.keepDir || "Text Direction"),
          removeComments: String(optionLabels.removeComments || "HTML Comments"),
          removeOfficeMarkup: String(optionLabels.removeOfficeMarkup || "Word/Office"),
          removeEmptySpans: String(optionLabels.removeEmptySpans || "Inline Wrappers"),
          unwrapContainers: String(optionLabels.unwrapContainers || "Block Wrappers"),
          semanticFormatting: String(optionLabels.semanticFormatting || "Bold/Italic Tags"),
          unsafe: String(optionLabels.unsafe || "Unsafe Content")
        },
        optionTitles: {
          keepInlineStyles: String(optionTitles.keepInlineStyles || "Keep inline visual styles"),
          keepClasses: String(optionTitles.keepClasses || "Keep CSS class names"),
          keepLinks: String(optionTitles.keepLinks || "Keep links"),
          keepImages: String(optionTitles.keepImages || "Keep images"),
          keepTables: String(optionTitles.keepTables || "Keep tables"),
          keepLang: String(optionTitles.keepLang || "Keep language tags"),
          keepDir: String(optionTitles.keepDir || "Keep text direction markers"),
          removeComments: String(optionTitles.removeComments || "Remove HTML comments"),
          removeOfficeMarkup: String(optionTitles.removeOfficeMarkup || "Remove Word/Office markup"),
          removeEmptySpans: String(optionTitles.removeEmptySpans || "Remove generic inline wrappers"),
          unwrapContainers: String(optionTitles.unwrapContainers || "Remove generic block wrappers"),
          semanticFormatting: String(optionTitles.semanticFormatting || "Convert bold/italic tags to cleaner markup"),
          unsafe: String(optionTitles.unsafe || "Unsafe content is always removed")
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

  function createFieldMeta(labelText, hintText, forId = "") {
    const meta = createElement("div", "sjx-smartpaste-field__meta");
    const label = createElement("label", "sjx-smartpaste-field__label", labelText);
    const hint = createElement("span", "sjx-smartpaste-field__hint", hintText);

    if (forId) {
      label.setAttribute("for", forId);
    }

    meta.append(label, hint);

    return meta;
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

  function sanitiseDirValue(value) {
    const dir = String(value || "").trim().toLowerCase();

    return ["ltr", "rtl", "auto"].includes(dir) ? dir : "";
  }

  function countElements(root, predicate) {
    return Array.from(root.querySelectorAll("*")).reduce((total, element) => {
      return total + (predicate(element) ? 1 : 0);
    }, 0);
  }

  function isGenericContainerTag(tagName) {
    return GENERIC_CONTAINER_TAGS.includes(String(tagName || "").toLowerCase());
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
    Array.from(root.querySelectorAll("span")).reverse().forEach((span) => {
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

  function cleanupGenericContainers(root) {
    let changed = true;

    while (changed) {
      changed = false;

      Array.from(root.querySelectorAll(GENERIC_CONTAINER_TAGS.join(","))).reverse().forEach((element) => {
        if (!isGenericContainerTag(element.tagName)) {
          return;
        }

        if (element.attributes.length > 0) {
          return;
        }

        if (!hasMeaningfulContent(element)) {
          element.remove();
          changed = true;
          return;
        }

        unwrapElement(element);
        changed = true;
      });
    }
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
        || name === "id"
        || name === "hidden"
        || name === "inert"
        || name === "role"
        || name === "tabindex"
        || name.startsWith("aria-")
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

      if (name === "dir") {
        if (!filters.keepDir) {
          element.removeAttribute(attribute.name);
          return;
        }

        const safeDir = sanitiseDirValue(value);

        if (safeDir) {
          element.setAttribute("dir", safeDir);
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

    if (filters.unwrapContainers) {
      cleanupGenericContainers(fragment);
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
      dir: countElements(fragment, (element) => element.hasAttribute("dir")),
      comments: countComments(fragment),
      office: (html.match(/(?:mso-|class\s*=\s*["'][^"']*Mso|<o:p|<\/?w:|<\/?v:|<\/?x:)/gi) || []).length,
      spans: fragment.querySelectorAll("span").length,
      containers: countElements(fragment, (element) => isGenericContainerTag(element.tagName)),
      semantic: fragment.querySelectorAll("b, i").length,
      unsafe: fragment.querySelectorAll("script, noscript, style, iframe, object, embed, form, input, button, textarea, select, option, canvas, svg").length
    };
  }

  function readEditorSelectionHtml(candidate) {
    if (!candidate?.selection?.getContent) {
      return "";
    }

    try {
      return String(candidate.selection.getContent({ format: "html" }) || "");
    } catch (error) {
      return "";
    }
  }

  function extractCurrentSelectionHtml(editor) {
    const htmlCandidates = [
      editor?.instance,
      editor?.editor,
      editor?.tinymce,
      window.tinymce?.get?.(editor?.id || ""),
      window.tinymce?.activeEditor
    ];

    for (const candidate of htmlCandidates) {
      const htmlSelection = String(readEditorSelectionHtml(candidate) || "");

      if (htmlSelection.trim()) {
        return htmlSelection;
      }
    }

    if (editor?.getSelection) {
      const selection = String(editor.getSelection() || "");

      if (selection.trim()) {
        return selection;
      }
    }

    return "";
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
    let visibleCount = 0;

    FORMATTING_ITEMS.forEach((item) => {
      const row = modal.formattingRows[item.analysisKey];

      if (!row) {
        return;
      }

      const count = Number(analysis?.[item.analysisKey] || 0);
      row.count.textContent = String(count);
      row.element.hidden = count === 0;
      row.element.classList.toggle("is-inactive", count === 0);

      if (count > 0) {
        visibleCount += 1;
      }
    });

    modal.formattingEmpty.hidden = visibleCount > 0;
    modal.bulkToggleButton.hidden = visibleCount === 0;
    updateBulkToggleButton(modal);
  }

  function readFilters(modal) {
    return FILTER_ORDER.reduce((result, key) => {
      const controls = modal.filterInputs[key];

      if (!controls) {
        result[key] = Boolean(DEFAULT_FILTERS[key]);
        return result;
      }

      result[key] = controls.primary.checked ? controls.primaryValue : controls.secondaryValue;
      return result;
    }, {});
  }

  function applyFiltersToInputs(modal, filters) {
    FILTER_ORDER.forEach((key) => {
      const controls = modal.filterInputs[key];

      if (controls?.primary && controls?.secondary) {
        const value = Boolean(filters[key]);
        controls.primary.checked = value === controls.primaryValue;
        controls.secondary.checked = value === controls.secondaryValue;
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

  function areVisibleRowsClean(modal) {
    return FORMATTING_ITEMS.every((item) => {
      if (!item.filterKey) {
        return true;
      }

      const row = modal.formattingRows[item.analysisKey];

      if (!row || row.element.hidden) {
        return true;
      }

      return readFilters(modal)[item.filterKey] === Boolean(item.cleanValue);
    });
  }

  function updateBulkToggleButton(modal) {
    const cleanState = areVisibleRowsClean(modal);

    modal.bulkToggleButton.textContent = cleanState
      ? modal.options.strings.buttons.keepMore
      : modal.options.strings.buttons.cleanAll;
    modal.bulkToggleButton.classList.toggle("btn-outline-secondary", cleanState);
    modal.bulkToggleButton.classList.toggle("btn-success", !cleanState);
  }

  function setVisibleRowsCleanState(modal, cleanState) {
    FORMATTING_ITEMS.forEach((item) => {
      if (!item.filterKey) {
        return;
      }

      const row = modal.formattingRows[item.analysisKey];
      const controls = modal.filterInputs[item.filterKey];

      if (!row || row.element.hidden || !controls?.primary || !controls?.secondary) {
        return;
      }

      const targetValue = cleanState ? Boolean(item.cleanValue) : !Boolean(item.cleanValue);
      controls.primary.checked = targetValue === controls.primaryValue;
      controls.secondary.checked = targetValue === controls.secondaryValue;
    });

    updateWorkspace(modal);
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
        const primaryId = `${name}-primary-${index}`;
        const secondaryId = `${name}-secondary-${index}`;
        const primaryInput = document.createElement("input");
        const secondaryInput = document.createElement("input");
        const primaryVerb = item.cleanValue ? item.trueVerb : item.falseVerb;
        const secondaryVerb = item.cleanValue ? item.falseVerb : item.trueVerb;
        const primaryValue = Boolean(item.cleanValue);
        const secondaryValue = !primaryValue;
        const primaryLabel = createElement("label", "btn btn-outline-success btn-sm sjx-smartpaste-toggle__button", modal.options.strings.buttons[primaryVerb] || modal.options.strings.buttons.drop);
        const secondaryLabel = createElement("label", "btn btn-outline-secondary btn-sm sjx-smartpaste-toggle__button", modal.options.strings.buttons[secondaryVerb] || modal.options.strings.buttons.keep);

        controls.setAttribute("role", "group");
        controls.setAttribute("aria-label", title);

        primaryInput.type = "radio";
        primaryInput.className = "btn-check sjx-smartpaste-toggle__input";
        primaryInput.name = name;
        primaryInput.id = primaryId;
        primaryInput.autocomplete = "off";
        primaryInput.checked = Boolean(modal.defaultFilters[item.filterKey]) === primaryValue;

        secondaryInput.type = "radio";
        secondaryInput.className = "btn-check sjx-smartpaste-toggle__input";
        secondaryInput.name = name;
        secondaryInput.id = secondaryId;
        secondaryInput.autocomplete = "off";
        secondaryInput.checked = Boolean(modal.defaultFilters[item.filterKey]) === secondaryValue;

        primaryInput.addEventListener("change", () => {
          if (primaryInput.checked) {
            updateWorkspace(modal);
          }
        });

        secondaryInput.addEventListener("change", () => {
          if (secondaryInput.checked) {
            updateWorkspace(modal);
          }
        });

        primaryLabel.htmlFor = primaryId;
        secondaryLabel.htmlFor = secondaryId;
        primaryLabel.title = title;
        secondaryLabel.title = title;

        modal.filterInputs[item.filterKey] = {
          primary: primaryInput,
          secondary: secondaryInput,
          primaryValue,
          secondaryValue
        };

        controls.append(primaryInput, primaryLabel, secondaryInput, secondaryLabel);
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

      row.hidden = true;
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
    titleGroup.append(title, titleDetail);
    header.appendChild(titleGroup);

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
    const pasteSurface = createElement("div", "sjx-smartpaste-paste-surface");
    pasteSurface.id = pasteId;
    pasteSurface.contentEditable = "true";
    pasteSurface.setAttribute("data-placeholder", options.strings.pastePlaceholder);
    pasteView.appendChild(pasteSurface);

    const sourceHtmlView = createElement("div", "sjx-smartpaste-pane sjx-smartpaste-pane--html");
    sourceHtmlView.id = sourceHtmlId;
    sourceHtmlView.hidden = true;
    const htmlMeta = createFieldMeta(options.strings.htmlLabel, options.strings.htmlHint, sourceId);
    const sourceTextarea = createElement("textarea", "sjx-smartpaste-source");
    sourceTextarea.id = sourceId;
    sourceTextarea.rows = 12;
    sourceTextarea.placeholder = options.strings.pastePlaceholder;
    sourceHtmlView.append(htmlMeta, sourceTextarea);
    sourceStage.append(pasteView, sourceHtmlView);

    const sourceActions = createElement("div", "sjx-smartpaste-panel__actions sjx-smartpaste-panel__actions--footer");
    const sourceActionGroup = createElement("div", "sjx-smartpaste-panel__action-group btn-group btn-group-sm");
    const sourceToggleButton = createElement("button", "btn btn-sm btn-outline-secondary");
    sourceToggleButton.type = "button";
    sourceToggleButton.textContent = options.strings.buttons.showHtml;
    sourceToggleButton.setAttribute("aria-controls", sourceHtmlId);
    sourceToggleButton.setAttribute("aria-expanded", "false");
    const clearButton = createElement("button", "btn btn-sm btn-outline-secondary");
    clearButton.type = "button";
    clearButton.textContent = options.strings.buttons.clear;
    sourceActionGroup.append(sourceToggleButton, clearButton);
    sourceActions.appendChild(sourceActionGroup);
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
    const outputMeta = createFieldMeta(options.strings.outputLabel, options.strings.outputHint, outputId);
    const outputTextarea = createElement("textarea", "sjx-smartpaste-output");
    outputTextarea.id = outputId;
    outputTextarea.rows = 8;
    outputTextarea.readOnly = true;
    previewHtmlView.append(outputMeta, outputTextarea);
    previewStage.append(previewView, previewHtmlView);
    const previewActions = createElement("div", "sjx-smartpaste-panel__actions sjx-smartpaste-panel__actions--footer");
    const previewActionGroup = createElement("div", "sjx-smartpaste-panel__action-group btn-group btn-group-sm");
    const previewToggleButton = createElement("button", "btn btn-sm btn-outline-secondary");
    previewToggleButton.type = "button";
    previewToggleButton.textContent = options.strings.buttons.showHtml;
    previewToggleButton.setAttribute("aria-controls", previewHtmlId);
    previewToggleButton.setAttribute("aria-expanded", "false");
    previewActionGroup.appendChild(previewToggleButton);
    previewActions.appendChild(previewActionGroup);
    previewPanel.append(previewHeader, previewStage, previewActions);

    const formattingPanel = createElement("section", "sjx-smartpaste-panel sjx-smartpaste-panel--formatting");
    const formattingHeader = createElement("div", "sjx-smartpaste-panel__header");
    const formattingTitle = createElement("h3", "sjx-smartpaste-panel__title", options.strings.formattingTitle);
    const formattingHeaderActions = createElement("div", "sjx-smartpaste-panel__actions");
    const bulkToggleButton = createElement("button", "btn btn-sm btn-success");
    bulkToggleButton.type = "button";
    bulkToggleButton.textContent = options.strings.buttons.cleanAll;
    formattingHeader.append(formattingTitle, formattingHeaderActions);
    formattingHeaderActions.appendChild(bulkToggleButton);
    const formattingEmpty = createElement("p", "sjx-smartpaste-empty", options.strings.formattingEmpty);
    formattingEmpty.hidden = true;

    topRow.append(sourcePanel, previewPanel);
    workspace.append(topRow, status, formattingPanel);

    body.append(workspace);

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
      formattingEmpty,
      bulkToggleButton,
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
      previousActiveElement: null
    };

    formattingPanel.append(formattingHeader, formattingEmpty, buildFormattingControls(modalState));

    const close = () => {
      backdrop.hidden = true;
      backdrop.classList.remove("is-active");
      document.body.classList.remove("sjx-smartpaste-modal-open");

      if (modalState?.previousActiveElement?.focus) {
        modalState.previousActiveElement.focus();
      }
    };

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

    bulkToggleButton.addEventListener("click", () => {
      setVisibleRowsCleanState(modalState, !areVisibleRowsClean(modalState));
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
    modal.initialSource = selectionSource;

    modal.title.textContent = modal.options.strings.title;
    modal.titleDetail.textContent = modal.options.strings.titleDetail;
    modal.clearButton.textContent = modal.options.strings.buttons.clear;
    modal.bulkToggleButton.textContent = modal.options.strings.buttons.cleanAll;
    modal.resetButton.textContent = modal.options.strings.buttons.reset;
    modal.cancelButton.textContent = modal.options.strings.buttons.cancel;
    modal.insertButton.textContent = modal.options.strings.buttons.insert;
    modal.pasteSurface.setAttribute("data-placeholder", modal.options.strings.pastePlaceholder);
    modal.sourceTextarea.placeholder = modal.options.strings.pastePlaceholder;
    modal.outputTextarea.placeholder = modal.options.strings.previewEmpty;
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
