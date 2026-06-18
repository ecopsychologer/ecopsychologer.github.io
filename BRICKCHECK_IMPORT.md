# BrickCheck Import Workflow

BrickCheck should stay a standalone project. This Pages repo keeps the BrickCheck
repo as a source submodule at `external/brickcheck-source`, while the public link
points to `/brickcheck/`.

Do not serve the raw Vite source submodule at `/brickcheck/`; the source
`index.html` points at TypeScript files that GitHub Pages will not build on
request. The `/brickcheck/` URL should be owned by the BrickCheck repo's GitHub
Pages deployment, or by a checked-in static build artifact if that workflow is
chosen later.

## One-time GitHub setup

1. Re-authenticate GitHub CLI if needed:

   ```bash
   gh auth login -h github.com
   ```

2. Create a public BrickCheck repo if it does not already exist:

   ```bash
   gh repo create ecopsychologer/brickcheck --public --source /Users/jschoen/Documents/Codex/2026-06-17/build-a-local-first-progressive-web-3 --remote origin --push
   ```

3. Add BrickCheck to this Pages repo as a source submodule:

   ```bash
   git submodule add -b trunk https://github.com/ecopsychologer/brickcheck.git external/brickcheck-source
   git commit -m "Add BrickCheck submodule"
   ```

## Updating BrickCheck later

Work on BrickCheck in its own repo, push those changes, then update this site to
point at the new BrickCheck source commit:

```bash
git submodule update --remote external/brickcheck-source
git add external/brickcheck-source
git commit -m "Update BrickCheck"
```

For the live PWA, enable GitHub Pages in the `ecopsychologer/brickcheck` repo so
its production build publishes at `https://ecopsychologer.github.io/brickcheck/`.

## Pages URL rename

Rename this repository on GitHub from `ecopsychologer/jcschoen.github.io` to
`ecopsychologer/ecopsychologer.github.io`, then update the local remote:

```bash
git remote set-url origin https://github.com/ecopsychologer/ecopsychologer.github.io.git
```
