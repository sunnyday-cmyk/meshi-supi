import { MemberRecord, PlaceCandidate, VoteRecord } from "@/types";

export type WheelItem = {
  key: string;
  label: string;
  place: PlaceCandidate;
};

function truncateLabel(text: string, max = 14): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function buildWheelItemsFromVotes(
  votes: VoteRecord[],
  members: MemberRecord[],
  candidates: PlaceCandidate[]
): WheelItem[] {
  const memberById = new Map(members.map((m) => [m.id, m]));
  const candidateByPlaceId = new Map(candidates.map((c) => [c.placeId, c]));

  return votes.map((vote) => {
    const member = memberById.get(vote.member_id);
    const candidate = candidateByPlaceId.get(vote.place_id);
    const shopName = candidate?.name ?? "不明な店";
    const voterName = member?.name ?? "ゲスト";
    const label = truncateLabel(`${shopName}（${voterName}）`);

    return {
      key: vote.id,
      label,
      place: candidate ?? {
        placeId: vote.place_id,
        name: shopName,
        emoji: "🍽️"
      }
    };
  });
}
