const cors = require("cors");
const express = require("express");
const Competition = require("./models/Competition");
const { getCompetitionState, isValidUserId } = require("./competitionState");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "16kb" }));

function serializeCompetition(competition, userId) {
  const lifecycle = getCompetitionState(competition);
  return {
    id: competition._id.toString(),
    slug: competition.slug,
    title: competition.title,
    category: competition.category,
    description: competition.description,
    organizer: competition.organizer,
    prizePool: competition.prizePool,
    currency: competition.currency,
    startsAt: competition.startsAt,
    endsAt: competition.endsAt,
    maxParticipants: competition.maxParticipants,
    participantCount: lifecycle.participantCount,
    spotsRemaining: lifecycle.spotsRemaining,
    state: lifecycle.state,
    registrationOpen: lifecycle.registrationOpen,
    isRegistered: userId ? competition.participantIds.includes(userId) : false,
    rules: competition.rules,
    coverImageUrl: competition.coverImageUrl,
  };
}

function validateUserId(req, res) {
  const userId = req.body.userId;
  if (!isValidUserId(userId)) {
    res.status(400).json({ error: "A valid userId is required." });
    return null;
  }
  return userId;
}

async function findCompetition(req, res) {
  const competition = await Competition.findOne({ slug: req.params.slug });
  if (!competition) {
    res.status(404).json({ error: "Competition not found." });
    return null;
  }
  return competition;
}

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/competitions/:slug", async (req, res, next) => {
  try {
    const userId = req.query.userId;
    if (userId !== undefined && !isValidUserId(userId)) {
      return res.status(400).json({ error: "Invalid userId." });
    }
    const competition = await findCompetition(req, res);
    if (competition) res.json(serializeCompetition(competition, userId));
  } catch (error) {
    next(error);
  }
});

app.post("/api/competitions/:slug/registration", async (req, res, next) => {
  try {
    const userId = validateUserId(req, res);
    if (!userId) return;

    const competition = await findCompetition(req, res);
    if (!competition) return;
    const now = new Date();
    if (now >= competition.startsAt || now >= competition.endsAt) {
      return res.status(409).json({
        error: "Registration is closed because this competition has started or ended.",
        competition: serializeCompetition(competition, userId),
      });
    }
    if (competition.participantIds.includes(userId)) {
      return res.json(serializeCompetition(competition, userId));
    }

    const updated = await Competition.findOneAndUpdate(
      {
        _id: competition._id,
        startsAt: { $gt: now },
        endsAt: { $gt: now },
        participantIds: { $ne: userId },
        $expr: { $lt: [{ $size: "$participantIds" }, "$maxParticipants"] },
      },
      { $addToSet: { participantIds: userId } },
      { new: true },
    );
    if (updated) return res.status(201).json(serializeCompetition(updated, userId));

    const latest = await findCompetition(req, res);
    if (!latest) return;
    if (latest.participantIds.includes(userId)) {
      return res.json(serializeCompetition(latest, userId));
    }
    return res.status(409).json({
      error: "No spots are available or registration has closed.",
      competition: serializeCompetition(latest, userId),
    });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/competitions/:slug/registration", async (req, res, next) => {
  try {
    const userId = validateUserId(req, res);
    if (!userId) return;

    const competition = await findCompetition(req, res);
    if (!competition) return;
    const now = new Date();
    if (now >= competition.startsAt) {
      return res.status(409).json({
        error: "Registration can no longer be cancelled after the competition starts.",
        competition: serializeCompetition(competition, userId),
      });
    }

    const updated = await Competition.findOneAndUpdate(
      { _id: competition._id, startsAt: { $gt: now } },
      { $pull: { participantIds: userId } },
      { new: true },
    );
    if (updated) return res.json(serializeCompetition(updated, userId));

    const latest = await findCompetition(req, res);
    if (!latest) return;
    if (new Date() >= latest.startsAt && latest.participantIds.includes(userId)) {
      return res.status(409).json({
        error: "Registration can no longer be cancelled after the competition starts.",
        competition: serializeCompetition(latest, userId),
      });
    }
    return res.json(serializeCompetition(latest, userId));
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

module.exports = app;
