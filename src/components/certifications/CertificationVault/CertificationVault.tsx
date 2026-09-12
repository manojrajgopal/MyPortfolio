'use client';

import { certifications } from '@/data/certifications/certifications';
import { CELL_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { LightShaft } from '@/components/world/primitives/LightShaft';
import { gridTexture } from '@/lib/three/textures';
import { useThemeHex } from '@/hooks/useResolvedTheme';
import { CertificateArtifact } from './CertificateArtifact';

interface CertificationVaultProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/**
 * Two rows of three on a shallow arc, held to the right of frame.
 *
 * The credential list is set on the left, so the artifacts are offset rather
 * than centred — otherwise the objects and the type occupy the same
 * rectangle and neither one reads.
 */
const VAULT_OFFSET_X = 3.9;

function placement(index: number): [number, number, number] {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const x = VAULT_OFFSET_X + (column - 1) * 2.1;
  const y = 2.7 - row * 2.4;
  // The arc: outer artifacts sit further back.
  const z = -Math.abs(column - 1) * 0.9;
  return [x, y, z];
}

/**
 * Chapter 09 — The vault.
 *
 * Deep fog, one overhead source, six objects hanging in the dark. The room
 * is almost entirely empty: the point is that each credential is treated as
 * something machined and kept, rather than a logo in a grid.
 */
export function CertificationVault({
  profile,
  reducedMotion,
}: CertificationVaultProps): React.JSX.Element {
  // The vault is an enclosed room; its surfaces follow the theme.
  const wallColor = useThemeHex(hex.obsidian, 0xe4ded1);
  const floorColor = useThemeHex(hex.void, 0xcfc8b9);

  return (
    <group position={[0, 0, CELL_Z.certifications]}>
      {certifications.map((certification, index) => (
        <CertificateArtifact
          key={certification.id}
          id={certification.id}
          position={placement(index)}
          arrival={0.06 + index * 0.07}
          reducedMotion={reducedMotion}
        />
      ))}

      {/* Vault walls, far enough back to be felt rather than seen. */}
      <mesh position={[0, 2, -9]}>
        <planeGeometry args={[40, 26]} />
        <meshStandardMaterial
          color={wallColor}
          roughness={0.92}
          metalness={0.14}
          map={gridTexture(512, 64)}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.6, -2]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color={floorColor} roughness={0.4} metalness={0.6} />
      </mesh>

      <LightShaft
        width={9}
        height={18}
        color={hex.champagne}
        opacity={0.09}
        position={[VAULT_OFFSET_X, 7, -1]}
        pulse={reducedMotion ? 0 : 0.24}
      />

      <DustField
        count={scaleCount(420, profile, 90)}
        spread={[14, 8, 10]}
        color={hex.champagne}
        opacity={0.34}
        size={8}
        rise={0.06}
        still={reducedMotion}
      />
    </group>
  );
}
