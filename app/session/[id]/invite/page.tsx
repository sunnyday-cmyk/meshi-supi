import InviteClient from "./InviteClient";

type PageProps = {
  params: { id: string };
};

export default function InvitePage({ params }: PageProps) {
  return <InviteClient sessionId={params.id} />;
}
