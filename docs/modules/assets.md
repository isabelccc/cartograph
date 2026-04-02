# Assets — MIME & storage keys

## TODO

- [ ] Virus scan hook, image variants, CDN signed URLs.

## Requirements

- Map known MIME → extension; unknown → `null`.
- Storage keys: no path traversal, stable encoding.

## Function declarations (`modules/assets/file-asset.ts`)

```ts
function extFromMime(mime: string): string | null;
function guessMimeFromFilename(filename: string): string | null;
function storageKeyFromFilename(filename: string): string;
```

Codes: `INVALID_FILENAME`, `UNKNOWN_MIME`.
