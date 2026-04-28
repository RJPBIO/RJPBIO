import { describe, it, expect } from "vitest";
import { mergeNeuralState } from "./sync-merge";

describe("sync-merge — mergeNeuralState", () => {
  describe("edge cases", () => {
    it("returns client when server is null", () => {
      const client = { hrvLog: [{ ts: 1, rmssd: 40 }] };
      expect(mergeNeuralState(null, client)).toEqual(client);
    });

    it("returns server when client is null", () => {
      const server = { hrvLog: [{ ts: 1, rmssd: 40 }] };
      expect(mergeNeuralState(server, null)).toEqual(server);
    });

    it("returns null when both are null", () => {
      expect(mergeNeuralState(null, null)).toBe(null);
    });
  });

  describe("ts-keyed log merging (the data-loss bug fix)", () => {
    it("merges hrvLog from two devices without losing entries — bug #1 round 2", () => {
      // Phone agrega entry #1 a las ts=100, sincroniza
      const server = { hrvLog: [{ ts: 100, rmssd: 40 }] };
      // Laptop tenía cache pre-#1, agrega #2 a las ts=200
      const client = { hrvLog: [{ ts: 200, rmssd: 45 }] };
      const merged = mergeNeuralState(server, client);
      // ANTES del fix: client overwrite → server tendría solo ts:200, perdiendo ts:100
      // CON fix: ambas entries presentes
      expect(merged.hrvLog).toHaveLength(2);
      expect(merged.hrvLog.map((e) => e.ts)).toEqual([100, 200]);
    });

    it("dedupes entries with same ts (client wins on collision)", () => {
      const server = { hrvLog: [{ ts: 100, rmssd: 40, source: "ble" }] };
      const client = { hrvLog: [{ ts: 100, rmssd: 42, source: "camera" }] };
      const merged = mergeNeuralState(server, client);
      expect(merged.hrvLog).toHaveLength(1);
      expect(merged.hrvLog[0].rmssd).toBe(42); // client wins
      expect(merged.hrvLog[0].source).toBe("camera");
    });

    it("sorts merged array by ts ascending", () => {
      const server = { hrvLog: [{ ts: 300, rmssd: 50 }, { ts: 100, rmssd: 40 }] };
      const client = { hrvLog: [{ ts: 200, rmssd: 45 }] };
      const merged = mergeNeuralState(server, client);
      expect(merged.hrvLog.map((e) => e.ts)).toEqual([100, 200, 300]);
    });

    it("ignores entries without numeric ts", () => {
      const server = { hrvLog: [{ ts: 100, rmssd: 40 }] };
      const client = { hrvLog: [{ ts: "x", rmssd: 99 }, { rmssd: 99 }, null] };
      const merged = mergeNeuralState(server, client);
      expect(merged.hrvLog).toEqual([{ ts: 100, rmssd: 40 }]);
    });
  });

  describe("multi-log merge", () => {
    it("merges history, moodLog, hrvLog, rhrLog independently", () => {
      const server = {
        history: [{ ts: 1, p: "Reset" }],
        moodLog: [{ ts: 1, mood: 3 }],
        hrvLog: [{ ts: 1, rmssd: 40 }],
        rhrLog: [{ ts: 1, rhr: 65 }],
      };
      const client = {
        history: [{ ts: 2, p: "Calm" }],
        moodLog: [{ ts: 2, mood: 4 }],
        hrvLog: [{ ts: 2, rmssd: 45 }],
        rhrLog: [{ ts: 2, rhr: 62 }],
      };
      const merged = mergeNeuralState(server, client);
      expect(merged.history).toHaveLength(2);
      expect(merged.moodLog).toHaveLength(2);
      expect(merged.hrvLog).toHaveLength(2);
      expect(merged.rhrLog).toHaveLength(2);
    });
  });

  describe("CAPS — slice oldest after merge", () => {
    it("caps hrvLog to 365 entries (keeping newest by ts)", () => {
      const server = { hrvLog: Array.from({ length: 200 }, (_, i) => ({ ts: i, rmssd: 40 })) };
      const client = { hrvLog: Array.from({ length: 200 }, (_, i) => ({ ts: i + 200, rmssd: 45 })) };
      const merged = mergeNeuralState(server, client);
      expect(merged.hrvLog).toHaveLength(365);
      // Verifica que los newest (ts mayor) sobreviven
      expect(merged.hrvLog[0].ts).toBe(35); // 400 - 365 = 35 oldest kept
      expect(merged.hrvLog[merged.hrvLog.length - 1].ts).toBe(399);
    });

    it("caps nom035Results to 20", () => {
      const server = { nom035Results: Array.from({ length: 15 }, (_, i) => ({ ts: i, score: i })) };
      const client = { nom035Results: Array.from({ length: 15 }, (_, i) => ({ ts: i + 15, score: i + 15 })) };
      const merged = mergeNeuralState(server, client);
      expect(merged.nom035Results).toHaveLength(20);
      expect(merged.nom035Results[0].ts).toBe(10);
    });
  });

  describe("MAX_COUNTERS — monotonic counters", () => {
    it("totalSessions takes MAX of both", () => {
      expect(mergeNeuralState({ totalSessions: 5 }, { totalSessions: 3 }).totalSessions).toBe(5);
      expect(mergeNeuralState({ totalSessions: 3 }, { totalSessions: 7 }).totalSessions).toBe(7);
    });

    it("vCores, bestStreak, totalTime same MAX semantic", () => {
      const merged = mergeNeuralState(
        { vCores: 100, bestStreak: 12, totalTime: 5000 },
        { vCores: 80, bestStreak: 15, totalTime: 4500 },
      );
      expect(merged.vCores).toBe(100);
      expect(merged.bestStreak).toBe(15);
      expect(merged.totalTime).toBe(5000);
    });

    it("missing counter on one side defaults to 0 for MAX", () => {
      expect(mergeNeuralState({}, { totalSessions: 5 }).totalSessions).toBe(5);
      expect(mergeNeuralState({ totalSessions: 5 }, {}).totalSessions).toBe(5);
    });
  });

  describe("SET_UNIONS — achievements, favs", () => {
    it("merges achievements from both devices without dups", () => {
      const merged = mergeNeuralState(
        { achievements: ["streak3", "first_session"] },
        { achievements: ["streak3", "mood5"] },
      );
      expect(merged.achievements.sort()).toEqual(["first_session", "mood5", "streak3"]);
    });

    it("favs union", () => {
      const merged = mergeNeuralState(
        { favs: ["Reset Ejecutivo", "Calma Profunda"] },
        { favs: ["Reset Ejecutivo", "Foco Sprint"] },
      );
      expect(merged.favs.sort()).toEqual(["Calma Profunda", "Foco Sprint", "Reset Ejecutivo"]);
    });
  });

  describe("last-writer-wins for non-special fields", () => {
    it("client wins for streak, lastDate, settings", () => {
      const merged = mergeNeuralState(
        { streak: 5, lastDate: "Mon Apr 27 2026", voiceOn: true },
        { streak: 3, lastDate: "Tue Apr 28 2026", voiceOn: false },
      );
      expect(merged.streak).toBe(3);
      expect(merged.lastDate).toBe("Tue Apr 28 2026");
      expect(merged.voiceOn).toBe(false);
    });
  });

  describe("predictionResiduals nested merge", () => {
    it("merges predictionResiduals.history by ts", () => {
      const server = { predictionResiduals: { history: [{ ts: 1, predicted: 0.5 }] } };
      const client = { predictionResiduals: { history: [{ ts: 2, predicted: 0.7 }] } };
      const merged = mergeNeuralState(server, client);
      expect(merged.predictionResiduals.history).toHaveLength(2);
      expect(merged.predictionResiduals.history[0].ts).toBe(1);
    });

    it("caps predictionResiduals.history to 100", () => {
      const server = { predictionResiduals: { history: Array.from({ length: 60 }, (_, i) => ({ ts: i, predicted: 0.5 })) } };
      const client = { predictionResiduals: { history: Array.from({ length: 60 }, (_, i) => ({ ts: i + 60, predicted: 0.7 })) } };
      const merged = mergeNeuralState(server, client);
      expect(merged.predictionResiduals.history).toHaveLength(100);
    });
  });

  describe("programHistory merge by startedAt", () => {
    it("dedupes by startedAt", () => {
      const server = {
        programHistory: [
          { id: "neural-baseline", startedAt: 100, completedAt: 200, completionFraction: 1 },
        ],
      };
      const client = {
        programHistory: [
          { id: "neural-baseline", startedAt: 100, completedAt: 200, completionFraction: 1 },
          { id: "recovery", startedAt: 300, completedAt: 400, completionFraction: 0.5, abandoned: true },
        ],
      };
      const merged = mergeNeuralState(server, client);
      expect(merged.programHistory).toHaveLength(2);
    });
  });

  describe("realistic cross-device scenario", () => {
    it("phone sync + laptop sync sin pérdida de datos", () => {
      // Estado inicial (server después del primer sync de phone)
      const phoneState = {
        totalSessions: 5,
        bestStreak: 3,
        vCores: 25,
        achievements: ["first_session", "streak3"],
        history: [
          { ts: 1000, p: "Reset Ejecutivo" },
          { ts: 2000, p: "Calma Profunda" },
        ],
        hrvLog: [{ ts: 1500, rmssd: 42 }],
        moodLog: [{ ts: 1100, mood: 3 }, { ts: 2100, mood: 4 }],
        streak: 3,
        lastDate: "Mon Apr 27 2026",
      };

      // Laptop tenía cache desde antes — solo 3 sessions, agrega una nueva
      const laptopState = {
        totalSessions: 4, // laptop creía 3, sumó 1 = 4
        bestStreak: 2, // laptop tenía bestStreak más bajo
        vCores: 18,
        achievements: ["first_session"], // laptop sin "streak3"
        history: [
          { ts: 1000, p: "Reset Ejecutivo" },
          { ts: 3000, p: "Foco Sprint" }, // entry NUEVA del laptop
        ],
        hrvLog: [
          { ts: 1500, rmssd: 42 },
          { ts: 3100, rmssd: 38 }, // entry NUEVA del laptop
        ],
        moodLog: [{ ts: 1100, mood: 3 }, { ts: 3050, mood: 5 }], // ts:3050 nueva
        streak: 1,
        lastDate: "Tue Apr 28 2026",
      };

      const merged = mergeNeuralState(phoneState, laptopState);

      // Counters: MAX wins
      expect(merged.totalSessions).toBe(5); // phone tenía más
      expect(merged.bestStreak).toBe(3);
      expect(merged.vCores).toBe(25);

      // Achievements: union
      expect(merged.achievements.sort()).toEqual(["first_session", "streak3"]);

      // History: ambas entries únicas presentes (3 total: 1000, 2000, 3000)
      expect(merged.history).toHaveLength(3);
      expect(merged.history.map((h) => h.ts)).toEqual([1000, 2000, 3000]);

      // HRV: dedupe ts:1500, agrega ts:3100
      expect(merged.hrvLog).toHaveLength(2);
      expect(merged.hrvLog.map((h) => h.ts)).toEqual([1500, 3100]);

      // MoodLog: 1100 (compartida), 2100 (phone-only), 3050 (laptop-only)
      expect(merged.moodLog).toHaveLength(3);

      // streak/lastDate: client (laptop) wins — last writer
      expect(merged.streak).toBe(1);
      expect(merged.lastDate).toBe("Tue Apr 28 2026");
    });
  });
});
