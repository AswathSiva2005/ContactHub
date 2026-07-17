export type ContactPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface StoredContactPermission {
  status: ContactPermissionStatus;
  canAskAgain: boolean;
  checkedAt: string;
}
