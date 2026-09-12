# Textures

Empty on purpose. Every texture used by the experience is drawn at runtime on
a 2D canvas — see `src/lib/three/textures.ts` for the particle sprite, the
light-shaft gradient and the technical grid.

Add bitmap textures here only if a procedural one cannot do the job, and keep
them compressed (`.webp`, or `.ktx2` for GPU textures).
