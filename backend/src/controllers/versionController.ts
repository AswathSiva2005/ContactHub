import type { Request, Response } from 'express';
import { env } from '../config/env.js';

export function getVersion(_request: Request, response: Response): void {
  response.setHeader('Cache-Control', 'public, max-age=300');
  response.json({
    success: true,
    data: {
      latestVersion: env.appLatestVersion,
      minimumSupportedVersion: env.appMinimumVersion,
      apkDownloadUrl: env.appApkDownloadUrl,
      releaseNotes: env.appReleaseNotes,
    },
  });
}
