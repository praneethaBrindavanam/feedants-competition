const Competition = require("./models/Competition");

async function seedCompetition() {
  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() + 7);
  startsAt.setHours(18, 0, 0, 0);

  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + 3);

  await Competition.updateOne(
    { slug: "urban-photo-challenge" },
    {
      $setOnInsert: {
        slug: "urban-photo-challenge",
        title: "Urban Photo Challenge",
        category: "PHOTOGRAPHY",
        description: "Find the extraordinary in the everyday. Capture the colors, characters, and hidden corners that make your city yours.",
        organizer: "Feedants Creative Club",
        prizePool: 2500,
        currency: "USD",
        startsAt,
        endsAt,
        maxParticipants: 120,
        participantIds: [],
        rules: [
          "Submit up to three original photographs.",
          "Photos must be taken in your city during the competition.",
          "No watermarks or AI-generated images.",
          "Keep your entry public until judging is complete.",
        ],
        coverImageUrl: "",
      },
    },
    { upsert: true },
  );
}

module.exports = seedCompetition;
