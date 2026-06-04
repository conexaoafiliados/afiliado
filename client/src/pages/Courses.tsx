import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/CourseCard";
import { useState } from "react";

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: number;
  lessons: number;
  students: number;
  rating: number;
  price: number;
  enrolled: boolean;
  progress?: number;
}

const MOCK_COURSES: Course[] = [
  {
    id: 1,
    title: "Criando Conteúdo que Engaja",
    description: "Aprenda as técnicas essenciais para criar conteúdo que realmente engaja seu público",
    instructor: "Maria Silva",
    level: "beginner",
    duration: 240,
    lessons: 12,
    students: 1250,
    rating: 4.8,
    price: 0,
    enrolled: true,
    progress: 75,
  },
  {
    id: 2,
    title: "Monetização para Creators",
    description: "Descubra todas as formas de ganhar dinheiro com seu conteúdo",
    instructor: "João Santos",
    level: "intermediate",
    duration: 180,
    lessons: 10,
    students: 890,
    rating: 4.9,
    price: 0,
    enrolled: false,
  },
  {
    id: 3,
    title: "SEO e Crescimento Orgânico",
    description: "Estratégias comprovadas para crescer organicamente nas redes sociais",
    instructor: "Ana Costa",
    level: "intermediate",
    duration: 300,
    lessons: 15,
    students: 2100,
    rating: 4.7,
    price: 0,
    enrolled: false,
  },
  {
    id: 4,
    title: "Edição de Vídeos Profissional",
    description: "Domine as ferramentas e técnicas de edição de vídeo profissional",
    instructor: "Carlos Oliveira",
    level: "advanced",
    duration: 420,
    lessons: 20,
    students: 650,
    rating: 4.9,
    price: 0,
    enrolled: false,
  },
  {
    id: 5,
    title: "Branding para Creators",
    description: "Construa uma marca pessoal forte e memorável",
    instructor: "Lucia Ferreira",
    level: "beginner",
    duration: 120,
    lessons: 8,
    students: 1800,
    rating: 4.6,
    price: 0,
    enrolled: true,
    progress: 30,
  },
];

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [filter, setFilter] = useState<"all" | "enrolled" | "beginner" | "intermediate" | "advanced">("all");

  const filteredCourses = courses.filter(course => {
    if (filter === "all") return true;
    if (filter === "enrolled") return course.enrolled;
    if (["beginner", "intermediate", "advanced"].includes(filter)) return course.level === filter;
    return true;
  });

  const handleEnroll = (id: number) => {
    setCourses(prev =>
      prev.map(c =>
        c.id === id ? { ...c, enrolled: true, progress: 0 } : c
      )
    );
  };

  const handleContinue = (id: number) => {
    console.log("Continuando curso", id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Cursos e Treinamentos</h1>
        <p className="text-muted-foreground">Aprenda com os melhores creators e especialistas</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "enrolled", "beginner", "intermediate", "advanced"].map(status => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status as any)}
            className={filter === status ? "btn-primary" : ""}
          >
            {status === "all" && "Todos"}
            {status === "enrolled" && "Meus Cursos"}
            {status === "beginner" && "Iniciante"}
            {status === "intermediate" && "Intermediário"}
            {status === "advanced" && "Avançado"}
          </Button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => (
          <CourseCard
            key={course.id}
            {...course}
            onEnroll={handleEnroll}
            onContinue={handleContinue}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card className="card-elegant text-center py-12">
          <p className="text-muted-foreground mb-4">Nenhum curso encontrado nesta categoria</p>
          <Button variant="outline" onClick={() => setFilter("all")}>
            Ver todos os cursos
          </Button>
        </Card>
      )}
    </div>
  );
}
