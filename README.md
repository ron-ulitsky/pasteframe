# PasteFrame for Google Docs

Chrome extension MVP for pasting images into Google Docs comment threads.

When the user pastes an image while focused in a Google Docs comment editor, the
extension uploads the image to Google Drive and inserts a shareable Drive link
into the comment. It also renders inline previews for supported Drive image
links inside Docs comments for users who have the extension installed.

## Status

This is an implementation scaffold, not yet store-ready. Before publishing you
must add a Chrome OAuth client ID in `manifest.json` and verify the OAuth
consent screen if Google requires it for your account/app.

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
