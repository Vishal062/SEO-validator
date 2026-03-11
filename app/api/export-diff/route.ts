import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const SNAPSHOT_DIR = path.resolve(process.cwd(), 'storage/snapshot');

// ─── Colour palette ──────────────────────────────────────────────────────────
const COLORS = {
  headerBg:    'FF6366F1', // indigo-500
  headerFg:    'FFFFFFFF',
  changed:     'FFFEF08A', // yellow-200  ← highlight changed rows
  changedText: 'FF92400E', // amber-800
  added:       'FFD1FAE5', // emerald-100 ← value exists in new but not old
  removed:     'FFFEE2E2', // red-100     ← value existed in old but not new
  unchanged:   'FFFFFFFF',
  rowAlt:      'FFF8FAFC', // slate-50  alternate row tint
  sectionBg:   'FFEDE9FE', // violet-100 section header
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readSnapshot(filename: string): Record<string, unknown> | null {
  const filePath = path.join(SNAPSHOT_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); }
  catch { return null; }
}

function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}

// Flatten snapshot into human-readable rows: [section, field, value]
function flattenSnapshot(snap: Record<string, unknown>): { section: string; field: string; value: string }[] {
  const rows: { section: string; field: string; value: string }[] = [];

  const simple: Record<string, string> = {
    title:        'Page Title',
    description:  'Meta Description',
    h1:           'H1 Tag',
    canonical:    'Canonical URL',
    ogTitle:      'OG Title',
    ogDesc:       'OG Description',
    twitterTitle: 'Twitter Title',
    twitterDesc:  'Twitter Description',
  };

  // Basic fields
  for (const [key, label] of Object.entries(simple)) {
    rows.push({ section: 'Basic SEO', field: label, value: str(snap[key]) });
  }

  // OG tags
  if (snap.og && typeof snap.og === 'object') {
    for (const [k, v] of Object.entries(snap.og as Record<string, unknown>)) {
      rows.push({ section: 'Open Graph', field: k, value: str(v) });
    }
  }

  // Twitter tags
  if (snap.twitter && typeof snap.twitter === 'object') {
    for (const [k, v] of Object.entries(snap.twitter as Record<string, unknown>)) {
      rows.push({ section: 'Twitter Card', field: k, value: str(v) });
    }
  }

  // Headings
  if (Array.isArray(snap.headings)) {
    (snap.headings as { level: string; text: string }[]).forEach((h, i) => {
      rows.push({ section: 'Headings', field: `${h.level.toUpperCase()} #${i + 1}`, value: h.text });
    });
  }

  // Missing fields
  if (Array.isArray(snap.missing) && (snap.missing as string[]).length > 0) {
    rows.push({ section: 'Missing Fields', field: 'Missing', value: (snap.missing as string[]).join(', ') });
  }

  // DataLayer summary
  if (Array.isArray(snap.dataLayer)) {
    rows.push({ section: 'DataLayer', field: 'Event Count', value: String((snap.dataLayer as unknown[]).length) });
    (snap.dataLayer as Record<string, unknown>[]).forEach((evt, i) => {
      rows.push({ section: 'DataLayer', field: `Event #${i + 1}`, value: str(evt) });
    });
  }

  return rows;
}

