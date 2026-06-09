import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";
import { Types } from "mongoose";

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: "tbl_staff", timestamps: true } })
export class StaffMember {
  @prop({ required: true })
  name!: string;

  @prop()
  email?: string;

  @prop()
  phone?: string;

  @prop({ required: true })
  role!: string;

  @prop({ type: () => [String], default: [] })
  skills!: string[];

  @prop()
  notes?: string;

  @prop({ default: true })
  isActive!: boolean;

  @prop({ default: false })
  isDeleted!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StaffMemberModel = getModelForClass(StaffMember);

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: "tbl_staff_assignments", timestamps: true } })
export class StaffAssignment {
  @prop({ required: true, type: () => Types.ObjectId })
  eventId!: Types.ObjectId;

  @prop({ required: true, type: () => Types.ObjectId })
  staffMemberId!: Types.ObjectId;

  @prop({ required: true })
  role!: string;

  @prop()
  startTime?: Date;

  @prop()
  endTime?: Date;

  @prop()
  notes?: string;

  @prop({ default: false })
  isDeleted!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StaffAssignmentModel = getModelForClass(StaffAssignment);
