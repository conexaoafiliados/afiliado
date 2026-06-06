export const ADMIN_PERMISSIONS = {
  ANALYTICS_VIEW: "analytics.view",
  USERS_MANAGE: "users.manage",
  ANNOUNCEMENTS_PUBLISH: "announcements.publish",
  PUNISHMENTS_PUBLISH: "punishments.publish",
  COMMUNITY_MODERATE: "community.moderate",
  TRAININGS_MANAGE: "trainings.manage",
  LEARNING_MANAGE: "learning.manage",
  SHOP_MANAGE: "shop.manage",
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const ALL_ADMIN_PERMISSIONS = Object.values(ADMIN_PERMISSIONS);

export const ADMIN_PERMISSION_LABELS: Record<AdminPermission, string> = {
  "analytics.view": "Ver analytics da plataforma",
  "users.manage": "Gerenciar usuários e permissões",
  "announcements.publish": "Publicar avisos",
  "punishments.publish": "Publicar punições",
  "community.moderate": "Moderar comunidade (posts)",
  "trainings.manage": "Gerenciar treinamentos",
  "learning.manage": "Gerenciar trilhas de aprendizado",
  "shop.manage": "Gerenciar loja e pedidos",
};

export const ADMIN_PERMISSION_GROUPS: { title: string; keys: AdminPermission[] }[] = [
  {
    title: "Visão e pessoas",
    keys: [ADMIN_PERMISSIONS.ANALYTICS_VIEW, ADMIN_PERMISSIONS.USERS_MANAGE],
  },
  {
    title: "Conteúdo",
    keys: [
      ADMIN_PERMISSIONS.ANNOUNCEMENTS_PUBLISH,
      ADMIN_PERMISSIONS.PUNISHMENTS_PUBLISH,
      ADMIN_PERMISSIONS.COMMUNITY_MODERATE,
      ADMIN_PERMISSIONS.TRAININGS_MANAGE,
      ADMIN_PERMISSIONS.LEARNING_MANAGE,
    ],
  },
  {
    title: "Comércio",
    keys: [ADMIN_PERMISSIONS.SHOP_MANAGE],
  },
];
