import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";
import { Types } from "mongoose";

export enum EventStatus {
  Confirmed = "confirmed",
  Prep = "prep",
  DayOf = "day_of",
  Completed = "completed",
  Cancelled = "cancelled",
}

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: "tbl_events", timestamps: true } })
export class Event {
  @prop({ required: true })
  title!: string;

  @prop({ required: true })
  clientName!: string;

  @prop()
  clientEmail?: string;

  @prop()
  clientPhone?: string;

  @prop({ required: true })
  eventDate!: Date;

  @prop()
  endDate?: Date;

  @prop({ required: true })
  venue!: string;

  @prop({ default: 0 })
  headcount!: number;

  @prop({ default: 0 })
  budget!: number;

  @prop({ type: String, enum: EventStatus, default: EventStatus.Confirmed })
  status!: EventStatus;

  @prop()
  notes?: string;

  @prop({ type: () => [Types.ObjectId], default: [] })
  menuIds!: Types.ObjectId[];

  @prop({ type: () => [Types.ObjectId], default: [] })
  staffAssignmentIds!: Types.ObjectId[];

  @prop({ type: () => [Types.ObjectId], default: [] })
  vendorAssignmentIds!: Types.ObjectId[];

  @prop({ default: false })
  isDeleted!: boolean;

  // Timestamps from schemaOptions
  createdAt?: Date;
  updatedAt?: Date;
}

export const EventModel = getModelForClass(Event);
