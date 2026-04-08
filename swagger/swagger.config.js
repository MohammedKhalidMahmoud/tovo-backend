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
  const authSchemas = YAML.load(path.resolve(__dirname, "./auth/schemas.yaml"));
  const usersSchemas = YAML.load(path.resolve(__dirname, "./users/schemas.yaml"));
  const driversSchemas = YAML.load(path.resolve(__dirname, "./drivers/schemas.yaml"));
  const tripsSchemas = YAML.load(path.resolve(__dirname, "./trips/schemas.yaml"));
  const servicesSchemas = YAML.load(path.resolve(__dirname, "./services/schemas.yaml"));
  const regionsSchemas = YAML.load(path.resolve(__dirname, "./regions/schemas.yaml"));
  const tollGatesSchemas = YAML.load(path.resolve(__dirname, "./toll-gates/schemas.yaml"));
  const vehiclesSchemas = YAML.load(path.resolve(__dirname, "./vehicles/schemas.yaml"));
  const vehicleModelsSchemas = YAML.load(path.resolve(__dirname, "./vehicle-models/schemas.yaml"));
  const walletsSchemas = YAML.load(path.resolve(__dirname, "./wallets/schemas.yaml"));
  const paymentsSchemas = YAML.load(path.resolve(__dirname, "./payments/schemas.yaml"));
  const couponsSchemas = YAML.load(path.resolve(__dirname, "./coupons/schemas.yaml"));
  const notificationsSchemas = YAML.load(path.resolve(__dirname, "./notifications/schemas.yaml"));
  const supportSchemas = YAML.load(path.resolve(__dirname, "./support/schemas.yaml"));
  const faqsSchemas = YAML.load(path.resolve(__dirname, "./faqs/schemas.yaml"));
  const analyticsSchemas = YAML.load(path.resolve(__dirname, "./analytics/schemas.yaml"));
  
  const settingsSchemas = YAML.load(path.resolve(__dirname, "./settings/schemas.yaml"));
  const commissionRulesSchemas = YAML.load(path.resolve(__dirname, "./commission-rules/schemas.yaml"));
  const earningsSchemas        = YAML.load(path.resolve(__dirname, "./earnings/schemas.yaml"));

  // ===== LOAD PATHS =====
  const authPaths = YAML.load(path.resolve(__dirname, "./auth/paths.yaml"));
  const usersPaths = YAML.load(path.resolve(__dirname, "./users/paths.yaml"));
  const driversPaths = YAML.load(path.resolve(__dirname, "./drivers/paths.yaml"));
  const tripsPaths = YAML.load(path.resolve(__dirname, "./trips/paths.yaml"));
  const servicesPaths = YAML.load(path.resolve(__dirname, "./services/paths.yaml"));
  const regionsPaths = YAML.load(path.resolve(__dirname, "./regions/paths.yaml"));
  const tollGatesPaths = YAML.load(path.resolve(__dirname, "./toll-gates/paths.yaml"));
  const vehiclesPaths = YAML.load(path.resolve(__dirname, "./vehicles/paths.yaml"));
  const vehicleModelsPaths = YAML.load(path.resolve(__dirname, "./vehicle-models/paths.yaml"));
  const walletsPaths = YAML.load(path.resolve(__dirname, "./wallets/paths.yaml"));
  const paymentsPaths = YAML.load(path.resolve(__dirname, "./payments/paths.yaml"));
  
  const couponsPaths = YAML.load(path.resolve(__dirname, "./coupons/paths.yaml"));
  const notificationsPaths = YAML.load(path.resolve(__dirname, "./notifications/paths.yaml"));
  const supportPaths = YAML.load(path.resolve(__dirname, "./support/paths.yaml"));
  const faqsPaths = YAML.load(path.resolve(__dirname, "./faqs/paths.yaml"));
  const analyticsPaths = YAML.load(path.resolve(__dirname, "./analytics/paths.yaml"));
  
  const settingsPaths = YAML.load(path.resolve(__dirname, "./settings/paths.yaml"));
  const commissionRulesPaths = YAML.load(path.resolve(__dirname, "./commission-rules/paths.yaml"));
  const earningsPaths        = YAML.load(path.resolve(__dirname, "./earnings/paths.yaml"));

  const schemas = {
    ...authSchemas,
    ...usersSchemas,
    ...driversSchemas,
    ...tripsSchemas,
    ...servicesSchemas,
    ...regionsSchemas,
    ...tollGatesSchemas,
    ...vehiclesSchemas,
    ...vehicleModelsSchemas,
    ...walletsSchemas,
    ...paymentsSchemas,
    ...couponsSchemas,
    ...notificationsSchemas,
    ...supportSchemas,
    ...faqsSchemas,
    ...analyticsSchemas,
    ...settingsSchemas,
    ...commissionRulesSchemas,
    ...earningsSchemas,
  };

  const paths = {
    ...authPaths,
    ...usersPaths,
    ...driversPaths,
    ...tripsPaths,
    ...servicesPaths,
    ...regionsPaths,
    ...tollGatesPaths,
    ...vehiclesPaths,
    ...vehicleModelsPaths,
    ...walletsPaths,
    ...paymentsPaths,
    ...couponsPaths,
    ...notificationsPaths,
    ...supportPaths,
    ...faqsPaths,
    ...analyticsPaths,
    ...settingsPaths,
    ...commissionRulesPaths,
    ...earningsPaths,
  };

  const swaggerSpec = buildSwaggerSpec(info, schemas, paths);
  const publicSwaggerSpec = buildSwaggerSpec(
    { ...info, info: { ...info.info, title: `${info.info.title} - Public` } },
    schemas,
    filterPaths(paths, (routePath) => !isAdminPath(routePath))
  );
  const adminSwaggerSpec = buildSwaggerSpec(
    { ...info, info: { ...info.info, title: `${info.info.title} - Admin` } },
    schemas,
    filterPaths(paths, (routePath) => isAdminPath(routePath))
  );

  app.use("/api/docs", swaggerUi.serveFiles(swaggerSpec), swaggerUi.setup(swaggerSpec));
  app.use(
    "/docs/public",
    swaggerUi.serveFiles(publicSwaggerSpec),
    swaggerUi.setup(publicSwaggerSpec)
  );

  return { swaggerSpec, publicSwaggerSpec, adminSwaggerSpec };
}
