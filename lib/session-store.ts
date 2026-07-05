"use client";

const MEMBER_KEY_PREFIX = "meshispin-member";

type StoredMember = {
  memberId: string;
  name: string;
  isHost: boolean;
};

function key(sessionId: string) {
  return `${MEMBER_KEY_PREFIX}:${sessionId}`;
}

export function saveMemberIdentity(sessionId: string, value: StoredMember) {
  localStorage.setItem(key(sessionId), JSON.stringify(value));
}

export function getMemberIdentity(sessionId: string): StoredMember | null {
  const raw = localStorage.getItem(key(sessionId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredMember;
  } catch {
    return null;
  }
}
