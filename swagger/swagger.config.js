import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";

const ADMIN_PATH_SEGMENT = "/admin/";
const ADMIN_ONLY_PATHS = new Set([
  "/notifications/send-to-user",
  "/notifications/send-to-driver",
  "/notifications/send-to-audience",
]);

function buildSwaggerSpec(info, schemas, paths) {
  const swaggerDefinition = {
    ...info,
    components: {
      schemas,
      securitySchemes: info.components?.securitySchemes,
    },
    paths,
  };

  return swaggerJSDoc({
    definition: swaggerDefinition,
    apis: [],
  });
}

function filterPaths(paths, predicate) {
  return Object.fromEntries(
    Object.entries(paths).filter(([routePath]) => predicate(routePath))
  );
}

function isAdminPath(routePath) {
  return routePath.includes(ADMIN_PATH_SEGMENT) || ADMIN_ONLY_PATHS.has(routePath);
}

export function configureSwagger(app) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Load base info
  const info = YAML.load(path.resolve(__dirname, "./swagger.info.yaml"));

  // Put the correct server first based on environment so Swagger UI defaults to it
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && info.servers?.length > 1) {
    // Move production server (index 1) to the front
    info.servers = [info.servers[1], info.servers[0]];
  }

  // ===== LOAD SCHEMAS =====
  const authSchemas = YAML.load(path.resolve(__dirname, "./app/auth/schemas.yaml"));
  const usersSchemas = YAML.load(path.resolve(__dirname, "./app/users/schemas.yaml"));
  const driversSchemas = YAML.load(path.resolve(__dirname, "./app/drivers/schemas.yaml"));
  const tripsSchemas = YAML.load(path.resolve(__dirname, "./app/trips/schemas.yaml"));
  const servicesSchemas = YAML.load(path.resolve(__dirname, "./app/services/schemas.yaml"));
  const regionsSchemas = YAML.load(path.resolve(__dirname, "./app/regions/schemas.yaml"));
  // const tollGatesSchemas = YAML.load(path.resolve(__dirname, "./app/toll-gates/schemas.yaml"));
  const vehiclesSchemas = YAML.load(path.resolve(__dirname, "./app/vehicles/schemas.yaml"));
  const vehicleModelsSchemas = YAML.load(path.resolve(__dirname, "./app/vehicle-models/schemas.yaml"));
  const walletsSchemas = YAML.load(path.resolve(__dirname, "./app/wallets/schemas.yaml"));
  const paymentsSchemas = YAML.load(path.resolve(__dirname, "./app/payments/schemas.yaml"));
  const couponsSchemas = YAML.load(path.resolve(__dirname, "./app/coupons/schemas.yaml"));
  const notificationsSchemas = YAML.load(path.resolve(__dirname, "./app/notifications/schemas.yaml"));
  const supportSchemas = YAML.load(path.resolve(__dirname, "./app/support/schemas.yaml"));
  const faqsSchemas = YAML.load(path.resolve(__dirname, "./app/faqs/schemas.yaml"));
  const instructionsSchemas = YAML.load(path.resolve(__dirname, "./app/instructions/schemas.yaml"));
  // const analyticsSchemas = YAML.load(path.resolve(__dirname, "./app/analytics/schemas.yaml"));

  const settingsSchemas = YAML.load(path.resolve(__dirname, "./app/settings/schemas.yaml"));
  // const commissionRulesSchemas = YAML.load(path.resolve(__dirname, "./app/commission-rules/schemas.yaml"));
  // const earningsSchemas        = YAML.load(path.resolve(__dirname, "./app/earnings/schemas.yaml"));

  // ===== LOAD PATHS =====
  const authPaths = YAML.load(path.resolve(__dirname, "./app/auth/paths.yaml"));
  const usersPaths = YAML.load(path.resolve(__dirname, "./app/users/paths.yaml"));
  const driversPaths = YAML.load(path.resolve(__dirname, "./app/drivers/paths.yaml"));
  const tripsPaths = YAML.load(path.resolve(__dirname, "./app/trips/paths.yaml"));
  const servicesPaths = YAML.load(path.resolve(__dirname, "./app/services/paths.yaml"));
  const regionsPaths = YAML.load(path.resolve(__dirname, "./app/regions/paths.yaml"));
  // const tollGatesPaths = YAML.load(path.resolve(__dirname, "./app/toll-gates/paths.yaml"));
  const vehiclesPaths = YAML.load(path.resolve(__dirname, "./app/vehicles/paths.yaml"));
  const vehicleModelsPaths = YAML.load(path.resolve(__dirname, "./app/vehicle-models/paths.yaml"));
  const walletsPaths = YAML.load(path.resolve(__dirname, "./app/wallets/paths.yaml"));
  const paymentsPaths = YAML.load(path.resolve(__dirname, "./app/payments/paths.yaml"));

  const couponsPaths = YAML.load(path.resolve(__dirname, "./app/coupons/paths.yaml"));
  const notificationsPaths = YAML.load(path.resolve(__dirname, "./app/notifications/paths.yaml"));
  const supportPaths = YAML.load(path.resolve(__dirname, "./app/support/paths.yaml"));
  const faqsPaths = YAML.load(path.resolve(__dirname, "./app/faqs/paths.yaml"));
  const instructionsPaths = YAML.load(path.resolve(__dirname, "./app/instructions/paths.yaml"));
  // const analyticsPaths = YAML.load(path.resolve(__dirname, "./app/analytics/paths.yaml"));

  const settingsPaths = YAML.load(path.resolve(__dirname, "./app/settings/paths.yaml"));
  // const commissionRulesPaths = YAML.load(path.resolve(__dirname, "./app/commission-rules/paths.yaml"));
  // const earningsPaths        = YAML.load(path.resolve(__dirname, "./app/earnings/paths.yaml"));

  // const authAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/auth/paths.yaml"));
  const usersAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/users/paths.yaml"));
  const driversAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/drivers/paths.yaml"));
  const servicesAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/services/paths.yaml"));
  const regionsAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/regions/paths.yaml"));
  const tollGatesAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/toll-gates/paths.yaml"));
  const vehiclesAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/vehicles/paths.yaml"));
  const vehicleModelsAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/vehicle-models/paths.yaml"));
  const walletsAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/wallets/paths.yaml"));
  const paymentsAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/payments/paths.yaml"));

  const couponsAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/coupons/paths.yaml"));
  const notificationsAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/notifications/paths.yaml"));
  const supportAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/support/paths.yaml"));
  const faqsAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/faqs/paths.yaml"));
  const instructionsAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/instructions/paths.yaml"));
  const analyticsAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/analytics/paths.yaml"));

  const settingsAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/settings/paths.yaml"));
  const commissionRulesAdminPaths = YAML.load(path.resolve(__dirname, "./dashboard/commission-rules/paths.yaml"));
  const earningsAdminPaths        = YAML.load(path.resolve(__dirname, "./dashboard/earnings/paths.yaml"));

  const schemas = {
    ...authSchemas,
    ...usersSchemas,
    ...driversSchemas,
    ...tripsSchemas,
    ...servicesSchemas,
    ...regionsSchemas,
    // ...tollGatesSchemas,
    ...vehiclesSchemas,
    ...vehicleModelsSchemas,
    ...walletsSchemas,
    ...paymentsSchemas,
    ...couponsSchemas,
    ...notificationsSchemas,
    ...supportSchemas,
    ...faqsSchemas,
    ...instructionsSchemas,
    // ...analyticsSchemas,
    ...settingsSchemas,
    // ...commissionRulesSchemas,
    // ...earningsSchemas,
  };

  const paths = {
    ...authPaths,
    ...usersPaths,
    ...driversPaths,
    ...tripsPaths,
    ...servicesPaths,
    ...regionsPaths,
    // ...tollGatesPaths,
    ...vehiclesPaths,
    ...vehicleModelsPaths,
    ...walletsPaths,
    ...paymentsPaths,
    ...couponsPaths,
    ...notificationsPaths,
    ...supportPaths,
    ...faqsPaths,
    ...instructionsPaths,
    // ...analyticsPaths,
    ...settingsPaths,
    // ...commissionRulesPaths,
    // ...earningsPaths,
    // ...authAdminPaths,
    ...usersAdminPaths,
    ...driversAdminPaths,
    ...servicesAdminPaths,
    ...regionsAdminPaths,
    ...tollGatesAdminPaths,
    ...vehiclesAdminPaths,
    ...vehicleModelsAdminPaths,
    ...walletsAdminPaths,
    ...paymentsAdminPaths,
    ...couponsAdminPaths,
    ...notificationsAdminPaths,
    ...supportAdminPaths,
    ...faqsAdminPaths,
    ...instructionsAdminPaths,
    ...analyticsAdminPaths,
    ...settingsAdminPaths,
    ...commissionRulesAdminPaths,
    ...earningsAdminPaths,
  };

  const swaggerSpec = buildSwaggerSpec(info, schemas, paths);
  const publicSwaggerSpec = buildSwaggerSpec(
    { ...info, info: { ...info.info, title: `${info.info.title} - Public` } },
    schemas,
    paths
  );
  const adminSwaggerSpec = buildSwaggerSpec(
    { ...info, info: { ...info.info, title: `${info.info.title} - Admin` } },
    schemas,
    filterPaths(paths, (routePath) => isAdminPath(routePath))
  );

  const swaggerOptions = {
    docExpansion: "none",
    apisCollapse: true,
  };

  app.use("/api/docs", swaggerUi.serveFiles(swaggerSpec), swaggerUi.setup(swaggerSpec, swaggerOptions));
  app.use(
    "/docs/public",
    swaggerUi.serveFiles(publicSwaggerSpec),
    swaggerUi.setup(publicSwaggerSpec, swaggerOptions)
  );
  app.use(
    "/docs/admin",
    swaggerUi.serveFiles(adminSwaggerSpec),
    swaggerUi.setup(adminSwaggerSpec, swaggerOptions)
  );

  return { swaggerSpec, publicSwaggerSpec, adminSwaggerSpec };
}
