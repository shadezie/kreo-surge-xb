# Kreo Surge XB interactive guide

This folder contains the editable static website and its standalone offline export.

## Run locally

From this folder, run:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:4173` in a browser.

## Edit the guide

- `dist/model.js` contains the procedural Three.js controller, control positions, materials, views, and annotations.
- `dist/data.js` contains every walkthrough and its steps.
- `dist/app.js` contains navigation, search, manual cards, and interaction behavior.
- `dist/style.css` contains the responsive layout and visual styling.
- `dist/manual/` contains the eight guide pages used by the manual library.
- `dist/vendor/` contains bundled Three.js and Lucide assets.

After changing the source, run:

```sh
python3 build-offline.py
```

This regenerates `Kreo-Surge-XB-Interactive-Guide.html`, which contains the site, model, icons, and manual images in one HTML file for offline use.

## Deploy on static hosting

Publish the contents of `dist/` together. For GitHub Pages, copy those contents into a repository's `docs/` folder, then select that branch and `/docs` in the Pages settings.
