"use client";

import {
  Award,
  BookOpen,
  Download,
  Pencil,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

import {
  Alert,
  Announcement,
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  CardBody,
  CardHeader,
  CellUser,
  Checkbox,
  ConfirmModal,
  CourseCard,
  EmptyState,
  FeeBox,
  Field,
  Input,
  Logo,
  Pager,
  PhotoUpload,
  RadioCard,
  SegmentedControl,
  Select,
  Skeleton,
  StatCard,
  Stepper,
  Table,
  Tabs,
  Textarea,
  useToast,
} from "@/components/ui";
import { enrollmentTone } from "@/lib/status";
import { useApplyTheme } from "@/lib/theme";
import type { Course } from "@/types/course";

const COURSE_DEFAULTS = {
  featured: true,
  image: null,
  schedule: "",
  next_batch_start: "",
  tag: "",
};
const COURSES: Course[] = [
  {
    ...COURSE_DEFAULTS,
    slug: "dca-acc",
    name: "DCA — Accounting",
    kind: "Diploma",
    category: "Accounting",
    level: "Beginner",
    description:
      "Computer fundamentals, MS Office and Tally Prime with GST, including GSTR1 and GSTR 3B return filing.",
    tag: "Most enrolled",
    monthly_fee: 800,
    first_month_fee: null,
    total_fee: 4800,
    months: 6,
    duration_label: "6 Months",
  },
  {
    ...COURSE_DEFAULTS,
    slug: "dwd",
    name: "DWD — Web Designing",
    kind: "Diploma",
    category: "Web Designing",
    level: "Advanced",
    description:
      "Photoshop, Flash and Dreamweaver through to HTML, CSS, PHP, MySQl and JavaScript (jQuery).",
    monthly_fee: 1000,
    first_month_fee: null,
    total_fee: 6000,
    months: 6,
    duration_label: "6 Months",
  },
  {
    ...COURSE_DEFAULTS,
    slug: "pdm",
    name: "Professional Diploma in Multimedia",
    kind: "Professional Diploma",
    category: "Multimedia",
    level: "Advanced",
    description:
      "Five semesters from graphic design and 2D animation through A/V editing, 3D modeling in Maya and ZBrush, to compositing in After Effect.",
    tag: "Flagship",
    monthly_fee: 3000,
    first_month_fee: 4000,
    total_fee: 55000,
    months: 18,
    duration_label: "18 Months",
  },
];

const ROWS = [
  {
    code: "EN-2107",
    name: "Aarav Mehta",
    student: "AA-STU-1042",
    course: "Desk Top Publishing",
    status: "Active",
  },
  {
    code: "EN-2150",
    name: "Nisha Bhatt",
    student: "AA-STU-1118",
    course: "Professional Diploma in Multimedia",
    status: "Pending",
  },
  {
    code: "EN-2058",
    name: "Sneha Kapoor",
    student: "AA-STU-1038",
    course: "DCA — Accounting",
    status: "Completed",
  },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-line type-h2 m-0 border-b pb-2">{title}</h2>
      {children}
    </section>
  );
}

