// Formatting rules from PROJECT_GUIDE §7: Indian digit grouping, monthly fees first,
// "24 September 2026" in documents and "24 Sep" in tables.

const TZ = "Asia/Kolkata";

/** ₹4,800 · ₹1,24,500 */
export function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** 1,24,500 (no currency sign) */
export function num(value: number): string {
  return value.toLocaleString("en-IN");
}

function toDate(value: string | Date): Date {
  // A bare "2026-09-24" would be parsed as UTC midnight; anchor it to noon so the
  // calendar day is the same in every timezone.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`);
  }
  return new Date(value);
}

/** 24 September 2026 — certificates and documents. */
export function formatDateLong(value: string | Date): string {
  return toDate(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  });
}

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** 24 Sep — tables and lists. (ICU's en-IN gives "Sept"; the design uses three letters.) */
export function formatDateShort(value: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "numeric",
    timeZone: TZ,
  }).formatToParts(toDate(value));
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  return `${day} ${SHORT_MONTHS[month - 1]}`;
}

/** { day: "24", month: "Sep" } — the date tile on announcements. */
export function dateTile(value: string | Date): { day: string; month: string } {
  const [day, month] = formatDateShort(value).split(" ");
  return { day, month };
}

/** The fee fields every course carries (the API's Course, see PROJECT_GUIDE §10). */
export interface CourseFee {
  monthly_fee: number;
  months: number;
  duration_label: string;
  /** Only the Professional Diploma in Multimedia: ₹4,000 for month one, then ₹3,000 × 17. */
  first_month_fee?: number | null;
}

const hasFirstMonthFee = (
  fee: CourseFee,
): fee is CourseFee & { first_month_fee: number } =>
  fee.first_month_fee !== null && fee.first_month_fee !== undefined;

/** Every month added up; the one-time registration fee is separate. */
export function courseTotal(fee: CourseFee): number {
  return hasFirstMonthFee(fee)
    ? fee.first_month_fee + fee.monthly_fee * (fee.months - 1)
    : fee.monthly_fee * fee.months;
}

/** The headline figure and its unit: "₹800" + "/month", or "₹4,000" + "at admission". */
export function feeHeadline(fee: CourseFee): { amount: string; unit: string } {
  return hasFirstMonthFee(fee)
    ? { amount: inr(fee.first_month_fee), unit: "at admission" }
    : { amount: inr(fee.monthly_fee), unit: "/month" };
}

/** "₹800 per month · 6 Months", or "₹4,000 + ₹3,000 × 17 · 18 Months". */
export function feeLong(fee: CourseFee): string {
  const terms = hasFirstMonthFee(fee)
    ? `${inr(fee.first_month_fee)} + ${inr(fee.monthly_fee)} × ${fee.months - 1}`
    : `${inr(fee.monthly_fee)} per month`;
  return `${terms} · ${fee.duration_label}`;
}

/** Secondary line under a fee: never a total on its own. */
export function feeSubline(fee: CourseFee, registrationFee = 250): string {
  const total = inr(courseTotal(fee));
  return hasFirstMonthFee(fee)
    ? `+ ${inr(fee.monthly_fee)} × ${fee.months - 1} months · ${total} total`
    : `${total} total · ${inr(registrationFee)} registration`;
}

/** Two initials for avatars: "Aarav Mehta" → "AM". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();
}

/** Today's date in India as "2026-09-26" (the same calendar day the API uses). */
export function todayISO(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

/** "NISHA BHATT" → "Nisha Bhatt" for greetings; names are stored in capitals for certificates. */
export function titleCase(name: string): string {
  return name
    .toLowerCase()
    .replace(/(^|[\s.'-])\p{L}/gu, (m) => m.toUpperCase());
}
