# Money Flows Spreadsheet Review

This document provides a comprehensive review and financial analysis of the `Money Flows.xlsx` spreadsheet. It breaks down the sheet structures, compiles current account balances, summarizes outstanding loans, and details key findings and discrepancies.

---

## 📊 1. Overview of the Spreadsheet Structure

The workbook is structured to track the personal and business finances of **Admin** and his family members: **Father** (Father / "Father") and **Mother** (Mother / "Mother"). 

It contains **7 active sheets**:
1. **`Dashboard`**: A central sheet that summarizes cash holdings, bank balances, bKash accounts, and outstanding loans.
2. **`HOME EXP`**: Tracks household expenses and funds allocated for home expenses.
3. **`Admin | Personal`**: Tracks Admin's personal cash (Money Beg), bKash, and bank accounts (Standard Bank, Brac Bank, Eastern Bank, Prime Savings).
4. **`Admin | Business Fund`**: Tracks Admin's business cash and business bank accounts (Brac Bank, Standard Bank).
5. **`FATHER`**: Tracks his cash, bKash, Standard Bank, Brac Bank, and Eastern Bank accounts.
6. **`MOTHER`**: Tracks her cash and Standard Bank (Her Personal) accounts.
7. **`LOANS`**: Tracks outstanding loans issued to various individuals/entities (Father, BTC, External Debtor B, External Debtor C, External Debtor A), along with a consolidated Master Ledger.

### Ledger Format
All ledger sheets (except the Dashboard) use a consistent **side-by-side layout** where each account is represented by a group of **5 columns**:
* **Date** | **Particulers** | **Debit** | **Credit** | **Balance**

Each account group is separated from the next by an empty column.

---

## 💰 2. Account & Fund Balances

Below is a compiled summary of all active accounts and their current balances as of the last transaction dates (June 2026), categorized by owner:

### Admin's Personal Accounts (`Admin | Personal`)
| Account Ledger | Current Balance (BDT) | Last Transaction Date | Notes |
| :--- | :---: | :---: | :--- |
| **Money Beg (Cash)** | **1,885** | 2026-06-28 | Main cash-in-hand tracker |
| **bKash** | **2,837** | 2026-06-23 | Mobile financial services |
| **Standard Bank** | **0** | - | No transactions recorded |
| **Brac Bank** | **3,170** | 2026-06-26 | Personal bank account |
| **Eastern Bank (EBL)** | **2,779** | 2026-06-20 | Personal bank account |
| **Prime Savings** | **34,000** | 2026-06-12 | Savings account (receives monthly contributions from Father) |
| **Total Personal Liquid Assets** | **44,671** | | *Includes Prime Savings* |

### Admin's Business Funds (`Admin | Business Fund`)
| Account Ledger | Current Balance (BDT) | Last Transaction Date | Notes |
| :--- | :---: | :---: | :--- |
| **Business Cash** | **5,000** | 2026-06-26 | Cash on hand for business operations |
| **Brac Bank** | **56,310** | 2026-06-26 | Business bank account |
| **Standard Bank** | **51,750** | 2026-05-31 | Business bank account |
| **Total Business Funds** | **113,060** | | |

### Father (Father) Accounts (`FATHER`)
| Account Ledger | Current Balance (BDT) | Last Transaction Date | Notes |
| :--- | :---: | :---: | :--- |
| **Cash** | **0** | - | No transactions recorded |
| **bKash** | **1,400** | 2026-06-10 | Mobile financial services |
| **Standard Bank** | **10,955** | 2026-06-09 | Personal bank account |
| **Brac Bank** | **951,849** | 2026-06-29 | Personal bank account |
| **Eastern Bank** | **0** | 2026-06-10 | Used for purchasing National Savings |
| **Total Liquid Assets** | **964,204** | | |

### Mother (Mother) Accounts (`MOTHER`)
| Account Ledger | Current Balance (BDT) | Last Transaction Date | Notes |
| :--- | :---: | :---: | :--- |
| **Cash** | **0** | - | No transactions recorded |
| **Standard Bank (Personal)** | **15,033** | 2026-06-07 | Personal bank account |
| **Total Liquid Assets** | **15,033** | | |

