"use client";

import { Check, Mail, RotateCcw } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/admin/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, Skeleton } from "@/components/ui/EmptyState";
import { Pager } from "@/components/ui/Table";
import { SegmentedControl } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { PAGE_SIZE, useAdminAction, useAdminPage } from "@/lib/admin";
import { formatDateLong } from "@/lib/format";
import type { AdminContactMessage } from "@/types/admin";

export default function MessagesPage() {
  const toast = useToast();
  const [filter, setFilter] = useState<"false" | "true" | "all">("false");
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useAdminPage<AdminContactMessage>(
    "contact-messages",
    {
      handled: filter === "all" ? undefined : filter,
      page,
    },
  );
  const mark = useAdminAction<{ id: number; handled: boolean }>(
    "PATCH",
    (m) => `contact-messages/${m.id}/`,
    (m) => ({ handled: m.handled }),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/admin", label: "Dashboard" }}
        title="Messages"
        text="Sent from the Contact page. Call back, then mark the message as handled."
      />
      <SegmentedControl
        label="Filter"
        items={[
          { key: "false", label: "To answer" },
          { key: "true", label: "Handled" },
          { key: "all", label: "All" },
        ]}
        active={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(1);
        }}
      />
      {isError && (
        <Alert tone="danger">
          Messages didn&apos;t load. Refresh the page to try again.
        </Alert>
      )}
      {isPending || !data ? (
        <Skeleton className="h-40 rounded-lg" />
      ) : data.results.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Mail />}
            title={filter === "false" ? "All answered" : "No messages"}
            text="Messages from the website's Contact page appear here."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {data.results.map((m) => (
            <Card key={m.id} className="flex flex-col gap-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <b className="type-h3 block">{m.name}</b>
                  <span className="text-ink-muted text-[13px]">
                    {formatDateLong(m.created_at)}
                  </span>
                </div>
                {m.handled ? (
                  <Badge tone="success" dot>
                    Handled
                  </Badge>
                ) : (
                  <Badge tone="warning" dot>
                    To answer
                  </Badge>
                )}
              </div>
              {m.course && (
                <p className="text-ink-muted m-0 text-sm">
                  Interested in <b className="text-ink">{m.course}</b>
                </p>
              )}
              {m.message ? (
                <p className="text-ink m-0 whitespace-pre-line">{m.message}</p>
              ) : (
                <p className="text-ink-muted m-0 text-sm italic">
                  No message — asked for a call back.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {m.phone && (
                  <a
                    href={`tel:+91${m.phone}`}
                    className="text-navy-ink touch:min-h-11 inline-flex items-center font-semibold"
                  >
                    Call {m.phone}
                  </a>
                )}
                {m.email && (
                  <a
                    href={`mailto:${m.email}`}
                    className="text-navy-ink touch:min-h-11 inline-flex items-center font-semibold"
                  >
                    {m.email}
                  </a>
                )}
                <Button
                  size="sm"
                  variant={m.handled ? "ghost" : "secondary"}
                  className="ml-auto"
                  loading={mark.isPending && mark.variables?.id === m.id}
                  onClick={async () => {
                    try {
                      await mark.mutateAsync({ id: m.id, handled: !m.handled });
                      toast({
                        title: m.handled
                          ? "Moved back to “To answer”"
                          : "Marked as handled",
                        text: m.name,
                      });
                    } catch {
                      toast({ title: "Couldn't update", tone: "danger" });
                    }
                  }}
                >
                  {m.handled ? (
                    <RotateCcw aria-hidden />
                  ) : (
                    <Check aria-hidden />
                  )}
                  {m.handled ? "Not Handled" : "Mark Handled"}
                </Button>
              </div>
            </Card>
          ))}
          <Card>
            <Pager
              page={page}
              pageSize={PAGE_SIZE}
              count={data.count}
              onPage={setPage}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
