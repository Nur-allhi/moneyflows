import { useMemo } from 'react';
import { Modal, AccountCard } from '../components';
import { useAccountStore } from '../stores/useAccountStore';
import { formatAmount } from '../utils/format';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useModalStore } from '../stores/useModalStore';
import { ACCOUNT_TYPE_GRADIENT_THREE, displayType } from '../constants/labels';
import styles from './SelectAccountModal.module.css';

interface SelectAccountModalProps {
  memberId: string;
  selectedAccountId: string | null;
  onSelect: (accountId: string | null) => void;
  onClose: () => void;
}

export function SelectAccountModal({ memberId, selectedAccountId, onSelect, onClose }: SelectAccountModalProps) {
  const accounts = useAccountStore((s) => s.accounts);
  const { locale, currency } = useSettingsStore((s) => s.settings);

  const memberAccounts = useMemo(
    () => accounts.filter((a) => a.memberId === memberId && !a.deletedAt),
    [accounts, memberId],
  );

  return (
    <Modal isOpen onClose={onClose} title="Linked Accounts" footer={null}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          role="button"
          tabIndex={0}
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            border: selectedAccountId === null ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: selectedAccountId === null ? 'oklch(62% 0.22 290 / 0.1)' : 'transparent',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 15,
            color: 'var(--color-text)',
            transition: 'all 0.15s',
          }}
          onClick={() => { onSelect(null); onClose(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { onSelect(null); onClose(); } }}
        >
          All Accounts
        </div>
        {memberAccounts.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 16, fontSize: 14 }}>
            No accounts yet
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {memberAccounts.map((acct) => (
              <AccountCard
                key={acct.id}
                name={acct.name}
                type={displayType(acct.type)}
                balance={formatAmount(acct.balance, locale, currency)}
                gradient={ACCOUNT_TYPE_GRADIENT_THREE[acct.type]}
                showChip={acct.type === 'cash'}
                onClick={() => { onSelect(acct.id); onClose(); }}
                selected={selectedAccountId === acct.id}
                className={styles.gridCard}
                actions={
                  <button
                    className={styles.acctActionBtn}
                    title="Edit account"
                    aria-label={`Edit ${acct.name}`}
                    onClick={() => { onClose(); useModalStore.getState().open('edit-account', { accountId: acct.id }); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M10.5 1.5l2 2L5 11l-2.7.7L3 8.9l7.5-7.4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
