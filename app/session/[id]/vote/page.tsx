import VoteClient from "./VoteClient";

type PageProps = {
  params: { id: string };
};

export default function VotePage({ params }: PageProps) {
  return <VoteClient sessionId={params.id} />;
}
