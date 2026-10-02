import { useState } from 'react';

/**
 * One-shot click animation replay for per-button feedback.
 * Bump the key on click and put it on the inner `svg` / `.anim-target`
 * (see `styles/click-anims.css`); the remount restarts the keyframe.
 * The host `button` keeps focus — only inner content remounts.
 *
 * @example
 * const [saveKey, replaySave] = useReplay();
 * <button onClick={() => { replaySave(); handleSave(); }}
 *   className={`${styles.saveBtn} ${saveKey > 0 ? 'anim-pop' : ''}`}>
 *   <span className="anim-target" key={saveKey}>Save</span>
 * </button>
 */
export function useReplay(): [number, () => void] {
  const [n, setN] = useState(0);
  return [n, () => setN((v) => v + 1)];
}
