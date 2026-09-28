import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";
const USER_ID_KEY = "feedants.deviceUserId";

async function getUserId() {
  let userId = await AsyncStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    await AsyncStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error || "The request could not be completed.");
    error.competition = payload.competition;
    throw error;
  }
  return payload;
}

export async function fetchCompetition(slug) {
  const userId = await getUserId();
  return request(`/competitions/${slug}?userId=${encodeURIComponent(userId)}`);
}

export async function updateRegistration(slug, action) {
  const userId = await getUserId();
  const method = action === "register" ? "POST" : "DELETE";
  return request(`/competitions/${slug}/registration`, {
    method,
    body: JSON.stringify({ userId }),
  });
}
