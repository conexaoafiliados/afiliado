export type GroupMessage = {
  id: number;
  userId: number;
  content: string;
  imageUrl: string | null;
  likes: number;
  commentCount: number;
  liked: boolean;
  createdAt: Date | string;
  authorName: string;
  authorUsername: string | null;
  authorProfileImageUrl: string | null;
  authorRole: "user" | "admin";
  isMock?: boolean;
};

export const MOCK_GROUP_MESSAGES: GroupMessage[] = [
  {
    id: -1,
    userId: 0,
    content: "Bom dia! Alguém já testou a nova campanha de amostras? Estou com dúvida no link do produto.",
    imageUrl: null,
    likes: 1,
    commentCount: 0,
    liked: false,
    createdAt: new Date(Date.now() - 6 * 3600000),
    authorName: "Erica Oliveira",
    authorUsername: "erica_oliveira",
    authorProfileImageUrl: null,
    authorRole: "user",
    isMock: true,
  },
  {
    id: -2,
    userId: 0,
    content: "Consegui minha primeira venda ontem 🎉 Obrigada a todos que ajudaram no grupo!",
    imageUrl: null,
    likes: 3,
    commentCount: 2,
    liked: false,
    createdAt: new Date(Date.now() - 4 * 3600000),
    authorName: "Michelle Chain Barreto",
    authorUsername: "michelle_chain",
    authorProfileImageUrl: null,
    authorRole: "user",
    isMock: true,
  },
  {
    id: -3,
    userId: 0,
    content: "Preciso de orientação: recebi punição por conteúdo não original, mas gravei tudo do zero. Alguém passou por isso?",
    imageUrl: null,
    likes: 2,
    commentCount: 1,
    liked: false,
    createdAt: new Date(Date.now() - 2 * 3600000),
    authorName: "João Creator",
    authorUsername: "joao_creator",
    authorProfileImageUrl: null,
    authorRole: "user",
    isMock: true,
  },
  {
    id: -4,
    userId: 0,
    content: "Alguém vai no treinamento de Lives na segunda? Podemos combinar de assistir juntos.",
    imageUrl: null,
    likes: 0,
    commentCount: 0,
    liked: false,
    createdAt: new Date(Date.now() - 1 * 3600000),
    authorName: "Marina Silva",
    authorUsername: "marina_silva",
    authorProfileImageUrl: null,
    authorRole: "admin",
    isMock: true,
  },
];

export const MOCK_GROUP_MEMBERS = {
  onlineCount: 3,
  totalCount: 8,
  members: [
    { id: 1, name: "Leo", username: "leo_admin", role: "admin" as const, profileImageUrl: null, isOnline: true, isSelf: false },
    { id: 2, name: "Marina Silva", username: "marina_silva", role: "admin" as const, profileImageUrl: null, isOnline: true, isSelf: false },
    { id: 3, name: "Erica Oliveira", username: "erica_oliveira", role: "user" as const, profileImageUrl: null, isOnline: true, isSelf: false },
    { id: 4, name: "Michelle Chain Barreto", username: "michelle_chain", role: "user" as const, profileImageUrl: null, isOnline: false, isSelf: false },
    { id: 5, name: "João Creator", username: "joao_creator", role: "user" as const, profileImageUrl: null, isOnline: false, isSelf: false },
    { id: 6, name: "Tairine", username: "tairine", role: "user" as const, profileImageUrl: null, isOnline: false, isSelf: false },
    { id: 7, name: "Andrezia", username: "andrezia", role: "user" as const, profileImageUrl: null, isOnline: false, isSelf: false },
    { id: 8, name: "Carlos", username: "carlos_shop", role: "user" as const, profileImageUrl: null, isOnline: false, isSelf: false },
  ],
};

export function formatMessageTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}
