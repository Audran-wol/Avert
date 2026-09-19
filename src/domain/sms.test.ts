import { describe, it, expect } from "vitest";
import { estimateSms } from "./sms";

describe("estimateSms", () => {
  it("counts a short plain-ASCII message as one GSM-7 segment", () => {
    const r = estimateSms("AVERT DEMO: Flood-risk exercise for Volo.");
    expect(r.encoding).toBe("GSM-7");
    expect(r.segments).toBe(1);
  });

  it("splits a message over 160 GSM-7 chars into multiple segments at the 153-char rate", () => {
    const text = "A".repeat(161);
    const r = estimateSms(text);
    expect(r.encoding).toBe("GSM-7");
    expect(r.perSegmentLimit).toBe(153);
    expect(r.segments).toBe(Math.ceil(161 / 153));
  });

  it("detects Unicode (e.g. emoji) and switches to UCS-2 with a 70-char limit", () => {
    const r = estimateSms("Alerte inondation \u{1F30A}");
    expect(r.encoding).toBe("UCS-2");
    expect(r.perSegmentLimit).toBe(70);
  });

  it("keeps French accented characters in GSM-7 (they are part of the basic set)", () => {
    const r = estimateSms("AVERT DÉMO : évitez les routes inondées");
    expect(r.encoding).toBe("GSM-7");
  });
});
