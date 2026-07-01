import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Avatar, Modal, FormInput } from '../components';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { Member } from '../../core/domain/Member';
import { formatAmount } from '../utils/format';
import styles from './MemberList.module.css';


export function MemberList() {
  const navigate = useNavigate();
  const { members, loading, error, fetchMembers, saveMember } = useMemberStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { locale, currency } = useSettingsStore((s) => s.settings);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newShortName, setNewShortName] = useState('');

  useEffect(() => {
    fetchMembers();
    fetchAccounts();
  }, []);

  const familyMembers = members.filter((m) => !m.isExternal);

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
      <div className={styles.header}>
        <h2 className={styles.title}>Family Members</h2>
        <p className={styles.subtitle}>{familyMembers.length} members</p>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>+ New Member</button>
      </div>
      <div className={styles.grid}>
        {familyMembers.map((m) => (
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
            <span className={styles.cardBalance}>{formatAmount(getBalance(m.id), locale, currency)}</span>
          </button>
        ))}
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
