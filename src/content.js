const DRIVE_FILE_RE = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/[^\s<)"]*/g;
const DRIVE_OPEN_RE = /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/g;

let previewObserver;

document.addEventListener("paste", handlePaste, true);
startPreviewObserver();

async function handlePaste(event) {
  const imageFile = findImageFile(event.clipboardData);
  if (!imageFile || !isLikelyDocsCommentTarget(event.target)) {
    return;
  }

  event.preventDefault();
  const target = document.activeElement || event.target;
  const notice = showToast("Uploading image to Drive...");

  try {
    const dataUrl = await fileToDataUrl(imageFile);
    const response = await chrome.runtime.sendMessage({
      type: "DIC_UPLOAD_IMAGE",
      payload: {
        dataUrl,
        mimeType: imageFile.type || "image/png",
        name: imageFile.name || makeImageName(imageFile.type)
      }
    });

    if (!response?.ok) {
      throw new Error(response?.error?.message || "Upload failed.");
    }

    insertTextAtTarget(target, response.result.link);
    notice.update("Image link inserted.");
    hydrateDrivePreviews();
  } catch (error) {
    notice.update(error.message || "Could not upload image.", true);
  }
}

function findImageFile(clipboardData) {
  const items = Array.from(clipboardData?.items || []);
  const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
  return imageItem?.getAsFile() || null;
}

function isLikelyDocsCommentTarget(target) {
  const element = target instanceof Element ? target : target?.parentElement;
  if (!element) {
    return false;
  }

  if (element.closest('[aria-label*="comment" i], [aria-label*="reply" i], [data-tooltip*="comment" i]')) {
    return true;
  }

  const editable = element.closest('[contenteditable="true"], textarea, input');
  if (!editable) {
    return false;
  }

  const dialogOrPane = editable.closest('[role="dialog"], [role="region"], [role="complementary"], .docos, .kix-appview-editor');
  const labelText = [
    editable.getAttribute("aria-label"),
    dialogOrPane?.getAttribute("aria-label"),
    dialogOrPane?.textContent?.slice(0, 300)
  ].filter(Boolean).join(" ");

  return /\b(comment|reply|suggestion)\b/i.test(labelText);
}

function insertTextAtTarget(target, text) {
  const active = target instanceof HTMLElement ? target : document.activeElement;

  if (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement) {
    const start = active.selectionStart ?? active.value.length;
    const end = active.selectionEnd ?? active.value.length;
    active.setRangeText(text, start, end, "end");
    active.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    return;
  }

  active?.focus?.();
  if (!document.execCommand("insertText", false, text)) {
    navigator.clipboard?.writeText(text).catch(() => {});
    showToast("Image uploaded. Link copied; paste it into the comment.", false, 4500);
  }
}

function startPreviewObserver() {
  hydrateDrivePreviews();

  previewObserver = new MutationObserver(() => {
    queueMicrotask(hydrateDrivePreviews);
  });

  previewObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

function hydrateDrivePreviews() {
  const candidates = Array.from(document.querySelectorAll("a[href*='drive.google.com']"));

  for (const anchor of candidates) {
    if (anchor.dataset.dicPreviewed === "true") {
      continue;
    }

    const fileId = extractDriveFileId(anchor.href);
    if (!fileId || !isInsideCommentUi(anchor)) {
      continue;
    }

    anchor.dataset.dicPreviewed = "true";
    anchor.insertAdjacentElement("afterend", createPreview(fileId, anchor.href));
  }
}

function extractDriveFileId(url) {
  DRIVE_FILE_RE.lastIndex = 0;
  DRIVE_OPEN_RE.lastIndex = 0;
  return DRIVE_FILE_RE.exec(url)?.[1] || DRIVE_OPEN_RE.exec(url)?.[1] || null;
}

function isInsideCommentUi(element) {
  const region = element.closest('[aria-label*="comment" i], [aria-label*="reply" i], [role="dialog"], .docos');
  if (region) {
    return true;
  }

  return /\b(comment|reply|resolve|reopen)\b/i.test(element.closest("div")?.textContent?.slice(0, 500) || "");
}

function createPreview(fileId, link) {
  const wrapper = document.createElement("a");
  wrapper.className = "dic-preview";
  wrapper.href = link;
  wrapper.target = "_blank";
  wrapper.rel = "noopener noreferrer";
  wrapper.setAttribute("aria-label", "Open pasted image");

  const image = document.createElement("img");
  image.src = `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w600`;
  image.alt = "Pasted comment image";
  image.loading = "lazy";

  wrapper.append(image);
  return wrapper;
}

function showToast(message, isError = false, timeout = 2500) {
  const toast = document.createElement("div");
  toast.className = `dic-toast${isError ? " dic-toast-error" : ""}`;
  toast.textContent = message;
  document.documentElement.append(toast);

  let timer = window.setTimeout(remove, timeout);

  function update(nextMessage, nextIsError = false) {
    window.clearTimeout(timer);
    toast.textContent = nextMessage;
    toast.classList.toggle("dic-toast-error", nextIsError);
    timer = window.setTimeout(remove, nextIsError ? 4500 : timeout);
  }

  function remove() {
    toast.remove();
  }

  return { update, remove };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function makeImageName(mimeType) {
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";
  return `docs-comment-image-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
}

