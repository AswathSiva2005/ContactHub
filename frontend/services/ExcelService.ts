import type { DocumentPickerAsset } from 'expo-document-picker';
import * as XLSX from 'xlsx';
import type { ExcelImportResult, ImportedContactRow, RejectedContactRow } from '@/types/excel';

type RawRow = Record<string, unknown>;
type FieldName = Exclude<keyof ImportedContactRow, 'rowNumber'>;

const MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'text/comma-separated-values',
  'application/csv',
  'application/octet-stream',
] as const;

const EXTENSIONS = ['.xlsx', '.csv'];
const REQUIRED_FIELDS: FieldName[] = ['studentName', 'parentName', 'studentNumber', 'parentNumber', 'rollNumber'];
const HEADER_ALIASES: Record<FieldName, string[]> = {
  studentName: ['studentname', 'student', 'studentfullname', 'nameofstudent'],
  parentName: ['parentname', 'parent', 'guardianname', 'fathername', 'mothername', 'nameofparent'],
  studentNumber: ['studentnumber', 'studentphone', 'studentmobile', 'studentmobilenumber', 'studentcontact'],
  parentNumber: ['parentnumber', 'parentphone', 'parentmobile', 'parentmobilenumber', 'guardianphone', 'guardianmobile'],
  rollNumber: ['rollnumber', 'rollno', 'roll', 'studentrollnumber', 'admissionnumber'],
};

export class ExcelImportError extends Error {}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function cleanText(value: unknown): string {
  return value == null ? '' : String(value).trim().replace(/\s+/g, ' ');
}

export function normalizePhone(value: unknown): string {
  const text = cleanText(value);
  const hasPlus = text.startsWith('+');
  const digits = text.replace(/\D/g, '');
  return `${hasPlus ? '+' : ''}${digits}`;
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

function phoneKey(phone: string): string {
  return phone.replace(/\D/g, '');
}

function buildColumnMap(headers: string[]): Record<FieldName, string> {
  const normalizedHeaders = new Map(headers.map((header) => [normalizeHeader(header), header]));
  const entries = REQUIRED_FIELDS.map((field) => {
    const source = HEADER_ALIASES[field].map((alias) => normalizedHeaders.get(alias)).find(Boolean);
    return [field, source] as const;
  });
  const missing = entries.filter(([, source]) => !source).map(([field]) => field);
  if (missing.length > 0) {
    throw new ExcelImportError(`Missing required columns: ${missing.join(', ')}.`);
  }
  return Object.fromEntries(entries) as Record<FieldName, string>;
}

function toContactRow(raw: RawRow, rowNumber: number, columns: Record<FieldName, string>): ImportedContactRow {
  return {
    rowNumber,
    studentName: cleanText(raw[columns.studentName]),
    parentName: cleanText(raw[columns.parentName]),
    studentNumber: normalizePhone(raw[columns.studentNumber]),
    parentNumber: normalizePhone(raw[columns.parentNumber]),
    rollNumber: cleanText(raw[columns.rollNumber]),
  };
}

function validateRow(row: ImportedContactRow): string[] {
  const reasons: string[] = [];
  if (!row.studentName) reasons.push('Student name is required');
  if (!row.parentName) reasons.push('Parent name is required');
  if (!row.rollNumber) reasons.push('Roll number is required');
  if (!isValidPhone(row.studentNumber)) reasons.push('Student number must contain 7–15 digits');
  if (!isValidPhone(row.parentNumber)) reasons.push('Parent number must contain 7–15 digits');
  return reasons;
}

export function parseWorkbook(workbook: XLSX.WorkBook, fileName: string): ExcelImportResult {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new ExcelImportError('The selected file does not contain a worksheet.');
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) throw new ExcelImportError('The first worksheet could not be read.');

  const rawRows = XLSX.utils.sheet_to_json<RawRow>(worksheet, { defval: '', raw: false });
  if (rawRows.length === 0) throw new ExcelImportError('The worksheet does not contain any data rows.');
  const columns = buildColumnMap(Object.keys(rawRows[0] ?? {}));
  const parsed = rawRows.map((raw, index) => toContactRow(raw, index + 2, columns));
  const invalidRows: RejectedContactRow[] = [];
  const structurallyValid: ImportedContactRow[] = [];

  for (const row of parsed) {
    const reasons = validateRow(row);
    if (reasons.length > 0) invalidRows.push({ ...row, reasons });
    else structurallyValid.push(row);
  }

  const phoneFrequency = new Map<string, number>();
  for (const row of structurallyValid) {
    for (const phone of [row.studentNumber, row.parentNumber]) {
      const key = phoneKey(phone);
      phoneFrequency.set(key, (phoneFrequency.get(key) ?? 0) + 1);
    }
  }

  const validRows: ImportedContactRow[] = [];
  const duplicateRows: RejectedContactRow[] = [];
  for (const row of structurallyValid) {
    const duplicatePhones = [...new Set([row.studentNumber, row.parentNumber])]
      .filter((phone) => (phoneFrequency.get(phoneKey(phone)) ?? 0) > 1);
    if (duplicatePhones.length > 0) {
      duplicateRows.push({ ...row, reasons: [`Duplicate phone number: ${duplicatePhones.join(', ')}`] });
    } else validRows.push(row);
  }

  return { fileName, sheetName, totalRows: parsed.length, validRows, duplicateRows, invalidRows };
}

async function readAsset(asset: DocumentPickerAsset): Promise<ArrayBuffer> {
  const response = await fetch(asset.uri);
  if (!response.ok) throw new ExcelImportError('The selected file could not be opened.');
  return response.arrayBuffer();
}

export const ExcelService = {
  async pickAndParse(): Promise<ExcelImportResult | null> {
    const DocumentPicker = await import('expo-document-picker');
    const selection = await DocumentPicker.getDocumentAsync({ type: [...MIME_TYPES], copyToCacheDirectory: true, multiple: false });
    if (selection.canceled) return null;
    const asset = selection.assets[0];
    if (!asset) throw new ExcelImportError('No file was selected.');
    const extension = asset.name.slice(asset.name.lastIndexOf('.')).toLowerCase();
    if (!EXTENSIONS.includes(extension)) throw new ExcelImportError('Choose a .xlsx or .csv file.');
    const buffer = await readAsset(asset);
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
    return parseWorkbook(workbook, asset.name);
  },
};
