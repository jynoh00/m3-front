import { useState } from "react";
import { apiRequest } from "../lib/api";

// 회원가입/프로필 수정에서 공통으로 쓰는 이미지 선택 훅.
// 파일을 고르는 즉시 서버에 업로드하면, 폼을 제출하지 않고 이탈해도 이미지가
// 서버에 계속 쌓이는 문제가 생긴다. 그래서 여기서는 로컬 미리보기만 준비해두고
// 실제 업로드(POST /images)는 호출 측이 폼 제출을 확정한 시점에 upload()를
// 직접 호출해야만 일어나도록 분리한다.
export const useImageUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const pickImage = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreview("");
      return { ok: true };
    }
    if (!selected.type.startsWith("image/")) {
      event.target.value = "";
      return { ok: false };
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(selected);
    return { ok: true };
  };

  const clearImage = () => {
    setFile(null);
    setPreview("");
  };

  // 새로 선택된 파일이 있을 때만 실제로 업로드하고 서버 이미지 경로를 반환한다.
  // 선택된 파일이 없으면 아무 요청도 보내지 않고 null을 반환한다.
  const upload = async ({ auth = true } = {}) => {
    if (!file) return null;
    const formData = new FormData();
    formData.append("image", file);
    const result = await apiRequest("/images", { method: "POST", auth, body: formData });
    return result.data.image_path;
  };

  return { file, preview, pickImage, clearImage, upload };
};
