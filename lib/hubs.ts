/**
 * Merged "hub" tools. Each hub page renders the legacy tool modules
 * (components/modes/<id>.tsx) behind a mode select. Mode ids equal the old
 * tool ids, so old i18n/keywords stay valid and old slugs redirect here.
 * The Universal Converter is defined separately in lib/converter-formats.ts.
 */
export const HUB_MODES: Record<string, string[]> = {
  "unit-converter": [
    "unit-converter",
    "data-converter",
    "physics-converter",
    "number-base-converter",
    "timestamp-converter",
  ],
  "encoder-decoder": ["base64-encoder", "url-encoder", "jwt-decoder", "hash-generator"],
  "text-tools": ["case-converter", "slug-generator"],
  "code-generator": ["qr-generator", "barcode-generator", "qr-scanner"],
  "random-generator": ["password-generator", "uuid-generator", "lorem-ipsum", "random-picker"],
  "pdf-toolkit": ["merge-pdf", "split-pdf", "pdf-editor"],
  "image-toolkit": ["image-resizer", "image-cropper", "image-compressor", "image-splitter"],
  "finance-calculator": [
    "percentage-calculator",
    "discount-calculator",
    "tax-calculator",
    "tip-calculator",
    "split-bill",
    "hpp-calculator",
    "profit-margin-calculator",
    "break-even-calculator",
  ],
  "date-calculator": ["age-calculator", "date-difference-calculator"],
};
