import EditorPageLayout from "../components/editor/EditorPageLayout";
import MusicPostEditor from "../components/MusicPostEditor";
import { apiRequest } from "../lib/api";
import "../styles/create.css";

export default function CreatePage() {
  return (
    <EditorPageLayout
      pageClassName="create-page"
      eyebrow="CREATE YOUR MOMENT"
      title="새로운 음악 순간"
      description="이야기와 함께 기억하고 싶은 음악을 골라보세요."
    >
      <MusicPostEditor
        mode="create"
        onSubmit={async (payload) => {
          await apiRequest("/posts", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          return "모멘트가 등록되었습니다.";
        }}
      />
    </EditorPageLayout>
  );
}
