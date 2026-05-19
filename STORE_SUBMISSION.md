# Chrome Web Store Submission

## Store Listing

Name:

```text
PasteFrame for Google Docs
```

Short description:

```text
Paste images into Google Docs comments by uploading them to Drive and inserting previewable links.
```

Detailed description:

```text
PasteFrame makes it easier to add screenshots and images to Google Docs comment threads.

When you paste an image into a Google Docs comment or reply field, PasteFrame uploads the image to your Google Drive and inserts a Drive link into the comment. Google Docs can show its built-in Drive preview when someone hovers over the link.

Uploaded images are stored in a PasteFrame folder in your Drive by default. You can change the folder name and link sharing behavior from the extension options page.

PasteFrame is intentionally small: it runs only on Google Docs document pages, uses the narrow Google Drive file scope, and does not collect analytics or browsing history.
```

Category:

```text
Productivity
```

Support URL:

```text
https://github.com/ron-ulitsky/pasteframe/issues
```

Privacy policy URL:

```text
https://github.com/ron-ulitsky/pasteframe/blob/main/PRIVACY.md
```

## Privacy Tab

Single purpose:

```text
PasteFrame uploads images that users paste into Google Docs comments to their Google Drive and inserts previewable Drive links into those comments.
```

Permission justifications:

```text
identity: Used to request Google authorization so PasteFrame can upload pasted images to the user's Google Drive.
storage: Used to save extension settings, including the upload folder name and link sharing preference.
https://docs.google.com/document/*: Used to detect image paste events in Google Docs comment and reply fields and insert the generated Drive link.
https://www.googleapis.com/* and https://www.googleapis.com/upload/drive/v3/*: Used to create the Drive folder, upload pasted images, and set file sharing permissions.
https://drive.google.com/*: Used because inserted links and uploaded files are Google Drive resources.
```

Remote code:

```text
No. PasteFrame does not execute remotely hosted code.
```

User data disclosure:

```text
PasteFrame handles images that users explicitly paste into Google Docs comment fields, Drive file metadata for uploaded images, and extension settings. It does not collect analytics, browsing history, document text, or advertising identifiers. Uploaded images are stored in the user's Google Drive.
```

## Pre-Submission Checklist

- Confirm the OAuth consent screen is configured with the same app name,
  support email, and privacy policy URL used in the store listing.
- Confirm Google Drive API is enabled in the Google Cloud project.
- Confirm `manifest.json` has the Chrome extension OAuth client ID.
- Reload and test the unpacked extension in Chrome.
- Test first-run OAuth, image upload, Drive folder creation, link insertion, and
  the options page.
- Capture at least one Chrome Web Store screenshot from the working flow.
- Run `powershell -ExecutionPolicy Bypass -File scripts/package.ps1`.
- Upload `dist/pasteframe.zip` in the Chrome Web Store Developer Dashboard.
- Complete Store Listing, Privacy, Distribution, and Test Instructions tabs.

## Reviewer Test Instructions

```text
1. Install the extension.
2. Open a Google Docs document.
3. Open a comment or reply field.
4. Paste an image from the clipboard.
5. Complete the Google authorization flow if prompted.
6. Confirm that PasteFrame uploads the image to Google Drive and inserts a Drive link into the comment field.
7. Open the extension options page to confirm the Drive folder name and link sharing settings.
```

