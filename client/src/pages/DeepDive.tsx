import { LearningContentList } from "@/components/LearningContentList";
import { useAuth } from "@/_core/hooks/useAuth";

const TRACK_SLUG = "aprofunde";
const BASE_PATH = "/vender/aprofunde";

export default function DeepDive() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl">
      <LearningContentList
        trackSlug={TRACK_SLUG}
        basePath={BASE_PATH}
        showWelcome
        userName={user?.name}
      />
    </div>
  );
}
