import type { components } from "./api";

// Generated from the API schema (npm run api-types); re-exported under readable names.
type Schemas = components["schemas"];

export type Course = Schemas["CourseList"];
export type CourseDetail = Schemas["CourseDetail"];
export type SyllabusGroup = Schemas["SyllabusGroup"];
export type Category = Schemas["Category"];
export type CourseCategory = Schemas["CategoryEnum"];
export type CourseLevel = Schemas["LevelEnum"];
