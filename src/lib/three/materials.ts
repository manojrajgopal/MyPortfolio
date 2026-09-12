import {
  MeshStandardMaterial,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { hex } from './palette';

export interface DissolveUniforms {
  /** 0 = fully present, 1 = fully dissolved. */
  uDissolve: { value: number };
  /** Width of the glowing edge band. */
  uEdge: { value: number };
  uEdgeColor: { value: [number, number, number] };
}

export interface DissolveMaterial extends MeshStandardMaterial {
  userData: { uniforms: DissolveUniforms };
}

const DISSOLVE_NOISE = /* glsl */ `
  float dissolveHash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float dissolveNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dissolveHash(i + vec3(0, 0, 0)), dissolveHash(i + vec3(1, 0, 0)), f.x),
          mix(dissolveHash(i + vec3(0, 1, 0)), dissolveHash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(dissolveHash(i + vec3(0, 0, 1)), dissolveHash(i + vec3(1, 0, 1)), f.x),
          mix(dissolveHash(i + vec3(0, 1, 1)), dissolveHash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
`;

/**
 * A standard material that erodes away along a noise field, leaving a hot
 * copper rim at the dissolve front. Used to visualise inpainting:
 * geometry is removed and regenerated rather than faded out.
 */
export function createDissolveMaterial(
  params: { color: number; roughness?: number; metalness?: number; edgeColor?: number } = {
    color: hex.ash,
  },
): DissolveMaterial {
  const material = new MeshStandardMaterial({
    color: params.color,
    roughness: params.roughness ?? 0.45,
    metalness: params.metalness ?? 0.4,
  }) as DissolveMaterial;

  const edge = params.edgeColor ?? hex.ember;
  const uniforms: DissolveUniforms = {
    uDissolve: { value: 0 },
    uEdge: { value: 0.08 },
    uEdgeColor: {
      value: [((edge >> 16) & 255) / 255, ((edge >> 8) & 255) / 255, (edge & 255) / 255],
    },
  };
  material.userData = { uniforms };

  material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    shader.uniforms.uDissolve = uniforms.uDissolve;
    shader.uniforms.uEdge = uniforms.uEdge;
    shader.uniforms.uEdgeColor = uniforms.uEdgeColor;

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDissolvePos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvDissolvePos = position;',
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vDissolvePos;
         uniform float uDissolve;
         uniform float uEdge;
         uniform vec3 uEdgeColor;
         ${DISSOLVE_NOISE}`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         float n = dissolveNoise(vDissolvePos * 2.6);
         if (n < uDissolve) discard;
         float band = smoothstep(uDissolve + uEdge, uDissolve, n);
         gl_FragColor.rgb = mix(gl_FragColor.rgb, uEdgeColor, band * 0.92);`,
      );
  };

  return material;
}

/** Advance a dissolve material. Cheap enough to call every frame. */
export function setDissolve(material: DissolveMaterial, value: number): void {
  material.userData.uniforms.uDissolve.value = value;
}
