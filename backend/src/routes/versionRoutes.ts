import { Router } from 'express';
import { getVersion } from '../controllers/versionController.js';

export const versionRouter = Router();
versionRouter.get('/', getVersion);
