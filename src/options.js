const DEFAULT_FOLDER_NAME = "PasteFrame";
const folderName = document.getElementById("folderName");
const shareUploadedFiles = document.getElementById("shareUploadedFiles");
const status = document.getElementById("status");

init();

async function init() {
  const settings = await chrome.storage.sync.get({
    folderName: DEFAULT_FOLDER_NAME,
    shareUploadedFiles: true
  });
  folderName.value = settings.folderName || DEFAULT_FOLDER_NAME;
  shareUploadedFiles.checked = settings.shareUploadedFiles;

  folderName.addEventListener("change", saveSettings);
  folderName.addEventListener("blur", saveSettings);
  shareUploadedFiles.addEventListener("change", async () => {
    await saveSettings();
  });
}

async function saveSettings() {
  const normalizedFolderName = normalizeFolderName(folderName.value);
  folderName.value = normalizedFolderName;
  await chrome.storage.sync.set({
    folderName: normalizedFolderName,
    shareUploadedFiles: shareUploadedFiles.checked
  });
  status.textContent = "Saved.";
  window.setTimeout(() => {
    status.textContent = "";
  }, 1600);
}

function normalizeFolderName(value) {
  const normalized = String(value || "").trim();
  return normalized || DEFAULT_FOLDER_NAME;
}
