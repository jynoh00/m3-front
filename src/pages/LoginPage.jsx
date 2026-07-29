import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, apiRequest } from "../lib/api";
import { saveTokens } from "../lib/auth";
import "../styles/login.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim()) return setError("* 이메일을 입력해주세요.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("* 잘못된 이메일 입력 형식입니다.");
    if (!password.trim()) return setError("* 비밀번호를 입력해주세요");
    if (password.length < 8 || password.length > 20) return setError("* 8자리 이상 20자리 미만의 비밀번호를 입력해주세요.");
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])\S+$/.test(password)) return setError("* 비밀번호는 대문자, 소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.");
    try {
      const result = await apiRequest("/login", { method: "POST", auth: false, redirectOn401: false, body: JSON.stringify({ user_email: email, user_password: password }) });
      if (!result.data?.access_token || !result.data?.refresh_token) return setError("* 로그인 응답 정보가 올바르지 않습니다.");
      saveTokens({ accessToken: result.data.access_token, refreshToken: result.data.refresh_token });
      navigate("/posts", { replace: true });
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        if (requestError.status === 401) return setError("* 잘못된 비밀번호입니다.");
        if (requestError.status === 404) return setError("* 존재하지 않는 계정입니다.");
        return setError(`* ${requestError.message}`);
      }
      setError("* 서버에 연결할 수 없습니다.");
    }
  };

  return (
  <div className="login-page">
  <main className="login-wrapper">
    <section className="login-card">
      <div
        className="brand-logo"
        aria-label="My Music Moment logo"
      >
        <svg
          className="stack-logo"
          viewBox="0 0 96 170"
          aria-hidden="true"
        >
          <path
            d="M16 62 V18 L48 68 L80 18 V62"
            fill="none"
            stroke="#eb4aa0"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M16 106 V62 L48 112 L80 62 V106"
            fill="none"
            stroke="#7428f4"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M16 150 V106 L48 156 L80 106 V150"
            fill="none"
            stroke="#63ddcf"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="wordmark" aria-hidden="true">
          <span>y</span>
          <span>usic</span>
          <span>oment</span>
        </div>
      </div>

      <h1>My Music Moment</h1>

      <p className="subtitle">
        지금 나의 음악 순간을 공유하세요!
      </p>

      <form className="login-form" onSubmit={submit}>
        <div className="form-group">
          <label htmlFor="email">이메일</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="music@example.com"
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">비밀번호</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            maxLength={20}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
          />

          <p className="helper-text" aria-live="polite">
            {error}
          </p>
        </div>

        {/* <div className="options">
          <label className="remember">
            <input type="checkbox" />
            로그인 유지
          </label>

          <button type="button" className="forgot">
            비밀번호 찾기
          </button>
        </div> */}

        <button type="submit" className="login-button">
          로그인
        </button>
      </form>

      <div className="divider" />

      <p className="signup">
        아직 계정이 없나요?{" "}
        <Link className="signup-link" to="/join">
          회원가입
        </Link>
      </p>
    </section>
  </main>
  </div>
  );
}