### Household Expense Fund (`HOME EXP`)
* **Current Balance: 2,355 BDT** (as of 2026-06-28)
* *Note: Funded via loans issued from Admin's Business Cash and Brac Bank on behalf of Father.*

---

## 🤝 3. Loans & Receivables Summary (`LOANS`)

Outstanding loans (amounts to be recovered) are tracked in the `LOANS` sheet. These represent funds lent out to family members or business connections.

> [!NOTE]
> Positive values below represent the amount owed to Admin/family (outstanding receivables). In the spreadsheet, they are shown as negative balances (indicating money gone out).

| Debtor / Loan Account | Outstanding Balance (BDT) | Last Activity Date | Purpose / Notes |
| :--- | :---: | :---: | :--- |
| **Father** (Father) | **101,240** | 2026-06-23 | General loans, including household expense allocations |
| **BTC** | **355,000** | 2026-06-29 | Business loans (e.g. Nobinogor Jaiga, Ghaws Trading, Father Trading) |
| **External Debtor B** | **120,000** | 2026-05-22 | Issued for Sohel Mama Qurbani purpose |
| **External Debtor C** | **100,000** | 2026-05-04 | 150K issued, 50K repaid |
| **External Debtor A** | **100,000** | 2026-06-17 | Issued from Father Brac Bank |
| **Total Outstanding Loans** | **776,240** | | **Combined receivables** |

---

## 🔍 4. Key Findings & Dashboard Discrepancies

During the detailed code-based verification of the spreadsheet, three critical discrepancies and omissions were identified on the **`Dashboard`** sheet:

### ⚠️ 1. Omission of Prime Savings Account (34,000 BDT)
* **Finding**: The `Prime Savings` account under Admin's Personal sheet has a verified balance of **34,000 BDT** (deposits of 32,000 initial + 1,000 in May + 1,000 in June).
* **Discrepancy**: This entire account is **completely omitted** from the Dashboard. As a result, Admin's Personal Assets are underrepresented by 34,000 BDT (listed as 10,671 BDT instead of the actual **44,671 BDT**).

### ⚠️ 2. Master Ledger Loan Typo (3,000 BDT Mismatch)
* **Finding**: In the `LOANS` sheet, the individual ledger for **Father** correctly records a loan of **8,000 BDT** on `2026-06-23` (matching the credit in the `HOME EXP` sheet and the debit in `Admin | Business Fund` Brac Bank).
* **Discrepancy**: The consolidated **Master Ledger** on the same sheet records this entry as **5,000 BDT** instead of 8,000 BDT. This typo results in a 3,000 BDT error, showing the Master Ledger balance as **-773,240 BDT** instead of the actual **-776,240 BDT** (which matches the sum of the individual loans shown on the Dashboard).

### ⚠️ 3. Omission of Father's bKash from Personal Summary
* **Finding**: The `FATHER` sheet has an active bKash ledger with a balance of **1,400 BDT**.
* **Discrepancy**: While this is captured under the general "bKash" summary (adding Admin's 2,837 and Father's 1,400 to make 4,237 BDT), it is **not included** in Father's total wealth summary on the right side of the Dashboard (which sums standard bank and Brac bank, but forgets his bKash).

### ⚠️ 4. Hardcoded Dashboard Values
* **Finding**: The Eastern Bank (EBL) balance for Father (Row 35, 0.0 BDT) and the Brac Bank balance for BTC (Row 29, 2,363.0 BDT) are **hardcoded** rather than dynamic formulas linking to the ledger sheets.

---

## 🔄 5. Key Financial Flows & Movements
* **National Savings Purchases**: Father transferred 300,000 BDT twice in June 2026 (totaling 600,000 BDT) through Eastern Bank to purchase new National Savings certificates. This was funded by a mature savings certificate of 300,000 BDT and standard/Brac bank transfers.
* **Household Funding**: Admin's business cash and Brac Bank have been heavily used to issue loans to Father to cover household expenses. 43,230 BDT has been transferred for this purpose, of which 40,875 BDT has been spent, leaving a balance of 2,355 BDT in the `HOME EXP` fund.
