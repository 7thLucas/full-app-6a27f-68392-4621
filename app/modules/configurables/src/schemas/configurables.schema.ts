/* START: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */
export interface FieldSchemaType {
  fieldName?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "color"
    | "url"
    | "enum"
    | "datetime"
    | "file"
    | "files";
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  fields?: FieldSchemaType[];
  item?: FieldSchemaType;
}
/* END: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */

export type ConfigurableSchemas = {
  formSchema: FieldSchemaType[];
};



export const configurableSchemas: ConfigurableSchemas = {
  formSchema: [
    {
      fieldName: "appName",
      type: "string",
      required: true,
      label: "App Name",
    },
    {
      fieldName: "tagline",
      type: "string",
      required: false,
      label: "Tagline",
    },
    {
      fieldName: "logoUrl",
      type: "url",
      required: true,
      label: "Logo URL",
    },
    {
      fieldName: "brandColor",
      type: "object",
      required: true,
      label: "Brand Color",
      fields: [
        {
          fieldName: "primary",
          type: "color",
          required: true,
          label: "Primary (Emerald)",
        },
        {
          fieldName: "secondary",
          type: "color",
          required: true,
          label: "Secondary (Cream)",
        },
        {
          fieldName: "accent",
          type: "color",
          required: true,
          label: "Accent (Gold)",
        },
      ],
    },
    {
      fieldName: "eventStatusLabels",
      type: "object",
      required: false,
      label: "Event Status Labels",
      fields: [
        { fieldName: "confirmed", type: "string", required: false, label: "Confirmed Label" },
        { fieldName: "prep", type: "string", required: false, label: "Prep Label" },
        { fieldName: "dayOf", type: "string", required: false, label: "Day-of Label" },
        { fieldName: "completed", type: "string", required: false, label: "Completed Label" },
      ],
    },
    {
      fieldName: "vendorCategories",
      type: "array",
      required: false,
      label: "Vendor Categories",
      item: { type: "string", required: true },
    },
    {
      fieldName: "staffRoles",
      type: "array",
      required: false,
      label: "Default Staff Roles",
      item: { type: "string", required: true },
    },
    {
      fieldName: "dietaryOptions",
      type: "array",
      required: false,
      label: "Dietary Options",
      item: { type: "string", required: true },
    },
    {
      fieldName: "currency",
      type: "string",
      required: false,
      label: "Currency Symbol",
    },
    {
      fieldName: "showWelcomeBanner",
      type: "boolean",
      required: false,
      label: "Show Welcome Banner on Dashboard",
    },
  ],
};
