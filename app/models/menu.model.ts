import { prop, getModelForClass, modelOptions, Severity } from "@typegoose/typegoose";

export class Dish {
  @prop({ required: true })
  name!: string;

  @prop()
  description?: string;

  @prop({ type: () => [String], default: [] })
  allergens!: string[];

  @prop({ type: () => [String], default: [] })
  dietaryTags!: string[];

  @prop({ default: 0 })
  portionCost!: number;
}

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { collection: "tbl_menus", timestamps: true } })
export class Menu {
  @prop({ required: true })
  name!: string;

  @prop()
  description?: string;

  @prop({ type: () => [Dish], default: [] })
  dishes!: Dish[];

  @prop({ default: true })
  isReusable!: boolean;

  @prop({ default: false })
  isDeleted!: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const MenuModel = getModelForClass(Menu);
