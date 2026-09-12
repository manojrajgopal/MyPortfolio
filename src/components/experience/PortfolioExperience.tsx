'use client';

import dynamic from 'next/dynamic';
import { ScrollTrack } from './ScrollTrack';
import { SceneStage } from './SceneStage';
import { CinematicNavigation } from '@/components/navigation/CinematicNavigation';
import { SceneIndicator } from '@/components/navigation/SceneIndicator';
import { CustomCursor } from '@/components/cursor/CustomCursor';
import { CinematicLoader } from '@/components/loader/CinematicLoader';

import { HeroOverlay } from '@/components/hero/HeroTypography/HeroOverlay';
import { IdentityOverlay } from '@/components/identity/IdentityOverlay/IdentityOverlay';
import { EngineeringOverlay } from '@/components/engineering/EngineeringOverlay/EngineeringOverlay';
import { ExperienceOverlay } from '@/components/experience/ExperienceOverlay';
import { ProjectOverlay } from '@/components/projects/ProjectOverlay';
import { AIOverlay } from '@/components/ai/AIOverlay/AIOverlay';
import { SkillsOverlay } from '@/components/skills/SkillsOverlay/SkillsOverlay';
import { EducationOverlay } from '@/components/education/EducationOverlay/EducationOverlay';
import { CredentialList } from '@/components/certifications/CredentialList/CredentialList';
import { AchievementOverlay } from '@/components/achievements/AchievementOverlay/AchievementOverlay';
import { LanguageOverlay } from '@/components/languages/LanguageOverlay/LanguageOverlay';
import { FinalOverlay } from '@/components/final/FinalOverlay/FinalOverlay';

/**
 * The WebGL world is loaded on the client only and split into its own chunk,
 * so the readable layer ships and paints without waiting on Three.js.
 */
const WorldCanvas = dynamic(
  () => import('@/components/world/WorldCanvas').then((module) => module.WorldCanvas),
  { ssr: false },
);

/**
 * The film.
 *
 * Four layers, locked together by one scroll engine:
 *   – the persistent 3D world,
 *   – the atmosphere (grain and vignette),
 *   – a scroll track that supplies length and nothing else,
 *   – twelve fixed chapter frames that dissolve between one another.
 *
 * Every word of the résumé lives in those frames as ordinary, selectable,
 * crawlable HTML. The world behind them is the setting for the story, never
 * the carrier of the information.
 */
export function PortfolioExperience(): React.JSX.Element {
  return (
    <>
      <CinematicLoader />
      <CustomCursor />

      <WorldCanvas />
      <div className="atmosphere" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <CinematicNavigation />
      <SceneIndicator />

      <ScrollTrack />

      <main id="main" className="overlays">
        <SceneStage id="intro" label="Intro">
          <HeroOverlay />
        </SceneStage>

        <SceneStage id="identity" label="Identity">
          <IdentityOverlay />
        </SceneStage>

        <SceneStage id="engineering" label="Engineering">
          <EngineeringOverlay />
        </SceneStage>

        <SceneStage id="experience" label="Experience">
          <ExperienceOverlay />
        </SceneStage>

        <SceneStage id="projects" label="Projects">
          <ProjectOverlay />
        </SceneStage>

        <SceneStage id="ai" label="Artificial intelligence">
          <AIOverlay />
        </SceneStage>

        <SceneStage id="skills" label="Skills">
          <SkillsOverlay />
        </SceneStage>

        <SceneStage id="education" label="Education">
          <EducationOverlay />
        </SceneStage>

        <SceneStage id="certifications" label="Certifications" className="stage--left">
          <CredentialList />
        </SceneStage>

        <SceneStage id="achievement" label="Achievement" className="stage--bottom">
          <AchievementOverlay />
        </SceneStage>

        <SceneStage id="languages" label="Languages">
          <LanguageOverlay />
        </SceneStage>

        <SceneStage id="final" label="Horizon">
          <FinalOverlay />
        </SceneStage>
      </main>
    </>
  );
}
