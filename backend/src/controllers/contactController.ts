import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Batch } from '../models/Batch.js';
import { Contact } from '../models/Contact.js';
import { getPagination } from '../utils/request.js';
import { escapeRegExp } from '../utils/regex.js';

export async function createContact(request: Request, response: Response): Promise<void> {
  const session = await mongoose.startSession();
  let contact;
  let duplicatePhone = false;
  try {
    await session.withTransaction(async () => {
      const phoneNumbers = [request.body.studentNumber, request.body.parentNumber].filter(Boolean);
      const existing = await Contact.exists({
        userId: response.locals.userId,
        $or: [
          { studentNumber: { $in: phoneNumbers } },
          { parentNumber: { $in: phoneNumbers } },
        ],
      }).session(session);
      if (existing) { duplicatePhone = true; return; }
      const batch = await Batch.findOneAndUpdate(
        { batchId: request.body.batchId, userId: response.locals.userId },
        { $inc: { totalContacts: 1 } },
        { new: true, session },
      );
      if (!batch) return;
      [contact] = await Contact.create([{
        contactUuid: request.body.contactUuid,
        studentName: request.body.studentName,
        parentName: request.body.parentName,
        studentNumber: request.body.studentNumber,
        parentNumber: request.body.parentNumber,
        rollNumber: request.body.rollNumber,
        batchId: request.body.batchId,
        phoneContactId: request.body.phoneContactId ?? null,
        studentPhoneContactId: request.body.studentPhoneContactId ?? request.body.phoneContactId ?? null,
        parentPhoneContactId: request.body.parentPhoneContactId ?? null,
        userId: response.locals.userId,
      }], { session });
    });
  } finally {
    await session.endSession();
  }
  if (duplicatePhone) { response.status(409).json({ success: false, error: { message: 'A contact with this phone number already exists' } }); return; }
  if (!contact) { response.status(404).json({ success: false, error: { message: 'Batch not found' } }); return; }
  response.status(201).json({ success: true, data: contact });
}

