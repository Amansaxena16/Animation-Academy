import type { components } from "./api";

// Generated from the API schema (npm run api-types); re-exported under readable names.
type Schemas = components["schemas"];

export type AdminDashboard = Schemas["AdminDashboard"];
export type AdminEnrollment = Schemas["AdminEnrollment"];
export type AdminStudentRow = Schemas["AdminStudentList"];
export type AdminStudent = Schemas["AdminStudent"];
export type AdminStudentCreated = Schemas["AdminStudentCreated"];
export type AdminCertificate = Schemas["AdminCertificate"];
export type AdminCourse = Schemas["AdminCourse"];
export type AdminAnnouncement = Schemas["AdminAnnouncement"];
export type AdminSite = Schemas["AdminSite"];
export type AdminContactMessage = Schemas["AdminContactMessage"];

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
