import { WHY } from "@/lib/site";

export function WhyGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {WHY.map(({ title, text, icon: Icon }) => (
        <div
          key={title}
          className="border-line bg-surface-raised hover:border-line-hover flex flex-col gap-3 rounded-lg border p-6 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 max-sm:grid max-sm:grid-cols-[40px_minmax(0,1fr)] max-sm:gap-x-3.5 max-sm:gap-y-1 max-sm:p-4"
        >
          <span className="bg-brand-soft text-brand-ink grid size-11 place-items-center rounded-md max-sm:row-span-2 max-sm:size-10">
            <Icon className="size-[22px]" aria-hidden />
          </span>
          <h3 className="type-h3 m-0">{title}</h3>
          <p className="text-ink-muted m-0 text-[15px]">{text}</p>
        </div>
      ))}
    </div>
  );
}