export async function getContacts(request: Request, response: Response): Promise<void> {
  const { page, limit, skip } = getPagination(request);
  const filter: Record<string, unknown> = { userId: response.locals.userId };
  if (request.query.batchId) filter.batchId = String(request.query.batchId);
  const search = request.query.search ? escapeRegExp(String(request.query.search).trim()) : '';
  if (search) {
    filter.$or = [
      { studentName: { $regex: search, $options: 'i' } },
      { parentName: { $regex: search, $options: 'i' } },
      { rollNumber: { $regex: search, $options: 'i' } },
      { studentNumber: { $regex: search, $options: 'i' } },
      { parentNumber: { $regex: search, $options: 'i' } },
    ];
  }
  const sort = String(request.query.sort ?? 'rollAsc') === 'rollDesc'
    ? { rollNumber: -1 as const, studentName: 1 as const }
    : { rollNumber: 1 as const, studentName: 1 as const };
  const [items, total] = await Promise.all([
    Contact.find(filter).sort(sort).collation({ locale: 'en', numericOrdering: true }).skip(skip).limit(limit).lean(),
    Contact.countDocuments(filter),
  ]);
  response.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function getContact(request: Request, response: Response): Promise<void> {
  const contact = await Contact.findOne({ contactUuid: request.params.contactUuid, userId: response.locals.userId }).lean();
  if (!contact) { response.status(404).json({ success: false, error: { message: 'Contact not found' } }); return; }
  response.json({ success: true, data: contact });
}

export async function updateContact(request: Request, response: Response): Promise<void> {
  const current = await Contact.findOne({ contactUuid: request.params.contactUuid, userId: response.locals.userId });
  if (!current) { response.status(404).json({ success: false, error: { message: 'Contact not found' } }); return; }
  const studentNumber = request.body.studentNumber ?? current.studentNumber;
  const parentNumber = request.body.parentNumber ?? current.parentNumber;
  const duplicate = await Contact.exists({
    userId: response.locals.userId,
    contactUuid: { $ne: current.contactUuid },
    $or: [
      { studentNumber: { $in: [studentNumber, parentNumber] } },
      { parentNumber: { $in: [studentNumber, parentNumber] } },
    ],
  });
  if (duplicate) { response.status(409).json({ success: false, error: { message: 'A contact with this phone number already exists' } }); return; }
  const contact = await Contact.findOneAndUpdate(
    { contactUuid: current.contactUuid, userId: response.locals.userId },
    { $set: {
      studentName: request.body.studentName,
      parentName: request.body.parentName,
      studentNumber: request.body.studentNumber,
      parentNumber: request.body.parentNumber,
      rollNumber: request.body.rollNumber,
    } },
    { new: true, runValidators: true },
  );
  response.json({ success: true, data: contact });
}

export async function deleteContact(request: Request, response: Response): Promise<void> {
  const session = await mongoose.startSession();
  let deleted = false;
  let studentPhoneContactId: string | null = null;
  let parentPhoneContactId: string | null = null;
  let deletedContactStudentNumber = '';
  let deletedContactParentNumber = '';
  try {
    await session.withTransaction(async () => {
      const contact = await Contact.findOneAndDelete({ contactUuid: request.params.contactUuid, userId: response.locals.userId }, { session });
      if (!contact) return;
      studentPhoneContactId = contact.studentPhoneContactId ?? contact.phoneContactId ?? null;
      parentPhoneContactId = contact.parentPhoneContactId ?? null;
      deletedContactStudentNumber = contact.studentNumber;
      deletedContactParentNumber = contact.parentNumber;
      deleted = true;
      await Batch.updateOne({ batchId: contact.batchId, userId: response.locals.userId }, { $inc: { totalContacts: -1 } }, { session });
    });
  } finally {
    await session.endSession();
  }
  if (!deleted) { response.status(404).json({ success: false, error: { message: 'Contact not found' } }); return; }
  response.json({ success: true, data: {
    contactUuid: request.params.contactUuid,
    studentNumber: deletedContactStudentNumber,
    parentNumber: deletedContactParentNumber,
    studentPhoneContactId,
    parentPhoneContactId,
  } });
}

export async function deleteSelectedContacts(request: Request, response: Response): Promise<void> {
  const contactUuids = [...new Set(
    (Array.isArray(request.body.contactUuids) ? request.body.contactUuids : [])
      .filter((value: unknown): value is string => typeof value === 'string' && Boolean(value.trim()))
      .map((value: string) => value.trim()),
  )];
  if (!contactUuids.length || contactUuids.length > 200) {
    response.status(400).json({ success: false, error: { message: 'Choose between 1 and 200 contacts to delete' } });
    return;
  }

  const session = await mongoose.startSession();
  let phoneContacts: Array<{
    contactUuid: string;
    studentNumber: string;
    parentNumber: string;
    phoneContactId?: string | null;
    studentPhoneContactId?: string | null;
    parentPhoneContactId?: string | null;
  }> = [];
  try {
    await session.withTransaction(async () => {
      phoneContacts = await Contact.find(
        { contactUuid: { $in: contactUuids }, userId: response.locals.userId },
        { contactUuid: 1, batchId: 1, studentNumber: 1, parentNumber: 1, phoneContactId: 1, studentPhoneContactId: 1, parentPhoneContactId: 1 },
        { session },
      ).lean();
      if (!phoneContacts.length) return;
      const batchCounts = new Map<string, number>();
      for (const contact of await Contact.find({ contactUuid: { $in: contactUuids }, userId: response.locals.userId }, { batchId: 1 }, { session }).lean()) {
        batchCounts.set(contact.batchId, (batchCounts.get(contact.batchId) ?? 0) + 1);
      }
      await Contact.deleteMany({ contactUuid: { $in: contactUuids }, userId: response.locals.userId }, { session });
      if (batchCounts.size) {
        await Batch.bulkWrite([...batchCounts].map(([batchId, count]) => ({
          updateOne: { filter: { batchId, userId: response.locals.userId }, update: { $inc: { totalContacts: -count } } },
        })), { session });
      }
    });
  } finally {
    await session.endSession();
  }
  response.json({ success: true, data: { deletedContacts: phoneContacts.length, phoneContacts } });
}
