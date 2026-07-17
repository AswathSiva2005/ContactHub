import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    nameKey: { type: String, required: true, trim: true, maxlength: 100, select: false },
    phoneNumber: { type: String, required: true, unique: true, trim: true, minlength: 7, maxlength: 20 },
  },
  { timestamps: true, versionKey: false, collection: 'users' },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
