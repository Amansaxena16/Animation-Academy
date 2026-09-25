// Values, client-side checks and step layout for the admission form. The checks mirror the
// API's rules (students/serializers.py) so most mistakes are caught before a request.

export const STEPS = ["Account", "Personal", "Education", "Course"] as const;
export const API_STEPS = [
  "account",
  "personal",
  "education",
  "course",
] as const;

export const EXAMS = [
  "High School",
  "Intermediate",
  "Graduation",
  "Post Graduation",
] as const;
export const EMPLOYMENT = [
  "Student",
  "Unemployed",
  "Employed",
  "Self-employed",
  "Part-time",
] as const;
export const GENDERS = ["Male", "Female", "Other"] as const;

export interface Qualification {
  exam: string;
  year: string;
  board: string;
  subject: string;
  percentage: string;
}

export interface Values {
  email: string;
  password: string;
  confirm: string;
  name: string;
  father_name: string;
  dob: string;
  gender: string;
  mobile: string;
  phone: string;
  address: string;
  pincode: string;
  city: string;
  qualifications: Qualification[];
  course: string;
  employment: string;
  accept_no_refund: boolean;
}

export type Errors = Partial<Record<keyof Values | "photo", string>>;

export const emptyValues = (course = ""): Values => ({
  email: "",
  password: "",
  confirm: "",
  name: "",
  father_name: "",
  dob: "",
  gender: "",
  mobile: "",
  phone: "",
  address: "",
  pincode: "",
  city: "Kanpur",
  qualifications: EXAMS.map((exam) => ({
    exam,
    year: "",
    board: "",
    subject: "",
    percentage: "",
  })),
  course,
  employment: "",
  accept_no_refund: false,
});

/** Which step each field lives on, to jump back to the first problem. */
export const FIELD_STEP: Record<string, number> = {
  email: 0,
  password: 0,
  confirm: 0,
  name: 1,
  father_name: 1,
  dob: 1,
  gender: 1,
  mobile: 1,
  phone: 1,
  address: 1,
  pincode: 1,
  city: 1,
  photo: 1,
  qualifications: 2,
  course: 3,
  employment: 3,
  accept_no_refund: 3,
};

export const STEP_FIELDS: (keyof Values)[][] = [
  ["email", "password"],
  [
    "name",
    "father_name",
    "dob",
    "gender",
    "mobile",
    "phone",
    "address",
    "pincode",
    "city",
  ],
  ["qualifications"],
  ["course", "employment", "accept_no_refund"],
];

const digits = (v: string) => v.replace(/\D/g, "");
export const normaliseMobile = (v: string) =>
  digits(v)
    .replace(/^91(?=\d{10}$)/, "")
    .replace(/^0(?=\d{10}$)/, "");

function checkQualifications(rows: Qualification[]): string | undefined {
  const thisYear = new Date().getFullYear();
  for (const row of rows) {
    const year = row.year.trim();
    const pct = row.percentage.trim().replace(/%$/, "");
    if (year && (!/^\d{4}$/.test(year) || +year < 1950 || +year > thisYear))
      return `${row.exam}: enter the year you passed, e.g. 2020.`;
    if (pct && (Number.isNaN(Number(pct)) || +pct < 0 || +pct > 100))
      return `${row.exam}: the percentage must be between 0 and 100.`;
  }
  if (!rows[0].year.trim() || !rows[0].board.trim())
    return "Fill in at least the High School row — year and board.";
}

/** Client-side check of one step. */
export function checkStep(step: number, v: Values): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim()))
      e.email = "Enter a valid email, e.g. name@example.com";
    if (v.password.length < 8) e.password = "Use at least 8 characters.";
    else if (v.confirm !== v.password)
      e.confirm = "The two passwords don't match.";
  }
  if (step === 1) {
    const name = v.name.trim().replace(/\s+/g, " ");
    if (name.length < 3 || !/^[A-Za-z .']+$/.test(name))
      e.name =
        "Enter your full name in capitals, as it should appear on the certificate.";
    if (v.father_name.trim().length < 3)
      e.father_name = "Father's name is required.";
    if (!v.dob) e.dob = "Enter your date of birth.";
    if (v.address.trim().length < 5) e.address = "Address is required.";
    if (!/^[1-9]\d{5}$/.test(v.pincode.trim()))
      e.pincode = "Enter a 6-digit pincode, e.g. 208012.";
    if (!/^[6-9]\d{9}$/.test(normaliseMobile(v.mobile)))
      e.mobile = "Enter a 10-digit mobile number.";
    const phone = digits(v.phone);
    if (v.phone.trim() && (phone.length < 6 || phone.length > 12))
      e.phone = "Enter a valid phone number, or leave it empty.";
  }
  if (step === 2) {
    const problem = checkQualifications(v.qualifications);
    if (problem) e.qualifications = problem;
  }
  if (step === 3) {
    if (!v.course) e.course = "Choose a course from the list.";
    if (!v.employment) e.employment = "Choose your employment status.";
    if (!v.accept_no_refund)
      e.accept_no_refund =
        "Please confirm you understand that no refund is allowed after confirmation.";
  }
  return e;
}

/** The API payload for one step (only that step's fields). */
export function stepData(step: number, v: Values): Record<string, unknown> {
  const data: Record<string, unknown> = Object.fromEntries(
    STEP_FIELDS[step].map((f) => [f, v[f]]),
  );
  if (step === 0) data.name = v.name; // lets the API compare the password with the name
  return data;
}

// A draft (everything but the password and photo) survives a page refresh in this tab.
const DRAFT_KEY = "aa-admission-draft";

export function saveDraft(v: Values) {
  try {
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...v, password: "", confirm: "" }),
    );
  } catch {
    /* storage unavailable: the form still works */
  }
}

export function loadDraft(): Partial<Values> | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<Values>) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing to clear */
  }
}
