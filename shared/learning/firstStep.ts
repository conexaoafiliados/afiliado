export type FirstStepLesson = {
  slug: string;
  title: string;
  /** Duração em segundos (opcional) */
  durationSeconds?: number;
  /** ID do vídeo no YouTube ou URL completa — preencher quando o vídeo estiver no ar */
  youtubeVideoId?: string;
  icon?: string;
};

export type FirstStepSection = {
  id: string;
  title: string;
  lessons: FirstStepLesson[];
};

export const FIRST_STEP_MODULE = {
  title: "Seu primeiro passo",
  emoji: "👋",
  sections: [
    {
      id: "conheca-app",
      title: "Conheça nosso App!",
      lessons: [
        {
          slug: "como-usar-o-club",
          title: "Como usar o Club?",
          durationSeconds: 223,
          icon: "▶️",
        },
      ],
    },
    {
      id: "conheca-time",
      title: "Conheça o Time",
      lessons: [
        {
          slug: "mayra-gestora",
          title: "Mayra - Gestora da Comunidade",
          durationSeconds: 10,
          icon: "▶️",
        },
        {
          slug: "leo-gerente",
          title: "Leo - Gerente de Contas",
          durationSeconds: 8,
          icon: "▶️",
        },
      ],
    },
    {
      id: "jornada-crescimento",
      title: "Entenda a jornada de crescimento!",
      lessons: [
        {
          slug: "sobre-amplify-agenciamento",
          title: "Sobre a Amplify e o Agenciamento",
          icon: "📄",
        },
        {
          slug: "beneficios-agencia-gmv",
          title: "Benefícios da Agência e como aumentar meu GMV?",
          icon: "📄",
        },
        {
          slug: "programa-indicacao",
          title: "Programa de Indicação",
          icon: "📄",
        },
      ],
    },
    {
      id: "guia-duvidas",
      title: "Guia de tira dúvidas",
      lessons: [
        {
          slug: "suporte-punicoes",
          title: "Suporte e Punições",
          icon: "📄",
        },
        {
          slug: "treinamentos",
          title: "Treinamentos",
          icon: "📄",
        },
        {
          slug: "amostras-campanhas",
          title: "Amostras e Campanhas",
          durationSeconds: 34,
          icon: "▶️",
        },
      ],
    },
    {
      id: "download-app",
      title: "Download do aplicativo",
      lessons: [
        {
          slug: "download-app",
          title: "Download do App",
          durationSeconds: 16,
          icon: "▶️",
        },
      ],
    },
  ] satisfies FirstStepSection[],
} as const;

export const FIRST_STEP_LESSONS = FIRST_STEP_MODULE.sections.flatMap(s => s.lessons);

export const FIRST_STEP_LESSON_SLUGS = new Set(FIRST_STEP_LESSONS.map(l => l.slug));

export function getFirstStepLesson(slug: string): FirstStepLesson | undefined {
  return FIRST_STEP_LESSONS.find(l => l.slug === slug);
}

export function getFirstStepSectionForLesson(slug: string): FirstStepSection | undefined {
  return FIRST_STEP_MODULE.sections.find(s => s.lessons.some(l => l.slug === slug));
}

import { formatLessonDuration, getTrackStats } from "./utils";

export { formatLessonDuration, parseYouTubeVideoId } from "./utils";

export function getFirstStepStats() {
  return getTrackStats(FIRST_STEP_MODULE.sections);
}
