import "dotenv/config";

import { NodeSDK } from "@opentelemetry/sdk-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  SemanticResourceAttributes,
} from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { env } from "./config/env";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";


console.log("------> ENV LOADED: ", env);

const resource = resourceFromAttributes({
  [SemanticResourceAttributes.SERVICE_NAME]: env.otelServiceName ?? "unknown-service",
  [SemanticResourceAttributes.SERVICE_NAMESPACE]: env.otelServiceNamespace ?? "default-namespace",
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env.otelEnvironment ?? "development",
});

const baseEndpoint = env.otelOtlpEndpoint;
const headers = {
    Authorization: process.env.OTEL_EXPORTER_OTLP_HEADERS?.replace('Authorization=', '') ?? '',
};
const logExporter = new OTLPLogExporter({
  url: baseEndpoint+'/v1/logs',
  headers: headers,
});


const traceExporter = new OTLPTraceExporter({
  url: baseEndpoint+'/v1/traces',
  headers: headers,
});

const metricExporter = new OTLPMetricExporter({
  url: baseEndpoint+'/v1/metrics',
  headers: headers,
});

const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 5000,
});


const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  logRecordProcessor: new BatchLogRecordProcessor(logExporter),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-express": { enabled: true },
      "@opentelemetry/instrumentation-http": { enabled: true },
    }),
  ],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => {
      console.log("OpenTelemetry terminated");
      process.exit(0);
    })
    .catch((err: unknown) => {
      console.error("Error terminating OpenTelemetry:", err);
      process.exit(1);
    });
});
