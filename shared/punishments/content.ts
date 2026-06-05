export const PUNISHMENT_INTRO = {
  title: "AVISO IMPORTANTE – PUNIÇÕES DA PLATAFORMA",
  preview:
    "O TikTok Shop está aplicando uma onda de punições automáticas devido ao reforço na moderação de conteúdos e respeito às Diretrizes da plataforma. Diversos creators estão sendo penalizados mesmo quando o produto e o conteúdo estão corretos. Segue as punições mais comuns e como fazer a defesa para recorrer.",
  authorName: "Leo",
  authorRole: "Administrador",
};

export type PunishmentType = {
  id: string;
  title: string;
  subtitle?: string;
  reasons: string[];
  defenseModel: string;
};

export const PUNISHMENT_TYPES: PunishmentType[] = [
  {
    id: "imagem-estatica",
    title: 'PUNIÇÃO: "IMAGEM ESTÁTICA"',
    subtitle: "Principalmente vídeos em IA",
    reasons: [
      "Vídeo criado com IA",
      "Animações muito leves (zoom suave, fade)",
      "Slides de imagens com pouca variação",
      "Transições sutis demais",
      "Sistema não identifica movimento como vídeo",
    ],
    defenseModel: `Solicito a revisão manual da penalidade aplicada por classificação incorreta de "imagem estática".

O conteúdo não se trata de imagem estática, mas sim de um vídeo com animações leves, transições visuais e/ou movimento gerado por IA, o que pode não ter sido corretamente identificado pelo sistema automatizado.

O material possui elementos de movimento contínuo, caracterizando formato de vídeo.

Solicito a análise por um revisor humano e a remoção da punição.`,
  },
  {
    id: "inconsistencia-video-produto",
    title: "PUNIÇÃO: INCONSISTÊNCIA ENTRE VÍDEO E PRODUTO",
    reasons: [
      "Produto fora da embalagem",
      "Close demais (não mostra o item completo)",
      "Uso diferente do nome do produto",
      "Mudança de cenário ou contexto",
      "Corte rápido que confunde o algoritmo",
    ],
    defenseModel: `Solicito a revisão manual da punição aplicada por suposta inconsistência entre o vídeo e o produto anunciado.

O vídeo apresenta exclusivamente o produto anunciado, sem divergência de características, funcionalidades ou uso, respeitando integralmente a descrição do anúncio.

Não há manipulação visual, uso de produto diferente ou edição enganosa.

Solicito a reavaliação manual e a retirada da punição.`,
  },
  {
    id: "conteudo-enganoso",
    title: "PUNIÇÃO: CONTEÚDO CONSIDERADO ENGANOSO",
    reasons: [
      "Antes e depois implícito",
      "Expressões exageradas",
      "Demonstração interpretada como promessa",
      "Falta de contexto explícito",
    ],
    defenseModel: `Solicito a revisão manual da penalidade aplicada por suposta indução ao erro.

O conteúdo não apresenta promessas, garantias de resultado ou afirmações absolutas. As informações são compatíveis com a descrição oficial do produto e têm caráter demonstrativo.

Não há exagero, omissão ou distorção das características do item. Solicito a remoção da penalidade após reavaliação manual.`,
  },
  {
    id: "conteudo-nao-original",
    title: "PUNIÇÃO: CONTEÚDO NÃO ORIGINAL",
    reasons: [
      "Formato parecido com outros anúncios",
      "Tendências muito usadas",
      "Vídeos parecidos entre afiliados",
      "Padrão repetido de roteiro/edição",
    ],
    defenseModel: `Solicito a revisão manual da penalidade aplicada por suposta violação de conteúdo não original.

O material foi produzido originalmente, sem uso de conteúdo de terceiros ou violação de direitos autorais.

Eventual similaridade visual decorre de padrões comuns de apresentação, não caracterizando reutilização indevida.

Solicito a reanálise manual e a remoção da penalidade.`,
  },
];

export const PUNISHMENT_FOOTER = {
  title: "IMPORTANTE",
  paragraphs: [
    "Essas punições são, em grande parte, automáticas.",
    "Sempre peça REAVALIAÇÃO MANUAL.",
    "Os textos de defesa acima são modelos base. Use como referência e adapte de acordo com a sua situação específica, evitando alterar demais a estrutura do texto.",
  ],
};

export const MOCK_PUNISHMENT_COMMENTS = [
  {
    id: 1,
    authorName: "Tairine",
    content: "Olá, recebi punição e estou impedida de promover produtos até agosto. Alguém pode me ajudar?",
    hoursAgo: 4,
  },
  {
    id: 2,
    authorName: "Andrezia",
    content: "Bom dia, posso apagar esse vídeo?",
    hoursAgo: 11,
  },
  {
    id: 3,
    authorName: "Erica",
    content: "Boa tarde. Tive uma denúncia em um vídeo, preciso de orientação para saber como proceder.",
    hoursAgo: 48,
  },
];
