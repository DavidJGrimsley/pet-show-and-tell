export type ReactionKind = 'like' | 'love';

export interface Pet {
  id: string;
  name: string;
  species: string;
  photoUri: string;
  personality: string;
  createdAt: string;
  isUserPet: boolean;
}

export interface PetPost {
  id: string;
  petId: string;
  photoUri: string;
  caption: string;
  createdAt: string;
}

export interface PetProfileInput {
  name: string;
  species: string;
  photoUri: string;
  personality: string;
}

export interface PetPostInput {
  petId: string;
  photoUri: string;
  caption: string;
}

export interface PetComment {
  id: string;
  postId: string;
  body: string;
  createdAt: string;
}

export interface PetCommentInput {
  postId: string;
  body: string;
}

export const MAX_COMMENT_LENGTH = 180;

export function normalizeCommentBody(body: string): string {
  const trimmed = typeof body === 'string' ? body.trim() : '';
  if (!trimmed) {
    throw new Error('Write a comment before posting.');
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comments must be ${MAX_COMMENT_LENGTH} characters or fewer.`);
  }
  return trimmed;
}

export interface PetSnapshot {
  pets: Pet[];
  posts: PetPost[];
  reactions: Record<string, ReactionKind>;
  comments: PetComment[];
  commentReactions: Record<string, ReactionKind>;
}
