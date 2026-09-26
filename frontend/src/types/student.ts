import type { components } from "./api";

// Generated from the API schema (npm run api-types); re-exported under readable names.
type Schemas = components["schemas"];

export type Dashboard = Schemas["Dashboard"];
export type Profile = Schemas["Profile"];
export type ProfileUpdate = Schemas["PatchedProfileRequest"];
export type MyEnrollment = Schemas["MyEnrollment"];
export type EnrollmentStatus = Schemas["EnrollmentStatusEnum"];
export type StudentStatus = Schemas["StudentStatusEnum"];
