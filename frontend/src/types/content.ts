import type { components } from "./api";

// Generated from the API schema (npm run api-types); re-exported under readable names.
type Schemas = components["schemas"];

export type Site = Schemas["Site"];
export type Stat = Schemas["Stat"];
export type Announcement = Schemas["Announcement"];
export type AnnouncementCategory = Schemas["AnnouncementCategoryEnum"];
export type ContactRequest = Schemas["ContactRequest"];
