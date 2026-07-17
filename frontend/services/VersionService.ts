import * as Application from 'expo-application';
import { Linking } from 'react-native';
import { api } from '@/services/api';

export interface VersionInfo {
  latestVersion: string;
  minimumSupportedVersion: string;
  apkDownloadUrl: string;
  releaseNotes: string;
}

export interface UpdateState extends VersionInfo {
  currentVersion: string;
  required: boolean;
}

function compareVersions(left: string, right: string): number {
  const a = left.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const b = right.split('.').map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export const VersionService = {
  currentVersion(): string {
    return Application.nativeApplicationVersion ?? '1.0.0';
  },

  async check(): Promise<UpdateState | null> {
    const response = await api.get<{ success: true; data: VersionInfo }>('/version');
    const currentVersion = this.currentVersion();
    if (compareVersions(currentVersion, response.data.data.latestVersion) >= 0) return null;
    return {
      ...response.data.data,
      currentVersion,
      required: compareVersions(currentVersion, response.data.data.minimumSupportedVersion) < 0,
    };
  },

  async openDownload(update: VersionInfo): Promise<void> {
    if (!update.apkDownloadUrl.startsWith('https://')) throw new Error('The update URL is not secure.');
    await Linking.openURL(update.apkDownloadUrl);
  },
};
