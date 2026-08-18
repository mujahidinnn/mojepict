import { Separator } from "@/components/ui/separator";

interface InfoPageSection {
  heading: string;
  body: string;
}

interface InfoPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  sections: InfoPageSection[];
  updated?: string;
}

export function InfoPage({ eyebrow, title, intro, sections, updated }: InfoPageProps) {
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {updated && (
          <span className="text-xs text-muted-foreground">{updated}</span>
        )}
        <p className="text-base text-muted-foreground max-w-prose">{intro}</p>
      </div>

      <Separator />

      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.heading} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {section.heading}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
