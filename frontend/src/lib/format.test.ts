import { describe, expect, it } from "vitest";

import {
  courseTotal,
  feeHeadline,
  feeLong,
  feeSubline,
  formatDateLong,
  formatDateShort,
  initials,
  todayISO,
  inr,
} from "./format";

const dcaAcc = {
  monthly_fee: 800,
  months: 6,
  duration_label: "6 Months",
  first_month_fee: null,
};
const pdm = {
  monthly_fee: 3000,
  months: 18,
  duration_label: "18 Months",
  first_month_fee: 4000,
};

describe("money", () => {
  it("uses Indian digit grouping", () => {
    expect(inr(4800)).toBe("₹4,800");
    expect(inr(124500)).toBe("₹1,24,500");
  });

  it("computes totals, including the PDM special terms", () => {
    expect(courseTotal(dcaAcc)).toBe(4800);
    expect(courseTotal(pdm)).toBe(55000);
  });

  it("leads with the monthly fee", () => {
    expect(feeHeadline(dcaAcc)).toEqual({ amount: "₹800", unit: "/month" });
    expect(feeLong(dcaAcc)).toBe("₹800 per month · 6 Months");
    expect(feeSubline(dcaAcc)).toBe("₹4,800 total · ₹250 registration");
  });

  it("states the PDM's own terms", () => {
    expect(feeHeadline(pdm)).toEqual({
      amount: "₹4,000",
      unit: "at admission",
    });
    expect(feeLong(pdm)).toBe("₹4,000 + ₹3,000 × 17 · 18 Months");
    expect(feeSubline(pdm)).toBe("+ ₹3,000 × 17 months · ₹55,000 total");
  });
});

describe("dates", () => {
  it("formats long and short dates without shifting the day", () => {
    expect(formatDateLong("2026-09-24")).toBe("24 September 2026");
    expect(formatDateShort("2026-09-24")).toBe("24 Sep");
    expect(formatDateShort("2026-10-02")).toBe("2 Oct");
  });
});

describe("initials", () => {
  it("takes the first and last name", () => {
    expect(initials("Aarav Mehta")).toBe("AM");
    expect(initials("  sneha  ")).toBe("S");
    expect(initials("Mohd. Farhan Ali")).toBe("MA");
  });
});

describe("todayISO", () => {
  it("uses the Indian calendar day", () => {
    // 20:00 UTC on 25 Sep is 01:30 on 26 Sep in Kolkata.
    expect(todayISO(new Date("2026-09-25T20:00:00Z"))).toBe("2026-09-26");
  });
});
