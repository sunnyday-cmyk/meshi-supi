import RouletteClient from "./RouletteClient";

type PageProps = {
  params: { id: string };
};

export default function RoulettePage({ params }: PageProps) {
  return <RouletteClient sessionId={params.id} />;
}
