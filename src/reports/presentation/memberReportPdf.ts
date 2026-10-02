import { shortDate } from '../../presentation/constants/dates';
import { formatAmount } from '../../presentation/utils/format';
import type { MemberReport, MemberReportRow } from '../domain/types';

const HEAD = ['Date', 'Type', 'Description', 'Debit', 'Credit', 'Balance'];

function bodyOf(rows: MemberReportRow[], locale: string, currency: string): string[][] {
  return rows.map((r) => [
    shortDate(r.date, locale),
    r.typeLabel,
    r.counterpartyAccount ? `${r.description} (${r.counterpartyAccount})` : r.description,
    r.debit > 0 ? formatAmount(r.debit, locale, currency) : '',
    r.credit > 0 ? formatAmount(r.credit, locale, currency) : '',
    formatAmount(r.runningBalance, locale, currency),
  ]);
}

/**
 * Consolidated member PDF (T-134): cover summary + one table per account,
 * then loan and other-ledger sections. Lazy-loaded by the caller via
 * `import('jspdf')` — this module imports no jspdf types at the top level.
 */
export async function downloadMemberReportPdf(
  report: MemberReport,
  opts: { locale: string; currency: string },
): Promise<void> {
  const { locale, currency } = opts;
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const money = (n: number): string => formatAmount(n, locale, currency);
  const tableY = (): number =>
    (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 52;

  const { summary } = report;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Member Report', pageW / 2, 20, { align: 'center' });
  doc.setFontSize(11);
  doc.text(summary.memberName, pageW / 2, 28, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Member: ${summary.memberName}`, 14, 36);
  const period = summary.periodStart && summary.periodEnd
    ? `Period: ${summary.periodStart}  -  ${summary.periodEnd}`
    : 'Period: All time';
  doc.text(period, 14, 44);

  const rightX = pageW - 14;
  const gap = 3;
  const stat = (label: string, value: string, y: number): void => {
    const w = doc.getTextWidth(value);
    doc.setFont('helvetica', 'bold');
    doc.text(label, rightX - w - gap, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(value, rightX, y, { align: 'right' });
  };
  doc.setFontSize(10);
  stat('Opening Balance:', money(summary.opening), 28);
  stat('Total Debit:', money(summary.totalDebit), 36);
  stat('Total Credit:', money(summary.totalCredit), 44);

  const tableDefaults = {
    styles: { fontSize: 8, cellPadding: 2, halign: 'center' as const },
    headStyles: { fillColor: [55, 65, 81] as [number, number, number], fontStyle: 'bold' as const, halign: 'center' as const },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 24 },
      2: { cellWidth: 'auto' as const, halign: 'left' as const },
      3: { cellWidth: 30 },
      4: { cellWidth: 30 },
      5: { cellWidth: 30 },
    },
    didDrawPage: (data: { cursor?: { y?: number } | null }) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('MoneyFlows — This is a system generated report', pageW / 2, (data.cursor?.y ?? 200) + 15, { align: 'center' });
    },
  };

  let cursorY = 52;
  let started = false;
  const section = (title: string, sub: string, rows: MemberReportRow[]): void => {
    // Every section starts on a fresh page — never two accounts on one page.
    if (started) {
      doc.addPage();
      cursorY = 20;
    }
    started = true;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, 14, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(sub, 14, cursorY + 6);
    if (rows.length === 0) {
      cursorY += 10;
      return;
    }
    autoTable(doc, {
      ...tableDefaults,
      head: [HEAD],
      body: bodyOf(rows, locale, currency),
      startY: cursorY + 10,
    });
    cursorY = tableY();
  };

  for (const a of report.accounts) {
    section(a.accountName, `Opening: ${money(a.opening)}   Closing: ${money(a.closing)}`, a.rows);
  }
  for (const l of report.loans) {
    section(
      `Loan — ${l.counterpartyName}`,
      `Lent: ${money(l.totalLent)}   Repaid: ${money(l.totalRepaid)}   Outstanding: ${money(l.outstanding)}`,
      l.rows,
    );
  }
  for (const l of report.otherLedgers) {
    section(l.ledgerName, `Opening: ${money(l.opening)}   Closing: ${money(l.closing)}`, l.rows);
  }

  const safe = summary.memberName.replace(/\s+/g, '_').toLowerCase() || 'report';
  doc.save(`Member_${safe}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
