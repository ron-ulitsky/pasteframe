# PasteFrame for Google Docs

<img width="1484" height="814" alt="demo3" src="https://github.com/user-attachments/assets/aab49eae-17be-4ad3-9e68-7198a37ddb27" />

PasteFrame lets you paste screenshots and images into Google Docs comments
without manually uploading files first.

## How It Works

1. Open a Google Docs comment or reply field.
2. Paste an image from your clipboard.
3. PasteFrame uploads the image to your Google Drive.
4. PasteFrame inserts a Drive link into the comment.

Google Docs shows its built-in Drive preview when someone hovers over the link.

## Drive Storage

Uploaded images are stored in a `PasteFrame` folder in Google Drive by default.
You can change the folder name from the extension options page.

PasteFrame can also make uploaded images readable by anyone with the link. This
is configurable from the extension options page.

## Privacy

PasteFrame runs only on Google Docs document pages. It handles images you
explicitly paste into comment fields, uploads them to your Google Drive, and
stores extension settings such as your upload folder name.

PasteFrame does not collect analytics, browsing history, document text, or
advertising identifiers.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Roadmap

- Insert shorter Drive links.
- Improve the success toast after uploads.
- Explore custom inline previews inside comment threads.

## Development

Developer setup and packaging notes live in [DEVELOPMENT.md](DEVELOPMENT.md).
