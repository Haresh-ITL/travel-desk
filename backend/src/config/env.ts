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
  otelOtlpHeaders: process.env.OTEL_EXPORTER_OTLP_HEADERS || "",
  // Perplexity AI Configuration
  // Valid models: sonar-pro (recommended for Pro accounts), sonar, sonar-reasoning,
  // llama-3.1-sonar-large-128k-online, llama-3.1-sonar-huge-128k-online, 
  // llama-3.1-sonar-small-128k-online, sonar-small-online, sonar-medium-online, sonar-large-online
  perplexityApiKey: (process.env.PERPLEXITY_API_KEY || "").trim(),
  perplexityModel: (process.env.PERPLEXITY_MODEL || "sonar-pro").trim(),
  // Email Configuration
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER || "",
  smtpPassword: process.env.SMTP_PASSWORD || "",
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@traveldesk.com"
};
