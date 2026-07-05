export type SessionStatus = "waiting" | "voting" | "roulette" | "done";

export type SessionConditions = {
  genres: string[];
  budget: number;
  people: number;
  transport: string;
  travelMinutes: number;
  extras: string[];
  /** 投票カウントダウン秒（ホスト開始時に vote_ends_at へ反映） */
  voteSeconds: number;
};

export type PlaceCandidate = {
  placeId: string;
  name: string;
  rating?: number;
  priceLevel?: number;
  distanceText?: string;
  emoji?: string;
  lat?: number;
  lng?: number;
  vicinity?: string;
};

export type SessionRecord = {
  id: string;
  host_id: string | null;
  conditions: SessionConditions;
  candidates: PlaceCandidate[];
  status: SessionStatus;
  vote_ends_at: string | null;
  created_at: string;
};

export type MemberRecord = {
  id: string;
  session_id: string;
  name: string;
  is_host: boolean;
  joined_at: string;
};

export type VoteRecord = {
  id: string;
  session_id: string;
  member_id: string;
  place_id: string;
  created_at: string;
};

export type RouletteAdditionRecord = {
  id: string;
  session_id: string;
  member_id: string;
  place_name: string;
  place_id: string | null;
};