// ─── API handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const fileA = req.nextUrl.searchParams.get('fileA'); // older snapshot
  const fileB = req.nextUrl.searchParams.get('fileB'); // newer snapshot

  if (!fileA || !fileB) {
    return NextResponse.json({ error: 'fileA and fileB are required.' }, { status: 400 });
  }

  const snapA = readSnapshot(fileA);
  const snapB = readSnapshot(fileB);

  if (!snapA || !snapB) {
    return NextResponse.json({ error: 'One or both snapshot files not found.' }, { status: 404 });
  }

  const rowsA = flattenSnapshot(snapA);
  const rowsB = flattenSnapshot(snapB);

  // Build a merged map: field key → { old, new }
  type DiffEntry = { section: string; field: string; oldVal: string; newVal: string; status: 'changed' | 'added' | 'removed' | 'same' };
  const fieldMap = new Map<string, DiffEntry>();

  for (const r of rowsA) {
    const key = `${r.section}||${r.field}`;
    fieldMap.set(key, { section: r.section, field: r.field, oldVal: r.value, newVal: '', status: 'removed' });
  }
  for (const r of rowsB) {
    const key = `${r.section}||${r.field}`;
    if (fieldMap.has(key)) {
      const entry = fieldMap.get(key)!;
      entry.newVal = r.value;
      entry.status = entry.oldVal === r.value ? 'same' : 'changed';
    } else {
      fieldMap.set(key, { section: r.section, field: r.field, oldVal: '', newVal: r.value, status: 'added' });
    }
  }

  const diffs = Array.from(fieldMap.values());

  // ── Build Excel ────────────────────────────────────────────────────────────
  const workbook  = new ExcelJS.Workbook();
  workbook.creator = 'SEOTale';
  workbook.created = new Date();

  // ── Sheet 1: Full Diff ────────────────────────────────────────────────────
  const sheet = workbook.addWorksheet('SEO Diff');

  // column widths
  sheet.columns = [
    { header: '', key: 'section', width: 18 },
    { header: '', key: 'field',   width: 28 },
    { header: '', key: 'oldVal',  width: 55 },
    { header: '', key: 'newVal',  width: 55 },
    { header: '', key: 'status',  width: 12 },
  ];

  // Title row
  const titleRow = sheet.addRow(['SEO Snapshot Diff Report']);
  titleRow.font = { bold: true, size: 14, color: { argb: COLORS.headerFg } };
  titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  sheet.mergeCells(`A1:E1`);
  titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
  titleRow.height = 30;

  // Meta rows
  const urlRow = sheet.addRow([`URL: ${str(snapB.url || snapA.url)}`]);
  urlRow.font = { italic: true, size: 10 };
  sheet.mergeCells(`A2:E2`);

  const dateOld = str(snapA.updated || snapA.date);
  const dateNew = str(snapB.updated || snapB.date);
  const dateRow = sheet.addRow([`Old Snapshot: ${dateOld}   →   New Snapshot: ${dateNew}`]);
  dateRow.font = { size: 10 };
  sheet.mergeCells(`A3:E3`);

  sheet.addRow([]); // blank

  // Column header row
  const hdr = sheet.addRow(['Section', 'Field', `Old (${dateOld})`, `New (${dateNew})`, 'Status']);
  hdr.font = { bold: true, color: { argb: COLORS.headerFg } };
  hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  hdr.height = 22;
  hdr.alignment = { vertical: 'middle' };

  // Data rows
  let currentSection = '';
  let rowIdx = 0;
  for (const d of diffs) {
    // Section header
    if (d.section !== currentSection) {
      currentSection = d.section;
      const sRow = sheet.addRow([d.section, '', '', '', '']);
      sRow.font   = { bold: true, italic: true, size: 10 };
      sRow.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };
      sheet.mergeCells(`A${sRow.number}:E${sRow.number}`);
    }

    const dataRow = sheet.addRow(['', d.field, d.oldVal, d.newVal, d.status.toUpperCase()]);
    rowIdx++;

    // Colour coding
    let bgColor = rowIdx % 2 === 0 ? COLORS.rowAlt : COLORS.unchanged;
    let textColor = '00000000';

    if (d.status === 'changed') { bgColor = COLORS.changed;  textColor = COLORS.changedText; }
    if (d.status === 'added')   { bgColor = COLORS.added; }
    if (d.status === 'removed') { bgColor = COLORS.removed; }

    dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    if (textColor !== '00000000') dataRow.font = { color: { argb: textColor }, bold: d.status === 'changed' };

    // Wrap text for long cells
    dataRow.getCell('oldVal').alignment = { wrapText: true, vertical: 'top' };
    dataRow.getCell('newVal').alignment = { wrapText: true, vertical: 'top' };

    // Bold the changed cells specifically
    if (d.status === 'changed') {
      dataRow.getCell('oldVal').font = { color: { argb: 'FF9A3412' }, strikethrough: true };
      dataRow.getCell('newVal').font = { color: { argb: 'FF15803D' }, bold: true };
    }
  }

  // ── Sheet 2: Changes Only ─────────────────────────────────────────────────
  const changesSheet = workbook.addWorksheet('Changes Only');
  changesSheet.columns = [
    { header: 'Section', key: 'section', width: 18 },
    { header: 'Field',   key: 'field',   width: 28 },
    { header: `Old`,     key: 'oldVal',  width: 55 },
    { header: `New`,     key: 'newVal',  width: 55 },
    { header: 'Status',  key: 'status',  width: 12 },
  ];

  const chdr = changesSheet.addRow(['Section', 'Field', `Old (${dateOld})`, `New (${dateNew})`, 'Status']);
  chdr.font = { bold: true, color: { argb: COLORS.headerFg } };
  chdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  chdr.height = 22;

  const changedOnly = diffs.filter(d => d.status !== 'same');
  if (changedOnly.length === 0) {
    const noneRow = changesSheet.addRow(['', 'No changes detected between these two snapshots.', '', '', '']);
    noneRow.font = { italic: true, color: { argb: 'FF6B7280' } };
  } else {
    for (const d of changedOnly) {
      const r = changesSheet.addRow([d.section, d.field, d.oldVal, d.newVal, d.status.toUpperCase()]);
      let bg = COLORS.unchanged;
      if (d.status === 'changed') bg = COLORS.changed;
      if (d.status === 'added')   bg = COLORS.added;
      if (d.status === 'removed') bg = COLORS.removed;
      r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      r.getCell('oldVal').alignment = { wrapText: true, vertical: 'top' };
      r.getCell('newVal').alignment = { wrapText: true, vertical: 'top' };
      if (d.status === 'changed') {
        r.getCell('oldVal').font = { color: { argb: 'FF9A3412' }, strikethrough: true };
        r.getCell('newVal').font = { color: { argb: 'FF15803D' }, bold: true };
      }
    }
  }

  // ── Stream response ───────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const safeUrl = str(snapB.url || snapA.url).replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
  const filename = `SEO_Diff_${safeUrl}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as Buffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control':       'no-store',
    },
  });
}
