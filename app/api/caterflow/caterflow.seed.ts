import { createLogger } from "~/lib/logger";
import { EventModel, EventStatus } from "~/models/event.model";
import { MenuModel } from "~/models/menu.model";
import { StaffMemberModel } from "~/models/staff.model";
import { VendorModel } from "~/models/vendor.model";

const logger = createLogger("CaterFlowSeed");

export async function seedCaterFlowData(): Promise<void> {
  try {
    const existingEvent = await EventModel.findOne({ isDeleted: false });
    if (existingEvent) {
      logger.info("CaterFlow data already seeded, skipping.");
      return;
    }

    logger.info("Seeding CaterFlow sample data...");

    // ── Staff Members ──────────────────────────────────────────────────────
    const staffMembers = await StaffMemberModel.insertMany([
      { name: "Maria Santos", email: "maria@caterflow.com", phone: "555-0101", role: "Head Chef", skills: ["French cuisine", "Pastry"], isActive: true },
      { name: "James Okafor", email: "james@caterflow.com", phone: "555-0102", role: "Sous Chef", skills: ["Mediterranean", "Grill"], isActive: true },
      { name: "Linda Park", email: "linda@caterflow.com", phone: "555-0103", role: "Catering Manager", skills: ["Event planning", "Client relations"], isActive: true },
      { name: "Carlos Rivera", email: "carlos@caterflow.com", phone: "555-0104", role: "Server", skills: ["Silver service", "Wine pairing"], isActive: true },
      { name: "Amara Osei", email: "amara@caterflow.com", phone: "555-0105", role: "Bartender", skills: ["Cocktails", "Bar management"], isActive: true },
      { name: "Tom Bradley", email: "tom@caterflow.com", phone: "555-0106", role: "Setup Crew", skills: ["Table setup", "AV"], isActive: true },
      { name: "Sophie Chen", email: "sophie@caterflow.com", phone: "555-0107", role: "Event Coordinator", skills: ["Logistics", "Vendor liaison"], isActive: true },
      { name: "David Kim", email: "david@caterflow.com", phone: "555-0108", role: "Server", skills: ["Buffet service", "Guest relations"], isActive: true },
    ]);

    // ── Vendors ────────────────────────────────────────────────────────────
    await VendorModel.insertMany([
      { name: "Bloom & Petal", company: "Bloom & Petal Floral Co.", category: "Florist", contactName: "Helen Marsh", email: "helen@bloomandpetal.com", phone: "555-0201", notes: "Preferred vendor for weddings. 2-week lead time.", isActive: true },
      { name: "Prestige Linen", company: "Prestige Linen Services", category: "Linen & Decor", contactName: "Marcus Webb", email: "marcus@prestigelinen.com", phone: "555-0202", notes: "Wide range of colors. Pickup included.", isActive: true },
      { name: "SoundPro AV", company: "SoundPro Audio Visual", category: "AV & Equipment", contactName: "Rachel Torres", email: "rachel@soundpro.com", phone: "555-0203", notes: "Full AV setup and live sound.", isActive: true },
      { name: "FreshDirect Supplies", company: "FreshDirect Catering Supplies", category: "Catering Supplies", contactName: "Greg Nguyen", email: "greg@freshdirect.com", phone: "555-0204", notes: "Next-day delivery available.", isActive: true },
      { name: "City Transport Co.", company: "City Transport Co.", category: "Transport", contactName: "Nina Patel", email: "nina@citytransport.com", phone: "555-0205", notes: "Fleet of refrigerated vans.", isActive: true },
      { name: "LensWork Studio", company: "LensWork Photography", category: "Photography", contactName: "Alex Yuen", email: "alex@lenswork.com", phone: "555-0206", notes: "Corporate events specialist.", isActive: true },
    ]);

    // ── Menus ──────────────────────────────────────────────────────────────
    const [gardenMenu, galaMenu, corporateMenu] = await MenuModel.insertMany([
      {
        name: "Garden Wedding Menu",
        description: "Elegant garden party menu with seasonal ingredients.",
        isReusable: true,
        dishes: [
          { name: "Smoked Salmon Blini", description: "House-smoked salmon on buckwheat blini with crème fraîche", allergens: ["Gluten", "Dairy", "Fish"], dietaryTags: [] },
          { name: "Caprese Skewers", description: "Buffalo mozzarella, cherry tomato, fresh basil with balsamic glaze", allergens: ["Dairy"], dietaryTags: ["Vegetarian"] },
          { name: "Herb-Crusted Chicken Supreme", description: "Pan-roasted chicken with herbed crust, roasted vegetables", allergens: ["Gluten"], dietaryTags: [], portionCost: 18 },
          { name: "Pan-Seared Salmon", description: "Atlantic salmon with lemon butter and asparagus", allergens: ["Fish", "Dairy"], dietaryTags: [], portionCost: 22 },
          { name: "Wild Mushroom Risotto", description: "Arborio rice with truffle oil and parmesan", allergens: ["Dairy"], dietaryTags: ["Vegetarian"] },
          { name: "Chocolate Fondant", description: "Warm chocolate fondant with vanilla bean ice cream", allergens: ["Gluten", "Dairy", "Eggs"], dietaryTags: [], portionCost: 8 },
        ],
      },
      {
        name: "Black Tie Gala Menu",
        description: "Five-course formal dinner menu for premium galas.",
        isReusable: true,
        dishes: [
          { name: "Lobster Bisque", description: "Silky lobster bisque with cream and cognac", allergens: ["Shellfish", "Dairy"], dietaryTags: [], portionCost: 14 },
          { name: "Beef Tenderloin", description: "8oz centre-cut beef tenderloin with red wine jus", allergens: [], dietaryTags: [], portionCost: 38 },
          { name: "Vegetarian Wellington", description: "Portobello and spinach wellington with truffle sauce", allergens: ["Gluten", "Dairy"], dietaryTags: ["Vegetarian"], portionCost: 24 },
          { name: "Crème Brûlée", description: "Classic vanilla crème brûlée with fresh berries", allergens: ["Dairy", "Eggs"], dietaryTags: ["Gluten-Free"], portionCost: 9 },
        ],
      },
      {
        name: "Corporate Lunch Buffet",
        description: "Casual corporate lunch spread, easy to scale.",
        isReusable: true,
        dishes: [
          { name: "Assorted Wraps", description: "Chicken Caesar, Falafel & Hummus, and Club wraps", allergens: ["Gluten"], dietaryTags: [], portionCost: 7 },
          { name: "Caesar Salad", description: "Romaine, parmesan, croutons, house-made Caesar dressing", allergens: ["Gluten", "Dairy", "Eggs"], dietaryTags: [], portionCost: 5 },
          { name: "Pasta Primavera", description: "Penne with seasonal vegetables and marinara sauce", allergens: ["Gluten"], dietaryTags: ["Vegan"], portionCost: 6 },
          { name: "Assorted Mini Desserts", description: "Macarons, brownie bites, fruit tarts", allergens: ["Gluten", "Dairy", "Eggs"], dietaryTags: [], portionCost: 4 },
        ],
      },
    ]);

    // ── Events ────────────────────────────────────────────────────────────
    const now = new Date();
    const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

    await EventModel.insertMany([
      {
        title: "Chen-Williams Wedding Reception",
        clientName: "Michael Chen",
        clientEmail: "mchen@example.com",
        clientPhone: "555-1001",
        eventDate: addDays(now, 12),
        venue: "The Grand Pavilion, Central Park",
        headcount: 180,
        budget: 28000,
        status: EventStatus.Confirmed,
        notes: "Outdoor ceremony followed by indoor reception. Client requests gluten-free options for approx. 20 guests.",
        menuIds: [gardenMenu._id],
      },
      {
        title: "TechVision Annual Gala 2026",
        clientName: "Sarah Brennan",
        clientEmail: "s.brennan@techvision.com",
        clientPhone: "555-2001",
        eventDate: addDays(now, 5),
        venue: "Metropolitan Ballroom, Downtown",
        headcount: 350,
        budget: 75000,
        status: EventStatus.Prep,
        notes: "Formal black-tie event. Client requires branded centerpieces and a cocktail hour before dinner service.",
        menuIds: [galaMenu._id],
      },
      {
        title: "Meridian Partners Q3 Lunch",
        clientName: "David Liu",
        clientEmail: "dliu@meridianpartners.com",
        clientPhone: "555-3001",
        eventDate: addDays(now, 2),
        venue: "Meridian HQ Boardroom",
        headcount: 45,
        budget: 3200,
        status: EventStatus.DayOf,
        notes: "Buffet style in the executive boardroom. 3 vegetarian and 2 nut-allergy attendees confirmed.",
        menuIds: [corporateMenu._id],
      },
      {
        title: "Garcia Family Reunion",
        clientName: "Rosa Garcia",
        clientEmail: "rosa.garcia@email.com",
        clientPhone: "555-4001",
        eventDate: addDays(now, 25),
        venue: "Riverside Community Hall",
        headcount: 90,
        budget: 9500,
        status: EventStatus.Confirmed,
        notes: "Family gathering with children. Kid-friendly options needed. Halal menu requested.",
        menuIds: [],
      },
      {
        title: "Summit Financial Awards Dinner",
        clientName: "Peter Holt",
        clientEmail: "pholt@summitfinancial.com",
        clientPhone: "555-5001",
        eventDate: addDays(now, -14),
        venue: "The Rooftop Terrace, Exchange Tower",
        headcount: 120,
        budget: 22000,
        status: EventStatus.Completed,
        notes: "Event completed successfully. Client requested follow-up proposal for Q4 event.",
        menuIds: [galaMenu._id],
      },
    ]);

    logger.info("CaterFlow sample data seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed CaterFlow data:", error);
  }
}
