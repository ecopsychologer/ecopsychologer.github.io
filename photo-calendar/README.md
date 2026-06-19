# Photo Calendar

A dependency-free Progressive Web App for a photo-first calendar. It is designed to be easy to host on GitHub Pages and usable from a phone browser.

## What works now

- Month calendar where each day is primarily a large photo tile.
- Compact, comfort, and large zoom options.
- Show Whole and Fill Box photo display modes. Show Whole is the default so photos are not cropped.
- Click any day to add or edit photos, titles, and notes.
- Tap a photo thumbnail inside a day to replace or remove that selected photo.
- Closing the day editor with X saves the current changes. Cancel closes without saving.
- Local IndexedDB storage where each day stores an `events` array for multiple photo entries.
- Laptop and tablet widths keep the 7-column calendar view. Narrow phone widths switch to a vertical day list with the weekday shown beside the date.
- Offline app shell through a service worker.
- No backend, account, build step, or third-party dependency.

## Run locally

From this folder:

```sh
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

The PWA behavior needs `localhost` or HTTPS. Opening `index.html` directly works for basic viewing, but service workers are not available from `file://`.

## Publish on GitHub Pages

This app can be served as static files. Push the repository to GitHub, then enable GitHub Pages for the branch and folder that contains `index.html`.

The manifest and service worker use relative paths, so the app can live at a repository subpath such as:

```text
https://your-name.github.io/photo-calendar/
```

## PWA vs iOS app

A PWA is the right first version for fast sharing through GitHub Pages, quick iteration, and use on different devices. An iOS app becomes worth it if the calendar needs App Store distribution, deeper photo library integration, reliable native notifications, shared multi-device sync, or caregiver/admin controls.
