/* eslint-disable @next/next/no-img-element -- fixed-size brand files inside a print layout */
import { formatDateLong } from "@/lib/format";
import type { Certificate as CertificateData } from "@/types/student";

import "./certificate.css";

/** Same rule as the PDF (students/pdf.py): shrink long names so they stay on one line. */
function nameSize(name: string) {
  const mm = Math.min(18.4, 240 / (Math.max(name.length, 1) * 0.72));
  return `${(mm / 2.97).toFixed(2)}cqw`; // 1cqw = 2.97mm on a 297mm-wide page
}

/** The printable Certificate of Completion. Always light, because it prints. */
export function Certificate({ data }: { data: CertificateData }) {
  const verifyHost = data.verify_url.replace(/^https?:\/\//, "");
  return (
    <div
      className="aa-cert"
      role="img"
      aria-label={`Certificate ${data.code} for ${data.student_name}, ${data.course_name}`}
    >
      <div className="aa-cert__corner">
        <i />
      </div>
      <div className="aa-cert__inner">
        <div className="aa-cert__logo">
          <div className="row">
            <img className="mark" src="/brand/aa-mark.png" alt="" />
            <img
              className="type"
              src="/brand/aa-wordmark.png"
              alt="Animation Academy"
            />
          </div>
          <span className="aa-cert__iso">
            IOCSGT Computer Education · Nehru Nagar, Kanpur
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div className="aa-cert__kicker">Certificate of Completion</div>
          <div className="aa-cert__lead">
            This certificate is proudly presented to
          </div>
          <div
            className="aa-cert__name"
            style={{ ["--name-size" as string]: nameSize(data.student_name) }}
          >
            {data.student_name}
          </div>
          <div className="aa-cert__lead">for successfully completing</div>
          <div className="aa-cert__course">{data.course_name}</div>
          <div className="aa-cert__meta">
            <span>
              ID <b>{data.code}</b>
            </span>
            <span>
              Duration <b>{data.duration}</b>
            </span>
            <span>
              Completed <b>{formatDateLong(data.issued_on)}</b>
            </span>
          </div>
        </div>

        <div className="aa-cert__foot">
          <div className="aa-cert__seal">
            <div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f08030"
                strokeWidth="1.75"
                aria-hidden
              >
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Verified
            </div>
          </div>
          <div className="aa-cert__verify">
            Check this certificate at <b>{verifyHost}</b>
          </div>
          <div className="aa-cert__sig">
            <span className="ink">{data.director_name}</span>
            {data.director_name && <b>{data.director_name}</b>}
            Director
          </div>
        </div>
      </div>
    </div>
  );
}
