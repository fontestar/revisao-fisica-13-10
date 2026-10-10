import Link from "next/link";
import { SectionLabel, EmptyState, VideoCard } from "@/components/ui";
import { allVideos, review, type VideoKind } from "@/content";

export const metadata = {
  title: `Videoaulas · ${review.kicker}`,
};

/** Ordem sugerida de estudo: visão geral → teoria → exercícios. */
const SECTIONS: { kind: VideoKind; step: string; title: string; text: string }[] = [
  {
    kind: "aulao",
    step: "1",
    title: "Comece pela visão geral",
    text: "Uma aula única que passa por todo o conteúdo. Assista antes de estudar as partes, para saber aonde cada assunto leva, ou use para revisar tudo de uma vez.",
  },
  {
    kind: "teoria",
    step: "2",
    title: "Aprofunde a teoria",
    text: "Aulas curtas, um assunto por vez. Volte a elas quando algum tópico da revisão não ficar claro.",
  },
  {
    kind: "exercicios",
    step: "3",
    title: "Treine com exercícios",
    text: "Questões resolvidas, separadas por capítulo. Pause o vídeo, tente resolver e só depois veja a resolução.",
  },
];

const partLabel = (n: number) => `Parte ${String(n).padStart(2, "0")}`;

export default function VideoaulasPage() {
  const videos = allVideos();
  const grouped = SECTIONS.map((section) => ({
    ...section,
    items: videos.filter(({ video }) => (video.kind ?? "teoria") === section.kind),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <SectionLabel>Recursos gerais</SectionLabel>
        <h1 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">Aulas em vídeo</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          Organizadas na ordem em que vale a pena estudar. Todos os vídeos abrem no YouTube, em uma nova aba. Cada parte da
          revisão também mostra, no topo, as videoaulas que combinam com ela.
        </p>

        {grouped.length > 0 ? (
          <div className="mt-10 flex flex-col gap-12">
            {grouped.map((section) => (
              <section key={section.kind} aria-labelledby={`sec-${section.kind}`}>
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-display text-sm font-semibold text-brand"
                  >
                    {section.step}
                  </span>
                  <div>
                    <h2 id={`sec-${section.kind}`} className="font-display text-xl font-medium text-ink">
                      {section.title}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft">{section.text}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {section.items.map(({ video, parts }) => (
                    <div key={video.id} className="flex flex-col">
                      <VideoCard
                        video={video}
                        eyebrow={parts.length === review.parts.length ? "Todas as partes" : parts.map((p) => partLabel(p.number)).join(" · ")}
                      />
                      {parts.length > 0 ? (
                        <p className="mt-2 pl-1 text-xs leading-relaxed text-ink-faint">
                          Combina com:{" "}
                          {parts.map((p, i) => (
                            <span key={p.id}>
                              {i > 0 ? ", " : ""}
                              <Link href={`/partes/${p.id}`} className="text-ink-soft underline-offset-2 hover:underline">
                                {p.title}
                              </Link>
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-10"
            title="As videoaulas aparecerão aqui."
            description="Nenhuma videoaula disponível no momento."
          />
        )}
      </div>
    </div>
  );
}
