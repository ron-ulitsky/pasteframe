const UPLOAD_TIMEOUT_MS = 45000;

document.addEventListener("paste", handlePaste, true);

async function handlePaste(event) {
  const imageFile = findImageFile(event.clipboardData);
  if (!imageFile || !isLikelyDocsCommentTarget(event.target)) {
    return;
  }

  event.preventDefault();
  const target = document.activeElement || event.target;
  const notice = showToast("Authorizing Drive...", false, UPLOAD_TIMEOUT_MS + 5000);

  try {
    debug("Image paste detected", {
      mimeType: imageFile.type,
      size: imageFile.size
    });
    const dataUrl = await fileToDataUrl(imageFile);
    notice.update("Uploading image to Drive...", false, UPLOAD_TIMEOUT_MS + 5000);

    const response = await sendMessageWithTimeout({
      type: "DIC_UPLOAD_IMAGE",
      payload: {
        dataUrl,
        mimeType: imageFile.type || "image/png",
        name: imageFile.name || makeImageName(imageFile.type)
      }
    }, UPLOAD_TIMEOUT_MS);

    if (!response?.ok) {
      throw new Error(response?.error?.message || "Upload failed.");
    }

    insertTextAtTarget(target, response.result.link);
    notice.update(`Uploaded ${response.result.name || "image"}. Link inserted.`, "success");
    debug("Image link inserted", response.result);
  } catch (error) {
    console.error("[PasteFrame] Upload failed", error);
    notice.update(error.message || "Could not upload image.", "error");
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
    showToast("Image uploaded. Link copied; paste it into the comment.", "success", 4500);
  }
}

function showToast(message, state = "default", timeout = 2500) {
  const toast = document.createElement("div");
  setToastState(toast, state);
  toast.textContent = message;
  document.documentElement.append(toast);

  let timer = window.setTimeout(remove, timeout);

  function update(nextMessage, nextState = "default", nextTimeout = timeout) {
    window.clearTimeout(timer);
    toast.textContent = nextMessage;
    setToastState(toast, nextState);
    timer = window.setTimeout(remove, nextState === "error" ? 4500 : nextTimeout);
  }

  function remove() {
    toast.remove();
  }

  return { update, remove };
}

function setToastState(toast, state) {
  toast.className = "dic-toast";
  if (state === "error") {
    toast.classList.add("dic-toast-error");
  }
  if (state === "success") {
    toast.classList.add("dic-toast-success");
  }
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

function sendMessageWithTimeout(message, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Drive upload timed out. Open the extension service worker console for details, then try again."));
    }, timeoutMs);

    chrome.runtime.sendMessage(message)
      .then((response) => {
        window.clearTimeout(timer);
        resolve(response);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function debug(message, details) {
  console.debug("[PasteFrame]", message, details || "");
}
