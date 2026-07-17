import type { NamingFormat, NamingPreference } from '@/types/naming';

export const DEFAULT_NAMING_PREFERENCE: NamingPreference = {
  format: 'studentName',
  customPrefix: '',
};

export const NAMING_FORMATS: readonly NamingFormat[] = [
  'studentName',
  'rollNumberName',
  'nameStudent',
  'rollNumberDashName',
  'customPrefix',
];

export function isNamingFormat(value: unknown): value is NamingFormat {
  return typeof value === 'string' && NAMING_FORMATS.includes(value as NamingFormat);
}

interface ContactNameInput {
  studentName: string;
  rollNumber: string;
}

export function formatContactName(input: ContactNameInput, preference: NamingPreference): string {
  const name = input.studentName.trim();
  const rollNumber = input.rollNumber.trim();
  switch (preference.format) {
    case 'rollNumberName':
      return [rollNumber, name].filter(Boolean).join(' ');
    case 'nameStudent':
      return `${name} (Student)`.trim();
    case 'rollNumberDashName':
      return rollNumber ? `${rollNumber} - ${name}`.trim() : name;
    case 'customPrefix': {
      const prefix = preference.customPrefix.trim();
      return [prefix, name].filter(Boolean).join(' ');
    }
    case 'studentName':
    default:
      return name;
  }
}
