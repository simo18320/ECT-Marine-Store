# Sampling kit support documents

Generates, for each active sampling kit, a print-ready PDF: instruction card (with the kit contents as a
checklist and the registration QR code), sample record sheet, chain of custody, sample labels with QR code
(A4 3 x 8 labels, 63.5 x 33.9 mm) and, for Legionella and the Yacht box, sampling-point labels (A4 2 x 4).

Everything comes from the catalogue (`technical_specs` of the "Sampling Kits" category), so edit the product
in the admin and regenerate. The QR code of each kit points to `/sample-registration?product=<product id>`.

```bash
pip install reportlab segno
node tools/kit-documents/fetch-kits.mjs > kits.json
BASE_URL=https://ectmarinestore.com python3 tools/kit-documents/generate.py out kits.json
```

Per-kit layout (number of rows, columns, tick options on the labels) is the `CFG` / `COLS` tables at the top of
`generate.py`. Bump `REV` when the documents change.
