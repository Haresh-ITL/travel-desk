import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || "",
  bcryptRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeCurrency: process.env.STRIPE_CURRENCY||"",
  otelServiceName: process.env.OTEL_SERVICE_NAME || "travel-desk-api",
  otelServiceNamespace: process.env.OTEL_SERVICE_NAMESPACE || "travel-platform",
  otelEnvironment: process.env.OTEL_ENVIRONMENT || "dev",
  otelOtlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||"",
  otelOtlpHeaders: process.env.OTEL_EXPORTER_OTLP_HEADERS || ""
};
