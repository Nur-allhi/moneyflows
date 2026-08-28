import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassPanel } from '../components';
import { useModalStore } from '../stores/useModalStore';
import { useTransactionStore } from '../stores/useTransactionStore';
import styles from './MemberProfile.module.css';
import { ProfileHero } from './memberProfile/ProfileHero';
import { AccountsSection } from './memberProfile/AccountsSection';
import { LedgerSection } from './memberProfile/LedgerSection';
import { useMemberData } from './memberProfile/useMemberData';
import { downloadMemberPdf } from './memberProfile/pdfExport';

export function MemberProfile() {
  const navigate = useNavigate();
  const { transactions } = useTransactionStore();
  const data = useMemberData();
  const {
    memberId, member, memberAccounts, selectedAccountId, setSelectedAccountId, accountsOpen, setAccountsOpen, displayLimit,
    isDesktop, ledgerFilter, setLedgerFilter, ledgerQuery, setLedgerQuery, tagFilter, setTagFilter, ledgerTagOptions,
    totalBalance, totalIncome, totalExpenses, filteredTxs, searchFilteredAll, filteredLedger, selectedAcct, handleReachEnd,
    sortedTxs, locale, currency,
  } = data;

  const showBalance = !!selectedAccountId;
  const txCount = filteredTxs.length;

  const handleAccountClick = useCallback((acctId: string) => {
    setSelectedAccountId((prev: string | null) => prev === acctId ? null : acctId);
    setAccountsOpen(false);
  }, [setSelectedAccountId, setAccountsOpen]);

  const handleSelectAccount = useCallback((acctId: string | null) => setSelectedAccountId(acctId), [setSelectedAccountId]);

  const downloadPdf = useCallback(() => {
    void downloadMemberPdf({ member, selectedAcct, selectedAccountId, memberAccounts, sortedTxs, ledgerFilter, ledgerQuery, locale, currency, showBalance });
  }, [member, selectedAcct, selectedAccountId, memberAccounts, sortedTxs, ledgerFilter, ledgerQuery, locale, currency, showBalance]);

  const onRowClick = useCallback((row: { transaction: typeof transactions[0] }) => {
    useModalStore.getState().open('transaction-detail', { transaction: row.transaction });
  }, []);

  const onOpeningBalance = useCallback(() => {
    if (!selectedAccountId) return;
    useModalStore.getState().open('opening-balance', { accountId: selectedAccountId });
  }, [selectedAccountId]);

  if (!member) {
    return (
      <div className={styles.memberProfile}>
        <GlassPanel className={styles.notFound}><p>Member not found</p><button onClick={() => navigate('/')}>Go home</button></GlassPanel>
      </div>
    );
  }

  return (
    <div className={styles.memberProfile}>
      <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="Back">&#8592; Back</button>
      <ProfileHero member={member} totalBalance={totalBalance} totalIncome={totalIncome} totalExpenses={totalExpenses} selectedAccountId={selectedAccountId} isDesktop={isDesktop} />
      <AccountsSection memberAccounts={memberAccounts} selectedAccountId={selectedAccountId} accountsOpen={accountsOpen} setAccountsOpen={setAccountsOpen} onAccountClick={handleAccountClick} isDesktop={isDesktop} memberId={memberId ?? ''} onSelectAccount={handleSelectAccount} />
      <LedgerSection
        isDesktop={isDesktop} memberAccounts={memberAccounts} selectedAccountId={selectedAccountId} setSelectedAccountId={setSelectedAccountId}
        filteredLedger={filteredLedger} filteredTxs={filteredTxs} searchFilteredAll={searchFilteredAll} ledgerFilter={ledgerFilter} setLedgerFilter={setLedgerFilter}
        ledgerQuery={ledgerQuery} setLedgerQuery={setLedgerQuery} tagFilter={tagFilter} setTagFilter={setTagFilter} ledgerTagOptions={ledgerTagOptions}
        showBalance={showBalance} displayLimit={displayLimit} onReachEnd={handleReachEnd} onRowClick={onRowClick as never} onOpeningBalance={onOpeningBalance}
        txCount={txCount} selectedAcct={selectedAcct} transactions={transactions} downloadPdf={downloadPdf}
      />
    </div>
  );
}
