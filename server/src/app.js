const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const { globalLimiter } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => (!origin || env.corsOrigins.includes(origin) ? cb(null, true) : cb(new Error(`Origin ${origin} not allowed by CORS`))),
  credentials: true,
}));
app.use(express.json({ limit: "100kb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use("/api", globalLimiter);
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/devices", require("./routes/device.routes"));
app.use("/api/ingest", require("./routes/ingest.routes"));
app.use("/api/sensors", require("./routes/sensor.routes"));
app.use("/api/gps", require("./routes/gps.routes"));
app.use("/api/medicines", require("./routes/medicine.routes"));
app.use("/api/alerts", require("./routes/alert.routes"));
app.use("/api/guardian", require("./routes/guardian.routes"));
app.use("/api/link", require("./routes/link.routes"));
app.use("/api/ai", require("./routes/ai.routes"));
app.use("/api/integrations", require("./routes/integration.routes"));
app.use("/api/thingspeak", require("./routes/thingspeak.routes"));

app.use(notFound);
app.use(errorHandler);
module.exports = app;
