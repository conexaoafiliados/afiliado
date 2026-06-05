export type AnnouncementFeedItem = {
  id: number;
  userId: number;
  title: string;
  content: string;
  imageUrl: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  likes: number;
  commentCount: number;
  liked: boolean;
  createdAt: Date | string;
  authorName: string;
  authorUsername: string | null;
  authorProfileImageUrl: string | null;
  authorRole: "user" | "admin";
  authorMemberSince: Date | string;
  isMock?: boolean;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);
const memberSince = new Date("2026-01-09");

export const MOCK_ANNOUNCEMENTS: AnnouncementFeedItem[] = [
  {
    id: -1,
    userId: 0,
    title: "🏆 RESULTADO DO DIA 1.6 | Gamificação | Mega Promo",
    content:
      "Parabéns a todos que participaram do primeiro dia da gamificação!\n\n@maria_creator e @joao_shop lideraram o ranking com vendas incríveis. Confira a tabela completa no grupo aberto e prepare-se: amanhã começam os bônus dobrados.\n\nContinue postando e marcando a equipe quando tiver dúvidas.",
    imageUrl: null,
    attachmentUrl: null,
    attachmentName: null,
    likes: 7,
    commentCount: 11,
    liked: false,
    createdAt: daysAgo(1),
    authorName: "Emily",
    authorUsername: "emily_admin",
    authorProfileImageUrl: null,
    authorRole: "admin",
    authorMemberSince: memberSince,
    isMock: true,
  },
  {
    id: -2,
    userId: 0,
    title: "🔥 GAMIFICAÇÃO MEGA PROMO | Mentoria com o Top #1",
    content:
      "⚠️ Atenção: alguns pontos da regulamentação foram atualizados.\n\nA competição de vendas vai de 1 a 13 de junho. Os 10 primeiros colocados ganham mentoria exclusiva com o creator #1 do TikTok Shop.\n\nLeia o regulamento completo no anexo e boa sorte a todos!",
    imageUrl: null,
    attachmentUrl: null,
    attachmentName: "Regulamento_Gamificacao_Mega_Promo.pdf",
    likes: 24,
    commentCount: 8,
    liked: false,
    createdAt: daysAgo(4),
    authorName: "Emily",
    authorUsername: "emily_admin",
    authorProfileImageUrl: null,
    authorRole: "admin",
    authorMemberSince: memberSince,
    isMock: true,
  },
  {
    id: -3,
    userId: 0,
    title: "📅 Novos treinamentos ao vivo na agenda",
    content:
      "Adicionamos três encontros ao calendário:\n\n• Terça 19h — Como escolher produtos campeões\n• Quinta 20h — Edição rápida para TikTok Shop\n• Sábado 10h — Tira-dúvidas ao vivo\n\nAcesse Treinamentos e Reuniões no menu e confirme presença.",
    imageUrl: null,
    attachmentUrl: null,
    attachmentName: null,
    likes: 12,
    commentCount: 3,
    liked: false,
    createdAt: daysAgo(6),
    authorName: "Equipe Conexões",
    authorUsername: null,
    authorProfileImageUrl: null,
    authorRole: "admin",
    authorMemberSince: memberSince,
    isMock: true,
  },
  {
    id: -4,
    userId: 0,
    title: "⭐ Campanhas Conexões Creators — inscrições abertas",
    content:
      "A nova rodada de campanhas já está no ar!\n\nCreators ativos na plataforma podem se candidatar a amostras gratuitas e comissões especiais. Prazo: até sexta-feira.\n\nVeja os detalhes em Categoria Start → Campanhas Conexões Creators.",
    imageUrl: null,
    attachmentUrl: null,
    attachmentName: null,
    likes: 18,
    commentCount: 5,
    liked: false,
    createdAt: daysAgo(9),
    authorName: "Equipe Conexões",
    authorUsername: null,
    authorProfileImageUrl: null,
    authorRole: "admin",
    authorMemberSince: memberSince,
    isMock: true,
  },
];
