'use client';

import type { PerformanceProfile } from '@/lib/three/performance';
import { HeroScene } from '@/components/hero/HeroScene/HeroScene';
import { IdentityScene } from '@/components/identity/IdentityScene/IdentityScene';
import { EngineeringScene } from '@/components/engineering/EngineeringScene/EngineeringScene';
import { ExperienceScene } from '@/components/experience/ExperienceScene/ExperienceScene';
import { ProjectUniverse } from '@/components/projects/ProjectUniverse/ProjectUniverse';
import { AIWorld } from '@/components/ai/AIWorld/AIWorld';
import { SkillsUniverse } from '@/components/skills/SkillsUniverse/SkillsUniverse';
import { EducationScene } from '@/components/education/EducationScene/EducationScene';
import { CertificationVault } from '@/components/certifications/CertificationVault/CertificationVault';
import { HackerRankScene } from '@/components/achievements/HackerRankScene/HackerRankScene';
import { LanguageScene } from '@/components/languages/LanguageScene/LanguageScene';
import { FinalScene } from '@/components/final/FinalScene/FinalScene';
import { CinematicCamera } from './CinematicCamera';
import { SceneDirector } from './SceneDirector';
import { SceneGroup } from './SceneGroup';

interface WorldContentProps {
  readonly profile: PerformanceProfile;
  readonly reducedMotion: boolean;
}

/**
 * The whole film, in order.
 *
 * Every chapter is wrapped in a SceneGroup, so only the two or three the
 * camera can currently reach are mounted at all. The camera and the director
 * sit outside them and run continuously.
 */
export function WorldContent({ profile, reducedMotion }: WorldContentProps): React.JSX.Element {
  const shared = { profile, reducedMotion };

  return (
    <>
      <CinematicCamera reducedMotion={reducedMotion} />
      <SceneDirector />

      <SceneGroup id="intro">
        <HeroScene {...shared} />
      </SceneGroup>

      <SceneGroup id="identity">
        <IdentityScene {...shared} />
      </SceneGroup>

      <SceneGroup id="engineering">
        <EngineeringScene {...shared} />
      </SceneGroup>

      <SceneGroup id="experience">
        <ExperienceScene {...shared} />
      </SceneGroup>

      {/* The longest chapter, and the only one holding four sets at once. */}
      <SceneGroup id="projects" preload={0.04}>
        <ProjectUniverse {...shared} />
      </SceneGroup>

      <SceneGroup id="ai">
        <AIWorld {...shared} />
      </SceneGroup>

      <SceneGroup id="skills">
        <SkillsUniverse {...shared} />
      </SceneGroup>

      <SceneGroup id="education">
        <EducationScene {...shared} />
      </SceneGroup>

      <SceneGroup id="certifications">
        <CertificationVault {...shared} />
      </SceneGroup>

      <SceneGroup id="achievement">
        <HackerRankScene {...shared} />
      </SceneGroup>

      <SceneGroup id="languages">
        <LanguageScene {...shared} />
      </SceneGroup>

      <SceneGroup id="final">
        <FinalScene {...shared} />
      </SceneGroup>
    </>
  );
}
