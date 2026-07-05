import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Modal, BottomSheet } from '../components';
import { AccountGroup } from '../../core/domain/AccountGroup';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { Member } from '../../core/domain/Member';
import type { Account } from '../../core/domain/Account';
import { formatAmount } from '../utils/format';
import { useSearchStore } from '../stores/useSearchStore';
import styles from './GroupsListScreen.module.css';

function groupGradient(name: string): string {
  const hues = [290, 170, 30, 85, 220, 330, 50, 190];
  let idx = 0;
  for (let i = 0; i < name.length; i++) {
    idx = (idx * 31 + name.charCodeAt(i)) % hues.length;
  }
  const h = hues[idx];
  return `linear-gradient(135deg, oklch(62% 0.22 ${h}), oklch(50% 0.2 ${h}))`;
}

export function GroupsListScreen() {
  const navigate = useNavigate();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [groups, setGroups] = useState<(AccountGroup & { accountIds: string[] })[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [detailGroup, setDetailGroup] = useState<AccountGroup & { accountIds: string[] } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editSelected, setEditSelected] = useState<Set<string>>(new Set());
  const [mobileSearch, setMobileSearch] = useState('');

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const db = getDatabase();
    const [g, m, a] = await Promise.all([
      db.getAccountGroupsWithMembers(),
      db.getMembers(),
      db.getAccounts(),
    ]);
    setGroups(g);
    setMembers(m);
    setAccounts(a);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const db = getDatabase();
      const group = new AccountGroup(uuidv4(), newName.trim());
      await db.saveAccountGroup(group);
      for (const acctId of selected) {
        await db.addGroupAccount(group.id, acctId);
      }
      setShowCreate(false);
      setNewName('');
      setSelected(new Set());
      setGroups((prev) => [...prev, { ...group, accountIds: [...selected] }]);
    } catch (err) {
      alert('Failed to create group: ' + (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this group?')) return;
    try {
      await getDatabase().softDeleteAccountGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
      if (detailGroup?.id === id) setDetailGroup(null);
    } catch (err) {
      alert('Failed to delete: ' + (err as Error).message);
    }
  };

  const openDetail = (g: AccountGroup & { accountIds: string[] }) => {
    setDetailGroup(g);
    setEditing(false);
    setEditSelected(new Set(g.accountIds));
  };

  const saveEdit = async () => {
    if (!detailGroup) return;
    try {
      const db = getDatabase();
      const toRemove = detailGroup.accountIds.filter((id) => !editSelected.has(id));
      const toAdd = [...editSelected].filter((id) => !detailGroup.accountIds.includes(id));
      for (const id of toRemove) await db.removeGroupAccount(detailGroup.id, id);
      for (const id of toAdd) await db.addGroupAccount(detailGroup.id, id);
      setDetailGroup({ ...detailGroup, accountIds: [...editSelected] });
      setGroups((prev) => prev.map((g) => g.id === detailGroup.id ? { ...g, accountIds: [...editSelected] } : g));
      setEditing(false);
    } catch (err) {
      alert('Failed to update group: ' + (err as Error).message);
    }
  };

  const groupBalances = groups.map((g) => {
    const total = g.accountIds.reduce((sum, id) => {
      const acct = accounts.find((a) => a.id === id);
      return sum + (acct?.balance ?? 0);
    }, 0);
    return { id: g.id, total };
  });
  const balanceMap = new Map(groupBalances.map((b) => [b.id, b.total]));
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const searchQuery = useSearchStore((s) => s.query.toLowerCase().trim());
  const effectiveSearch = mobileSearch.toLowerCase().trim() || searchQuery;
  const filteredGroups = effectiveSearch
    ? groups.filter((g) => g.name.toLowerCase().includes(effectiveSearch))
    : groups;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.grid}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton skeleton-card" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.mobHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/')} aria-label="Back">
          {'\u2190'}
        </button>
        <span className={styles.pageTitle}>Groups</span>
        <button className={styles.addCircleBtn} onClick={() => setShowCreate(true)} aria-label="New group">
          {'+'}
        </button>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="7" cy="7" r="5.5" />
              <path d="M11 11l3.5 3.5" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search groups..."
            value={mobileSearch}
            onChange={(e) => setMobileSearch(e.target.value)}
          />
          {mobileSearch && (
            <button className={styles.searchClear} onClick={() => setMobileSearch('')} aria-label="Clear search">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 3l6 6M9 3l-6 6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={styles.header}>
        <h2 className={styles.title}>Account Groups</h2>
        <p className={styles.subtitle}>{filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''}</p>
        <button className={styles.addBtn} onClick={() => setShowCreate(true)}>+ New Group</button>
      </div>

      {filteredGroups.length === 0 ? (
        <div className={styles.empty}>{effectiveSearch ? 'No groups match your search' : 'No groups yet. Create one to combine account ledgers.'}</div>
      ) : (
        <div className={styles.grid}>
          {filteredGroups.map((g) => (
            <button key={g.id} className={styles.card} onClick={() => openDetail(g)}>
              <div className={styles.cardLeft}>
                <div className={styles.cardAvatar} style={{ background: groupGradient(g.name) }}>
                  {(g.name[0] ?? 'G').toUpperCase()}
                </div>
                <div className={styles.cardInfo}>
                  <span className={styles.cardName}>{g.name}</span>
                  <span className={styles.cardTag}>{g.accountIds.length} account{g.accountIds.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <span className={styles.cardBalance}>{formatAmount(balanceMap.get(g.id) ?? 0, locale, currency)}</span>
            </button>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Group" onSave={handleCreate} saveLabel="Create">
        <input className={styles.nameInput} placeholder="Group name" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
        <div className={styles.accountList}>
          {members.map((m) => {
            const memberAccts = accounts.filter((a) => a.memberId === m.id && a.isActive);
            if (memberAccts.length === 0) return null;
            return (
              <div key={m.id} className={styles.memberSection}>
                <div className={styles.memberName}>{m.name}</div>
                {memberAccts.map((a) => (
                  <label key={a.id} className={styles.accountItem}>
                    <input type="checkbox" checked={selected.has(a.id)} onChange={() => {
                      setSelected((prev) => { const n = new Set(prev); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n; });
                    }} />
                    <span>{a.name}</span>
                    <span className={styles.acctType}>{a.type}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      </Modal>

      {detailGroup && !isMobile && (
        <Modal isOpen onClose={() => setDetailGroup(null)} title={detailGroup.name}
          footer={editing ? (
            <div className={styles.footer}>
              <button className={styles.iconBtn} onClick={() => { setEditing(false); setEditSelected(new Set(detailGroup.accountIds)); }} title="Cancel">
                <span className={styles.icon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
                <span className={styles.btnLabel}>Cancel</span>
              </button>
              <button className={styles.iconBtn} onClick={saveEdit} title="Save">
                <span className={styles.icon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                </span>
                <span className={styles.btnLabel}>Save</span>
              </button>
            </div>
          ) : (
            <div className={styles.footer}>
              <button className={styles.ledgerBtn} onClick={() => navigate(`/groups/${detailGroup.id}`)} title="View Ledger">
                <span className={styles.icon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </span>
                <span className={styles.btnLabel}>View Ledger</span>
              </button>
              <button className={styles.iconBtn} onClick={() => setEditing(true)} title="Edit">
                <span className={styles.icon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </span>
                <span className={styles.btnLabel}>Edit</span>
              </button>
              <button className={styles.iconBtn} onClick={() => handleDelete(detailGroup.id)} title="Delete">
                <span className={styles.icon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </span>
                <span className={styles.btnLabel}>Delete</span>
              </button>
            </div>
          )}
        >
          {editing ? (
            <div className={styles.accountList}>
              {members.map((m) => {
                const memberAccts = accounts.filter((a) => a.memberId === m.id && a.isActive);
                if (memberAccts.length === 0) return null;
                return (
                  <div key={m.id} className={styles.memberSection}>
                    <div className={styles.memberName}>{m.name}</div>
                    {memberAccts.map((a) => (
                      <label key={a.id} className={styles.accountItem}>
                        <input type="checkbox" checked={editSelected.has(a.id)} onChange={() => {
                          setEditSelected((prev) => { const n = new Set(prev); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n; });
                        }} />
                        <span>{a.name}</span>
                        <span className={styles.acctType}>{a.type}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.detailBody}>
              {detailGroup.accountIds.length === 0 ? (
                <div className={styles.empty}>No accounts in this group.</div>
              ) : (
                detailGroup.accountIds.map((acctId) => {
                  const acct = accounts.find((a) => a.id === acctId);
                  const member = acct ? memberMap.get(acct.memberId ?? '') : null;
                  return (
                    <div key={acctId} className={styles.detailRow}>
                      <div className={styles.detailInfo}>
                        <span className={styles.detailName}>{acct?.name ?? 'Unknown'}</span>
                        <span className={styles.detailMeta}>
                          {(member?.name ?? 'Unknown')} &middot; {acct?.type ?? ''}
                        </span>
                      </div>
                      <span className={styles.detailBal}>{formatAmount(acct?.balance ?? 0, locale, currency)}</span>
                    </div>
                  );
                })
              )}
              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalAmt}>{formatAmount(balanceMap.get(detailGroup.id) ?? 0, locale, currency)}</span>
              </div>
            </div>
          )}
        </Modal>
      )}

      {detailGroup && isMobile && (
        <BottomSheet isOpen onClose={() => setDetailGroup(null)} title={detailGroup.name}>
          {editing ? (
            <div className={styles.accountList}>
              {members.map((m) => {
                const memberAccts = accounts.filter((a) => a.memberId === m.id && a.isActive);
                if (memberAccts.length === 0) return null;
                return (
                  <div key={m.id} className={styles.memberSection}>
                    <div className={styles.memberName}>{m.name}</div>
                    {memberAccts.map((a) => (
                      <label key={a.id} className={styles.accountItem}>
                        <input type="checkbox" checked={editSelected.has(a.id)} onChange={() => {
                          setEditSelected((prev) => { const n = new Set(prev); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n; });
                        }} />
                        <span>{a.name}</span>
                        <span className={styles.acctType}>{a.type}</span>
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.detailBody}>
              {detailGroup.accountIds.length === 0 ? (
                <div className={styles.empty}>No accounts in this group.</div>
              ) : (
                detailGroup.accountIds.map((acctId) => {
                  const acct = accounts.find((a) => a.id === acctId);
                  const member = acct ? memberMap.get(acct.memberId ?? '') : null;
                  return (
                    <div key={acctId} className={styles.detailRow}>
                      <div className={styles.detailInfo}>
                        <span className={styles.detailName}>{acct?.name ?? 'Unknown'}</span>
                        <span className={styles.detailMeta}>
                          {(member?.name ?? 'Unknown')} &middot; {acct?.type ?? ''}
                        </span>
                      </div>
                      <span className={styles.detailBal}>{formatAmount(acct?.balance ?? 0, locale, currency)}</span>
                    </div>
                  );
                })
              )}
              <div className={styles.totalRow}>
                <span>Total</span>
                <span className={styles.totalAmt}>{formatAmount(balanceMap.get(detailGroup.id) ?? 0, locale, currency)}</span>
              </div>
            </div>
          )}
          <div className={styles.mobSheetFooter}>
            <button className={styles.mobSheetBtn} onClick={() => navigate(`/groups/${detailGroup.id}`)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Ledger
            </button>
            <button className={styles.mobSheetBtn} onClick={() => setEditing(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              Edit
            </button>
            <button className={`${styles.mobSheetBtn} ${styles.mobSheetDanger}`} onClick={() => handleDelete(detailGroup.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Delete
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
