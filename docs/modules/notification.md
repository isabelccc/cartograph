# Notification

## TODO

- [ ] Provider adapters (SendGrid, SES, Twilio).
- [ ] Locale fallbacks + MJML/React Email templates.

## Requirements

- `{{token}}` replacement; unknown keys **unchanged**.
- Sanitization for previews must be **allowlist**-based.

## Function declarations (`modules/notification/notification.ts`)

```ts
function renderTemplate(template: string, vars: Record<string, string>): string;
function sanitizeForEmailPreview(html: string): string;
function mergeTemplateLayers(base: string, override: string | undefined): string;
```
