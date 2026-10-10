import { notFound } from "next/navigation";
import { getAdjacentParts, getPart, getParts } from "@/content";
import { PartHeader, PartTabs, PartNavigation } from "@/components/study";

export function generateStaticParams() {
  return getParts().map((part) => ({ partId: part.id }));
}

export default async function PartPage({
  params,
}: {
  params: Promise<{ partId: string }>;
}) {
  const { partId } = await params;
  const part = getPart(partId);

  if (!part) {
    notFound();
  }

  const { prev, next } = getAdjacentParts(partId);

  return (
    <div className="px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <PartHeader part={part} />
        <PartTabs part={part} />
        <PartNavigation prev={prev} next={next} />
      </div>
    </div>
  );
}
