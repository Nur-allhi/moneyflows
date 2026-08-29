import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LedgerTable } from '../../components';
import type { LedgerRow } from '../../components';
import { useModalStore } from '../../stores/useModalStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { formatAmountParts } from '../../utils/format';
import { MONTHS } from '../../constants/dates';
import { Highlight } from '../../utils/highlight';
import { Transaction } from '../../../core/domain/Transaction';
import type { Account } from '../../../core/domain/Account';
import styles from '../MemberProfile.module.css';

const ledgerFilters = [
  { key: 'all', label: 'All' },
  { key: 'income', label: 'Income' },
  { key: 'expense', label: 'Expense' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'loan', label: 'Loan' },
];

interface Props {
  isDesktop: boolean;
  memberAccounts: Account[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  filteredLedger: LedgerRow[];
  filteredTxs: Transaction[];
  searchFilteredAll: Transaction[];
  ledgerFilter: string;
  setLedgerFilter: (v: string) => void;
  ledgerQuery: string;
  setLedgerQuery: (v: string) => void;
  tagFilter: string;
  setTagFilter: (v: string) => void;
  ledgerTagOptions: string[];
  showBalance: boolean;
  displayLimit: number;
  onReachEnd: () => void;
  onRowClick: (row: LedgerRow) => void;
  onOpeningBalance: () => void;
  txCount: number;
  selectedAcct?: Account;
  transactions: Transaction[];
  downloadPdf: () => void;
}

export function LedgerSection(props: Props) {
  const { isDesktop, memberAccounts, selectedAccountId, setSelectedAccountId, filteredLedger, filteredTxs, searchFilteredAll, ledgerFilter, setLedgerFilter, ledgerQuery, setLedgerQuery, tagFilter, setTagFilter, ledgerTagOptions, showBalance, displayLimit, onReachEnd, onRowClick, onOpeningBalance, txCount, selectedAcct, transactions, downloadPdf } = props;
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const [showExtras, setShowExtras] = useState(false);

  if (isDesktop) {
    return (
      <div className={styles.contentSplit}>
        <div className={styles.ledgerPanel}>
          <div className={styles.ledgerPanelHead}>
            <h3>
              {selectedAcct ? (
                <>{selectedAcct.name} <span className={styles.ledgerBalance}>{formatAmountParts(selectedAcct.balance, locale, currency).amount} {currency}</span> <span className={styles.txCount}>{txCount}</span></>
              ) : (
                <>All Accounts Ledger <span className={styles.txCount}>{txCount}</span></>
              )}
            </h3>
            <div className={styles.ledgerPanelFilter}>
              <div className={styles.ledgerSearchInline}>
                <svg className={styles.pdfBtnIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="7" cy="7" r="5.5" /><path d="M11 11l3.5 3.5" /></svg>
                <input className={styles.ledgerSearchInput} type="text" placeholder="Search transactions..." value={ledgerQuery} onChange={(e) => setLedgerQuery(e.target.value)} />
                {ledgerQuery && <button className={styles.searchClear} onClick={() => setLedgerQuery('')} aria-label="Clear"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="10" height="10"><path d="M3 3l6 6M9 3l-6 6" /></svg></button>}
              </div>
              <button className={styles.pdfBtn} onClick={downloadPdf} title="Download PDF" aria-label="Download PDF">
                <svg className={styles.pdfBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                <span className={styles.pdfBtnLabel}>Download PDF</span>
              </button>
              <button
                className={`${styles.pdfBtn} ${styles.extrasToggle}`}
                onClick={() => setShowExtras((v) => !v)}
                title="Toggle filter and extras"
                aria-label="Toggle filter and extras"
                aria-expanded={showExtras}
              >
                <svg className={styles.pdfBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
              </button>
              {showExtras && (
                <>
                  <div className={styles.ledgerFilterPills}>
                    {ledgerFilters.map((f) => (
                      <button
                        key={f.key}
                        className={`${styles.ledgerFilterIconBtn} ${ledgerFilter === f.key ? styles.ledgerFilterIconBtnActive : ''}`}
                        onClick={() => setLedgerFilter(f.key)}
                        title={f.label}
                        aria-label={f.label}
                        aria-pressed={ledgerFilter === f.key}
                      >
                        {f.key === 'all' ? (
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14"><circle cx="8" cy="8" r="5.5" /></svg>
                        ) : f.key === 'income' ? (
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14"><path d="M8 13V3" /><path d="M4 7l4-4 4 4" /></svg>
                        ) : f.key === 'expense' ? (
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14"><path d="M8 3v10" /><path d="M4 9l4 4 4-4" /></svg>
                        ) : f.key === 'transfer' ? (
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14"><path d="M3 8h10" /><path d="M9 4l4 4-4 4" /></svg>
                        ) : (
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14"><circle cx="8" cy="8" r="5.5" /><path d="M8 5v6" /><path d="M5 8h6" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedAccountId && <button className={styles.showAllBtn} onClick={() => setSelectedAccountId(null)}>All account</button>}
                  {selectedAccountId && (() => {
                    const hasObTx = transactions.some((tx) => tx.type === 'income' && tx.destAccount === selectedAccountId && (tx.metadata as Record<string, unknown>)?.isOpeningBalance === true);
                    const showAdd = hasObTx || memberAccounts.find((a) => a.id === selectedAccountId)?.balance === 0;
                    if (!showAdd) return null;
                    return <button className={styles.obBtn} onClick={onOpeningBalance}>{hasObTx ? 'Opening Balance' : 'Add Opening'}</button>;
                  })()}
                </>
              )}
            </div>
          </div>
          <LedgerTable rows={filteredLedger} className={styles.ledgerTableInner} desktop showBalance={showBalance} onRowClick={onRowClick} sentinel={<div ref={sentinelRef} style={{ height: 1 }} />} searchQuery={ledgerQuery} />
          {displayLimit < searchFilteredAll.length && <button type="button" className={styles.loadMoreBtn} onClick={onReachEnd}>Load more ({searchFilteredAll.length - displayLimit} remaining)</button>}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mobileLedger}>
      <div ref={trayRef}>
        <div className={styles.ledgerToolbar}>
          <div className={styles.ledgerSectionTitle}>{selectedAcct ? selectedAcct.name : 'All Accounts'}</div>
          <span className={styles.txCountBadge}>{filteredTxs.length}</span>
          <div className={styles.ledgerActions}>
            {(ledgerTagOptions.length > 0 || tagFilter) && (
              <>
                <select className={styles.tagSelect} value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} aria-label="Filter by tag"><option value="">All tags</option>{ledgerTagOptions.map((t) => <option key={t} value={t}>{t}</option>)}</select>
                {tagFilter && <button className={styles.ledgerFilterBtn} onClick={() => navigate(`/tags/${encodeURIComponent(tagFilter)}`)} title="View this tag across all members" aria-label="View tag family-wide">{'\u{1F3E0}'}</button>}
              </>
            )}
            <button className={styles.ledgerFilterBtn} onClick={() => (trayRef.current?.querySelector(`.${styles.filterTray ?? 'filterTray'}`) as HTMLElement)?.classList.toggle(styles.filterTrayOpen ?? 'filterTrayOpen')} aria-label="Filter">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M2 4.5h14M4.5 9h9M7 13.5h4" /><circle cx="4.5" cy="4.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="13.5" cy="9" r="1.5" fill="currentColor" stroke="none" /><circle cx="9" cy="13.5" r="1.5" fill="currentColor" stroke="none" /></svg>
            </button>
            <button className={styles.ledgerFilterBtn} onClick={() => (trayRef.current?.querySelector(`.${styles.searchBar ?? 'searchBar'}`) as HTMLElement)?.classList.toggle(styles.searchBarOpen ?? 'searchBarOpen')} aria-label="Search">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="8" cy="8" r="5.5" /><path d="M12 12l4 4" /></svg>
            </button>
            <button className={styles.downloadBtn} onClick={downloadPdf} aria-label="Download PDF">
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M15 12v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2" /><polyline points="6 9 9 12 12 9" /><line x1="9" y1="3" x2="9" y2="12" /></svg>
            </button>
          </div>
        </div>
        <div className={`${styles.filterTray}`}>
          <div className={styles.filterPills}>
            {(['all', 'income', 'expense', 'loan'] as const).map((f) => (
              <button key={f} className={`${styles.filterPill} ${ledgerFilter === f ? styles.filterPillActive : ''}`} onClick={() => setLedgerFilter(f)}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
        </div>
        <div className={`${styles.searchBar}`}>
          <div className={styles.ledgerSearchWrap}>
            <svg className={styles.ledgerSearchIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="7" cy="7" r="5.5" /><path d="M11 11l3.5 3.5" /></svg>
            <input type="text" placeholder="Search transactions..." value={ledgerQuery} onChange={(e) => setLedgerQuery(e.target.value)} />
            {ledgerQuery && <button className={styles.searchClear} onClick={() => setLedgerQuery('')} aria-label="Clear"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6" /></svg></button>}
          </div>
        </div>
      </div>
      {filteredTxs.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}><div className="empty-state-icon">{'\u{1F4CB}'}</div><p className="empty-state-text">No transactions yet</p></div>
      ) : (
        filteredTxs.map((tx) => {
          const isCredit = tx.type === 'income' || tx.type === 'loan_repayment' || tx.type === 'repay';
          const { amount: fmtAmt, currency: fmtCur } = formatAmountParts(tx.amount, locale, currency);
          return (
            <div key={tx.id} className={styles.txRow} onClick={() => useModalStore.getState().open('transaction-detail', { transaction: tx })}>
              <span className={styles.txType} data-type={tx.type}><span className={styles.txDay}>{new Date(tx.date).getDate()}</span><span className={styles.txMonth}>{MONTHS[new Date(tx.date).getMonth() ?? 0] ?? ''}</span></span>
              <span className={styles.txDesc}><Highlight text={tx.description} query={ledgerQuery} /></span>
              <span className={styles.txAmount}><span className={`${styles.txArrow} ${isCredit ? styles.txArrowIn : styles.txArrowOut}`}>{isCredit ? <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 10V2M2 6l4-4 4 4" /></svg> : <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2v8M2 6l4 4 4-4" /></svg>}</span>{fmtAmt}<small className={styles.txCurrency}>{fmtCur}</small></span>
            </div>
          );
        })
      )}
      {displayLimit < searchFilteredAll.length && <button type="button" className={styles.loadMoreBtn} onClick={onReachEnd}>Load more ({searchFilteredAll.length - displayLimit} remaining)</button>}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}
