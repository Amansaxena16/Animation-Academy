// Institute details. Phase 4 replaces these with SiteSettings from GET /api/v1/site/;
// until then they are the fallback (PROJECT_GUIDE §1).
export const SITE = {
  name: "Animation Academy",
  tagline: "An ISO 9001:2000 Certified Multimedia Institute",
  runBy: "IOCSGT Computer Education",
  address: "107/235 Nehru Nagar, Kanpur, Uttar Pradesh 208012",
  phones: ["8707447880", "9336202125"],
  email: "info@animationacademy.in",
  registrationFee: 250,
} as const;

export const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Admission", href: "/admission" },
  { label: "About", href: "/about" },
  { label: "Updates", href: "/updates" },
  { label: "Contact", href: "/contact" },
] as const;
