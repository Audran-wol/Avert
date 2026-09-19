// GSM-7 basic charset (single-unit). Not exhaustive of every accented char in the spec table,
// but covers the common Latin/French set this app actually needs — verified against the
// standard 160/153 and 70/67 segment thresholds.
const GSM7_BASIC = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXTENDED = "^{}\\[~]|€"; // each costs 2 GSM-7 units (escape sequence)

export interface SmsEstimate { encoding: "GSM-7" | "UCS-2"; length: number; segments: number; perSegmentLimit: number }

export function estimateSms(text: string): SmsEstimate {
  const chars = [...text];
  const isGsm7 = chars.every((c) => GSM7_BASIC.includes(c) || GSM7_EXTENDED.includes(c));
  if (isGsm7) {
    const units = chars.reduce((sum, c) => sum + (GSM7_EXTENDED.includes(c) ? 2 : 1), 0);
    const perSegmentLimit = units > 160 ? 153 : 160;
    return { encoding: "GSM-7", length: units, segments: Math.max(1, Math.ceil(units / perSegmentLimit)), perSegmentLimit };
  }
  const perSegmentLimit = chars.length > 70 ? 67 : 70;
  return { encoding: "UCS-2", length: chars.length, segments: Math.max(1, Math.ceil(chars.length / perSegmentLimit)), perSegmentLimit };
}
