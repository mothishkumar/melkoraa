# DROP 001 — production print pack

Six oversized tees. Original MELKORAA artwork only. Licensed-character collabs are not in this drop.

## Garment

- Blank: oversized unisex tee, dropped shoulder, rib collar
- Fabric: 240 GSM 100% cotton
- Fit: oversized (size down for a cleaner line)
- Neck label: woven MELKORAA signature tag
- Sizes: S–XXL

## Print method

- Identity line: water-based or discharge for soft hand
- Manifesto line: high-opacity plastisol or puff on type-heavy backs
- No DTG for the first production run

## Placement

| Location | Artwork width | Offset from collar |
| --- | --- | --- |
| Left chest | 8 cm | 8 cm |
| Center back | 30–34 cm | 7–8 cm |

Export each SVG to PDF + PNG at 300 DPI, true black `#111111` or ivory `#F4F1EA` on dark garments. Keep 5 mm safety around type.

## SKUs

| Code | Style | Files |
| --- | --- | --- |
| 01 Essential | Chest mark + quiet back type | `frontend/public/print/essential-chest.svg`, `essential-back.svg` |
| 02 Signature | Full-back house mark | `signature-back.svg` |
| 03 Statement | Geometric back + “brighter tomorrow” | `statement-back.svg` |
| 04 So Build Yourself | Oversized back type | `so-build-yourself-back.svg` |
| 05 Built Different | Geometric emblem + four words | `built-different-back.svg` |
| 06 24 Hours | `24:00` chest + time-fragment back | `hours-24-front.svg`, `hours-24-back.svg` |

Colourways and inventory quantities live in `src/lib/catalog/drop-001.ts`.

## Not shipping

Anime / character portraits, third-party clan marks, and quoted dialogue from other IP. Keep those out of production files and the storefront.
