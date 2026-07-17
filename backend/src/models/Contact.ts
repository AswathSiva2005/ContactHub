import { Schema, model, type InferSchemaType } from 'mongoose';

const contactSchema = new Schema(
  {
    contactUuid: { type: String, required: true, trim: true, maxlength: 100, immutable: true },
    studentName: { type: String, required: true, trim: true, minlength: 1, maxlength: 150 },
    parentName: { type: String, required: true, trim: true, minlength: 1, maxlength: 150 },
    studentNumber: { type: String, required: true, trim: true, minlength: 3, maxlength: 30 },
    parentNumber: { type: String, required: true, trim: true, minlength: 3, maxlength: 30 },
    rollNumber: { type: String, required: true, trim: true, maxlength: 50 },
    batchId: { type: String, required: true, trim: true, maxlength: 100, immutable: true },
    createdDate: { type: Date, default: Date.now, immutable: true },
    phoneContactId: { type: String, default: null, trim: true, maxlength: 200 },
    studentPhoneContactId: { type: String, default: null, trim: true, maxlength: 200 },
    parentPhoneContactId: { type: String, default: null, trim: true, maxlength: 200 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  },
  { versionKey: false, collection: 'contacts' },
);

contactSchema.index({ userId: 1, contactUuid: 1 }, { unique: true });
contactSchema.index({ userId: 1, batchId: 1, createdDate: -1 });
contactSchema.index({ userId: 1, batchId: 1, rollNumber: 1 });
contactSchema.index({ userId: 1, studentNumber: 1 }, { unique: true });
contactSchema.index({ userId: 1, parentNumber: 1 }, { unique: true });

export type ContactDocument = InferSchemaType<typeof contactSchema>;
export const Contact = model('Contact', contactSchema);
