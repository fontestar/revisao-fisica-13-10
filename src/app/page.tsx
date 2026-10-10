import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  CalendarDays,
  Layers,
  ListChecks,
  PenLine,
  PlaySquare,
} from "lucide-react";
import {
  allVideos,
  getParts,
  review,
  totalDiscursiveQuestions,
  totalFlashcards,
  totalQuestions,
  totalVideos,
} from "@/content";
import {
  MetricCard,
  VideoCard,
  EmptyState,
  SectionLabel,
  StudyTip,
  HeroMotif,
} from "@/components/ui";
import { PartCard, ProgressSummary } from "@/components/study";
import { EasterEgg } from "@/components/easter-egg";

export default function HomePage() {
  const parts = getParts();
  // Mesma ordem da página de videoaulas: visão geral → teoria → exercícios.
  const kindOrder = { aulao: 0, teoria: 1, exercicios: 2 } as const;
  const videos = [...allVideos()].sort(
    (a, b) => kindOrder[a.video.kind ?? "teoria"] - kindOrder[b.video.kind ?? "teoria"],
  );
  const secondTip = review.studyTips[1];

  return (
    <div className="px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        {/* HERO */}
        <section className="relative overflow-hidden rounded-card bg-dot-grid">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 55%, transparent) 55%, var(--color-bg) 100%)",
            }}
            aria-hidden
          />
          <div className="relative grid gap-10 px-1 py-2 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-6">
            <div>
              <SectionLabel>{review.kicker}</SectionLabel>
              <h1 className="mt-4 max-w-xl font-display text-4xl font-medium leading-[1.08] text-ink sm:text-5xl lg:text-[3.4rem]">
                {review.title}
              </h1>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">{review.subtitle}</p>

              {review.identifier ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-sm text-ink-soft">
                  <CalendarDays className="h-4 w-4 text-ink-faint" aria-hidden />
                  {review.identifier}
                </p>
              ) : null}

              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft">{review.description}</p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {parts.length > 0 ? (
                  <Link
                    href={`/partes/${parts[0].id}`}
                    className="inline-flex items-center gap-2 rounded-control bg-brand px-5 py-3 text-sm font-semibold text-brand-contrast transition-opacity hover:opacity-90"
                  >
                    Começar revisão
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                ) : (
                  <Link
                    href="/partes"
                    className="inline-flex items-center gap-2 rounded-control bg-brand px-5 py-3 text-sm font-semibold text-brand-contrast transition-opacity hover:opacity-90"
                  >
                    Ver partes
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
                <Link
                  href="/videoaulas"
                  className="inline-flex items-center gap-2 rounded-control border border-border px-5 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-border-strong hover:text-ink"
                >
                  Ver videoaulas
                </Link>
              </div>
            </div>

            <HeroMotif className="hidden h-auto w-full max-w-[280px] justify-self-end lg:block" />
          </div>
        </section>

        {/* RESUMO */}
        <section className="mt-12 grid grid-cols-2 gap-3 sm:mt-16 sm:grid-cols-4">
          <MetricCard icon={Layers} value={parts.length} label="Partes" />
          <MetricCard icon={BookMarked} value={totalFlashcards()} label="Flashcards" />
          <MetricCard icon={ListChecks} value={totalQuestions()} label="Questões" />
          <MetricCard icon={PlaySquare} value={totalVideos()} label="Videoaulas" />
        </section>

        {/* PROGRESSO */}
        <section className="mt-12 rounded-card border border-border bg-surface p-6 sm:mt-16 sm:p-8">
          <ProgressSummary />
        </section>

        {/* PARTES */}
        <section className="mt-12 sm:mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <SectionLabel>Partes da revisão</SectionLabel>
              <h2 className="mt-2 font-display text-2xl font-medium text-ink sm:text-3xl">
                {parts.length > 0 ? `${parts.length} partes disponíveis` : "Partes da revisão"}
              </h2>
            </div>
            {parts.length > 0 ? (
              <Link href="/partes" className="hidden shrink-0 text-sm font-medium text-brand sm:inline">
                Ver todas →
              </Link>
            ) : null}
          </div>

          {parts.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {parts.map((part) => (
                <PartCard key={part.id} part={part} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6"
              title="As partes da revisão aparecerão aqui."
              description="Nenhuma parte disponível no momento."
            />
          )}
        </section>

        {/* QUESTÕES DISCURSIVAS */}
        <section className="mt-12 sm:mt-16">
          <SectionLabel>Recursos</SectionLabel>
          <Link
            href="/discursivas"
            className="group mt-4 flex flex-col gap-5 rounded-card border border-border bg-surface p-6 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between sm:p-7"
          >
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <PenLine className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-display text-xl font-medium text-ink sm:text-2xl">
                  Questões discursivas
                </h2>
                <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-ink-soft">
                  {totalDiscursiveQuestions() > 0
                    ? `${totalDiscursiveQuestions()} questões abertas que combinam o conteúdo das partes, com resolução passo a passo.`
                    : "As questões abertas desta revisão aparecerão aqui."}
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand">
              Resolver
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </section>

        {/* VIDEOAULAS */}
        <section className="mt-12 sm:mt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <SectionLabel>Recursos</SectionLabel>
              <h2 className="mt-2 font-display text-2xl font-medium text-ink sm:text-3xl">Videoaulas</h2>
              <p className="mt-1 text-sm text-ink-soft">Visão geral, teoria e exercícios em vídeo</p>
            </div>
            {videos.length > 0 ? (
              <Link href="/videoaulas" className="hidden shrink-0 text-sm font-medium text-brand sm:inline">
                Ver todas →
              </Link>
            ) : null}
          </div>

          {videos.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {videos.map(({ video, parts: covered }) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  eyebrow={
                    covered.length === parts.length
                      ? "Todas as partes"
                      : covered.length > 0
                        ? covered.map((p) => `Parte ${String(p.number).padStart(2, "0")}`).join(" · ")
                        : "Geral"
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6"
              title="As videoaulas aparecerão aqui."
              description="Nenhuma videoaula disponível no momento."
            />
          )}
        </section>

        {/* DICA */}
        {secondTip ? <StudyTip tip={secondTip} className="mt-12 sm:mt-16" /> : null}

        <EasterEgg className="mt-12 sm:mt-16" />
      </div>
    </div>
  );
}
