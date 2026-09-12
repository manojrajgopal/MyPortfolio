/**
 * The 3D palette mirrors the CSS tokens so the WebGL world and the DOM
 * never drift apart. Colours are authored in sRGB hex.
 */
export const hex = {
  void: 0x050506,
  obsidian: 0x08080a,
  graphite: 0x101114,
  ash: 0x17191d,
  stone: 0x23252a,

  ivory: 0xefe9de,
  parchment: 0xddd6c8,
  silver: 0x9a9992,
  muted: 0x6c6b66,

  copper: 0xb06b45,
  copperLift: 0xd08a5c,
  copperDeep: 0x7a462b,
  ember: 0xe0a063,

  champagne: 0xd9c9a8,
  bronze: 0x6b573f,

  emerald: 0x4a7f68,
  emeraldLift: 0x6ea88c,
  forest: 0x0e1b16,
} as const;
