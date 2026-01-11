"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const api_1 = require("@opentelemetry/api");
function addSpanEvent(level, message, attrs) {
    const span = api_1.trace.getSpan(api_1.context.active());
    if (!span)
        return;
    span.addEvent(message, {
        "log.severity": level,
        ...attrs,
    });
}
exports.logger = {
    info(message, attrs) {
        console.log("[INFO]", message, attrs !== null && attrs !== void 0 ? attrs : {});
        addSpanEvent("INFO", message, attrs);
    },
    warn(message, attrs) {
        console.warn("[WARN]", message, attrs !== null && attrs !== void 0 ? attrs : {});
        addSpanEvent("WARN", message, attrs);
    },
    error(message, attrs) {
        console.error("[ERROR]", message, attrs !== null && attrs !== void 0 ? attrs : {});
        addSpanEvent("ERROR", message, attrs);
    },
};
