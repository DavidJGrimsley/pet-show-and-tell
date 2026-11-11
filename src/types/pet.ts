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

export interface PetSnapshot {
  pets: Pet[];
  posts: PetPost[];
  reactions: Record<string, ReactionKind>;
}
