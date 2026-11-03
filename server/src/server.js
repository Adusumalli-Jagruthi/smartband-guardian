const env = require("./config/env");
const { connectDb } = require("./config/db");
const app = require("./app");
const missedMedicines = require("./jobs/missedMedicines");

(async () => {
  try {
    await connectDb();
    missedMedicines.start();
    app.listen(env.port, () => console.log(`SmartBand API listening on :${env.port} (${env.nodeEnv})`));
  } catch (e) {
    console.error("Failed to start:", e.message);
    process.exit(1);
  }
})();
