export type NamingFormat =
  | 'studentName'
  | 'rollNumberName'
  | 'nameStudent'
  | 'rollNumberDashName'
  | 'customPrefix';

export interface NamingPreference {
  format: NamingFormat;
  customPrefix: string;
}

export interface NamingFormatOption {
  value: NamingFormat;
  label: string;
  description: string;
}
