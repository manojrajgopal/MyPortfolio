'use client';

import { projects, projectWindow } from '@/data/projects/projects';
import { CELL_Z, PROJECT_STATION_Z } from '@/lib/three/cameraRig';
import { hex } from '@/lib/three/palette';
import { scaleCount, type PerformanceProfile } from '@/lib/three/performance';
import { DustField } from '@/components/world/primitives/DustField';
import { InteriorScene } from '../scenes/InteriorScene';
import { StylistScene } from '../scenes/StylistScene';
import { VoiceScene } from '../scenes/VoiceScene';
import { InfiniteWaveXScene } from '../scenes/InfiniteWaveXScene';

interface ProjectUniverseProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/**
 * Chapter 05 — The project universe.
 *
 * Four stations along the same stretch of space, each a different world.
 * No cards, no grid: the camera flies to a set, the set performs the idea
 * behind the project, and the camera moves on.
 */
export function ProjectUniverse({
  profile,
  reducedMotion,
}: ProjectUniverseProps): React.JSX.Element {
  const cell = CELL_Z.projects;

  /** Station positions expressed relative to the chapter cell. */
  const stationZ = (index: number): number => (PROJECT_STATION_Z[index] ?? cell) - cell;

  return (
    <group position={[0, 0, cell]}>
      {projects.map((project, index) => {
        const { from, to } = projectWindow(project.id);
        const z = stationZ(index);

        switch (project.scene) {
          case 'interior':
            return (
              <InteriorScene
                key={project.id}
                z={z}
                from={from}
                to={to}
                reducedMotion={reducedMotion}
              />
            );
          case 'stylist':
            return (
              <StylistScene
                key={project.id}
                z={z}
                from={from}
                to={to}
                profile={profile}
                reducedMotion={reducedMotion}
              />
            );
          case 'voice':
            return (
              <VoiceScene
                key={project.id}
                z={z}
                from={from}
                to={to}
                profile={profile}
                reducedMotion={reducedMotion}
              />
            );
          case 'infinitewavex':
            return (
              <InfiniteWaveXScene
                key={project.id}
                z={z}
                from={from}
                to={to}
                profile={profile}
                reducedMotion={reducedMotion}
              />
            );
          default:
            return null;
        }
      })}

      {/* Shared atmosphere binding the four sets into one laboratory. */}
      <DustField
        count={scaleCount(900, profile, 160)}
        spread={[26, 14, 110]}
        color={hex.silver}
        opacity={0.2}
        size={9}
        rise={0.1}
        still={reducedMotion}
      />
    </group>
  );
}