export function Showcase() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tab, setTab] = useState<"overview" | "syllabus" | "fees">("overview");
  const [seg, setSeg] = useState<"all" | "active" | "completed">("all");
  const [modal, setModal] = useState(false);
  const [page, setPage] = useState(3);
  const [photo, setPhoto] = useState<File | null>(null);
  const toast = useToast();
  useApplyTheme(theme);

  return (
    <div className="bg-surface text-ink min-h-screen">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-10 md:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="type-overline text-accent-ink">
              Development only
            </span>
            <h1 className="type-display m-0">Components</h1>
          </div>
          <SegmentedControl
            label="Theme"
            items={[
              { key: "light", label: "Light" },
              { key: "dark", label: "Dark" },
            ]}
            active={theme}
            onChange={setTheme}
          />
        </header>

        <Section title="Logo">
          <div className="flex flex-wrap items-center gap-8">
            <Logo size="lg" href={null} />
            <Logo href={null} />
            <Logo size="sm" href={null} />
            <Logo markOnly href={null} />
          </div>
          <div className="bg-navy flex flex-wrap items-center gap-8 rounded-lg p-6">
            <Logo tone="inverse" href={null} />
          </div>
        </Section>

        <Section title="Type">
          <div className="flex flex-col gap-2">
            <span className="type-display-xl">
              Learn the tools. Build the work.
            </span>
            <span className="type-display">
              Professional Diploma in Multimedia
            </span>
            <span className="type-h1">DCA — Accounting</span>
            <span className="type-h2">Our courses</span>
            <span className="type-h3">Sem-IV 3D Modeling</span>
            <span className="rounded-pill bg-navy type-pill text-on-navy w-fit px-3 py-1">
              DWD — Web Designing
            </span>
            <span className="type-body-lg">
              A certified multimedia institute in Nehru Nagar, Kanpur.
            </span>
            <span className="type-body">
              Tally Prime with GST, including GSTR1 and GSTR 3B return filing.
            </span>
            <span className="type-overline text-accent-ink">
              ISO 9001:2000 certified
            </span>
            <span className="type-mono">AA-2026-000123</span>
            <span className="type-certificate-name">Aarav Mehta</span>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Explore Courses</Button>
            <Button variant="navy">Download Prospectus</Button>
            <Button variant="accent">Enroll Now</Button>
            <Button variant="secondary">View Details</Button>
            <Button variant="ghost">
              <Download /> Download
            </Button>
            <Button variant="danger">
              <Trash2 /> Delete
            </Button>
            <Button loading>Saving</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg">Register Now</Button>
            <Button size="sm" variant="secondary">
              <Pencil /> Edit
            </Button>
            <Button size="icon" variant="secondary" aria-label="Search">
              <Search />
            </Button>
            <div className="bg-navy rounded-md p-3">
              <Button variant="inverse">On Navy</Button>
            </div>
          </div>
        </Section>

        <Section title="Badges and avatars">
          <div className="flex flex-wrap gap-2">
            <Badge>Beginner</Badge>
            <Badge tone="info">Intermediate</Badge>
            <Badge tone="brand">Advanced</Badge>
            {Object.entries(enrollmentTone).map(([label, tone]) => (
              <Badge key={label} tone={tone} dot>
                {label}
              </Badge>
            ))}
            <Badge tone="navy">DWD — WEB DESIGNING</Badge>
            <Badge tone="accent">Flagship</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name="Aarav Mehta" size="sm" />
            <Avatar name="Sneha Kapoor" />
            <Avatar name="Rohan Gupta" size="lg" />
            <Avatar name="Ishita Verma" size="xl" />
          </div>
        </Section>

        <Section title="Course cards">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
          <div className="grid max-w-md gap-4">
            <FeeBox fee={COURSES[0]} />
            <FeeBox fee={COURSES[2]} />
          </div>
        </Section>

        <Section title="Stat cards">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={<Users />}
              value="1,248"
              label="Total students"
              delta={{ value: "12%" }}
            />
            <StatCard
              icon={<Award />}
              tone="amber"
              value="1,032"
              label="Certificates issued"
            />
            <StatCard
              icon={<BookOpen />}
              tone="blue"
              value="9"
              label="Courses offered"
            />
            <StatCard
              icon={<TrendingUp />}
              tone="green"
              value="84"
              label="Admissions in September"
            />
          </div>
        </Section>

        <Section title="Forms">
          <Stepper
            steps={["Account", "Personal", "Education", "Course"]}
            current={2}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name (in capitals)" required>
              {(p) => <Input {...p} defaultValue="AARAV MEHTA" />}
            </Field>
            <Field
              label="Email"
              required
              error="Enter a valid email, e.g. name@example.com"
            >
              {(p) => <Input {...p} defaultValue="aarav.mehta@gmail" />}
            </Field>
            <Field label="Mobile" valid help="Looks good">
              {(p) => <Input {...p} valid defaultValue="98110 45236" />}
            </Field>
            <Field label="Employment status">
              {(p) => (
                <Select {...p} defaultValue="Student">
                  {[
                    "Student",
                    "Unemployed",
                    "Employed",
                    "Self-employed",
                    "Part-time",
                  ].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Search courses" className="sm:col-span-2">
              {(p) => (
                <Input
                  {...p}
                  icon={<Search />}
                  placeholder="Try “Tally” or “CorelDraw”"
                />
              )}
            </Field>
            <Field
              label="Address"
              help="House number, street and area."
              className="sm:col-span-2"
            >
              {(p) => <Textarea {...p} />}
            </Field>
            <RadioCard name="course" defaultChecked>
              <b>DCA — Accounting</b>
              <br />
              <span className="text-ink-muted text-[13px]">
                6 Months · ₹800/month
              </span>
            </RadioCard>
            <RadioCard name="course">
              <b>Desk Top Publishing</b>
              <br />
              <span className="text-ink-muted text-[13px]">
                6 Months · ₹800/month
              </span>
            </RadioCard>
            <Checkbox label="I understand that no refund is allowed after confirmation of admission." />
            <PhotoUpload value={photo} onChange={setPhoto} />
          </div>
        </Section>

        <Section title="Tabs, breadcrumbs, alerts">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Courses", href: "/courses" },
              { label: "DCA — Accounting" },
            ]}
          />
          <Tabs
            items={[
              { key: "overview", label: "Overview" },
              { key: "syllabus", label: "Syllabus" },
              { key: "fees", label: "Fees" },
            ]}
            active={tab}
            onChange={setTab}
          />
          <SegmentedControl
            label="Filter enrollments"
            items={[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "completed", label: "Completed" },
            ]}
            active={seg}
            onChange={setSeg}
          />
          <div className="grid gap-3">
            <Alert title="Admission requested">
              DCA — Accounting is awaiting confirmation.
            </Alert>
            <Alert tone="success" title="Admission confirmed">
              Aarav Mehta is now active in DCA — Accounting.
            </Alert>
            <Alert tone="warning">Registration closes on 5 October.</Alert>
            <Alert tone="danger" title="Check the form">
              Add your name and a valid email so we can reply.
            </Alert>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                toast({
                  title: "Profile saved",
                  text: "Your details are up to date.",
                })
              }
            >
              Show Success Toast
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast({
                  title: "Upload failed",
                  text: "The photo must be 2 MB or smaller.",
                  tone: "danger",
                })
              }
            >
              Show Error Toast
            </Button>
            <Button variant="danger" onClick={() => setModal(true)}>
              Open Confirm Modal
            </Button>
          </div>
        </Section>

        <Section title="Table and pager">
          <Card className="overflow-hidden">
            <CardHeader
              title="Enrollments"
              actions={<Button size="sm">Export</Button>}
            />
            <Table
              caption="Enrollments"
              rows={ROWS}
              rowKey={(r) => r.code}
              columns={[
                {
                  key: "student",
                  header: "Student",
                  render: (r) => (
                    <CellUser
                      avatar={<Avatar name={r.name} size="sm" />}
                      name={r.name}
                      sub={r.student}
                    />
                  ),
                },
                { key: "course", header: "Course", render: (r) => r.course },
                {
                  key: "code",
                  header: "Enrollment",
                  render: (r) => <span className="type-mono">{r.code}</span>,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => (
                    <Badge tone={enrollmentTone[r.status]} dot>
                      {r.status}
                    </Badge>
                  ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  actions: true,
                  render: (r) => (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${r.name}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${r.name}`}
                        className="text-danger-ink"
                      >
                        <Trash2 />
                      </Button>
                    </>
                  ),
                },
              ]}
            />
            <Pager page={page} pageSize={20} count={248} onPage={setPage} />
          </Card>
        </Section>

        <Section title="Announcements, empty and loading">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardBody>
                <Announcement
                  item={{
                    id: 1,
                    date: "2026-10-02",
                    category: "Holiday",
                    title: "Institute closed for Gandhi Jayanti",
                    text: "All batches resume on Friday, 3 October at regular timings.",
                  }}
                />
                <Announcement
                  item={{
                    id: 2,
                    date: "2026-09-28",
                    category: "Course Update",
                    title: "New batch: Professional Diploma in Multimedia",
                    text: "Sem-I Graphic Designing starts 12 October. 20 seats; registration closes 5 October.",
                  }}
                />
                <Announcement
                  item={{
                    id: 3,
                    date: "2026-10-06",
                    category: "Exam",
                    title: "CCC practical assessment",
                    text: "Course on Computer Concepts assessment in Lab 2. Bring your admit card.",
                  }}
                />
              </CardBody>
            </Card>
            <div className="flex flex-col gap-6">
              <Card>
                <EmptyState
                  icon={<Award />}
                  title="No certificates yet"
                  text="When the office marks a course as completed, its certificate appears here."
                  action={<Button variant="secondary">Browse Courses</Button>}
                />
              </Card>
              <Card pad className="flex flex-col gap-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </Card>
            </div>
          </div>
        </Section>
      </div>

      <ConfirmModal
        open={modal}
        title="Remove Aarav Mehta?"
        text="Their login is deactivated and they no longer appear in active lists. Enrollments and certificates are kept."
        confirmLabel="Remove Student"
        onCancel={() => setModal(false)}
        onConfirm={() => {
          setModal(false);
          toast({
            title: "Student removed",
            text: "Aarav Mehta has been deactivated.",
            tone: "info",
          });
        }}
      />
    </div>
  );
}
