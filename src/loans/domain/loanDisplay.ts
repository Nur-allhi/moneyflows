/**
 * Single source of truth for a loan stack's display name.
 * Internal borrower account with a known member: "Account - Member".
 * External (counterparty) or member-less: plain account name.
 * Matches LoanDatabase._getStackForBorrower so UI and DB never drift.
 */
export function getStackDisplayName(
  accountName: string,
  accountType: string | undefined,
  memberName: string | undefined,
): string {
  if (accountType !== 'counterparty' && memberName) {
    return `${accountName} - ${memberName}`;
  }
  return accountName;
}
