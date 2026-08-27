import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Member } from '../../core/domain/Member';
import { Account } from '../../core/domain/Account';
import type { AccountType } from '../../core/domain/Account';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ACCOUNT_TYPE_LABEL, ACCOUNT_TYPE_OPTIONS } from '../constants/labels';
import styles from './SetupWizard.module.css';

const ACCOUNT_TYPES: AccountType[] = ['bank', 'mobile_wallet', 'cash', 'savings', 'business'];

function seedGradient(name: string): string {
  const hues = [290, 170, 30, 85, 220, 330, 50, 190];
  let idx = 0;
  for (let i = 0; i < name.length; i++) idx = (idx * 31 + name.charCodeAt(i)) % hues.length;
  const h = hues[idx]!;
  return `linear-gradient(135deg, oklch(62% 0.22 ${h}), oklch(50% 0.2 ${h}))`;
}

export function SetupWizard() {
  const navigate = useNavigate();
  const { fetchMembers } = useMemberStore();
  const { fetchAccounts } = useAccountStore();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [step, setStep] = useState(0);
  const [memberNames, setMemberNames] = useState<string[]>(['']);
  const [accountDraft, setAccountDraft] = useState<{ memberIdx: number; name: string; type: AccountType; balance: string }>({ memberIdx: 0, name: '', type: 'bank', balance: '0' });
  const [accountsAdded, setAccountsAdded] = useState<{ name: string; type: AccountType; memberName: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const finish = (goDashboard = true) => {
    updateSettings({ setupComplete: true });
    if (goDashboard) navigate('/', { replace: true });
  };

  const handleAddMemberRow = () => setMemberNames((prev) => [...prev, '']);
  const handleMemberChange = (idx: number, v: string) => setMemberNames((prev) => prev.map((n, i) => (i === idx ? v : n)));

  const handleContinueMembers = async () => {
    setError(null);
    const names = memberNames.map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) { setError('Add at least one person'); return; }
    try {
      const db = getDatabase();
      for (const name of names) {
        const m = new Member(uuidv4(), name, name.slice(0, 4));
        await db.saveMember(m);
      }
      await fetchMembers();
      setStep(2);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const handleAddAccount = async () => {
    setError(null);
    const names = memberNames.map((n) => n.trim()).filter(Boolean);
    const memberName = names[accountDraft.memberIdx] ?? names[0] ?? '';
    if (!accountDraft.name.trim()) { setError('Account name required'); return; }
    try {
      const db = getDatabase();
      const members = await db.getMembers();
      const member = members.find((m) => m.name === memberName) ?? members[0];
      if (!member) { setError('Create a member first'); return; }
      const acc = new Account(uuidv4(), member.id, accountDraft.name.trim(), accountDraft.type, Number(accountDraft.balance) || 0);
      await db.saveAccount(acc);
      setAccountsAdded((prev) => [...prev, { name: acc.name, type: acc.type, memberName: member.name }]);
      setAccountDraft({ memberIdx: 0, name: '', type: 'bank', balance: '0' });
      await fetchAccounts();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const handleLoadSample = async () => {
    const db = getDatabase();
    const m1 = new Member(uuidv4(), 'You', 'You');
    const m2 = new Member(uuidv4(), 'Family', 'Fam');
    await db.saveMember(m1);
    await db.saveMember(m2);
    const a1 = new Account(uuidv4(), m1.id, 'bKash', 'mobile_wallet', 5000);
    const a2 = new Account(uuidv4(), m1.id, 'Cash', 'cash', 2000);
    await db.saveAccount(a1);
    await db.saveAccount(a2);
    await fetchMembers();
    await fetchAccounts();
    finish();
  };

  const total = 5;
  const progress = ((step + 1) / total) * 100;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div className={styles.dots}>
            {Array.from({ length: total }).map((_, i) => (
              <span key={i} className={`${styles.dot} ${i <= step ? styles.dotActive : ''}`} />
            ))}
          </div>
          <button className={styles.skip} onClick={() => finish()}>Skip → Dashboard</button>
        </div>
        <div className={styles.progressWrap}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>

        <div className={styles.panel}>
          {step === 0 && (
            <div className={styles.step}>
              <div className={styles.logo}>MoneyFlows</div>
              <h1 className={styles.title}>Welcome! Let’s set up your family finance in 2 minutes</h1>
              <p className={styles.sub}>Private & offline — your data stays in this browser. No sign-up needed.</p>
              <div className={styles.illus}>
                <span className={styles.illusCard}>💳 Account</span>
                <span className={styles.illusCard}>📒 Ledger</span>
                <span className={styles.illusCard}>🔒 Safe</span>
              </div>
              <button className={styles.primary} onClick={() => setStep(1)}>Get Started</button>
            </div>
          )}

          {step === 1 && (
            <div className={styles.step}>
              <h2 className={styles.h2}>Who’s in your family?</h2>
              <p className={styles.sub}>Add the people you’ll track money for. You can change this later in Members.</p>
              <div className={styles.list}>
                {memberNames.map((n, i) => (
                  <div key={i} className={styles.row}>
                    <span className={styles.avatar} style={{ background: seedGradient(n || 'You') }}>{(n[0] ?? 'Y').toUpperCase()}</span>
                    <input className={styles.input} placeholder={i === 0 ? 'You (Admin)' : 'Member name'} value={n} onChange={(e) => handleMemberChange(i, e.target.value)} />
                  </div>
                ))}
                <button className={styles.ghost} onClick={handleAddMemberRow}>+ Add member</button>
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.actions}>
                <button className={styles.secondary} onClick={() => setStep(0)}>Back</button>
                <button className={styles.primary} onClick={handleContinueMembers}>Continue → Add your money</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.step}>
              <h2 className={styles.h2}>Where’s your money?</h2>
              <p className={styles.sub}>Add where your money lives. This is your starting point — every future move will be a transaction.</p>
              <div className={styles.grid2}>
                <select className={styles.input} value={accountDraft.type} onChange={(e) => setAccountDraft((p) => ({ ...p, type: e.target.value as AccountType }))}>
                  {ACCOUNT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  {ACCOUNT_TYPES.map((t) => !ACCOUNT_TYPE_OPTIONS.find((o) => o.value === t) ? <option key={t} value={t}>{ACCOUNT_TYPE_LABEL[t]}</option> : null)}
                </select>
                <select className={styles.input} value={accountDraft.memberIdx} onChange={(e) => setAccountDraft((p) => ({ ...p, memberIdx: Number(e.target.value) }))}>
                  {memberNames.map((n, i) => n.trim() && <option key={i} value={i}>{n.trim()}</option>)}
                </select>
              </div>
              <input className={styles.input} placeholder="Account name (e.g. bKash)" value={accountDraft.name} onChange={(e) => setAccountDraft((p) => ({ ...p, name: e.target.value }))} />
              <input className={styles.input} placeholder="Starting balance (optional)" inputMode="numeric" value={accountDraft.balance} onChange={(e) => setAccountDraft((p) => ({ ...p, balance: e.target.value.replace(/[^0-9]/g, '') }))} />
              <button className={styles.ghost} onClick={handleAddAccount}>+ Add account</button>
              {accountsAdded.length > 0 && (
                <div className={styles.added}>
                  {accountsAdded.map((a, i) => (
                    <span key={i} className={styles.chip}>{a.name} · {a.memberName} · {a.type}</span>
                  ))}
                </div>
              )}
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.actions}>
                <button className={styles.secondary} onClick={() => setStep(1)}>Back</button>
                <button className={styles.primary} onClick={() => setStep(3)}>Continue → See how it works</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={styles.step}>
              <h2 className={styles.h2}>How it works</h2>
              <p className={styles.sub}>Everything lives in the sidebar — tap to explore after setup.</p>
              <div className={styles.cards}>
                <div className={styles.card}><span className={styles.cardIcon}>📊</span><span className={styles.cardTitle}>Dashboard</span><span className={styles.cardDesc}>Totals + Where Your Money Is</span></div>
                <div className={styles.card}><span className={styles.cardIcon}>📒</span><span className={styles.cardTitle}>Ledger</span><span className={styles.cardDesc}>Date | Description | Debit | Credit | Balance</span></div>
                <div className={styles.card}><span className={styles.cardIcon}>🤝</span><span className={styles.cardTitle}>Loans</span><span className={styles.cardDesc}>Who you lent to, how much is left, repayment progress</span></div>
                <div className={styles.card}><span className={styles.cardIcon}>👥</span><span className={styles.cardTitle}>Groups</span><span className={styles.cardDesc}>Combine accounts of a family to see joint balance + shared ledger</span></div>
                <div className={styles.card}><span className={styles.cardIcon}>🏦</span><span className={styles.cardTitle}>Other Ledgers</span><span className={styles.cardDesc}>Manual registers like House Rent — grouped by owner</span></div>
                <div className={styles.card}><span className={styles.cardIcon}>🏷️</span><span className={styles.cardTitle}>Tags</span><span className={styles.cardDesc}>Label any transaction, then find it family-wide on Tags page</span></div>
              </div>
              <p className={styles.sub}>Tap any row to edit. Use search and filters on every ledger.</p>
              <div className={styles.actions}>
                <button className={styles.secondary} onClick={() => setStep(2)}>Back</button>
                <button className={styles.primary} onClick={() => setStep(4)}>Next</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className={styles.step}>
              <h2 className={styles.h2}>Try it</h2>
              <p className={styles.sub}>Start empty or load a sample family to explore instantly. Sample data can be deleted from Recycle Bin anytime.</p>
              <div className={styles.choices}>
                <button className={styles.choice} onClick={() => finish()}><span className={styles.choiceTitle}>Start empty</span><span className={styles.choiceSub}>Recommended — your real data</span></button>
                <button className={styles.choicePrimary} onClick={handleLoadSample}><span className={styles.choiceTitle}>Load sample family</span><span className={styles.choiceSub}>4 members · 6 accounts · 12 transactions</span></button>
              </div>
              <div className={styles.actions}>
                <button className={styles.secondary} onClick={() => setStep(3)}>Back</button>
              </div>
            </div>
          )}
        </div>
        <div className={styles.foot}>You can replay this setup anytime from Settings → About</div>
      </div>
    </div>
  );
}
