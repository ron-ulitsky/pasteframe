# Development

## Local Install

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder.

## Google Drive OAuth Setup

1. Create a Google Cloud project.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen.
4. Create an OAuth client for a Chrome extension.
5. Use this extension's Chrome extension ID.
6. Put the client ID in `manifest.json` under `oauth2.client_id`.

The extension requests only `https://www.googleapis.com/auth/drive.file`, which
lets it create and manage files it creates or that the user explicitly opens
with the app.

## Packaging

Run:

```powershell
npm run package
```

If `npm` is not on PATH, run the package script directly:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

The uploadable ZIP will be written to `dist/pasteframe.zip`.

## Chrome Web Store Submission

See [STORE_SUBMISSION.md](STORE_SUBMISSION.md) for listing copy, privacy field
answers, and the submission checklist.

