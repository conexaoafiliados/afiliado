import { LEGAL_ENTITY_CNPJ, LEGAL_ENTITY_NAME } from "./const";

export const AFFILIATE_COMPANY_NAME = LEGAL_ENTITY_NAME;
export const AFFILIATE_COMPANY_CNPJ = LEGAL_ENTITY_CNPJ;
export const CONTENT_USE_AFTER_END = "2 anos após o encerramento";
export const AFFILIATE_CONTRACT_FORUM =
  "foro da comarca da sede da Conexões Consultoria e Treinamentos Ltda";

export type ContractClause = { title: string; body: string };

export const AFFILIATE_CONTRACT_CLAUSES: ContractClause[] = [
  {
    title: "1. OBJETO",
    body: `A PARTICIPANTE adere ao programa de afiliados da ${AFFILIATE_COMPANY_NAME}, pelo qual divulga os produtos e as campanhas da marca por meio de link e/ou cupom exclusivos e recebe comissão sobre as vendas atribuídas a ela, conforme as regras publicadas no portal do programa.`,
  },
  {
    title: "2. NATUREZA",
    body: "A participação é voluntária, sem exclusividade e não cria vínculo empregatício, societário ou de representação comercial entre as partes. A PARTICIPANTE atua de forma autônoma, com seus próprios meios e horários.",
  },
  {
    title: "3. COMISSÕES E PAGAMENTO",
    body: "As comissões são calculadas sobre pedidos pagos e não cancelados, pelas taxas vigentes no portal na data do pedido, e pagas via Pix na chave cadastrada pela PARTICIPANTE, respeitado o prazo e o valor mínimo de saque informados no portal.",
  },
  {
    title: "4. CONDUTA",
    body: "A PARTICIPANTE compromete-se a divulgar a marca com veracidade, a identificar o conteúdo publicitário conforme a legislação e as normas do CONAR, a não utilizar práticas enganosas (spam, cupons em sites de desconto não autorizados, autocompra) e a respeitar as diretrizes de marca disponibilizadas no portal.",
  },
  {
    title: "5. USO DE IMAGEM E MARCA",
    body: `A ${AFFILIATE_COMPANY_NAME} autoriza o uso de seu nome, logotipo e materiais oficiais exclusivamente para a divulgação prevista neste termo. A PARTICIPANTE poderá autorizar, pelo portal, o uso pela ${AFFILIATE_COMPANY_NAME} dos conteúdos que produzir mencionando a marca, com os devidos créditos, durante a parceria e por ${CONTENT_USE_AFTER_END}, podendo revogar a autorização a qualquer momento.`,
  },
  {
    title: "6. DADOS PESSOAIS",
    body: `Os dados da PARTICIPANTE são tratados para a execução deste programa, nos termos da LGPD e dos Termos de Uso da plataforma. Controladora: ${AFFILIATE_COMPANY_NAME}, CNPJ ${AFFILIATE_COMPANY_CNPJ}.`,
  },
  {
    title: "7. VIGÊNCIA E ENCERRAMENTO",
    body: "Este termo vigora por prazo indeterminado e pode ser encerrado por qualquer das partes a qualquer momento, mediante aviso pelo portal ou por e-mail, sem ônus, ficando garantido o pagamento das comissões já apuradas até a data do encerramento.",
  },
  {
    title: "8. FORO",
    body: `Fica eleito o ${AFFILIATE_CONTRACT_FORUM} para dirimir quaisquer questões oriundas deste instrumento, com renúncia a qualquer outro, por mais privilegiado que seja.`,
  },
];

export function affiliateContractIntro(participantName: string) {
  return `Contrato de participação no programa de afiliados da ${AFFILIATE_COMPANY_NAME}, firmado com ${participantName}.`;
}

export const DEFAULT_POINT_RULES = {
  storyPoints: 10,
  feedPoints: 5,
  reelPoints: 10,
  salePoints: 15,
  redeemMinPoints: 100,
  redeemMinSales: 5,
  redeemItemLimit: 1,
  redeemDays: 15,
};

export type PointRules = typeof DEFAULT_POINT_RULES;

export function formatMention(handle: string | null | undefined) {
  const clean = (handle ?? "").trim().replace(/^@/, "");
  return clean ? `@${clean}` : "o @ da marca deste desafio";
}

export function pointsRegulation(handle: string | null | undefined, rules: PointRules = DEFAULT_POINT_RULES) {
  const ig = formatMention(handle);
  const salesPointsFromMinimum = rules.redeemMinSales * rules.salePoints;
  const remaining = Math.max(0, rules.redeemMinPoints - salesPointsFromMinimum);
  return {
    mention: ig,
    actions: [
      `Menção à marca nos Stories, com marcação de ${ig}: ${rules.storyPoints} pontos por publicação.`,
      `Publicação de foto ou carrossel no feed: ${rules.feedPoints} pontos por publicação.`,
      `Publicação de Reels ou vídeo: ${rules.reelPoints} pontos por vídeo publicado.`,
      `Venda aprovada, vinculada ao link ou cupom da afiliada: ${rules.salePoints} pontos por venda.`,
    ],
    monthly:
      "A pontuação é acumulada mensalmente, considerando os conteúdos publicados e as vendas aprovadas no período.",
    criteria: [
      `Para ter direito à troca por produtos, a afiliada deve, no mesmo mês, atingir pelo menos ${rules.redeemMinPoints} pontos e realizar no mínimo ${rules.redeemMinSales} vendas aprovadas, vinculadas ao seu link ou cupom.`,
      `As ${rules.redeemMinSales} vendas mínimas correspondem a ${salesPointsFromMinimum} pontos e integram a meta mensal. Os ${remaining} pontos restantes podem vir da publicação de conteúdos ou de vendas adicionais.`,
      "O cumprimento de apenas um dos requisitos não dá direito à troca: é preciso atingir a pontuação mínima e o número mínimo de vendas aprovadas.",
    ],
    redeem: `Quem cumprir os critérios escolhe os produtos liberados pela marca (até ${rules.redeemItemLimit} ${rules.redeemItemLimit === 1 ? "item" : "itens"}) em até ${rules.redeemDays} dias depois do fechamento do mês. Sem escolha nesse prazo, a troca do mês expira. O valor em pontos de cada produto é definido manualmente pela equipe.`,
  };
}
