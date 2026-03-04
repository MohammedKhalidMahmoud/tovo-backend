import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

export function configureSwagger(app) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Load base info
  const info = YAML.load(path.resolve(__dirname, "./swagger.info.yaml"));

  // ===== LOAD SCHEMAS =====
  const authSchemas = YAML.load(path.resolve(__dirname, "./auth/schemas.yaml"));
  const usersSchemas = YAML.load(path.resolve(__dirname, "./users/schemas.yaml"));
  const captainsSchemas = YAML.load(path.resolve(__dirname, "./captains/schemas.yaml"));
  const tripsSchemas = YAML.load(path.resolve(__dirname, "./trips/schemas.yaml"));
  const ridesSchemas = YAML.load(path.resolve(__dirname, "./rides/schemas.yaml"));
  const servicesSchemas = YAML.load(path.resolve(__dirname, "./services/schemas.yaml"));
  const regionsSchemas = YAML.load(path.resolve(__dirname, "./regions/schemas.yaml"));
  const vehiclesSchemas = YAML.load(path.resolve(__dirname, "./vehicles/schemas.yaml"));
  const vehicleModelsSchemas = YAML.load(path.resolve(__dirname, "./vehicle-models/schemas.yaml"));
  const walletsSchemas = YAML.load(path.resolve(__dirname, "./wallets/schemas.yaml"));
  const paymentsSchemas = YAML.load(path.resolve(__dirname, "./payments/schemas.yaml"));
  const couponsSchemas = YAML.load(path.resolve(__dirname, "./coupons/schemas.yaml"));
  const notificationsSchemas = YAML.load(path.resolve(__dirname, "./notifications/schemas.yaml"));
  const complaintsSchemas = YAML.load(path.resolve(__dirname, "./complaints/schemas.yaml"));
  const supportSchemas = YAML.load(path.resolve(__dirname, "./support/schemas.yaml"));
  const faqsSchemas = YAML.load(path.resolve(__dirname, "./faqs/schemas.yaml"));
  const sosSchemas = YAML.load(path.resolve(__dirname, "./sos/schemas.yaml"));
  const dashboardSchemas = YAML.load(path.resolve(__dirname, "./dashboard/schemas.yaml"));
  const analyticsSchemas = YAML.load(path.resolve(__dirname, "./analytics/schemas.yaml"));
  
  const settingsSchemas = YAML.load(path.resolve(__dirname, "./settings/schemas.yaml"));

  // ===== LOAD PATHS =====
  const authPaths = YAML.load(path.resolve(__dirname, "./auth/paths.yaml"));
  const usersPaths = YAML.load(path.resolve(__dirname, "./users/paths.yaml"));
  const captainsPaths = YAML.load(path.resolve(__dirname, "./captains/paths.yaml"));
  const tripsPaths = YAML.load(path.resolve(__dirname, "./trips/paths.yaml"));
  const ridesPaths = YAML.load(path.resolve(__dirname, "./rides/paths.yaml"));
  const servicesPaths = YAML.load(path.resolve(__dirname, "./services/paths.yaml"));
  const regionsPaths = YAML.load(path.resolve(__dirname, "./regions/paths.yaml"));
  const vehiclesPaths = YAML.load(path.resolve(__dirname, "./vehicles/paths.yaml"));
  const vehicleModelsPaths = YAML.load(path.resolve(__dirname, "./vehicle-models/paths.yaml"));
  const walletsPaths = YAML.load(path.resolve(__dirname, "./wallets/paths.yaml"));
  const paymentsPaths = YAML.load(path.resolve(__dirname, "./payments/paths.yaml"));
  
  const couponsPaths = YAML.load(path.resolve(__dirname, "./coupons/paths.yaml"));
  const notificationsPaths = YAML.load(path.resolve(__dirname, "./notifications/paths.yaml"));
  const complaintsPaths = YAML.load(path.resolve(__dirname, "./complaints/paths.yaml"));
  const supportPaths = YAML.load(path.resolve(__dirname, "./support/paths.yaml"));
  const faqsPaths = YAML.load(path.resolve(__dirname, "./faqs/paths.yaml"));
  const sosPaths = YAML.load(path.resolve(__dirname, "./sos/paths.yaml"));
  const dashboardPaths = YAML.load(path.resolve(__dirname, "./dashboard/paths.yaml"));
  const analyticsPaths = YAML.load(path.resolve(__dirname, "./analytics/paths.yaml"));
  
  const settingsPaths = YAML.load(path.resolve(__dirname, "./settings/paths.yaml"));

  const swaggerDefinition = {
    ...info,
    components: {
      schemas: {
        ...authSchemas,
        ...usersSchemas,
        ...captainsSchemas,
        ...tripsSchemas,
        ...ridesSchemas,
        ...servicesSchemas,
        ...regionsSchemas,
        ...vehiclesSchemas,
        ...vehicleModelsSchemas,
        ...walletsSchemas,
        ...paymentsSchemas,
        
        ...couponsSchemas,
        ...notificationsSchemas,
        ...complaintsSchemas,
        ...supportSchemas,
        ...faqsSchemas,
        ...sosSchemas,
        ...dashboardSchemas,
        ...analyticsSchemas,
       
        ...settingsSchemas
      },
      securitySchemes: info.components?.securitySchemes
    },
    paths: {
      ...authPaths,
      ...usersPaths,
      ...captainsPaths,
      ...tripsPaths,
      ...ridesPaths,
      ...servicesPaths,
      ...regionsPaths,
      ...vehiclesPaths,
      ...vehicleModelsPaths,
      ...walletsPaths,
      ...paymentsPaths,
      
      ...couponsPaths,
      ...notificationsPaths,
      ...complaintsPaths,
      ...supportPaths,
      ...faqsPaths,
      ...sosPaths,
      ...dashboardPaths,
      ...analyticsPaths,
      
      ...settingsPaths
    }
  };

  const swaggerSpec = swaggerJSDoc({
    definition: swaggerDefinition,
    apis: []
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}