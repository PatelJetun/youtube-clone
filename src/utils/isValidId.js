import mongoose, { isValidObjectId } from "mongoose";

export default function isValidId(id) {
  return mongoose.isValidObjectId(id);
}
