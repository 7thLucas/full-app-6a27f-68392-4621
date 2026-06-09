// Explicitly register CaterFlow models (outside app/modules/, need manual registration)
import "~/models/event.model";
import "~/models/menu.model";
import "~/models/staff.model";
import "~/models/vendor.model";

// Import global routes and seeder
import routes from "./routes";
import { initializeModels } from "./models";
import { seedCaterFlowData } from "./caterflow/caterflow.seed";

// Initialize all module models
await initializeModels();

// Seed CaterFlow domain data (after models are registered)
await seedCaterFlowData();

export default routes;
