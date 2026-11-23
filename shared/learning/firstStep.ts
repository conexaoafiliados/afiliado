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
          slug: "como-usar-conexao-creators",
          title: "Como usar Conexão Creators",
          icon: "▶️",
        },
      ],
    },
    {
      id: "conheca-time",
      title: "Conheça o Time",
      lessons: [
        {
          slug: "camila-almeida-gestora",
          title: "Camila Almeida - Gestora da Comunidade",
          icon: "▶️",
        },
        {
          slug: "marcelo-conelheiros-ceo",
          title: "Marcelo Conelheiros - CEO Grupo",
          icon: "▶️",
        },
      ],
    },
    {
      id: "jornada-crescimento",
      title: "Entenda a jornada de crescimento!",
      lessons: [
        {
          slug: "sobre-conexao-creators",
          title: "Sobre o Conexão Creators",
          icon: "📄",
        },
        {
          slug: "beneficios-da-agencia",
          title: "Benefícios da Agência",
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
