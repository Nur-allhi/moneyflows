import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Avatar, Modal, FormInput } from '../components';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Member } from '../../core/domain/Member';
import { formatAmountParts } from '../utils/format';
import { useSearchStore } from '../stores/useSearchStore';
import styles from './MemberList.module.css';

export function MemberList() {
  const navigate = useNavigate();
  const { members, loading, error, fetchMembers, saveMember } = useMemberStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const searchQuery = useSearchStore((s) => s.query.toLowerCase().trim());
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newShortName, setNewShortName] = useState('');
  const [mobileSearch, setMobileSearch] = useState('');

  useEffect(() => {
    fetchMembers();
    fetchAccounts();
  }, []);

  const familyMembers = members.filter((m) => !m.isExternal);
  const effectiveQuery = mobileSearch.toLowerCase().trim() || searchQuery;
  const filteredMembers = useMemo(
    () => effectiveQuery ? familyMembers.filter((m) => m.name.toLowerCase().includes(effectiveQuery)) : familyMembers,
    [familyMembers, effectiveQuery],
  );

  function getBalance(memberId: string): number {
    return accounts
      .filter((a) => a.memberId === memberId)
      .reduce((sum, a) => sum + a.balance, 0);
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className="error-state">
          <div className="error-state-icon">{'\u26A0\uFE0F'}</div>
          <p className="error-state-text">{error}</p>
          <button className="retry-btn" onClick={() => { fetchMembers(); fetchAccounts(); }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
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
            placeholder="Search members..."
            className="member-search-input"
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
        <h2 className={styles.title}>Family Members</h2>
        <p className={styles.subtitle}>{filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}</p>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>+ New Member</button>
      </div>

      {familyMembers.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>{'+'}</div>
          <div className={styles.emptyTitle}>No members yet</div>
          <div className={styles.emptyDesc}>Add your first family member to start tracking finances together</div>
          <button className={styles.emptyBtn} onClick={() => setShowModal(true)}>Add First Member</button>
        </div>
      )}

      <div className={styles.grid}>
        {filteredMembers.length === 0 ? (
          familyMembers.length > 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '40px 0' }}>
              <div className="empty-state-icon">{'\u{1F50D}'}</div>
              <p className="empty-state-text">No members match your search</p>
            </div>
          )
        ) : (
          filteredMembers.map((m) => (
          <button
            key={m.id}
            className={styles.card}
            onClick={() => navigate(`/member/${m.id}`)}
          >
            <div className={styles.cardLeft}>
              <Avatar
                initial={m.shortName?.[0] ?? m.name[0]!}
                seed={m.name}
                name={m.name}
                size={48}
              />
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{m.name}</span>
                <span className={styles.cardTag}>Member</span>
              </div>
            </div>
            <span className={styles.cardBalance}>{formatAmountParts(getBalance(m.id), locale, currency).amount}<span className={styles.currencyLabel}>{formatAmountParts(getBalance(m.id), locale, currency).currency}</span></span>
          </button>
          ))
        )}
        {familyMembers.length > 0 && (
          <button className={styles.addCell} onClick={() => setShowModal(true)} aria-label="Add member">
            <div className={styles.addIcon}>{'+'}</div>
          </button>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Member"
        saveLabel="Add Member"
        onSave={async () => {
          if (!newName.trim()) return;
          const member = new Member(uuidv4(), newName.trim(), newShortName.trim() || undefined);
          await saveMember(member);
          setNewName('');
          setNewShortName('');
          setShowModal(false);
        }}
      >
        <FormInput
          label="Name"
          placeholder="Full name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          autoFocus
        />
        <FormInput
          label="Short Name (optional)"
          placeholder="Display initial"
          value={newShortName}
          onChange={(e) => setNewShortName(e.target.value)}
          maxLength={4}
        />
      </Modal>
    </div>
  );
}
