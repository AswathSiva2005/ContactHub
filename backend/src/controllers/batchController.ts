import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Batch } from '../models/Batch.js';
import { Contact } from '../models/Contact.js';
import { getPagination } from '../utils/request.js';
import { escapeRegExp } from '../utils/regex.js';

export async function createBatch(request: Request, response: Response): Promise<void> {
  const batch = await Batch.create({
    batchId: request.body.batchId,
    batchName: request.body.batchName,
    academicYear: request.body.academicYear,
    userDeviceId: request.body.userDeviceId,
    userId: response.locals.userId,
  });
  response.status(201).json({ success: true, data: batch });
}

export async function getBatches(request: Request, response: Response): Promise<void> {
  const { page, limit, skip } = getPagination(request);
  const filter: Record<string, unknown> = { userId: response.locals.userId };
  if (request.query.userDeviceId) filter.userDeviceId = String(request.query.userDeviceId);
  if (request.query.search) {
    const escaped = escapeRegExp(String(request.query.search).trim());
    if (escaped) filter.batchName = { $regex: escaped, $options: 'i' };
  }
  const sortOption = String(request.query.sort ?? 'newest');
  const sort: Record<string, 1 | -1> = sortOption === 'oldest'
    ? { createdDate: 1 }
    : sortOption === 'alphabetical'
      ? { batchName: 1, createdDate: -1 }
      : { createdDate: -1 };
  const [items, total] = await Promise.all([
    Batch.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Batch.countDocuments(filter),
  ]);
  response.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function getBatch(request: Request, response: Response): Promise<void> {
  const batch = await Batch.findOne({ batchId: request.params.batchId, userId: response.locals.userId }).lean();
  if (!batch) { response.status(404).json({ success: false, error: { message: 'Batch not found' } }); return; }
  response.json({ success: true, data: batch });
}

export async function updateBatch(request: Request, response: Response): Promise<void> {
  const batch = await Batch.findOneAndUpdate(
    { batchId: request.params.batchId, userId: response.locals.userId },
    { $set: { batchName: request.body.batchName } },
    { new: true, runValidators: true },
  );
  if (!batch) { response.status(404).json({ success: false, error: { message: 'Batch not found' } }); return; }
  response.json({ success: true, data: batch });
}

export async function deleteBatch(request: Request, response: Response): Promise<void> {
  const session = await mongoose.startSession();
  let deletedContacts = 0;
  let found = false;
  let phoneContacts: Array<{ contactUuid: string; studentNumber: string; parentNumber: string; phoneContactId?: string | null; studentPhoneContactId?: string | null; parentPhoneContactId?: string | null }> = [];
  try {
    await session.withTransaction(async () => {
      phoneContacts = await Contact.find(
        { batchId: request.params.batchId, userId: response.locals.userId },
        { contactUuid: 1, studentNumber: 1, parentNumber: 1, phoneContactId: 1, studentPhoneContactId: 1, parentPhoneContactId: 1 },
        { session },
      ).lean();
      const batch = await Batch.findOneAndDelete({ batchId: request.params.batchId, userId: response.locals.userId }, { session });
      if (!batch) return;
      found = true;
      const result = await Contact.deleteMany({ batchId: batch.batchId, userId: response.locals.userId }, { session });
      deletedContacts = result.deletedCount;
    });
  } finally {
    await session.endSession();
  }
  if (!found) { response.status(404).json({ success: false, error: { message: 'Batch not found' } }); return; }
  response.json({ success: true, data: { batchId: request.params.batchId, deletedContacts, phoneContacts } });
}

export async function deleteAllBatches(request: Request, response: Response): Promise<void> {
  const session = await mongoose.startSession();
  let deletedBatches = 0;
  let deletedContacts = 0;
  let phoneContacts: Array<{ contactUuid: string; studentNumber: string; parentNumber: string; phoneContactId?: string | null; studentPhoneContactId?: string | null; parentPhoneContactId?: string | null }> = [];
  try {
    await session.withTransaction(async () => {
      phoneContacts = await Contact.find(
        { userId: response.locals.userId },
        { contactUuid: 1, studentNumber: 1, parentNumber: 1, phoneContactId: 1, studentPhoneContactId: 1, parentPhoneContactId: 1 },
        { session },
      ).lean();
      const contactResult = await Contact.deleteMany({ userId: response.locals.userId }, { session });
      const batchResult = await Batch.deleteMany({ userId: response.locals.userId }, { session });
      deletedContacts = contactResult.deletedCount;
      deletedBatches = batchResult.deletedCount;
    });
  } finally {
    await session.endSession();
  }
  response.json({ success: true, data: { deletedBatches, deletedContacts, phoneContacts } });
}
