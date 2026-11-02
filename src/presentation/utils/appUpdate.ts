/**
 * Service-worker update-takeover decision (update banner, 2026-11-03).
 * Pure so the takeover rule stays testable without a real service worker.
 *
 * The page learns a new app version arrived when a *new* service worker takes
 * control of it (`controllerchange`). But the very first claim is not an
 * update: on a fresh visit no controller exists, install fires `claim()`, and
 * that also produces one change. So:
 * - page started WITH a controller → any change is a real update;
 * - page started WITHOUT one → only the SECOND change is a real update
 *   (the first was the initial claim).
 */
export interface TakeoverState {
  /** Did a service worker already control this page when it mounted? */
  startedWithController: boolean;
  /** How many `controllerchange` events observed so far. */
  controllerChanges: number;
}

export function isUpdateTakeover(state: TakeoverState): boolean {
  if (state.startedWithController) return state.controllerChanges >= 1;
  return state.controllerChanges >= 2;
}
