const MAX_USER_ID_LENGTH = 128;

function getCompetitionState(competition, now = new Date()) {
  const participants = competition.participantIds ?? [];
  const spotsRemaining = Math.max(0, competition.maxParticipants - participants.length);
  let state;

  if (now >= competition.endsAt) {
    state = "completed";
  } else if (now >= competition.startsAt) {
    state = "live";
  } else if (spotsRemaining === 0) {
    state = "full";
  } else {
    state = "registration_open";
  }

  return {
    state,
    participantCount: participants.length,
    spotsRemaining,
    registrationOpen: state === "registration_open",
  };
}

function isValidUserId(userId) {
  return typeof userId === "string" &&
    userId.length > 0 &&
    userId.length <= MAX_USER_ID_LENGTH &&
    userId.trim() === userId;
}

module.exports = { getCompetitionState, isValidUserId };
