import { ScrollEngine } from './ScrollEngine';

/**
 * There is exactly one journey per page, so there is exactly one engine.
 *
 * A singleton rather than React context on purpose: the WebGL tree renders in
 * its own reconciler root, where context from the DOM tree is not available.
 * Both trees import this instead of bridging.
 */
let instance: ScrollEngine | null = null;

export function getScrollEngine(): ScrollEngine {
  if (!instance) instance = new ScrollEngine();
  return instance;
}
