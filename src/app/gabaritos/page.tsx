import Link from "next/link";
import { SectionLabel, EmptyState, MathText } from "@/components/ui";
import { AnswerRow } from "@/components/study";
import { getAnswerKey, review } from "@/content";

export const metadata = {
  title: `Gabaritos · ${review.kicker}`,
};

export default function GabaritosPage() {
  const answerKey = getAnswerKey();

  return (
    <div className="px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionLabel>Recursos gerais</SectionLabel>
        <h1 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">Gabarito</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          Respostas de todas as questões objetivas, agrupadas por parte. Onde houver explicação,
          é possível abri-la logo ao lado.
        </p>

        {answerKey.length > 0 ? (
          <div className="mt-10 flex flex-col gap-10">
            {answerKey.map(({ part, entries }) => (
              <section key={part.id}>
                <h2 className="font-display text-lg font-medium text-ink">
                  Parte {String(part.number).padStart(2, "0")} · {part.title}
                </h2>
                <ul className="mt-3 rounded-card border border-border bg-surface px-4">
                  {entries.map(({ question, letter }, i) => (
                    <AnswerRow key={question.id} number={i + 1} letter={letter} question={question} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}

        {review.professorExercises.length > 0 ? (
          <section className="mt-14">
            <SectionLabel>Aula de exercícios do professor</SectionLabel>
            <h2 className="mt-2 font-display text-2xl font-medium text-ink">Espelhos planos e esféricos</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Os enunciados completos estão no PDF da aula. Aqui ficam o assunto de cada questão, o que estudar e o gabarito
              transcrito. Resolva primeiro e use esta lista para conferir.
            </p>
            <ol className="mt-6 flex flex-col gap-3">
              {review.professorExercises.map((q) => (
                <li key={q.number} className="rounded-card border border-border bg-surface p-4 sm:p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-display text-base font-medium text-ink">
                      <span className="mr-2 text-ink-faint">{String(q.number).padStart(2, "0")}</span>
                      {q.topic}
                    </p>
                    <Link href={`/partes/${q.partId}`} className="text-xs font-medium text-brand hover:underline">
                      Revisar a teoria →
                    </Link>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-soft">{q.asks}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {q.study.map((t) => (
                      <span key={t} className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs text-ink-soft">
                        <MathText text={t} />
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 rounded-control bg-success-soft px-3 py-2 text-sm text-ink">
                    <span className="font-semibold text-success">Gabarito: </span>
                    <MathText text={q.answer} />
                  </p>
                  {q.check ? (
                    <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                      <MathText text={q.check} />
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {answerKey.length === 0 && review.professorExercises.length === 0 ? (
          <EmptyState
            className="mt-10"
            title="Nenhum gabarito disponível ainda."
            description="Nenhum gabarito disponível no momento."
          />
        ) : null}
      </div>
    </div>
  );
}
