import type { Transaction } from '../../../core/domain/Transaction';
import { shortDate } from '../../constants/dates';
import { formatAmount } from '../../utils/format';
import { pdfDescription } from '../../utils/groupLedgerLegs';
import type { TagLedgerRowResolver } from '../../utils/tagLedgerRow';

export type TagPdfRow = {
  date: string;
  type: string;
  description: string;
  member: string;
  debit: string;
  credit: string;
};

export type TagPdfData = {
  /** Already filtered by the search box and ordered by the chosen sort. */
  txs: Transaction[];
  /** One display rule for the Member and Account columns, shared with the screen. */
  resolve: TagLedgerRowResolver;
  /** The same credit rule the on-screen register uses. */
  isCredit: (tx: Transaction) => boolean;
  locale: string;
  currency: string;
};

const titleOf = (type: string) =>
  type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Pure row shape shared by the PDF and its unit tests. A tag spans accounts,
 *  so there is deliberately no running-balance column. */
export function buildTagPdfRows({ txs, resolve, isCredit, locale, currency }: TagPdfData) {
  let totalIn = 0;
  let totalOut = 0;

  const rows: TagPdfRow[] = txs.map((tx) => {
    const credit = isCredit(tx);
    const amountText = formatAmount(tx.amount, locale, currency);
    if (credit) totalIn += tx.amount;
    else totalOut += tx.amount;

    // The route sits under the description, like the Group Ledger PDF: a long
    // account name can wrap there without colliding with the money columns.
    // Use ASCII arrows — jsPDF's Helvetica cannot encode the Unicode glyph.
    const route = resolve.routeLabel(tx);

    return {
      date: shortDate(tx.date, locale),
      type: titleOf(tx.type),
      description: pdfDescription(tx.description, route),
      member: resolve.memberName(tx),
      debit: credit ? '' : amountText,
      credit: credit ? amountText : '',
    };
  });

  return { rows, totalIn, totalOut };
}

export async function downloadTagPdf({ tag, ...data }: TagPdfData & { tag: string }) {
  const { txs, locale, currency } = data;
  const { rows, totalIn, totalOut } = buildTagPdfRows(data);
  if (rows.length === 0) return;

  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const rightX = pageW - 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`#${tag}`, pageW / 2, 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${txs.length} transaction${txs.length === 1 ? '' : 's'} - across all members`, pageW / 2, 28, { align: 'center' });

  const first = txs[0];
  const last = txs[txs.length - 1];
  if (first && last) {
    doc.text(`Period: ${shortDate(first.date, locale)} - ${shortDate(last.date, locale)}`, 14, 36);
  }

  const total = (label: string, value: number, y: number) => {
    const valueText = formatAmount(value, locale, currency);
    doc.setFont('helvetica', 'bold');
    doc.text(label, rightX - doc.getTextWidth(valueText) - 3, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(valueText, rightX, y, { align: 'right' });
  };
  total('Total In:', totalIn, 28);
  total('Total Out:', totalOut, 36);

  autoTable(doc, {
    head: [['Date', 'Type', 'Description', 'Member', 'Debit', 'Credit']],
    body: rows.map((r) => [r.date, r.type, r.description, r.member, r.debit, r.credit]),
    startY: 44,
    styles: { fontSize: 8, overflow: 'linebreak', valign: 'middle' },
    headStyles: { fillColor: [99, 102, 241] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 26 },
      2: { cellWidth: 'auto', halign: 'left' },
      3: { cellWidth: 28 },
      4: { cellWidth: 26 },
      5: { cellWidth: 26 },
    },
  });

  doc.text('MoneyFlows \u2014 System generated report', pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  const slug = tag.replace(/[^\w-]+/g, '_');
  doc.save(`tag_${slug}_ledger.pdf`);
}
