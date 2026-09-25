import { WHY } from "@/lib/site";

export function WhyGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {WHY.map(({ title, text, icon: Icon }) => (
        <div
          key={title}
          className="border-line bg-surface-raised flex flex-col gap-3 rounded-lg border p-6"
        >
          <span className="bg-brand-soft text-brand-ink grid size-11 place-items-center rounded-md">
            <Icon className="size-[22px]" aria-hidden />
          </span>
          <h3 className="type-h3 m-0">{title}</h3>
          <p className="text-ink-muted m-0 text-[15px]">{text}</p>
        </div>
      ))}
    </div>
  );
}
