const mongoose = require("mongoose");

const competitionSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  organizer: { type: String, required: true },
  prizePool: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: "USD" },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  maxParticipants: { type: Number, required: true, min: 1, max: 10000 },
  participantIds: { type: [String], default: [] },
  rules: { type: [String], default: [] },
  coverImageUrl: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Competition", competitionSchema);
