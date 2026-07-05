import { v4 as uuidv4 } from 'uuid';
import { Member } from './core/domain/Member';
import { Account } from './core/domain/Account';
import { AccountGroup } from './core/domain/AccountGroup';
import { Transaction } from './core/domain/Transaction';
import { getDatabase } from './infrastructure/database/getDatabase';
import { LoanService } from './loans/application/LoanService';

const now = new Date();
const nowISO = now.toISOString();

function daysAgo(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function dateTime(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d), now.getHours(), now.getMinutes(), now.getSeconds()).toISOString();
}

export async function seedDatabase() {
  const db = getDatabase();
  const service = new LoanService(db);

  /* ── Members ────────────────────────────────── */
  const rafiq = new Member(uuidv4(), 'রফিকুল ইসলাম', 'রফিক', undefined, '01711-111111', undefined, false, {}, nowISO, nowISO);
  const jahanara = new Member(uuidv4(), 'জাহানারা বেগম', 'জাহানারা', undefined, '01722-222222', undefined, false, {}, nowISO, nowISO);
  const sabbir = new Member(uuidv4(), 'সাব্বির হোসেন', 'সাব্বির', undefined, '01733-333333', undefined, false, {}, nowISO, nowISO);
  const nasrin = new Member(uuidv4(), 'নাসরিন আক্তার', 'নাসরিন', undefined, '01744-444444', undefined, false, {}, nowISO, nowISO);
  const members = [rafiq, jahanara, sabbir, nasrin];

  for (const m of members) await db.saveMember(m);

  /* ── Accounts ───────────────────────────────── */
  const accounts: Account[] = [
    /* Rafiq */
    new Account(uuidv4(), rafiq.id, 'ব্যাংক অ্যাকাউন্ট', 'bank', 85000, 'BDT', undefined, '#7C5CFC', true, {}, nowISO, nowISO),
    new Account(uuidv4(), rafiq.id, 'নগদ', 'cash', 15000, 'BDT', undefined, '#4CAF50', true, {}, nowISO, nowISO),
    new Account(uuidv4(), rafiq.id, 'বিকাশ', 'mobile_wallet', 12500, 'BDT', undefined, '#E2136E', true, {}, nowISO, nowISO),
    new Account(uuidv4(), rafiq.id, 'সঞ্চয়', 'savings', 200000, 'BDT', undefined, '#FF9800', true, {}, nowISO, nowISO),

    /* Jahanara */
    new Account(uuidv4(), jahanara.id, 'গৃহস্থালি', 'cash', 8000, 'BDT', undefined, '#4CAF50', true, {}, nowISO, nowISO),
    new Account(uuidv4(), jahanara.id, 'সোনালী ব্যাংক', 'bank', 45000, 'BDT', undefined, '#7C5CFC', true, {}, nowISO, nowISO),
    new Account(uuidv4(), jahanara.id, 'নগদ', 'mobile_wallet', 3000, 'BDT', undefined, '#E2136E', true, {}, nowISO, nowISO),

    /* Sabbir */
    new Account(uuidv4(), sabbir.id, 'ছাত্র অ্যাকাউন্ট', 'bank', 12000, 'BDT', undefined, '#7C5CFC', true, {}, nowISO, nowISO),
    new Account(uuidv4(), sabbir.id, 'পকেট খরচ', 'cash', 2000, 'BDT', undefined, '#4CAF50', true, {}, nowISO, nowISO),

    /* Nasrin */
    new Account(uuidv4(), nasrin.id, 'ব্যক্তিগত সঞ্চয়', 'savings', 35000, 'BDT', undefined, '#FF9800', true, {}, nowISO, nowISO),
    new Account(uuidv4(), nasrin.id, 'নগদ', 'cash', 4500, 'BDT', undefined, '#4CAF50', true, {}, nowISO, nowISO),
  ];

  for (const a of accounts) await db.saveAccount(a);

  const rafiqBank = accounts[0]!;
  const rafiqCash = accounts[1]!;
  const rafiqBkash = accounts[2]!;
  const rafiqSavings = accounts[3]!;
  const jahanaraCash = accounts[4]!;
  const jahanaraBank = accounts[5]!;
  const sabbirBank = accounts[7]!;
  const sabbirCash = accounts[8]!;
  const nasrinSavings = accounts[9]!;
  const nasrinCash = accounts[10]!;

  /* ── Transactions ───────────────────────────── */
  const txs: Transaction[] = [
    /* Rafiq — Salary & Income */
    new Transaction(uuidv4(), 'income', 'বেতন — জুন ২০২৬', 65000, rafiq.id, dateTime(daysAgo(5)), undefined, rafiqBank.id),
    new Transaction(uuidv4(), 'income', 'বেতন — মে ২০২৬', 65000, rafiq.id, dateTime(daysAgo(35)), undefined, rafiqBank.id),
    new Transaction(uuidv4(), 'income', 'ফ্রিল্যান্সিং — ওয়েব সাইট', 15000, rafiq.id, dateTime(daysAgo(12)), undefined, rafiqBkash.id),
    new Transaction(uuidv4(), 'income', 'বাড়ি ভাড়া (জুন)', 12000, rafiq.id, dateTime(daysAgo(3)), undefined, rafiqCash.id),

    /* Rafiq — Expenses */
    new Transaction(uuidv4(), 'expense', 'বাজার — মাস শেষ', 8500, rafiq.id, dateTime(daysAgo(2)), rafiqCash.id),
    new Transaction(uuidv4(), 'expense', 'বিদ্যুৎ বিল — জুন', 3200, rafiq.id, dateTime(daysAgo(7)), rafiqBank.id),
    new Transaction(uuidv4(), 'expense', 'গ্যাস বিল — জুন', 1450, rafiq.id, dateTime(daysAgo(7)), rafiqBank.id),
    new Transaction(uuidv4(), 'expense', 'পানির বিল — জুন', 800, rafiq.id, dateTime(daysAgo(7)), rafiqBank.id),
    new Transaction(uuidv4(), 'expense', 'মোবাইল রিচার্জ', 500, rafiq.id, dateTime(daysAgo(4)), rafiqBkash.id),
    new Transaction(uuidv4(), 'expense', 'পরিবহন ভাড়া', 1200, rafiq.id, dateTime(daysAgo(1)), rafiqCash.id),

    /* Rafiq — Transfers */
    new Transaction(uuidv4(), 'transfer', 'সঞ্চয়ে জমা', 10000, rafiq.id, dateTime(daysAgo(5)), rafiqBank.id, rafiqSavings.id),
    new Transaction(uuidv4(), 'transfer', 'জাহানারাকে পাঠালাম', 5000, rafiq.id, dateTime(daysAgo(3)), rafiqBank.id, jahanaraBank.id),

    /* Jahanara */
    new Transaction(uuidv4(), 'income', 'রফিকের কাছ থেকে', 5000, jahanara.id, dateTime(daysAgo(3)), undefined, jahanaraBank.id),
    new Transaction(uuidv4(), 'expense', 'বাজার', 3200, jahanara.id, dateTime(daysAgo(1)), jahanaraCash.id),
    new Transaction(uuidv4(), 'expense', 'ওষুধ', 1250, jahanara.id, dateTime(daysAgo(2)), jahanaraCash.id),
    new Transaction(uuidv4(), 'expense', 'বাসা ভাড়া', 12000, jahanara.id, dateTime(daysAgo(6)), jahanaraBank.id),
    new Transaction(uuidv4(), 'transfer', 'নগদ তুললাম', 3000, jahanara.id, dateTime(daysAgo(2)), jahanaraBank.id, jahanaraCash.id),

    /* Sabbir */
    new Transaction(uuidv4(), 'income', 'বাবা দিয়েছেন', 3000, sabbir.id, dateTime(daysAgo(3)), undefined, sabbirBank.id),
    new Transaction(uuidv4(), 'income', 'টিউশন — রবিউল', 2500, sabbir.id, dateTime(daysAgo(8)), undefined, sabbirCash.id),
    new Transaction(uuidv4(), 'expense', 'বই কিনলাম', 1800, sabbir.id, dateTime(daysAgo(4)), sabbirBank.id),
    new Transaction(uuidv4(), 'expense', 'ক্যান্টিন', 350, sabbir.id, dateTime(daysAgo(1)), sabbirCash.id),

    /* Nasrin */
    new Transaction(uuidv4(), 'income', 'বোনাস — জুন', 5000, nasrin.id, dateTime(daysAgo(10)), undefined, nasrinSavings.id),
    new Transaction(uuidv4(), 'expense', 'ড্রেস কিনলাম', 2500, nasrin.id, dateTime(daysAgo(6)), nasrinCash.id),
    new Transaction(uuidv4(), 'transfer', 'সঞ্চয়ে রাখলাম', 2000, nasrin.id, dateTime(daysAgo(10)), nasrinCash.id, nasrinSavings.id),
  ];

  for (const tx of txs) await db.saveTransaction(tx);

  /* ── Counterparties (Debtors) ───────────────── */
  const cp1 = await service.createCounterparty('আব্দুল করিম');
  const cp2 = await service.createCounterparty('ফাতেমা খাতুন');
  const cp3 = await service.createCounterparty('মনির হোসেন');
  const cp4 = await service.createCounterparty('শাহিনা ইয়াসমিন');

  /* ── Loans ──────────────────────────────────── */
  await service.createLoan({
    lenderAccountId: rafiqBank.id,
    borrowerAccountId: cp1.accountId,
    amount: 30000,
    description: 'ব্যবসার জন্য ধার',
    date: daysAgo(120),
    memberId: rafiq.id,
  });

  await service.createLoan({
    lenderAccountId: rafiqCash.id,
    borrowerAccountId: cp1.accountId,
    amount: 10000,
    description: 'জরুরি চিকিৎসা',
    date: daysAgo(45),
    memberId: rafiq.id,
  });

  await service.createLoan({
    lenderAccountId: rafiqBkash.id,
    borrowerAccountId: cp2.accountId,
    amount: 15000,
    description: 'সেলাই মেশিন কেনা',
    date: daysAgo(90),
    memberId: rafiq.id,
  });

  await service.createLoan({
    lenderAccountId: jahanaraBank.id,
    borrowerAccountId: cp2.accountId,
    amount: 5000,
    description: 'ছেলের স্কুল ফি',
    date: daysAgo(30),
    memberId: jahanara.id,
  });

  await service.createLoan({
    lenderAccountId: rafiqBank.id,
    borrowerAccountId: cp3.accountId,
    amount: 50000,
    description: 'অটোরিক্সা কেনা',
    date: daysAgo(200),
    memberId: rafiq.id,
  });

  await service.createLoan({
    lenderAccountId: rafiqBank.id,
    borrowerAccountId: cp4.accountId,
    amount: 20000,
    description: 'ক্ষুদ্র ব্যবসা',
    date: daysAgo(60),
    memberId: rafiq.id,
  });

  /* ── Repayments ─────────────────────────────── */
  await service.recordRepayment({
    borrowerAccountId: cp1.accountId,
    amount: 12000,
    description: 'টাকা ফেরত — কিস্তি ১',
    date: daysAgo(60),
    memberId: rafiq.id,
    destinationAccountId: rafiqBank.id,
  });

  await service.recordRepayment({
    borrowerAccountId: cp2.accountId,
    amount: 5000,
    description: 'সেলাই মেশিনের প্রথম কিস্তি',
    date: daysAgo(40),
    memberId: rafiq.id,
    destinationAccountId: rafiqBkash.id,
  });

  await service.recordRepayment({
    borrowerAccountId: cp3.accountId,
    amount: 10000,
    description: 'অটোরিক্সার কিস্তি',
    date: daysAgo(100),
    memberId: rafiq.id,
    destinationAccountId: rafiqBank.id,
  });

  await service.recordRepayment({
    borrowerAccountId: cp1.accountId,
    amount: 8000,
    description: 'টাকা ফেরত — কিস্তি ২',
    date: daysAgo(15),
    memberId: rafiq.id,
    destinationAccountId: rafiqBank.id,
  });

  /* ── Group ──────────────────────────────────── */
  const groupId = uuidv4();
  await db.saveAccountGroup(new AccountGroup(groupId, 'পরিবারের সঞ্চয়', 0, {}));
  await db.addGroupAccount(groupId, rafiqSavings.id);
  await db.addGroupAccount(groupId, jahanaraBank.id);
  await db.addGroupAccount(groupId, nasrinSavings.id);

  return { members, accounts };
}

export async function resetAndSeed() {
  localStorage.removeItem('money_flows_db');
  localStorage.removeItem('money_flows_settings');
  const { initDatabase } = await import('./infrastructure/database/getDatabase');
  await initDatabase();
  await seedDatabase();
}
