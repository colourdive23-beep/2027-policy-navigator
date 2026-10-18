import type { Profile } from '../types';

const PROFILE_KEY = 'pn2027:profile';
const DRAFT_KEY = 'pn2027:draft';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 저장 없이 동작 */
  }
}

export const loadProfile = () => read<Profile | null>(PROFILE_KEY, null);
export const saveProfile = (p: Profile | null) => write(PROFILE_KEY, p);
export const loadDraft = () => read<{ profile: Profile; step: number } | null>(DRAFT_KEY, null);
export const saveDraft = (d: { profile: Profile; step: number } | null) => write(DRAFT_KEY, d);

// 제도별 체크리스트 저장은 src/lib/checklists.ts 에 있습니다.
