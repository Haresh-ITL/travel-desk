import { context, trace } from "@opentelemetry/api";

type LogAttributes = Record<string, any>;

function addSpanEvent(level: string, message: string, attrs?: LogAttributes) {
  const span = trace.getSpan(context.active());
  if (!span) return;

  span.addEvent(message, {
    "log.severity": level,
    ...attrs,
  });
}

export const logger = {
  info(message: string, attrs?: LogAttributes) {
    console.log("[INFO]", message, attrs ?? {});
    addSpanEvent("INFO", message, attrs);
  },
  warn(message: string, attrs?: LogAttributes) {
    console.warn("[WARN]", message, attrs ?? {});
    addSpanEvent("WARN", message, attrs);
  },
  error(message: string, attrs?: LogAttributes) {
    console.error("[ERROR]", message, attrs ?? {});
    addSpanEvent("ERROR", message, attrs);
  },
};
