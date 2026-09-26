"use client";

import { Eye, EyeOff, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Form";
import { ConfirmModal } from "@/components/ui/Modal";
import { Pager, Table } from "@/components/ui/Table";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { PAGE_SIZE, useAdminAction, useAdminPage } from "@/lib/admin";
import { ApiError } from "@/lib/api";
import { formatDateShort, todayISO } from "@/lib/format";
import { announcementTone } from "@/lib/status";
import type { AdminAnnouncement } from "@/types/admin";

const CATEGORIES = [
  "General",
  "Holiday",
  "Course Update",
  "Exam",
  "Event",
  "Important Notice",
];

interface Draft {
  id?: number;
  title: string;
  text: string;
  category: string;
  date: string;
  published: boolean;
}

const blank = (): Draft => ({
  title: "",
  text: "",
  category: "General",
  date: todayISO(),
  published: true,
});

export default function AnnouncementsPage() {
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<AdminAnnouncement | null>(null);

  const { data, isPending, isError } = useAdminPage<AdminAnnouncement>(
    "announcements",
    {
      published: filter === "all" ? undefined : filter,
      page,
    },
  );
  const create = useAdminAction<Draft>("POST", () => "announcements/");
  const update = useAdminAction<Draft>(
    "PATCH",
    (d) => `announcements/${d.id}/`,
  );
  const remove = useAdminAction<number>(
    "DELETE",
    (id) => `announcements/${id}/`,
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setErrors({});
    try {
      await (draft.id ? update : create).mutateAsync(draft);
      toast({
        title: draft.id ? "Announcement saved" : "Announcement added",
        text: draft.published
          ? "It's on the website now."
          : "Saved as a draft (not on the website).",
      });
      setDraft(null);
    } catch (err) {
      if (err instanceof ApiError)
        setErrors(
          Object.fromEntries(
            Object.entries(err.errors).map(([k, v]) => [k, v[0]]),
          ),
        );
      toast({ title: "Couldn't save", tone: "danger" });
    }
  };

  const togglePublish = async (a: AdminAnnouncement) => {
    try {
      await update.mutateAsync({ ...a, published: !a.published } as Draft);
      toast({
        title: a.published ? "Hidden from the website" : "Published",
        text: a.title,
      });
    } catch {
      toast({ title: "Couldn't update", tone: "danger" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Announcements"
        text="Holidays, new batches, exams and events on the Updates page, the home page and student dashboards."
        actions={
          !draft && (
            <Button onClick={() => setDraft(blank())}>
              <Plus aria-hidden /> New Announcement
            </Button>
          )
        }
      />

      {draft && (
        <Card>
          <CardHeader
            title={draft.id ? "Edit announcement" : "New announcement"}
          />
          <CardBody>
            <form
              onSubmit={save}
              noValidate
              className="grid gap-5 sm:grid-cols-2"
            >
              <Field
                label="Title"
                required
                error={errors.title}
                className="sm:col-span-2"
              >
                {(p) => (
                  <Input
                    {...p}
                    maxLength={120}
                    value={draft.title}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                    placeholder="Institute closed for Diwali"
                  />
                )}
              </Field>
              <Field
                label="Details"
                required
                help="One or two sentences (up to 300 characters)."
                error={errors.text}
                className="sm:col-span-2"
              >
                {(p) => (
                  <Textarea
                    {...p}
                    rows={2}
                    maxLength={300}
                    className="min-h-0"
                    value={draft.text}
                    onChange={(e) =>
                      setDraft({ ...draft, text: e.target.value })
                    }
                  />
                )}
              </Field>
              <Field label="Category" error={errors.category}>
                {(p) => (
                  <Select
                    {...p}
                    value={draft.category}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field
                label="Date"
                required
                help="The day it's about (holiday, exam, event), or today."
                error={errors.date}
              >
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    value={draft.date}
                    onChange={(e) =>
                      setDraft({ ...draft, date: e.target.value })
                    }
                  />
                )}
              </Field>
              <Checkbox
                label="Published (show on the website)"
                checked={draft.published}
                onChange={(e) =>
                  setDraft({ ...draft, published: e.target.checked })
                }
                className="sm:col-span-2"
              />
              <div className="flex gap-3 sm:col-span-2">
                <Button
                  type="submit"
                  loading={create.isPending || update.isPending}
                >
                  {draft.id ? "Save" : "Add Announcement"}
                </Button>
                <Button variant="secondary" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <SegmentedControl
        label="Filter"
        items={[
          { key: "all", label: "All" },
          { key: "true", label: "Published" },
          { key: "false", label: "Drafts" },
        ]}
        active={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
      />
      {isError && (
        <Alert tone="danger">
          Announcements didn&apos;t load. Refresh the page to try again.
        </Alert>
      )}
      <Card className="overflow-hidden">
        {isPending || !data ? (
          <div className="flex flex-col gap-3 p-6">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : (
          <>
            <Table
              caption="Announcements"
              rows={data.results}
              rowKey={(a) => String(a.id)}
              empty={
                <EmptyState
                  icon={<Megaphone />}
                  title="No announcements"
                  text="Post holidays, new batches and exam dates here."
                />
              }
              columns={[
                {
                  key: "date",
                  header: "Date",
                  render: (a) => formatDateShort(a.date),
                },
                {
                  key: "title",
                  header: "Announcement",
                  render: (a) => (
                    <div className="min-w-[220px]">
                      <b className="block">{a.title}</b>
                      <small className="text-ink-muted line-clamp-1">
                        {a.text}
                      </small>
                    </div>
                  ),
                },
                {
                  key: "category",
                  header: "Category",
                  render: (a) => (
                    <Badge tone={announcementTone[a.category ?? "General"]}>
                      {a.category}
                    </Badge>
                  ),
                },
                {
                  key: "published",
                  header: "Website",
                  render: (a) =>
                    a.published ? (
                      <Badge tone="success" dot>
                        Published
                      </Badge>
                    ) : (
                      <Badge dot>Draft</Badge>
                    ),
                },
                {
                  key: "actions",
                  header: "Actions",
                  actions: true,
                  render: (a) => (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={
                          a.published ? `Hide ${a.title}` : `Publish ${a.title}`
                        }
                        onClick={() => togglePublish(a)}
                      >
                        {a.published ? <EyeOff /> : <Eye />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${a.title}`}
                        onClick={() => setDraft({ ...(a as Draft) })}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Delete ${a.title}`}
                        className="text-danger-ink"
                        onClick={() => setDeleting(a)}
                      >
                        <Trash2 />
                      </Button>
                    </>
                  ),
                },
              ]}
            />
            <Pager
              page={page}
              pageSize={PAGE_SIZE}
              count={data.count}
              onPage={setPage}
            />
          </>
        )}
      </Card>

      <ConfirmModal
        open={!!deleting}
        title={`Delete “${deleting?.title}”?`}
        text="It's removed from the website and the admin. To keep it but hide it, unpublish it instead."
        confirmLabel="Delete Announcement"
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          try {
            await remove.mutateAsync(deleting!.id);
            toast({ title: "Announcement deleted", tone: "info" });
          } catch {
            toast({ title: "Couldn't delete", tone: "danger" });
          } finally {
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
