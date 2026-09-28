require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");
const seedCompetition = require("./seed");

const port = Number(process.env.PORT) || 4000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("MONGODB_URI must be configured before starting the API.");
  process.exit(1);
}

async function start() {
  await mongoose.connect(mongoUri);
  await seedCompetition();
  app.listen(port, () => console.log(`Competition API listening on port ${port}`));
}

start().catch((error) => {
  console.error("Failed to start the competition API:", error);
  process.exit(1);
});
