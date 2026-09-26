"use client";

import { ArrowLeft, Download, Link2, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { Certificate } from "@/components/certificate/Certificate";
import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { downloadCertificate, useCertificate } from "@/lib/student";

export default function CertificatePage() {
  const { code } = useParams<{ code: string }>();
  const { data, isPending, error } = useCertificate(code);
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      await downloadCertificate(data!.code);
    } catch {
      toast({
        title: "Download failed",
        text: "Please try again in a moment.",
        tone: "danger",
      });
    } finally {
      setDownloading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data!.verify_url);
      toast({
        title: "Verification link copied",
        text: data!.verify_url.replace(/^https?:\/\//, ""),
      });
    } catch {
      toast({
        title: "Couldn't copy",
        text: data!.verify_url,
        tone: "warning",
      });
    }
  };

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="flex flex-col gap-4">
        <Alert
          tone="danger"
          title={
            notFound ? "Certificate not found" : "This certificate didn't load"
          }
        >
          {notFound
            ? "There's no certificate with this ID on your account."
            : "Refresh the page to try again."}
        </Alert>
        <ButtonLink
          href="/student/certificates"
          variant="secondary"
          className="self-start"
        >
          <ArrowLeft aria-hidden /> All Certificates
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <Link
            href="/student/certificates"
            className="text-ink-muted hover:text-navy-ink inline-flex items-center gap-1.5 text-sm no-underline"
          >
            <ArrowLeft className="size-4" aria-hidden /> Certificates
          </Link>
          <h1 className="type-h1 m-0">{data?.course_name ?? "Certificate"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={download} loading={downloading} disabled={!data}>
            <Download aria-hidden /> Download PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.print()}
            disabled={!data}
          >
            <Printer aria-hidden /> Print
          </Button>
          <Button variant="secondary" onClick={copyLink} disabled={!data}>
            <Link2 aria-hidden /> Copy Verification Link
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1000px] print:max-w-none">
        {isPending || !data ? (
          <Skeleton className="aspect-[1.414] w-full rounded-sm" />
        ) : (
          <Certificate data={data} />
        )}
      </div>

      {data && (
        <p className="text-ink-muted m-0 text-center text-sm print:hidden">
          Anyone can check this certificate at{" "}
          <a href={data.verify_url} className="text-navy-ink font-semibold">
            {data.verify_url.replace(/^https?:\/\//, "")}
          </a>
        </p>
      )}
    </div>
  );
}
