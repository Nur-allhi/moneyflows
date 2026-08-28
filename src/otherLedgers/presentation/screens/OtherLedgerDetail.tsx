import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LedgerTable, LedgerSearch, MobileLedger, Modal, BottomSheet } from '../../../presentation/components';
import type { LedgerRow } from '../../../presentation/components';
import { useOtherLedgerStore } from '../stores/useOtherLedgerStore';
import { useMemberStore } from '../../../presentation/stores/useMemberStore';
import { useSettingsStore } from '../../../presentation/stores/useSettingsStore';
import { formatAmount, formatAmountParts } from '../../../presentation/utils/format';
import { shortDate, MONTHS } from '../../../presentation/constants/dates';
import { Highlight } from '../../../presentation/utils/highlight';
import { useDebouncedValue } from '../../../presentation/utils/useDebouncedValue';
import { AddEntryModal } from '../components/AddEntryModal';
import { RenameLedgerModal } from '../components/RenameLedgerModal';
import styles from './OtherLedgerDetail.module.css';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'debit', label: 'Debit' },
  { key: 'credit', label: 'Credit' },
];

const PAGE_SIZE = 10;

export function OtherLedgerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ledgers, entriesByLedger, fetchLedgers, fetchEntries, deleteLedger } = useOtherLedgerStore();
  const members = useMemberStore((s) => s.members);
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [filter, setFilter] = useState('all');
  const [ledgerQuery, setLedgerQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteLedgerConfirm, setShowDeleteLedgerConfirm] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => { fetchLedgers(); }, [fetchLedgers]);
  useEffect(() => { if (id) fetchEntries(id); }, [id, fetchEntries]);

  const ledger = useMemo(() => ledgers.find((l) => l.id === id), [ledgers, id]);
  const entries = useMemo(() => (id ? entriesByLedger[id] ?? [] : []), [id, entriesByLedger]);
  const memberMap = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members]);

  const debouncedQuery = useDebouncedValue(ledgerQuery, 200);

  const searchFiltered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.description.toLowerCase().includes(q) || e.date.includes(q) || String(e.debit).includes(q) || String(e.credit).includes(q));
  }, [entries, debouncedQuery]);

  const displayed = useMemo(() => searchFiltered.slice(-displayLimit), [searchFiltered, displayLimit]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || displayLimit >= searchFiltered.length) return;
    const obs = new IntersectionObserver((ents) => { if (ents[0]?.isIntersecting) setDisplayLimit((p) => Math.min(p + PAGE_SIZE, searchFiltered.length)); }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [displayLimit, searchFiltered.length]);

  const currentBalance = entries.length > 0 ? entries[entries.length - 1]!.balance : ledger?.openingBalance ?? 0;
  const owner = ledger ? (ledger.ownerType === 'member' ? memberMap.get(ledger.ownerMemberId ?? '') ?? 'Unknown' : ledger.ownerName ?? '—') : '—';

  const ledgerRows: LedgerRow[] = useMemo(() => {
    const rows = displayed.map((e) => {
      const isDebit = e.debit > 0;
      return {
        id: e.id,
        date: shortDate(e.date, locale),
        description: e.description,
        account: '',
        debit: isDebit ? formatAmountParts(e.debit, locale, currency).amount : '—',
        credit: !isDebit ? formatAmountParts(e.credit, locale, currency).amount : '—',
        balance: formatAmountParts(e.balance, locale, currency).amount,
        currencyLabel: currency,
        type: isDebit ? 'expense' as const : 'income' as const,
      };
    }).reverse();
    if (filter === 'all') return rows;
    return rows.filter((r) => (filter === 'debit' ? r.debit !== '—' : r.credit !== '—'));
  }, [displayed, filter, locale, currency]);

  const mobileFiltered = useMemo(() => {
    let list = [...displayed];
    if (filter !== 'all') list = list.filter((e) => (filter === 'debit' ? e.debit > 0 : e.credit > 0));
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [displayed, filter]);

  const handleRowClick = useCallback((row: LedgerRow) => {
    if (row.id) setEditId(row.id);
  }, []);

  const downloadPdf = useCallback(async () => {
    if (!ledger) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text(ledger.name, pageW / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Owner: ${owner}`, 14, 28);
    doc.text(`Starting: ${shortDate(ledger.startingDate, locale)}`, 14, 36);
    const rows = mobileFiltered.map((e) => [shortDate(e.date, locale), e.description, e.debit ? formatAmount(e.debit, locale, currency) : '', e.credit ? formatAmount(e.credit, locale, currency) : '', formatAmount(e.balance, locale, currency)]);
    if (rows.length === 0) return;
    doc.text(`Balance: ${formatAmount(currentBalance, locale, currency)}`, pageW - 14, 28, { align: 'right' });
    autoTable(doc, {
      head: [['Date', 'Description', 'Debit', 'Credit', 'Balance']],
      body: rows.map((r) => r as string[]),
      startY: 44,
      styles: { fontSize: 8, overflow: 'linebreak' },
      headStyles: { fillColor: [99, 102, 241] },
    });
    doc.save(`other_ledger_${ledger.name}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }, [ledger, owner, locale, currency, mobileFiltered, currentBalance]);

  if (!ledger) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>Ledger not found <button className={styles.backBtn} onClick={() => navigate('/other-ledgers')}>Back</button></div>
      </div>
    );
  }

  const filteredForEmpty = filter === 'all' ? mobileFiltered : mobileFiltered;

  return (
    <div className={styles.container}>
      {!isDesktop ? (
        <div className={styles.heroCard}>
          <span className={styles.heroLabel}>Current Balance</span>
          <span className={styles.heroValue}>{formatAmount(currentBalance, locale, currency)}</span>
          <span className={styles.heroMeta}>{owner} · {entries.length} entries · Starting {shortDate(ledger.startingDate, locale)}</span>
        </div>
      ) : null}

      {!isDesktop ? (
        <MobileLedger
          title={ledger.name}
          count={mobileFiltered.length}
          filterOptions={FILTER_TABS}
          activeFilter={filter}
          onFilterChange={setFilter}
          searchQuery={ledgerQuery}
          onSearchChange={setLedgerQuery}
          onDownloadPdf={downloadPdf}
          sentinel={<div ref={sentinelRef} style={{ height: 1 }} />}
          empty={mobileFiltered.length === 0 ? <div className={styles.empty}>{ledgerQuery ? `No matches for "${ledgerQuery}"` : 'No entries yet — tap + to add first row.'}</div> : undefined}
        >
          {mobileFiltered.map((e) => {
            const isDebit = e.debit > 0;
            const { amount: fmtAmt, currency: fmtCur } = formatAmountParts(isDebit ? e.debit : e.credit, locale, currency);
            return (
              <div key={e.id} className={styles.txRow} onClick={() => setEditId(e.id)}>
                <span className={styles.txType} data-type={isDebit ? 'debit' : 'credit'}>
                  <span className={styles.txDay}>{new Date(e.date).getDate()}</span>
                  <span className={styles.txMonth}>{MONTHS[new Date(e.date).getMonth()]}</span>
                </span>
                <span className={styles.txDesc}><Highlight text={e.description} query={ledgerQuery} /></span>
                <span className={styles.txAmount}>
                  <span className={`${styles.txArrow} ${isDebit ? styles.txArrowOut : styles.txArrowIn}`}>
                    {isDebit ? (
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2v8M2 6l4 4 4-4" /></svg>
                    ) : (
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 10V2M2 6l4-4 4 4" /></svg>
                    )}
                  </span>
                  {fmtAmt}<small className={styles.txCurrency}>{fmtCur}</small>
                </span>
              </div>
            );
          })}
        </MobileLedger>
      ) : (
        <>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{ledger.name}</h1>
              <button className={styles.renameBtn} onClick={() => setShowRename(true)} aria-label="Rename ledger" title="Rename ledger" tabIndex={0}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M11 2l3 3-8 8H3v-3l8-8z" /></svg>
              </button>
              <span className={styles.subtitle}>{owner} · Starting {shortDate(ledger.startingDate, locale)} · {entries.length} entries · {formatAmount(currentBalance, locale, currency)}</span>
            </div>
            <div className={styles.actions}>
              <LedgerSearch value={ledgerQuery} onChange={setLedgerQuery} />
              <button className={styles.pdfBtn} onClick={downloadPdf} aria-label="Download PDF">
                <span className={styles.pdfBtnIcon}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                </span>
                <span className={styles.pdfBtnLabel}>Download PDF</span>
              </button>
              <button className={styles.addBtn} onClick={() => setShowAdd(true)} aria-label="New entry">
                <span className={styles.addBtnIcon}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="14" height="14"><path d="M8 3v10M3 8h10" /></svg>
                </span>
                <span className={styles.addBtnLabel}>New Entry</span>
              </button>
              <button
                className={styles.deleteBtn}
                aria-label="Delete ledger"
                onClick={() => setShowDeleteLedgerConfirm(true)}
                title="Delete ledger"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 4h10" /><path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="M6 7l0 5M10 7l0 5M4 4l0 8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1L12 4" /></svg>
              </button>
            </div>
          </div>

          <div className={styles.filterBar} role="tablist" aria-label="Filter entries">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={filter === t.key}
                className={`${styles.filterPill} ${filter === t.key ? styles.filterPillActive : ''}`}
                onClick={() => setFilter(t.key)}
              >
                <span className={styles.filterIcon}>
                  {t.key === 'all' ? (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14"><circle cx="8" cy="8" r="5.5" /><path d="M8 3v10M3 8h10" opacity="0.35" /></svg>
                  ) : t.key === 'debit' ? (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14"><circle cx="8" cy="8" r="5.5" /><path d="M8 5v6M5 8l3 3 3-3" /></svg>
                  ) : (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="14" height="14"><circle cx="8" cy="8" r="5.5" /><path d="M8 11V5M11 8l-3-3-3 3" /></svg>
                  )}
                </span>
                {t.label}
              </button>
            ))}
          </div>

          <LedgerTable
            rows={ledgerRows}
            showBalance
            desktop
            onRowClick={handleRowClick}
            sentinel={<div ref={sentinelRef} style={{ height: 1 }} />}
            searchQuery={ledgerQuery}
          />

          {filteredForEmpty.length === 0 && <div className={styles.empty}>{ledgerQuery ? `No matches for "${ledgerQuery}"` : 'No entries yet — tap + to add first row.'}</div>}
        </>
      )}

      {isDesktop ? null : (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '12px 0' }}>
          <button className={styles.addBtn} onClick={() => setShowAdd(true)} aria-label="New entry">
            <span className={styles.addBtnIcon}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="14" height="14"><path d="M8 3v10M3 8h10" /></svg>
            </span>
            <span className={styles.addBtnLabel}>New Entry</span>
          </button>
          <button className={styles.renameBtn} onClick={() => setShowRename(true)} aria-label="Rename ledger" title="Rename ledger" style={{ width: 36, height: 36 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M11 2l3 3-8 8H3v-3l8-8z" /></svg>
          </button>
          <button
            className={styles.deleteBtn}
            aria-label="Delete ledger"
            onClick={() => setShowDeleteLedgerConfirm(true)}
            style={{ width: 36, height: 36 }}
            title="Delete ledger"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M3 4h10" /><path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" /><path d="M6 7l0 5M10 7l0 5M4 4l0 8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1L12 4" /></svg>
          </button>
        </div>
      )}

      {showAdd && id && <AddEntryModal isOpen ledgerId={id} onClose={() => setShowAdd(false)} />}
      {editId && id && <AddEntryModal isOpen ledgerId={id} entryId={editId} onClose={() => setEditId(null)} />}
      {showRename && ledger && <RenameLedgerModal isOpen ledger={ledger} onClose={() => setShowRename(false)} />}
      {showDeleteLedgerConfirm && ledger && id && (() => {
        const descStyle: React.CSSProperties = { textAlign: 'center', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '12px 0' };
        const handleDelete = async () => {
          await deleteLedger(id);
          setShowDeleteLedgerConfirm(false);
          navigate('/other-ledgers');
        };
        return isDesktop ? (
          <Modal isOpen onClose={() => setShowDeleteLedgerConfirm(false)} title="Delete Ledger" saveLabel="Delete" onSave={handleDelete}>
            <p style={descStyle}>Are you sure you want to delete “{ledger.name}”? It will be moved to the Recycle Bin and can be restored within 30 days.</p>
          </Modal>
        ) : (
          <BottomSheet isOpen onClose={() => setShowDeleteLedgerConfirm(false)} title="Delete Ledger">
            <p style={descStyle}>Are you sure you want to delete “{ledger.name}”? It will be moved to the Recycle Bin and can be restored within 30 days.</p>
            <div style={{ display: 'flex', gap: 10, padding: '8px 0 4px' }}>
              <button onClick={() => setShowDeleteLedgerConfirm(false)} style={{ flex: 1, padding: 14, border: '1px solid var(--color-border)', borderRadius: 12, background: 'var(--color-surface)', color: 'var(--color-text)', font: '500 14px var(--font-display)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: 14, border: 'none', borderRadius: 12, background: 'var(--color-coral)', color: '#fff', font: '500 14px var(--font-display)', cursor: 'pointer' }}>Delete</button>
            </div>
          </BottomSheet>
        );
      })()}
    </div>
  );
}
