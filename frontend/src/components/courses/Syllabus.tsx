import type { SyllabusGroup } from "@/types/course";

const UNIT = 4;

function Topics({ items, start = 1 }: { items: string[]; start?: number }) {
  return (
    <ol start={start} className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((item, i) => (
        <li key={item} className="text-ink flex gap-3">
          <span className="bg-brand-soft text-brand-ink grid size-6 shrink-0 place-items-center rounded-full font-mono text-xs">
            {start + i}
          </span>
          <span className="pt-px">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** Information only: there are no online lessons. One group is shown in units of four
 *  topics; several groups (the PDM) are shown as semesters with their duration and tools. */
export function Syllabus({ groups }: { groups: SyllabusGroup[] }) {
  if (groups.length === 1 && !groups[0].title) {
    const items = groups[0].items;
    const units = Array.from(
      { length: Math.ceil(items.length / UNIT) },
      (_, i) => items.slice(i * UNIT, i * UNIT + UNIT),
    );
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {units.map((unit, i) => (
          <div
            key={i}
            className="border-line bg-surface-raised flex flex-col gap-3 rounded-lg border p-5"
          >
            <h3 className="type-overline text-brand-ink m-0">Unit {i + 1}</h3>
            <Topics items={unit} start={i * UNIT + 1} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div
          key={group.title}
          className="border-line bg-surface-raised flex flex-col gap-3 rounded-lg border p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="type-h3 m-0">{group.title}</h3>
            {group.duration && (
              <span className="text-accent-ink text-sm font-semibold">
                {group.duration}
              </span>
            )}
          </div>
          {group.tools && (
            <p className="text-ink-muted m-0 text-sm">
              Tools: <span className="text-ink">{group.tools}</span>
            </p>
          )}
          <Topics items={group.items} />
        </div>
      ))}
    </div>
  );
}
