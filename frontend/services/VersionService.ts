import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';
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

  async downloadAndInstall(update: VersionInfo, onProgress: (progress: number) => void): Promise<void> {
    if (!update.apkDownloadUrl.startsWith('https://')) throw new Error('The update URL is not secure.');
    if (Platform.OS !== 'android') {
      await Linking.openURL(update.apkDownloadUrl);
      return;
    }
    const destination = `${FileSystem.cacheDirectory}contactsync-${update.latestVersion}.apk`;
    const download = FileSystem.createDownloadResumable(
      update.apkDownloadUrl,
      destination,
      {},
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (totalBytesExpectedToWrite > 0) onProgress(totalBytesWritten / totalBytesExpectedToWrite);
      },
    );
    const result = await download.downloadAsync();
    if (!result?.uri) throw new Error('The APK download did not complete.');
    const contentUri = await FileSystem.getContentUriAsync(result.uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1,
      type: 'application/vnd.android.package-archive',
    });
  },
};
