// The quiet weekly backup, postcards from Waymark and calm play.
import { describe, expect, it } from "vitest";
import { onBeat } from "../../src/domain/games";
import { DEFAULT_SETTINGS, normaliseSettings } from "../../src/domain/settings";
import { weeklyDue, weeklyToPrune } from "../../src/state/backup";
import { addPostcard } from "../../src/world/siblings";
import { normaliseWorld } from "../../src/world/world";

describe("the weekly backup", () => {
  it("is due a week after the last one, by hand or by itself", () => {
    const now = Date.parse("2026-11-13T12:00:00Z");
    expect(weeklyDue(undefined, now)).toBe(true);
    expect(weeklyDue("2026-11-10T12:00:00Z", now)).toBe(false);
    expect(weeklyDue("2026-11-06T12:00:00Z", now)).toBe(true);
  });

  it("keeps the newest four weekly copies and never touches ones made by hand", () => {
    const names = [
      "nookling-backup-2026-01-01-1200.zip",
      ...["01", "08", "15", "22", "29"].map(
        (d) => `nookling-backup-weekly-2026-10-${d}.zip`,
      ),
      "notes.md",
    ];
    expect(weeklyToPrune(names)).toEqual([
      "nookling-backup-weekly-2026-10-01.zip",
    ]);
  });

  it("is on by default, and calm play is off", () => {
    expect(DEFAULT_SETTINGS.autoBackup).toBe(true);
    expect(
      normaliseSettings({ autoBackup: false, calmPlay: true }),
    ).toMatchObject({ autoBackup: false, calmPlay: true });
  });
});

describe("postcards", () => {
  it("keep one per place and day, newest first, and survive a backup", () => {
    let cards = addPostcard([], "Lisbon", "Portugal", "2026-05-02", 1);
    cards = addPostcard(cards, "Kyoto", "Japan", "2026-06-01", 2);
    cards = addPostcard(cards, "Lisbon", "Portugal", "2026-05-02", 3);
    expect(cards.map((c) => c.city)).toEqual(["Lisbon", "Kyoto"]);
    const world = normaliseWorld(
      { postcards: [...cards, { city: "Nowhere" }] },
      0,
    );
    expect(world.postcards).toHaveLength(2);
  });
});

describe("calm play", () => {
  it("widens the rhythm window", () => {
    expect(onBeat(0.97, 0.85)).toBe(false);
    expect(onBeat(0.97, 0.85, 2)).toBe(true);
  });
});
