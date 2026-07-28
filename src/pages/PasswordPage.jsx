import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserHeader from "../components/UserHeader";
import { ApiError, apiRequest } from "../lib/api";
import { clearTokens } from "../lib/auth";
import "../styles/password.css";

export default function PasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({ password: "", confirm: "" });
  const submit = async (event) => {
    event.preventDefault();
    if (!password.trim()) return setErrors({ password: "* 비밀번호를 입력해주세요", confirm: "" });
    if (password.length < 8 || password.length > 20) return setErrors({ password: "* 8자리 이상 20자리 미만의 비밀번호를 입력해주세요.", confirm: "" });
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S+$/.test(password)) return setErrors({ password: "* 비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.", confirm: "" });
    if (password !== confirm) return setErrors({ password: "", confirm: "* 비밀번호가 일치하지 않습니다." });
    try {
      await apiRequest("/me/password", { method: "PATCH", body: JSON.stringify({ user_new_password: password, user_new_password_check: confirm }) });
      clearTokens();
      navigate("/login", { replace: true });
    } catch (error) {
      setErrors({ password: "", confirm: error instanceof ApiError ? `* ${error.message}` : "* 서버에 연결할 수 없습니다." });
    }
  };
  return (
  <div className="password-page">
  <UserHeader />

  <main className="password-main">
    <section className="password-section">
      <div className="password-heading">
        <p className="eyebrow">SECURITY SETTINGS</p>
        <h1>비밀번호 수정</h1>
        <p>
          계정을 안전하게 보호할 새 비밀번호를 설정하세요.
        </p>
      </div>

      <div className="password-guide">
        <span>i</span>
        <p>
          8~20자 이내로 대문자, 소문자, 숫자와 특수문자를
          각각 하나 이상 포함해주세요.
        </p>
      </div>

      <form className="password-form" onSubmit={submit}>
        <div className="field-group">
          <label htmlFor="password">
            새 비밀번호
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            maxLength={20}
            placeholder="새 비밀번호를 입력하세요"
          />

          <p className="helper-text">
            {errors.password}
          </p>
        </div>

        <div className="field-group">
          <label htmlFor="password-confirm">
            새 비밀번호 확인
          </label>

          <input
            id="password-confirm"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            maxLength={20}
            placeholder="새 비밀번호를 한 번 더 입력하세요"
          />

          <p className="helper-text">
            {errors.confirm}
          </p>
        </div>

        <button
          className="update-button"
          type="submit"
        >
          비밀번호 변경
        </button>
      </form>
    </section>
  </main>
  </div>
  );
}
