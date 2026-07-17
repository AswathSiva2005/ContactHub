export interface ImportedContactRow {
  rowNumber: number;
  studentName: string;
  parentName: string;
  studentNumber: string;
  parentNumber: string;
  rollNumber: string;
}

export interface RejectedContactRow extends ImportedContactRow {
  reasons: string[];
}

export interface ExcelImportResult {
  fileName: string;
  sheetName: string;
  totalRows: number;
  validRows: ImportedContactRow[];
  duplicateRows: RejectedContactRow[];
  invalidRows: RejectedContactRow[];
}

export interface ImportStats {
  total: number;
  valid: number;
  duplicate: number;
  invalid: number;
}
