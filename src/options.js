const shareUploadedFiles = document.getElementById("shareUploadedFiles");
const status = document.getElementById("status");

init();

async function init() {
  const settings = await chrome.storage.sync.get({ shareUploadedFiles: true });
  shareUploadedFiles.checked = settings.shareUploadedFiles;

  shareUploadedFiles.addEventListener("change", async () => {
    await chrome.storage.sync.set({ shareUploadedFiles: shareUploadedFiles.checked });
    status.textContent = "Saved.";
    window.setTimeout(() => {
      status.textContent = "";
    }, 1600);
  });
}

