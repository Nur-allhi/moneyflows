/**
 * The one definition behind the four dashboard metric chips (BUG-21).
 *
 * "vs last month" used to mean two different things on one screen: assets and
 * cash were shifted by *this* month's family-wide income/expense net, while banks
 * and loans were shifted by *last* month's — and `loansChange` subtracted an
 * income/expense net from a loan stock it had nothing to do with. An expense paid
 * from a bank account therefore moved the Cash-in-Hand baseline the money never
 * touched.
 *
 * The agreed definition: each chip compares the metric with **its own value at
 * the end of last month**, i.e. its current value minus the movement of its own
 * accounts (or, for loans, of its own stock) since then. Same period, same
 * numerator, same baseline basis on all four cards — and the shared "vs last
 * month" label is now true for every one of them.
 */
import { balanceEffects, loanStockDelta } from '../../../core/domain/balanceEffect';

export interface MetricTrend {
  /** The metric's value at the end of last month. */
  base: number;
  /** Current value minus `base`. Always meaningful, in currency units. */
  delta: number;
  /** Percent change from `base`, or null when a percentage would be meaningless. */
  percent: number | null;
}

/**
 * A metric's trend from its current value and how much it moved since the
 * baseline. A percentage of a zero or negative base is not a number anyone can
 * read (a cash balance going 0 → 5,000 is not "infinitely more"), so those cases
 * carry `percent: null` and the caller shows the change in currency instead.
 */
export function metricTrend(current: number, movementSinceBase: number): MetricTrend {
  const base = current - movementSinceBase;
  const delta = current - base;
  const percent = base > 0 ? (delta / base) * 100 : null;
  return { base, delta, percent };
}

/** Net movement of the given accounts across these transactions. */
export function accountMovement(
  txs: readonly { type: string; amount: number; sourceAccount?: string | null; destAccount?: string | null }[],
  accountIds: ReadonlySet<string>,
): number {
  let movement = 0;
  for (const tx of txs) {
    for (const effect of balanceEffects(tx)) {
      if (accountIds.has(effect.accountId)) movement += effect.delta;
    }
  }
  return movement;
}

/** Net movement of the loans module's outstanding stock across these transactions. */
export function loanMovement(txs: readonly { type: string; amount: number }[]): number {
  let movement = 0;
  for (const tx of txs) movement += loanStockDelta(tx);
  return movement;
}

