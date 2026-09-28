const test = require("node:test");
const assert = require("node:assert/strict");
const { getCompetitionState, isValidUserId } = require("../src/competitionState");

const startsAt = new Date("2026-10-01T12:00:00.000Z");
const endsAt = new Date("2026-10-04T12:00:00.000Z");
const competition = {
  startsAt,
  endsAt,
  maxParticipants: 2,
  participantIds: ["user-1"],
};

test("reports open registration and correct spots before start", () => {
  const result = getCompetitionState(competition, new Date("2026-09-30T12:00:00.000Z"));
  assert.equal(result.state, "registration_open");
  assert.equal(result.spotsRemaining, 1);
  assert.equal(result.registrationOpen, true);
});

test("reports full only before start when all spots are taken", () => {
  const result = getCompetitionState(
    { ...competition, participantIds: ["user-1", "user-2"] },
    new Date("2026-09-30T12:00:00.000Z"),
  );
  assert.equal(result.state, "full");
  assert.equal(result.spotsRemaining, 0);
  assert.equal(result.registrationOpen, false);
});

test("competition becomes live at its start and completed at its end", () => {
  assert.equal(getCompetitionState(competition, startsAt).state, "live");
  assert.equal(getCompetitionState(competition, endsAt).state, "completed");
});

test("accepts bounded, trimmed user identifiers only", () => {
  assert.equal(isValidUserId("device-123"), true);
  assert.equal(isValidUserId("  device-123"), false);
  assert.equal(isValidUserId(""), false);
  assert.equal(isValidUserId("x".repeat(129)), false);
  assert.equal(isValidUserId(42), false);
});
