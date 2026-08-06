import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserHeader from "../components/UserHeader";
import WithdrawModal from "../components/profile/WithdrawModal";
import { useAuth } from "../context/AuthContext";
import { ApiError, apiRequest } from "../lib/api";
import { clearTokens } from "../lib/auth";
import { resolveImageUrl } from "../lib/constants";
import { describeError } from "../lib/errorMessages";
import { useImageUpload } from "../hooks/useImageUpload";
import "../styles/profile.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [email] = useState(user?.user_email || "");
  const [nickname, setNickname] = useState(user?.user_nickname || "");
  const [originalNickname, setOriginalNickname] = useState(user?.user_nickname || "");
  const [image, setImage] = useState(user?.user_image || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const { preview, file: pendingImageFile, pickImage: pickImageFile, upload: uploadImage, clearImage } = useImageUpload();

  const nicknameError = () => {
    if (!nickname.trim()) return "* 닉네임을 입력해주세요.";
    if (nickname.length < 2 || nickname.length > 10) return "* 닉네임은 2자 이상 10자 이하로 입력해주세요.";
    if (!/^\S+$/.test(nickname)) return "* 닉네임에는 공백을 사용할 수 없습니다.";
    return "";
  };
  const changed = nickname !== originalNickname || Boolean(pendingImageFile);
  const displayImage = preview || (image ? resolveImageUrl(image) : "");

  const pickImage = (event) => {
    const { ok } = pickImageFile(event);
    if (!ok) { event.target.value = ""; window.alert("이미지 파일만 선택할 수 있습니다."); }
  };

  const submit = async (event) => {
    event.preventDefault();
    const validation = nicknameError(); if (validation) return setError(validation);

    setUploading(true);
    try {
      // 변경사항 저장이 실제로 확정된 지금 시점에만 새 이미지를 서버에 업로드한다.
      let imagePath = image;
      try {
        const uploaded = await uploadImage();
        if (uploaded) imagePath = uploaded;
      } catch {
        return setError("* 이미지 업로드에 실패했습니다.");
      }
      await apiRequest("/me/profile", { method: "PATCH", body: JSON.stringify({ user_new_nickname: nickname, user_new_image: imagePath }) });
      setImage(imagePath);
      clearImage();
      setOriginalNickname(nickname);
      setUser((current) => ({
        ...current,
        user_nickname: nickname,
        user_image: imagePath,
      }));
      setError("");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 409) return setError("* 이미 사용 중인 닉네임입니다.");
      setError(`* ${describeError(requestError, "서버에 연결할 수 없습니다.")}`);
    } finally {
      setUploading(false);
    }
  };

  const withdraw = async () => {
    try {
      await apiRequest("/withdraw", { method: "DELETE" });
      clearTokens();
      navigate("/login", { replace: true });
    }
    catch (requestError) { window.alert(describeError(requestError, "회원탈퇴에 실패했습니다.")); }
  };

  return (
  <div className="profile-page">
  <UserHeader />

  <main className="profile-main">
    <section className="profile-section">
      <div className="profile-heading">
        <p className="eyebrow">MY PROFILE</p>
        <h1>회원정보 수정</h1>
        <p>
          나를 표현하는 프로필 정보를 관리해보세요.
        </p>
      </div>

      <form
        className="profile-form"
        onSubmit={submit}
      >
        <fieldset className="photo-field">
          <legend>프로필 사진</legend>

          <label
            className="photo-upload"
            htmlFor="profile-image"
          >
            <span
              className="photo-image"
              style={
                displayImage
                  ? {
                      backgroundImage: `url(${displayImage})`,
                    }
                  : undefined
              }
            />

            <span className="photo-overlay" />

            <span className="photo-change">
              <i>+</i>
              사진 변경
            </span>
          </label>

          <input
            id="profile-image"
            type="file"
            accept="image/*"
            onChange={pickImage}
          />
        </fieldset>

        <div className="info-field email-field">
          <label>이메일</label>
          <p className="email-text">{email}</p>
        </div>

        <div className="info-field">
          <label htmlFor="nickname">
            닉네임
          </label>

          <input
            id="nickname"
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value);
              setError("");
            }}
            maxLength={10}
          />

          <p className="helper-text">
            {error || nicknameError()}
          </p>
        </div>

        <button
          className="update-button"
          type="submit"
          disabled={
            !changed ||
            Boolean(nicknameError()) ||
            uploading
          }
        >
          변경사항 저장
        </button>
      </form>

      <button
        className="withdraw-button"
        type="button"
        onClick={() => setWithdrawOpen(true)}
      >
        회원 탈퇴
      </button>
    </section>
  </main>

  <WithdrawModal
    open={withdrawOpen}
    onClose={() => setWithdrawOpen(false)}
    onConfirm={() => void withdraw()}
  />
  </div>
  );
}
