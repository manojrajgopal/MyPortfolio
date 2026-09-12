'use client';

import { scenes, sceneHeightVh } from '@/data/navigation/scenes';

/**
 * The scroll track carries no content at all — it exists only to give the
 * film its length.
 *
 * Each chapter contributes a spacer whose height is the same weight that
 * defines its camera window, so the scrollbar position and the shot list are
 * the same number. A trailing viewport makes scroll progress reach exactly 1
 * at the bottom of the document rather than one screen short of it.
 *
 * The readable content lives in the fixed overlay layer instead, which is why
 * scrolling here moves a camera rather than a page.
 */
export function ScrollTrack(): React.JSX.Element {
  return (
    <div className="track" aria-hidden="true">
      {scenes.map((scene) => (
        <div
          key={scene.id}
          className="track__span"
          style={{ height: `${sceneHeightVh(scene.weight).toFixed(3)}vh` }}
        />
      ))}
      <div className="track__span" style={{ height: '100vh' }} />
    </div>
  );
}
