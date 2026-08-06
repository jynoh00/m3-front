import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, apiRequest } from "../lib/api";
import { useImageUpload } from "../hooks/useImageUpload";
import "../styles/join.css";

export default function JoinPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", password: "", confirm: "", nickname: "" });
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const { preview, pickImage: pickImageFile, upload: uploadImage } = useImageUpload();

  const pickImage = (event) => {
    const { ok } = pickImageFile(event);
    if (!ok) return setErrors({ image: "* 이미지 파일만 업로드할 수 있습니다." });
    setErrors({});
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!values.email.trim()) next.email = "* 이메일을 입력해주세요.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "* 잘못된 이메일 입력 형식입니다.";
    if (!values.password.trim()) next.password = "* 비밀번호를 입력해주세요";
    else if (values.password.length < 8 || values.password.length > 20) next.password = "* 8자리 이상 20자리 미만의 비밀번호를 입력해주세요.";
    else if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S+$/.test(values.password)) next.password = "* 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해주세요.";
    if (values.password !== values.confirm) next.confirm = "* 비밀번호가 일치하지 않습니다.";
    if (!values.nickname.trim()) next.nickname = "* 닉네임을 입력해주세요.";
    else if (values.nickname.length < 2 || values.nickname.length > 10) next.nickname = "* 닉네임은 2자 이상 10자 이하로 입력해주세요.";
    else if (!/^\S+$/.test(values.nickname)) next.nickname = "* 닉네임에는 공백을 사용할 수 없습니다.";
    if (Object.keys(next).length) return setErrors(next);

    setUploading(true);
    try {
      // 회원가입이 실제로 확정된 지금 시점에만 이미지를 서버에 업로드한다.
      let imagePath;
      try {
        imagePath = await uploadImage({ auth: false });
      } catch {
        return setErrors({ image: "* 이미지 업로드에 실패했습니다." });
      }
      await apiRequest("/join", { method: "POST", auth: false, body: JSON.stringify({ user_email: values.email, user_password: values.password, user_password_check: values.confirm, user_nickname: values.nickname, user_image: imagePath || undefined }) });
      navigate("/login", { replace: true });
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 409) {
        if (requestError.message === "duplicated_user_email") return setErrors({ email: "* 이미 사용 중인 이메일입니다." });
        if (requestError.message === "duplicated_user_nickname") return setErrors({ nickname: "* 이미 사용 중인 닉네임입니다." });
      }
      setErrors({ email: "* 서버에 연결할 수 없습니다." });
    } finally {
      setUploading(false);
    }
  };

  const field = (name) => ({ value: values[name], onChange: (event) => setValues({ ...values, [name]: event.target.value }) });

  return (
  <div className="join-page">
  <header className="site-header">
    <Link
      className="back-button"
      to="/login"
      aria-label="로그인 화면으로 돌아가기"
    />

    <Link className="brand" to="/login">
      <img
        className="brand-logo"
        src="/assets/small-logo.png"
        alt=""
      />
      <span>My Music Moment</span>
    </Link>
  </header>

  <main className="page-main">
    <section className="signup-card">
      <div className="card-heading">
        <p className="eyebrow">JOIN THE MOMENT</p>
        <h1>회원가입</h1>
        <p className="subtitle">
          나만의 이야기를 자유롭게 나눠보세요.
        </p>
      </div>

      <form className="signup-form" onSubmit={submit}>
        <fieldset className="profile-field">
          <legend>프로필 사진</legend>

          <label
            className="profile-upload"
            htmlFor="profile-image"
            style={
              preview
                ? { backgroundImage: `url(${preview})` }
                : undefined
            }
          >
            {!preview && (
              <>
                <span className="upload-icon">+</span>
                <span className="upload-copy">사진 추가</span>
              </>
            )}
          </label>

          <input
            id="profile-image"
            type="file"
            accept="image/*"
            onChange={pickImage}
          />

          <p className="helper-text">{errors.image}</p>
        </fieldset>

        <div className="field-group">
          <label htmlFor="email">
            이메일 <span>*</span>
          </label>

          <input
            id="email"
            type="email"
            {...field("email")}
            placeholder="music@example.com"
          />

          <p className="helper-text">{errors.email}</p>
        </div>

        <div className="field-grid">
          <div className="field-group">
            <label htmlFor="password">
              비밀번호 <span>*</span>
            </label>

            <input
              id="password"
              type="password"
              {...field("password")}
              maxLength={20}
              placeholder="8자 이상 입력"
            />

            <p className="helper-text">{errors.password}</p>
          </div>

          <div className="field-group">
            <label htmlFor="password-confirm">
              비밀번호 확인 <span>*</span>
            </label>

            <input
              id="password-confirm"
              type="password"
              {...field("confirm")}
              maxLength={20}
              placeholder="한 번 더 입력"
            />

            <p className="helper-text">{errors.confirm}</p>
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="nickname">
            닉네임 <span>*</span>
          </label>

          <input
            id="nickname"
            {...field("nickname")}
            maxLength={10}
            placeholder="사용할 닉네임을 입력하세요"
          />

          <p className="helper-text">{errors.nickname}</p>
        </div>

        <button className="signup-button" type="submit" disabled={uploading}>
          회원가입
        </button>
      </form>

      <p className="login-guide">
        이미 계정이 있나요?{" "}
        <Link className="login-link" to="/login">
          로그인하러 가기
        </Link>
      </p>
    </section>
  </main>
  </div>
  );
}
