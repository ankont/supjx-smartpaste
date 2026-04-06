import { JoomlaEditorButton } from "editor-api";

(() => {
  const OPTIONS_KEY = "plg_editors_xtd_smartpaste";
  let modalState = null;

  function getOptions() {
    const joomla = window.Joomla;
    const configured = joomla?.getOptions?.(OPTIONS_KEY) || {};
    const strings = configured.strings || {};

    return {
      defaultInsertText: String(
        configured.defaultInsertText
        || "SmartPaste scaffold placeholder: modal workflow is connected and ready for future controlled import."
      ),
      strings: {
        modalTitle: String(strings.modalTitle || "SmartPaste"),
        modalIntro: String(strings.modalIntro || "Paste source content into the placeholder modal to validate the editor button flow."),
        modalNote: String(strings.modalNote || "This first scaffold inserts escaped placeholder HTML only."),
        textareaLabel: String(strings.textareaLabel || "Source content"),
        textareaPlaceholder: String(strings.textareaPlaceholder || "Paste content here..."),
        cancel: String(strings.cancel || "Cancel"),
        insert: String(strings.insert || "Insert Placeholder"),
        close: String(strings.close || "Close")
      }
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normaliseText(value) {
    return String(value ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\u200B/g, "")
      .trim();
  }

  function getSelection(editor) {
    if (editor?.getSelection) {
      return String(editor.getSelection() || "");
    }

    return "";
  }

  function selectionToTextareaValue(editor) {
    const selection = normaliseText(getSelection(editor));

    if (!selection) {
      return "";
    }

    const stripped = selection.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    return stripped.length > 3000 ? stripped.slice(0, 3000) : stripped;
  }

  function buildPlaceholderMarkup(rawValue, options) {
    const sourceText = normaliseText(rawValue) || options.defaultInsertText;
    const paragraphs = sourceText
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`);

    return [
      '<div class="sjx-smartpaste-placeholder" data-smartpaste-placeholder="1">',
      ...paragraphs,
      "</div>"
    ].join("");
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

    if (editor?.setValue && editor?.getValue) {
      editor.setValue(`${editor.getValue()}${markup}`);
    }
  }

  function createElement(tagName, className = "") {
    const element = document.createElement(tagName);

    if (className) {
      element.className = className;
    }

    return element;
  }

  function ensureModal() {
    if (modalState) {
      return modalState;
    }

    const titleId = "sjx-smartpaste-modal-title";
    const textareaId = "sjx-smartpaste-modal-textarea";
    const backdrop = createElement("div", "sjx-smartpaste-modal-backdrop");
    backdrop.hidden = true;

    const dialog = createElement("section", "sjx-smartpaste-modal");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", titleId);
    dialog.tabIndex = -1;

    const header = createElement("header", "sjx-smartpaste-modal__header");
    const title = createElement("h2", "sjx-smartpaste-modal__title");
    title.id = titleId;
    const closeButton = createElement("button", "sjx-smartpaste-modal__close btn btn-link");
    closeButton.type = "button";

    header.append(title, closeButton);

    const body = createElement("div", "sjx-smartpaste-modal__body");
    const intro = createElement("p", "sjx-smartpaste-modal__intro");
    const note = createElement("p", "sjx-smartpaste-modal__note");
    const label = createElement("label", "sjx-smartpaste-modal__label");
    label.setAttribute("for", textareaId);
    const textarea = createElement("textarea", "sjx-smartpaste-modal__textarea");
    textarea.id = textareaId;
    textarea.rows = 10;

    body.append(intro, note, label, textarea);

    const footer = createElement("footer", "sjx-smartpaste-modal__footer");
    const cancelButton = createElement("button", "btn btn-secondary");
    cancelButton.type = "button";
    const insertButton = createElement("button", "btn btn-primary");
    insertButton.type = "button";

    footer.append(cancelButton, insertButton);
    dialog.append(header, body, footer);
    backdrop.append(dialog);
    document.body.appendChild(backdrop);

    const close = () => {
      backdrop.hidden = true;
      backdrop.classList.remove("is-active");
      document.body.classList.remove("sjx-smartpaste-modal-open");

      if (modalState?.previousActiveElement?.focus) {
        modalState.previousActiveElement.focus();
      }
    };

    cancelButton.addEventListener("click", close);
    closeButton.addEventListener("click", close);

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

    insertButton.addEventListener("click", () => {
      if (!modalState?.editor) {
        close();
        return;
      }

      const markup = buildPlaceholderMarkup(textarea.value, modalState.options);
      insertMarkup(modalState.editor, markup);
      close();
    });

    modalState = {
      backdrop,
      dialog,
      title,
      closeButton,
      intro,
      note,
      label,
      textarea,
      cancelButton,
      insertButton,
      editor: null,
      options: getOptions(),
      previousActiveElement: null
    };

    return modalState;
  }

  function openModal(editor) {
    const modal = ensureModal();
    const options = getOptions();

    modal.options = options;
    modal.editor = editor || null;
    modal.previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    modal.title.textContent = options.strings.modalTitle;
    modal.closeButton.textContent = options.strings.close;
    modal.closeButton.setAttribute("aria-label", options.strings.close);
    modal.intro.textContent = options.strings.modalIntro;
    modal.note.textContent = options.strings.modalNote;
    modal.label.textContent = options.strings.textareaLabel;
    modal.textarea.placeholder = options.strings.textareaPlaceholder;
    modal.cancelButton.textContent = options.strings.cancel;
    modal.insertButton.textContent = options.strings.insert;
    modal.textarea.value = selectionToTextareaValue(editor);

    modal.backdrop.hidden = false;
    modal.backdrop.classList.add("is-active");
    document.body.classList.add("sjx-smartpaste-modal-open");

    window.setTimeout(() => {
      modal.dialog.focus();
      modal.textarea.focus();
      modal.textarea.select();
    }, 0);
  }

  JoomlaEditorButton.registerAction("supersoft-smartpaste", (editor) => {
    openModal(editor);
  });
})();
