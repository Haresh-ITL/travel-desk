"use strict";
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const exporter_metrics_otlp_http_1 = require("@opentelemetry/exporter-metrics-otlp-http");
const sdk_metrics_1 = require("@opentelemetry/sdk-metrics");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const sdk_logs_1 = require("@opentelemetry/sdk-logs");
const env_1 = require("./config/env");
const exporter_logs_otlp_http_1 = require("@opentelemetry/exporter-logs-otlp-http");
console.log("------> ENV LOADED: ", env_1.env);
const resource = (0, resources_1.resourceFromAttributes)({
    [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: (_a = env_1.env.otelServiceName) !== null && _a !== void 0 ? _a : "unknown-service",
    [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAMESPACE]: (_b = env_1.env.otelServiceNamespace) !== null && _b !== void 0 ? _b : "default-namespace",
    [semantic_conventions_1.SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: (_c = env_1.env.otelEnvironment) !== null && _c !== void 0 ? _c : "development",
});
const baseEndpoint = env_1.env.otelOtlpEndpoint;
const headers = {
    Authorization: (_e = (_d = process.env.OTEL_EXPORTER_OTLP_HEADERS) === null || _d === void 0 ? void 0 : _d.replace('Authorization=', '')) !== null && _e !== void 0 ? _e : '',
};
const logExporter = new exporter_logs_otlp_http_1.OTLPLogExporter({
    url: baseEndpoint + '/v1/logs',
    headers: headers,
});
const traceExporter = new exporter_trace_otlp_http_1.OTLPTraceExporter({
    url: baseEndpoint + '/v1/traces',
    headers: headers,
});
const metricExporter = new exporter_metrics_otlp_http_1.OTLPMetricExporter({
    url: baseEndpoint + '/v1/metrics',
    headers: headers,
});
const metricReader = new sdk_metrics_1.PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 5000,
});
const sdk = new sdk_node_1.NodeSDK({
    resource,
    traceExporter,
    metricReader,
    logRecordProcessor: new sdk_logs_1.BatchLogRecordProcessor(logExporter),
    instrumentations: [
        (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
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
        .catch((err) => {
        console.error("Error terminating OpenTelemetry:", err);
        process.exit(1);
    });
});
