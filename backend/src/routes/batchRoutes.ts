import { Router } from 'express';
import { createBatch, deleteAllBatches, deleteBatch, getBatch, getBatches, updateBatch } from '../controllers/batchController.js';

export const batchRouter = Router();
batchRouter.post('/', createBatch);
batchRouter.get('/', getBatches);
batchRouter.delete('/', deleteAllBatches);
batchRouter.get('/:batchId', getBatch);
batchRouter.patch('/:batchId', updateBatch);
batchRouter.delete('/:batchId', deleteBatch);
