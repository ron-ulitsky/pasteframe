const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,thumbnailLink";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_PERMISSION_URL = (fileId) => `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`;
const DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const FETCH_TIMEOUT_MS = 30000;
const DEFAULT_FOLDER_NAME = "PasteFrame";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "DIC_UPLOAD_IMAGE") {
    return false;
  }

  uploadImage(message.payload)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => sendResponse({ ok: false, error: serializeError(error) }));

  return true;
});

async function uploadImage(payload) {
  if (!payload?.dataUrl || !payload?.mimeType) {
    throw new Error("Missing image payload.");
  }

  debug("Requesting auth token");
  const token = await getAuthToken();
  const settings = await getSettings();
  const fileName = payload.name || `docs-comment-image-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
  const folderId = await getOrCreateFolder(token, settings.folderName);
  const metadata = {
    name: fileName,
    mimeType: payload.mimeType,
    parents: [folderId]
  };

  debug("Uploading file to Drive", { fileName, mimeType: payload.mimeType });
  const multipartBody = await buildMultipartBody(metadata, payload.dataUrl, payload.mimeType);
  const uploadResponse = await fetchWithTimeout(DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${multipartBody.boundary}`
    },
    body: multipartBody.body
  });

  if (!uploadResponse.ok) {
    throw new Error(`Drive upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`);
  }

  const file = await uploadResponse.json();
  debug("Drive upload complete", { id: file.id, name: file.name });

  if (settings.shareUploadedFiles) {
    debug("Creating anyone-with-link permission", { id: file.id });
    await makeFileReadableByLink(token, file.id);
  }

  const link = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
  return {
    id: file.id,
    name: file.name,
    link,
    thumbnailLink: file.thumbnailLink || `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w600`
  };
}

function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      const error = chrome.runtime.lastError;
      if (error || !token) {
        reject(new Error(error?.message || "Could not authorize Google Drive."));
        return;
      }
      resolve(token);
    });
  });
}

async function getSettings() {
  const result = await chrome.storage.sync.get({
    shareUploadedFiles: true,
    folderName: DEFAULT_FOLDER_NAME
  });
  return {
    shareUploadedFiles: result.shareUploadedFiles,
    folderName: normalizeFolderName(result.folderName)
  };
}

async function getOrCreateFolder(token, folderName) {
  const cachedKey = `folderId:${folderName}`;
  const cached = await chrome.storage.local.get(cachedKey);
  const cachedFolderId = cached[cachedKey];

  if (cachedFolderId && await driveFileExists(token, cachedFolderId)) {
    return cachedFolderId;
  }

  const existingFolder = await findFolderByName(token, folderName);
  if (existingFolder?.id) {
    await chrome.storage.local.set({ [cachedKey]: existingFolder.id });
    return existingFolder.id;
  }

  const folder = await createFolder(token, folderName);
  await chrome.storage.local.set({ [cachedKey]: folder.id });
  return folder.id;
}

async function driveFileExists(token, fileId) {
  const response = await fetchWithTimeout(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?fields=id,trashed`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    throw new Error(`Could not check Drive folder: ${response.status} ${await response.text()}`);
  }

  const file = await response.json();
  return !file.trashed;
}

async function findFolderByName(token, folderName) {
  const query = [
    `name = '${escapeDriveQueryString(folderName)}'`,
    `mimeType = '${DRIVE_FOLDER_MIME_TYPE}'`,
    "trashed = false"
  ].join(" and ");
  const url = `${DRIVE_FILES_URL}?fields=files(id,name)&pageSize=1&q=${encodeURIComponent(query)}`;
  const response = await fetchWithTimeout(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Could not find Drive folder: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  return result.files?.[0] || null;
}

async function createFolder(token, folderName) {
  const response = await fetchWithTimeout(DRIVE_FILES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: DRIVE_FOLDER_MIME_TYPE
    })
  });

  if (!response.ok) {
    throw new Error(`Could not create Drive folder: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function makeFileReadableByLink(token, fileId) {
  const response = await fetchWithTimeout(DRIVE_PERMISSION_URL(fileId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      role: "reader",
      type: "anyone",
      allowFileDiscovery: false
    })
  });

  if (!response.ok) {
    throw new Error(`Could not create share link: ${response.status} ${await response.text()}`);
  }
}

async function buildMultipartBody(metadata, dataUrl, mimeType) {
  const boundary = `dic_${crypto.randomUUID()}`;
  const imageBlob = await fetch(dataUrl).then((response) => response.blob());
  const head = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    "",
    ""
  ].join("\r\n");
  const tail = `\r\n--${boundary}--\r\n`;
  const body = new Blob([head, imageBlob, tail], {
    type: `multipart/related; boundary=${boundary}`
  });

  return { boundary, body };
}

function serializeError(error) {
  console.error("[PasteFrame] Background error", error);
  return {
    message: error?.message || String(error)
  };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Google Drive request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function debug(message, details) {
  console.debug("[PasteFrame]", message, details || "");
}

function normalizeFolderName(folderName) {
  const normalized = String(folderName || "").trim();
  return normalized || DEFAULT_FOLDER_NAME;
}

function escapeDriveQueryString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
