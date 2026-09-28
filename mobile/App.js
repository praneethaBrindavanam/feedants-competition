import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchCompetition, updateRegistration } from "./src/api";

const SLUG = "urban-photo-challenge";
const COLORS = {
  ink: "#17251f",
  muted: "#77827b",
  green: "#34775b",
  pale: "#edf2e9",
  paper: "#f6f6f2",
  line: "#e9ebe5",
};

function formatDate(dateString, options) {
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function Countdown({ startsAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = Math.max(0, new Date(startsAt).getTime() - now);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const units = [
    [days, "DAYS"],
    [hours, "HRS"],
    [minutes, "MIN"],
    [seconds, "SEC"],
  ];

  return (
    <View style={styles.countdown}>
      {units.map(([value, label], index) => (
        <React.Fragment key={label}>
          {index > 0 && <Text style={styles.countdownColon}>:</Text>}
          <View style={styles.countdownUnit}>
            <Text style={styles.countdownValue}>{String(value).padStart(2, "0")}</Text>
            <Text style={styles.countdownLabel}>{label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

function stateLabel(state) {
  if (state === "live") return "LIVE NOW";
  if (state === "completed") return "COMPLETED";
  if (state === "full") return "FULL";
  return "REGISTRATION OPEN";
}

function CompetitionScreen() {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(Date.now());

  const loadCompetition = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      setCompetition(await fetchCompetition(SLUG));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCompetition();
  }, [loadCompetition]);

  useEffect(() => {
    if (!competition) return undefined;
    const startsAt = new Date(competition.startsAt).getTime();
    const endsAt = new Date(competition.endsAt).getTime();
    const nextBoundary = startsAt > now ? startsAt : endsAt > now ? endsAt : null;
    if (nextBoundary === null) return undefined;

    const timer = setTimeout(
      () => setNow(Date.now()),
      Math.min(nextBoundary - now + 50, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [competition, now]);

  const onRegistrationPress = async () => {
    if (!competition || submitting) return;
    const action = competition.isRegistered ? "cancel" : "register";
    setSubmitting(true);
    setNotice("");
    setError("");
    try {
      setCompetition(await updateRegistration(SLUG, action));
      setNotice(action === "register" ? "You're in! Your spot is reserved." : "Your registration was cancelled.");
    } catch (requestError) {
      if (requestError.competition) setCompetition(requestError.competition);
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={COLORS.green} />
        <Text style={styles.loadingText}>Loading competition…</Text>
      </SafeAreaView>
    );
  }

  if (!competition) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="cloud-offline-outline" size={34} color={COLORS.green} />
        <Text style={styles.emptyTitle}>Competition unavailable</Text>
        <Text style={styles.emptyText}>{error}</Text>
        <Pressable onPress={() => loadCompetition()} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const effectiveState = now >= new Date(competition.endsAt).getTime()
    ? "completed"
    : now >= new Date(competition.startsAt).getTime()
      ? "live"
      : competition.spotsRemaining === 0
        ? "full"
        : "registration_open";
  const canCancel = competition.isRegistered && now < new Date(competition.startsAt).getTime();
  const canRegister = !competition.isRegistered && effectiveState === "registration_open";
  const actionEnabled = canRegister || canCancel;
  const actionLabel = submitting
    ? "Please wait…"
    : effectiveState === "completed"
      ? "Competition ended"
    : competition.isRegistered
      ? canCancel ? "Cancel my spot" : "You're participating"
      : effectiveState === "full"
        ? "Competition full"
        : effectiveState === "live"
          ? "Registration closed"
          : "Join the competition";
  const participantPercent = Math.min(
    100,
    (competition.participantCount / competition.maxParticipants) * 100,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadCompetition(true)}
            tintColor={COLORS.green}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.brandMark}><Ionicons name="sparkles" size={16} color="#fff" /></View>
            <Text style={styles.brandName}>feedants</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="More options" style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.ink} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <LinearGradient colors={["#243f36", "#3c735d", "#99a876"]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroOrbOne} />
          <View style={styles.heroOrbTwo} />
          <View style={styles.heroTopLine}>
            <View style={styles.categoryPill}>
              <View style={styles.liveDot} />
              <Text style={styles.categoryText}>{stateLabel(effectiveState)}</Text>
            </View>
            <Ionicons name="camera-outline" size={30} color="rgba(255,255,255,0.82)" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{competition.category} · COMMUNITY CHALLENGE</Text>
            <Text style={styles.heroTitle}>{competition.title}</Text>
            <Text style={styles.heroSubtitle}>See your city a little differently.</Text>
          </View>
          <View style={styles.heroFooter}>
            <View style={styles.organizerMark}><Ionicons name="aperture-outline" size={18} color="#e9d8a4" /></View>
            <Text style={styles.organizerName}>{competition.organizer}</Text>
            <Ionicons name="checkmark-circle" size={15} color="#b8d6a8" />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.dateRow}>
            <View style={styles.dateIcon}><Ionicons name="calendar-outline" size={18} color={COLORS.green} /></View>
            <View style={styles.dateCopy}>
              <Text style={styles.label}>COMPETITION DATES</Text>
              <Text style={styles.dateText}>
                {formatDate(competition.startsAt, { month: "short", day: "numeric" })} – {formatDate(competition.endsAt, { month: "short", day: "numeric", year: "numeric" })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9aa49d" />
          </View>

          {effectiveState === "registration_open" && (
            <View style={styles.countdownCard}>
              <View style={styles.countdownHeader}>
                <View>
                  <Text style={styles.countdownTitle}>The challenge begins in</Text>
                  <Text style={styles.countdownSub}>Get your camera ready</Text>
                </View>
                <Ionicons name="time-outline" size={22} color={COLORS.green} />
              </View>
              <Countdown startsAt={competition.startsAt} />
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}><Ionicons name="trophy-outline" size={19} color="#a07732" /></View>
              <Text style={styles.statValue}>
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: competition.currency,
                  maximumFractionDigits: 0,
                }).format(competition.prizePool)}
              </Text>
              <Text style={styles.statCaption}>TOTAL PRIZE POOL</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}><Ionicons name="people-outline" size={19} color={COLORS.green} /></View>
              <Text style={styles.statValue}>{competition.spotsRemaining}</Text>
              <Text style={styles.statCaption}>SPOTS LEFT</Text>
            </View>
          </View>

          <View style={styles.capacityCard}>
            <View style={styles.capacityCopy}>
              <Text style={styles.capacityTitle}>The community is growing</Text>
              <Text style={styles.capacityMeta}>
                {competition.participantCount} of {competition.maxParticipants} participants
              </Text>
            </View>
            <Text style={styles.capacityPercent}>{Math.round(participantPercent)}%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${participantPercent}%` }]} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this challenge</Text>
            <Text style={styles.description}>{competition.description}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.rulesHeading}>
              <Text style={styles.sectionTitle}>A few ground rules</Text>
              <Ionicons name="leaf-outline" size={20} color={COLORS.green} />
            </View>
            {competition.rules.map((rule, index) => (
              <View key={rule} style={styles.ruleRow}>
                <Text style={styles.ruleNumber}>{String(index + 1).padStart(2, "0")}</Text>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>

          {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
          {notice ? <Text accessibilityLiveRegion="polite" style={styles.noticeText}>{notice}</Text> : null}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomNote}>
          <Ionicons name={competition.isRegistered ? "checkmark-circle" : "shield-checkmark-outline"} size={17} color={COLORS.green} />
          <Text style={styles.bottomNoteText}>
            {competition.isRegistered ? "Your place is saved" : "Free to enter · Be part of it"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!actionEnabled || submitting}
          onPress={onRegistrationPress}
          style={({ pressed }) => [
            styles.actionButton,
            !actionEnabled && styles.actionButtonDisabled,
            pressed && actionEnabled && styles.actionButtonPressed,
          ]}
        >
          {submitting && <ActivityIndicator size="small" color="#fff" />}
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          {!submitting && actionEnabled && (
            <Ionicons name={competition.isRegistered ? "close" : "arrow-forward"} size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return <CompetitionScreen />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.paper },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.paper, padding: 28 },
  loadingText: { marginTop: 14, color: COLORS.muted, fontSize: 14 },
  emptyTitle: { marginTop: 14, fontSize: 20, fontWeight: "700", color: COLORS.ink },
  emptyText: { marginTop: 8, color: COLORS.muted, textAlign: "center", lineHeight: 21 },
  retryButton: { marginTop: 20, borderRadius: 12, backgroundColor: COLORS.green, paddingHorizontal: 22, paddingVertical: 12 },
  retryLabel: { color: "#fff", fontWeight: "700" },
  scrollContent: { paddingBottom: 18 },
  topBar: { height: 62, paddingHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.green },
  brandName: { color: COLORS.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.8 },
  iconButton: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, borderColor: COLORS.line, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  hero: { height: 306, marginHorizontal: 16, marginTop: 3, borderRadius: 25, overflow: "hidden", padding: 21, justifyContent: "space-between" },
  heroOrbOne: { position: "absolute", width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(218,190,129,0.15)", right: -90, top: 18 },
  heroOrbTwo: { position: "absolute", width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", right: -26, top: 64 },
  heroTopLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryPill: { flexDirection: "row", gap: 7, alignItems: "center", borderRadius: 30, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: "rgba(255,255,255,0.16)" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d3e4a0" },
  categoryText: { color: "#f5f4e9", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  heroCopy: { maxWidth: 290 },
  heroEyebrow: { color: "#d1d6b7", fontSize: 9, letterSpacing: 1.7, fontWeight: "800", marginBottom: 9 },
  heroTitle: { color: "#fffdf5", fontSize: 33, lineHeight: 37, fontWeight: "800", letterSpacing: -1.4 },
  heroSubtitle: { color: "rgba(255,255,255,0.82)", fontSize: 13, marginTop: 8 },
  heroFooter: { flexDirection: "row", alignItems: "center", gap: 8 },
  organizerMark: { width: 28, height: 28, borderRadius: 10, backgroundColor: "rgba(20,35,27,0.35)", alignItems: "center", justifyContent: "center" },
  organizerName: { color: "#fff", fontWeight: "600", fontSize: 12 },
  body: { paddingHorizontal: 20 },
  dateRow: { flexDirection: "row", alignItems: "center", paddingVertical: 19, gap: 12 },
  dateIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: COLORS.pale, alignItems: "center", justifyContent: "center" },
  dateCopy: { flex: 1 },
  label: { fontSize: 9, letterSpacing: 1.1, fontWeight: "800", color: COLORS.muted, marginBottom: 4 },
  dateText: { fontSize: 14, fontWeight: "700", color: COLORS.ink },
  countdownCard: { backgroundColor: "#fff", borderRadius: 19, padding: 16, borderWidth: 1, borderColor: COLORS.line, marginBottom: 13 },
  countdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  countdownTitle: { color: COLORS.ink, fontWeight: "700", fontSize: 14 },
  countdownSub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  countdown: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16 },
  countdownUnit: { flex: 1, alignItems: "center" },
  countdownValue: { color: COLORS.green, fontSize: 22, fontWeight: "800", fontVariant: ["tabular-nums"] },
  countdownLabel: { marginTop: 2, fontSize: 8, fontWeight: "800", color: "#8b968e", letterSpacing: 1 },
  countdownColon: { color: "#b8c0b8", fontSize: 17, marginTop: -10 },
  statsRow: { flexDirection: "row", gap: 11 },
  statCard: { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.line, borderRadius: 17, padding: 14 },
  statIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: "#f6f5ed", alignItems: "center", justifyContent: "center", marginBottom: 11 },
  statValue: { color: COLORS.ink, fontSize: 20, fontWeight: "800" },
  statCaption: { color: COLORS.muted, fontSize: 8, letterSpacing: 1, fontWeight: "800", marginTop: 4 },
  capacityCard: { marginTop: 12, backgroundColor: "#edf2e9", borderRadius: 17, padding: 15 },
  capacityCopy: { flex: 1 },
  capacityTitle: { fontSize: 12, color: COLORS.ink, fontWeight: "700" },
  capacityMeta: { marginTop: 4, color: COLORS.muted, fontSize: 10 },
  capacityPercent: { position: "absolute", top: 18, right: 15, color: COLORS.green, fontSize: 12, fontWeight: "800" },
  progressTrack: { height: 5, borderRadius: 4, backgroundColor: "#d8e1d5", marginTop: 13, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.green },
  section: { marginTop: 23 },
  sectionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  description: { color: "#657169", fontSize: 13, lineHeight: 21, marginTop: 9 },
  rulesHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
  ruleRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.line, gap: 13 },
  ruleNumber: { color: COLORS.green, fontSize: 10, fontWeight: "800", marginTop: 2 },
  ruleText: { flex: 1, color: "#657169", fontSize: 12, lineHeight: 18 },
  errorText: { color: "#a43d36", backgroundColor: "#f9e9e6", borderRadius: 10, padding: 11, marginTop: 16, fontSize: 12 },
  noticeText: { color: COLORS.green, backgroundColor: "#e6f0e6", borderRadius: 10, padding: 11, marginTop: 16, fontSize: 12, fontWeight: "600" },
  bottomBar: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: COLORS.line, paddingHorizontal: 20, paddingTop: 11, paddingBottom: 8 },
  bottomNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 9 },
  bottomNoteText: { fontSize: 10, fontWeight: "600", color: COLORS.muted },
  actionButton: { backgroundColor: COLORS.green, minHeight: 51, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  actionButtonDisabled: { backgroundColor: "#aab4ac" },
  actionButtonPressed: { opacity: 0.86 },
  actionLabel: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
