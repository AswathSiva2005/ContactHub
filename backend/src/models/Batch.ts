import { Schema, model, type InferSchemaType } from 'mongoose';

const batchSchema = new Schema(
  {
    batchId: { type: String, required: true, trim: true, maxlength: 100, immutable: true },
    batchName: { type: String, required: true, trim: true, minlength: 1, maxlength: 150 },
    academicYear: { type: String, required: true, trim: true, match: /^\d{4}(?:-\d{2,4})?$/, maxlength: 9 },
    createdDate: { type: Date, default: Date.now, immutable: true },
    totalContacts: { type: Number, default: 0, min: 0 },
    userDeviceId: { type: String, required: true, trim: true, maxlength: 200, immutable: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  },
  { versionKey: false, collection: 'batches' },
);

batchSchema.index({ userId: 1, batchId: 1 }, { unique: true });
batchSchema.index({ userId: 1, userDeviceId: 1, createdDate: -1 });
batchSchema.index({ userId: 1, createdDate: -1 });
batchSchema.index({ userId: 1, batchName: 1, academicYear: 1 }, { unique: true });

export type BatchDocument = InferSchemaType<typeof batchSchema>;
export const Batch = model('Batch', batchSchema);
