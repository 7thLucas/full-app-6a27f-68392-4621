/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TEventStatusLabels = {
  confirmed: string;
  prep: string;
  dayOf: string;
  completed: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  tagline: string;
  logoUrl: string;
  brandColor: TBrandColor;
  eventStatusLabels: TEventStatusLabels;
  vendorCategories: string[];
  staffRoles: string[];
  dietaryOptions: string[];
  currency: string;
  showWelcomeBanner: boolean;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "CaterFlow",
  tagline: "Every event. Every detail. Under control.",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "#1B5E47",
    secondary: "#FAF7F0",
    accent: "#C9932A",
  },
  eventStatusLabels: {
    confirmed: "Confirmed",
    prep: "Prep",
    dayOf: "Day-of",
    completed: "Completed",
  },
  vendorCategories: [
    "Florist",
    "Linen & Decor",
    "AV & Equipment",
    "Catering Supplies",
    "Transport",
    "Photography",
    "Entertainment",
    "Other",
  ],
  staffRoles: [
    "Head Chef",
    "Sous Chef",
    "Catering Manager",
    "Event Coordinator",
    "Server",
    "Bartender",
    "Setup Crew",
    "Driver",
  ],
  dietaryOptions: [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Nut Allergy",
    "Halal",
    "Kosher",
    "None",
  ],
  currency: "$",
  showWelcomeBanner: true,
};
