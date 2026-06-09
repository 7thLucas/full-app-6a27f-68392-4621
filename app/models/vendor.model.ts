import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";
import { Types } from "mongoose";

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: "tbl_vendors", timestamps: true } })
export class Vendor {
  @prop({ required: true })
  name!: string;

  @prop()
  company?: string;

  @prop({ required: true })
  category!: string;

  @prop()
  contactName?: string;

  @prop()
  email?: string;

  @prop()
  phone?: string;

  @prop()
  website?: string;

  @prop()
  notes?: string;

  @prop({ default: true })
  isActive!: boolean;

  @prop({ default: false })
  isDeleted!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const VendorModel = getModelForClass(Vendor);

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: "tbl_vendor_assignments", timestamps: true } })
export class VendorAssignment {
  @prop({ required: true, type: () => Types.ObjectId })
  eventId!: Types.ObjectId;

  @prop({ required: true, type: () => Types.ObjectId })
  vendorId!: Types.ObjectId;

  @prop()
  requiredRole?: string;

  @prop()
  leadTimeDays?: number;

  @prop()
  setupWindowStart?: Date;

  @prop()
  setupWindowEnd?: Date;

  @prop()
  onSiteStart?: Date;

  @prop()
  onSiteEnd?: Date;

  @prop()
  notes?: string;

  @prop({ default: false })
  isDeleted!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const VendorAssignmentModel = getModelForClass(VendorAssignment);
