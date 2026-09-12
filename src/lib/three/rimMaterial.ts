import { MeshStandardMaterial, type WebGLProgramParametersWithUniforms } from 'three';
import { hex } from './palette';

export interface RimUniforms {
  /** Strength of the edge light. */
  uRim: { value: number };
  /** How tightly the rim hugs the silhouette. Higher is thinner. */
  uRimPower: { value: number };
  uRimColor: { value: [number, number, number] };
  /** Vertical gradient applied in object space, 0 disables it. */
  uSheen: { value: number };
  uSheenColor: { value: [number, number, number] };
}

export interface RimMaterial extends MeshStandardMaterial {
  userData: { rim: RimUniforms };
}

function rgb(value: number): [number, number, number] {
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

interface RimParams {
  readonly color?: number;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly emissive?: number;
  readonly emissiveIntensity?: number;
  readonly rim?: number;
  readonly rimPower?: number;
  readonly rimColor?: number;
  readonly sheen?: number;
  readonly sheenColor?: number;
  readonly flatShading?: boolean;
}

/**
 * A standard material with a fresnel edge light and an optional vertical
 * sheen.
 *
 * This is what makes the metal in the world read as machined rather than
 * merely dark. Three directional lights cannot catch a silhouette the way a
 * real studio does; a view-dependent rim can, and it costs one dot product.
 *
 * Deliberately subtle — the rim is a highlight on an edge, never a glow
 * around an object.
 */
export function createRimMaterial(params: RimParams = {}): RimMaterial {
  const material = new MeshStandardMaterial({
    color: params.color ?? hex.ash,
    roughness: params.roughness ?? 0.36,
    metalness: params.metalness ?? 0.86,
    emissive: params.emissive ?? 0x000000,
    emissiveIntensity: params.emissiveIntensity ?? 1,
    flatShading: params.flatShading ?? false,
  }) as RimMaterial;

  const uniforms: RimUniforms = {
    uRim: { value: params.rim ?? 0.7 },
    uRimPower: { value: params.rimPower ?? 2.6 },
    uRimColor: { value: rgb(params.rimColor ?? hex.copperLift) },
    uSheen: { value: params.sheen ?? 0 },
    uSheenColor: { value: rgb(params.sheenColor ?? hex.champagne) },
  };
  material.userData = { rim: uniforms };

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uRim = uniforms.uRim;
    shader.uniforms.uRimPower = uniforms.uRimPower;
    shader.uniforms.uRimColor = uniforms.uRimColor;
    shader.uniforms.uSheen = uniforms.uSheen;
    shader.uniforms.uSheenColor = uniforms.uSheenColor;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vRimView;
         varying vec3 vRimNormal;
         varying float vRimHeight;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vec4 rimView = modelViewMatrix * vec4(transformed, 1.0);
         vRimView = -rimView.xyz;
         vRimNormal = normalize(normalMatrix * objectNormal);
         vRimHeight = position.y;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vRimView;
         varying vec3 vRimNormal;
         varying float vRimHeight;
         uniform float uRim;
         uniform float uRimPower;
         uniform vec3 uRimColor;
         uniform float uSheen;
         uniform vec3 uSheenColor;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         vec3 rimView = normalize(vRimView);
         float facing = 1.0 - clamp(dot(normalize(vRimNormal), rimView), 0.0, 1.0);
         float rim = pow(facing, uRimPower) * uRim;
         gl_FragColor.rgb += uRimColor * rim;

         if (uSheen > 0.0) {
           float sheen = smoothstep(-1.0, 1.4, vRimHeight) * uSheen;
           gl_FragColor.rgb = mix(gl_FragColor.rgb, uSheenColor, sheen * 0.16);
         }`,
      );
  };

  return material;
}
