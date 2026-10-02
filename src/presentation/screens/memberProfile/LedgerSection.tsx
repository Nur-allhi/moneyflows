import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LedgerTable, LedgerSearch } from '../../components';
import type { LedgerRow } from '../../components';
import { useModalStore } from '../../stores/useModalStore';
import { useReplay } from '../../hooks/useReplay';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { formatAmountParts } from '../../utils/format';
import { MONTHS } from '../../constants/dates';
import { Highlight } from '../../utils/highlight';
import { Transaction } from '../../../core/domain/Transaction';
import type { Account } from '../../../core/domain/Account';
import { HandCoins, BanknoteArrowUp, BanknoteArrowDown, Coins, Filter } from 'lucide-react';
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pdfKey, replayPdf] = useReplay();
  const [drawerKey, replayDrawer] = useReplay();
  const [ledgerFKey, replayLedgerF] = useReplay();
  const [ledgerFPicked, setLedgerFPicked] = useState<string | null>(null);
  const [showAllKey, replayShowAll] = useReplay();
  const [obKey, replayOb] = useReplay();
  const [loadMoreKey, replayLoadMore] = useReplay();
  const [tagViewKey, replayTagView] = useReplay();
  const [filtKey, replayFilt] = useReplay();
  const [srchKey, replaySrch] = useReplay();
  const [dlKey, replayDl] = useReplay();
  const [mPillKey, replayMPill] = useReplay();
  const [mPillPicked, setMPillPicked] = useState<string | null>(null);
  const [mClearKey, replayMClear] = useReplay();
  const [loadMoreMKey, replayLoadMoreM] = useReplay();
  const filterWrapRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setDrawerOpen(false), 500);
  };
  useEffect(() => {
    if (!drawerOpen) {
      clearCloseTimer();
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (filterWrapRef.current && !filterWrapRef.current.contains(e.target as Node)) setDrawerOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    scheduleClose();
    return () => {
      document.removeEventListener('mousedown', onDown);
      clearCloseTimer();
    };
  }, [drawerOpen]);

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
            <div className={styles.ledgerPanelFilter} ref={filterWrapRef}>
              <LedgerSearch value={ledgerQuery} onChange={setLedgerQuery} />
              <button className={`${styles.pdfBtn} ${pdfKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayPdf(); downloadPdf(); }} title="Download PDF" aria-label="Download PDF">
                <span className="anim-target" key={pdfKey}>
                <svg className={styles.pdfBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                <span className={styles.pdfBtnLabel}>Download PDF</span>
                </span>
              </button>
              <button
                className={`${styles.pdfBtn} ${styles.drawerToggle} ${drawerOpen ? styles.drawerToggleOpen : ''} ${drawerKey > 0 ? 'anim-pop' : ''}`}
                onClick={() => { replayDrawer(); setDrawerOpen((o) => !o); }}
                title={drawerOpen ? 'Hide filters' : 'Show filters'}
                aria-label={drawerOpen ? 'Hide filters' : 'Show filters'}
                aria-expanded={drawerOpen}
              >
                <span className="anim-target" key={drawerKey}>
                <svg className={styles.pdfBtnIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                <span className={styles.pdfBtnLabel}>More</span>
                </span>
              </button>
              <div
                className={`${styles.filterDrawer} ${drawerOpen ? styles.filterDrawerOpen : ''}`}
                onMouseEnter={clearCloseTimer}
                onMouseLeave={scheduleClose}
                onMouseMove={() => {
                  clearCloseTimer();
                  scheduleClose();
                }}
              >
                <div className={styles.filterDrawerInner}>
                  <div className={styles.drawerFiltersRow}>
                    <div className={styles.ledgerFilterPills}>
                      {ledgerFilters.map((f) => (
                        <button
                          key={f.key}
                          className={`${styles.ledgerFilterIconBtn} ${ledgerFilter === f.key ? styles.ledgerFilterIconBtnActive : ''} ${ledgerFPicked === f.key && ledgerFKey > 0 ? 'anim-pop' : ''}`}
                          onClick={() => {
                            replayLedgerF();
                            setLedgerFPicked(f.key);
                            setLedgerFilter(f.key);
                            clearCloseTimer();
                            scheduleClose();
                          }}
                          title={f.label}
                          aria-label={f.label}
                          aria-pressed={ledgerFilter === f.key}
                        >
                          <span className="anim-target" key={`${f.key}-${ledgerFPicked === f.key ? ledgerFKey : 0}`}>
                          <span className={styles.filterIconBox}>
                            {f.key === 'all' ? (
                              <Filter size={14} strokeWidth={1.8} />
                            ) : f.key === 'income' ? (
                              <BanknoteArrowUp size={14} strokeWidth={1.8} />
                            ) : f.key === 'expense' ? (
                              <BanknoteArrowDown size={14} strokeWidth={1.8} />
                            ) : f.key === 'transfer' ? (
                              <Coins size={14} strokeWidth={1.8} />
                            ) : (
                              <HandCoins size={14} strokeWidth={1.8} />
                            )}
                          </span>
                          <span className={styles.filterLabel}>{f.label}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    {selectedAccountId && (
                      <div className={styles.drawerActions}>
                        <button
                          className={`${styles.showAllBtn} ${showAllKey > 0 ? 'anim-pop' : ''}`}
                          onClick={() => {
                            replayShowAll();
                            setSelectedAccountId(null);
                            clearCloseTimer();
                            scheduleClose();
                          }}
                        >
                          <span className="anim-target" key={showAllKey}>All account</span>
                        </button>
                        {(() => {
                          const hasObTx = transactions.some((tx) => tx.type === 'income' && tx.destAccount === selectedAccountId && (tx.metadata as Record<string, unknown>)?.isOpeningBalance === true);
                          const showAdd = hasObTx || memberAccounts.find((a) => a.id === selectedAccountId)?.balance === 0;
                          if (!showAdd) return null;
                          return (
                            <button
                              className={`${styles.obBtn} ${obKey > 0 ? 'anim-pop' : ''}`}
                              onClick={() => {
                                replayOb();
                                onOpeningBalance();
                                clearCloseTimer();
                                scheduleClose();
                              }}
                            >
                              <span className="anim-target" key={obKey}>{hasObTx ? 'Opening Balance' : 'Add Opening'}</span>
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <LedgerTable rows={filteredLedger} className={styles.ledgerTableInner} desktop showBalance={showBalance} onRowClick={onRowClick} sentinel={<div ref={sentinelRef} style={{ height: 1 }} />} searchQuery={ledgerQuery} />
          {displayLimit < searchFilteredAll.length && <button type="button" className={`${styles.loadMoreBtn} ${loadMoreKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayLoadMore(); onReachEnd(); }}><span className="anim-target" key={loadMoreKey}>Load more ({searchFilteredAll.length - displayLimit} remaining)</span></button>}
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
                {tagFilter && <button className={`${styles.ledgerFilterBtn} ${tagViewKey > 0 ? 'anim-nudge' : ''}`} onClick={() => { replayTagView(); navigate(`/tags/${encodeURIComponent(tagFilter)}`); }} title="View this tag across all members" aria-label="View tag family-wide"><span className="anim-target" key={tagViewKey}>{'\u{1F3E0}'}</span></button>}
              </>
            )}
            <button className={`${styles.ledgerFilterBtn} ${filtKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayFilt(); (trayRef.current?.querySelector(`.${styles.filterTray ?? 'filterTray'}`) as HTMLElement)?.classList.toggle(styles.filterTrayOpen ?? 'filterTrayOpen'); }} aria-label="Filter">
              <span className="anim-target" key={filtKey}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M2 4.5h14M4.5 9h9M7 13.5h4" /><circle cx="4.5" cy="4.5" r="1.5" fill="currentColor" stroke="none" /><circle cx="13.5" cy="9" r="1.5" fill="currentColor" stroke="none" /><circle cx="9" cy="13.5" r="1.5" fill="currentColor" stroke="none" /></svg>
              </span>
            </button>
            <button className={`${styles.ledgerFilterBtn} ${srchKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replaySrch(); (trayRef.current?.querySelector(`.${styles.searchBar ?? 'searchBar'}`) as HTMLElement)?.classList.toggle(styles.searchBarOpen ?? 'searchBarOpen'); }} aria-label="Search">
              <span className="anim-target" key={srchKey}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="8" cy="8" r="5.5" /><path d="M12 12l4 4" /></svg>
              </span>
            </button>
            <button className={`${styles.downloadBtn} ${dlKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayDl(); downloadPdf(); }} aria-label="Download PDF">
              <span className="anim-target" key={dlKey}>
              <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><path d="M15 12v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2" /><polyline points="6 9 9 12 12 9" /><line x1="9" y1="3" x2="9" y2="12" /></svg>
              </span>
            </button>
          </div>
        </div>
        <div className={`${styles.filterTray}`}>
          <div className={styles.filterPills}>
            {(['all', 'income', 'expense', 'loan'] as const).map((f) => (
              <button key={f} className={`${styles.filterPill} ${ledgerFilter === f ? styles.filterPillActive : ''} ${mPillPicked === f && mPillKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayMPill(); setMPillPicked(f); setLedgerFilter(f); }}><span className="anim-target" key={`${f}-${mPillPicked === f ? mPillKey : 0}`}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</span></button>
            ))}
          </div>
        </div>
        <div className={`${styles.searchBar}`}>
          <div className={styles.ledgerSearchWrap}>
            <svg className={styles.ledgerSearchIcon} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="7" cy="7" r="5.5" /><path d="M11 11l3.5 3.5" /></svg>
            <input type="text" placeholder="Search transactions..." value={ledgerQuery} onChange={(e) => setLedgerQuery(e.target.value)} />
            {ledgerQuery && <button className={`${styles.searchClear} ${mClearKey > 0 ? 'anim-twist' : ''}`} onClick={() => { replayMClear(); setLedgerQuery(''); }} aria-label="Clear"><svg key={mClearKey} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l6 6M9 3l-6 6" /></svg></button>}
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
      {displayLimit < searchFilteredAll.length && <button type="button" className={`${styles.loadMoreBtn} ${loadMoreMKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayLoadMoreM(); onReachEnd(); }}><span className="anim-target" key={loadMoreMKey}>Load more ({searchFilteredAll.length - displayLimit} remaining)</span></button>}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}
