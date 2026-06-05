export type TrainingEvent = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  eventType: string;
  hostName: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  liveStreamUrl: string | null;
  participantCount: number;
  registered: boolean;
  isMock?: boolean;
};

export function formatEventSchedule(start: Date | string, end?: Date | string | null) {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = end ? (typeof end === "string" ? new Date(end) : end) : null;
  const datePart = s.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "America/Sao_Paulo",
  });
  const timeFmt: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  };
  const startTime = s.toLocaleTimeString("pt-BR", timeFmt);
  const endTime = e ? e.toLocaleTimeString("pt-BR", timeFmt) : null;
  const timePart = endTime ? `${startTime} - ${endTime} -03` : `${startTime} -03`;
  return `${datePart.charAt(0).toUpperCase()}${datePart.slice(1)} · ${timePart}`;
}

export function formatMonthGroup(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function daysUntilLabel(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff <= 0) return "Hoje";
  if (diff === 1) return "Começa em 1 dia";
  return `Começa em ${diff} dias`;
}

export function eventBannerGradient(title: string, category: string) {
  if (title.includes("Blue Carpet") || title.includes("💙")) {
    return "from-blue-600 via-blue-700 to-indigo-900";
  }
  if (title.includes("COPA") || title.toLowerCase().includes("copa")) {
    return "from-emerald-600 via-green-600 to-teal-800";
  }
  if (title.toLowerCase().includes("live")) {
    return "from-rose-500 via-pink-600 to-fuchsia-700";
  }
  if (category === "indicacao") {
    return "from-violet-600 to-purple-800";
  }
  return "from-primary via-primary to-accent";
}

export const MOCK_TRAINING_EVENTS: TrainingEvent[] = [
  {
    id: -1,
    title: "Blue Carpet 💙",
    description: "Encontro especial com os top creators da comunidade.",
    imageUrl: null,
    category: "estrategia",
    eventType: "live",
    hostName: "Gabriel Tolentino Corrêa",
    startDate: new Date("2026-06-08T19:00:00-03:00"),
    endDate: new Date("2026-06-08T20:00:00-03:00"),
    liveStreamUrl: null,
    participantCount: 9,
    registered: false,
    isMock: true,
  },
  {
    id: -2,
    title: "Consistência vence: como manter frequência de Lives",
    description: null,
    imageUrl: null,
    category: "estrategia",
    eventType: "live",
    hostName: "Equipe Conexões Creators",
    startDate: new Date("2026-06-15T15:00:00-03:00"),
    endDate: new Date("2026-06-15T16:00:00-03:00"),
    liveStreamUrl: null,
    participantCount: 14,
    registered: false,
    isMock: true,
  },
  {
    id: -3,
    title: "ESPECIAL COPA: como aproveitar uma tendência antes que ela passe",
    description: null,
    imageUrl: null,
    category: "estrategia",
    eventType: "live",
    hostName: "Marina Silva",
    startDate: new Date("2026-06-17T19:00:00-03:00"),
    endDate: new Date("2026-06-17T20:00:00-03:00"),
    liveStreamUrl: null,
    participantCount: 21,
    registered: false,
    isMock: true,
  },
  {
    id: -4,
    title: "Programa de Indicação — como funciona na prática",
    description: null,
    imageUrl: null,
    category: "indicacao",
    eventType: "live",
    hostName: "Equipe Conexões Creators",
    startDate: new Date("2026-06-22T19:00:00-03:00"),
    endDate: new Date("2026-06-22T20:00:00-03:00"),
    liveStreamUrl: null,
    participantCount: 6,
    registered: false,
    isMock: true,
  },
  {
    id: -5,
    title: "Tira-dúvidas semanal ao vivo",
    description: null,
    imageUrl: null,
    category: "geral",
    eventType: "live",
    hostName: "Suporte Creators",
    startDate: new Date("2026-06-26T16:00:00-03:00"),
    endDate: new Date("2026-06-26T17:00:00-03:00"),
    liveStreamUrl: null,
    participantCount: 11,
    registered: false,
    isMock: true,
  },
];
