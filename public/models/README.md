# 3D assets

These folders are empty on purpose.

Every object in the experience — the ridgelines, the code lattice, the
credential slabs, the avatar, the verification seal, the skill constellation —
is generated procedurally in Three.js at runtime, and every texture is drawn
on a canvas (`src/lib/three/textures.ts`). Nothing is downloaded, so there is
no third-party licence to honour and no binary payload to ship.

## Adding a real model

If a GLTF/GLB model would tell the story better than the procedural geometry,
drop it into the matching folder and load it with `useGLTF` from
`@react-three/drei`, inside the `<Suspense>` boundary that already wraps the
world in `src/components/world/WorldCanvas.tsx`.

Before you do:

- Compress it with Draco or Meshopt (`npx gltf-transform optimize in.glb out.glb`).
- Keep it under a few hundred kilobytes; chapters mount and unmount as the
  camera travels, and a heavy model will stall that transition.
- Copy the file into this folder rather than hotlinking it from a CDN.
- Check the licence allows use here, and record it below.

| File | Source | Licence |
| ---- | ------ | ------- |
| _(none yet)_ | | |
