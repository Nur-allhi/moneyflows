import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Member } from '../../core/domain/Member';
import { Account } from '../../core/domain/Account';
import type { AccountType } from '../../core/domain/Account';
import { getDatabase } from '../../infrastructure/database/getDatabase';
import { useMemberStore } from '../stores/useMemberStore';
import { useAccountStore } from '../stores/useAccountStore';
import { googleAuth } from '../../infrastructure/database/GoogleAuth';
import { GOOGLE_CLIENT_ID, isGoogleSyncConfigured } from '../constants/googleClient';
import { useReplay } from '../hooks/useReplay';
import { useSettingsStore } from '../stores/useSettingsStore';
import { ProgressBar } from '../components/ProgressBar';
import { ACCOUNT_TYPE_LABEL, ACCOUNT_TYPE_OPTIONS } from '../constants/labels';
import { ledgerGradient } from '../constants/gradients';
import styles from './SetupWizard.module.css';

const ACCOUNT_TYPES: AccountType[] = ['bank', 'mobile_wallet', 'cash', 'savings', 'business'];

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
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  /** Staged sign-in progress (T-154) so slow networks never look dead. */
  const [authStage, setAuthStage] = useState<'google' | 'syncing' | null>(null);
  /** Modal pickers for the money step (T-155, DESIGN_IDENTITY §9). */
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [typeKey, replayType] = useReplay();
  const [memberKey, replayMember] = useReplay();
  const [pickKey, replayPick] = useReplay();
  const [signInKey, replaySignIn] = useReplay();
  const [guestKey, replayGuest] = useReplay();
  const [skipKey, replaySkip] = useReplay();
  const [startKey, replayStart] = useReplay();
  const [addMemberKey, replayAddMember] = useReplay();
  const [back1Key, replayBack1] = useReplay();
  const [cont1Key, replayCont1] = useReplay();
  const [addAcctKey, replayAddAcct] = useReplay();
  const [back2Key, replayBack2] = useReplay();
  const [cont2Key, replayCont2] = useReplay();
  const [back3Key, replayBack3] = useReplay();
  const [nextKey, replayNext] = useReplay();
  const finish = (goDashboard = true) => {
    updateSettings({ setupComplete: true });
    if (goDashboard) navigate('/', { replace: true });
  };

  const handleAddMemberRow = () => setMemberNames((prev) => [...prev, '']);
  const handleMemberChange = (idx: number, v: string) => setMemberNames((prev) => prev.map((n, i) => (i === idx ? v : n)));

  /**
   * Entry gate (T-153): sign in → shared reconcile. A downloaded cloud backup
   * skips the wizard (data already present); anything else continues normally.
   */
  const handleSignIn = async () => {
    setAuthBusy(true);
    setAuthError(null);
    setAuthStage('google');
    try {
      await googleAuth.signIn(GOOGLE_CLIENT_ID);
      setAuthStage('syncing');
      const result = await getDatabase().reconcileAfterSignIn();
      if (result === 'downloaded') {
        await fetchMembers();
        await fetchAccounts();
        finish();
        return;
      }
      setStep(1);
    } catch {
      setAuthError('Sign-in failed — check your connection, or continue as guest.');
    } finally {
      setAuthBusy(false);
      setAuthStage(null);
    }
  };

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

  const total = 4;
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
          <button className={`${styles.skip} ${skipKey > 0 ? 'anim-nudge' : ''}`} onClick={() => { replaySkip(); finish(); }}><span className="anim-target" key={skipKey}>Skip → Dashboard</span></button>
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
              {isGoogleSyncConfigured() ? (
                <>
                  <button className={`${styles.primary} ${signInKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replaySignIn(); void handleSignIn(); }} disabled={authBusy}><span className="anim-target" key={signInKey}>{authBusy ? (authStage === 'syncing' ? 'Completing sign-in…' : 'Opening Google…') : 'Sign in with Google'}</span></button>
                  <button className={`${styles.ghost} ${guestKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayGuest(); setStep(1); }} disabled={authBusy}><span className="anim-target" key={guestKey}>Continue as guest</span></button>
                  {authBusy && authStage && (
                    <ProgressBar
                      percent={authStage === 'google' ? 35 : 75}
                      label={authStage === 'google' ? 'Opening Google…' : 'Syncing your data…'}
                      sublabel="Stay on this screen — finishing up."
                    />
                  )}
                  {authError && <div className={styles.error}>{authError}</div>}
                </>
              ) : (
                <button className={`${styles.primary} ${startKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayStart(); setStep(1); }}><span className="anim-target" key={startKey}>Get Started</span></button>
              )}
            </div>
          )}

          {step === 1 && (
            <div className={styles.step}>
              <h2 className={styles.h2}>Who’s in your family?</h2>
              <p className={styles.sub}>Add the people you’ll track money for. You can change this later in Members.</p>
              <div className={styles.list}>
                {memberNames.map((n, i) => (
                  <div key={i} className={styles.row}>
                    <span className={styles.avatar} style={{ background: ledgerGradient(n || 'You') }}>{(n[0] ?? 'Y').toUpperCase()}</span>
                    <input className={styles.input} placeholder={i === 0 ? 'You (Admin)' : 'Member name'} value={n} onChange={(e) => handleMemberChange(i, e.target.value)} />
                  </div>
                ))}
                <button className={`${styles.ghost} ${addMemberKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayAddMember(); handleAddMemberRow(); }}><span className="anim-target" key={addMemberKey}>+ Add member</span></button>
              </div>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.actions}>
                <button className={`${styles.secondary} ${back1Key > 0 ? 'anim-nudge' : ''}`} onClick={() => { replayBack1(); setStep(0); }}><span className="anim-target" key={back1Key}>Back</span></button>
                <button className={`${styles.primary} ${cont1Key > 0 ? 'anim-pop' : ''}`} onClick={() => { replayCont1(); void handleContinueMembers(); }}><span className="anim-target" key={cont1Key}>Continue → Add your money</span></button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={styles.step}>
              <h2 className={styles.h2}>Where’s your money?</h2>
              <p className={styles.sub}>Add where your money lives. This is your starting point — every future move will be a transaction.</p>
              <div className={styles.grid2}>
                <button type="button" className={`${styles.pickerTrigger} ${typeKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayType(); setShowTypePicker(true); }}>
                  <span className={styles.pickerValue} key={typeKey}>{ACCOUNT_TYPE_LABEL[accountDraft.type] ?? accountDraft.type}</span>
                  <span className={styles.pickerArrow}>▾</span>
                </button>
                <button type="button" className={`${styles.pickerTrigger} ${memberKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayMember(); setShowMemberPicker(true); }}>
                  <span className={styles.pickerValue} key={memberKey}>{memberNames[accountDraft.memberIdx]?.trim() || 'Select member'}</span>
                  <span className={styles.pickerArrow}>▾</span>
                </button>
              </div>
              <input className={styles.input} placeholder="Account name (e.g. bKash)" value={accountDraft.name} onChange={(e) => setAccountDraft((p) => ({ ...p, name: e.target.value }))} />
              <input className={styles.input} placeholder="Starting balance (optional)" inputMode="numeric" value={accountDraft.balance} onChange={(e) => setAccountDraft((p) => ({ ...p, balance: e.target.value.replace(/[^0-9]/g, '') }))} />
              <button className={`${styles.ghost} ${addAcctKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayAddAcct(); void handleAddAccount(); }}><span className="anim-target" key={addAcctKey}>+ Add account</span></button>
              {accountsAdded.length > 0 && (
                <div className={styles.added}>
                  {accountsAdded.map((a, i) => (
                    <span key={i} className={styles.chip}>{a.name} · {a.memberName} · {a.type}</span>
                  ))}
                </div>
              )}
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.actions}>
                <button className={`${styles.secondary} ${back2Key > 0 ? 'anim-nudge' : ''}`} onClick={() => { replayBack2(); setStep(1); }}><span className="anim-target" key={back2Key}>Back</span></button>
                <button className={`${styles.primary} ${cont2Key > 0 ? 'anim-pop' : ''}`} onClick={() => { replayCont2(); setStep(3); }}><span className="anim-target" key={cont2Key}>Continue → See how it works</span></button>
              </div>
              {showTypePicker && (
                <div className={styles.pickerOverlay} onClick={() => setShowTypePicker(false)}>
                  <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.pickerHeader}>
                      <span className={styles.pickerTitle}>Account type</span>
                      <button className={styles.pickerClose} onClick={() => setShowTypePicker(false)} aria-label="Close">✕</button>
                    </div>
                    <div className={styles.pickerList}>
                      {ACCOUNT_TYPE_OPTIONS.map((o) => (
                        <button key={o.value} className={`${styles.pickerItem} ${accountDraft.type === o.value ? styles.pickerItemActive : ''}`} onClick={() => { replayPick(); setAccountDraft((p) => ({ ...p, type: o.value as AccountType })); setShowTypePicker(false); }}>
                          <span className={styles.pickerItemName} key={`${o.value}-${pickKey}`}>{o.label}</span>
                        </button>
                      ))}
                      {ACCOUNT_TYPES.filter((t) => !ACCOUNT_TYPE_OPTIONS.find((o) => o.value === t)).map((t) => (
                        <button key={t} className={`${styles.pickerItem} ${accountDraft.type === t ? styles.pickerItemActive : ''}`} onClick={() => { replayPick(); setAccountDraft((p) => ({ ...p, type: t })); setShowTypePicker(false); }}>
                          <span className={styles.pickerItemName} key={`${t}-${pickKey}`}>{ACCOUNT_TYPE_LABEL[t]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {showMemberPicker && (
                <div className={styles.pickerOverlay} onClick={() => setShowMemberPicker(false)}>
                  <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.pickerHeader}>
                      <span className={styles.pickerTitle}>Owner</span>
                      <button className={styles.pickerClose} onClick={() => setShowMemberPicker(false)} aria-label="Close">✕</button>
                    </div>
                    <div className={styles.pickerList}>
                      {memberNames.map((n, i) => n.trim() && (
                        <button key={i} className={`${styles.pickerItem} ${accountDraft.memberIdx === i ? styles.pickerItemActive : ''}`} onClick={() => { replayPick(); setAccountDraft((p) => ({ ...p, memberIdx: i })); setShowMemberPicker(false); }}>
                          <span className={styles.pickerItemName} key={`${i}-${pickKey}`}>{n.trim()}</span>
                        </button>
                      ))}
                      {!memberNames.some((n) => n.trim()) && (
                        <div className={styles.pickerEmpty}>No members yet — add one on the previous step</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                <button className={`${styles.secondary} ${back3Key > 0 ? 'anim-nudge' : ''}`} onClick={() => { replayBack3(); setStep(2); }}><span className="anim-target" key={back3Key}>Back</span></button>
                <button className={`${styles.primary} ${nextKey > 0 ? 'anim-pop' : ''}`} onClick={() => { replayNext(); finish(); }}><span className="anim-target" key={nextKey}>Finish → Dashboard</span></button>
              </div>
            </div>
          )}
        </div>
        <div className={styles.foot}>You can replay this setup anytime from Settings → About</div>
      </div>
    </div>
  );
}
