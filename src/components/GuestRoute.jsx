import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { clearTokens, getAccessToken } from "../lib/auth";

export default function GuestRoute({ children }) {
  const token = getAccessToken();
  const [status, setStatus] = useState(token ? "checking" : "guest");

  useEffect(() => {
    if (!token) return;

    let active = true;

    apiRequest("/me/profile", { redirectOn401: false })
      .then(() => {
        if (active) setStatus("authenticated");
      })
      .catch(() => {
        clearTokens();
        if (active) setStatus("guest");
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (status === "checking") return null;
  if (status === "authenticated") {
    return <Navigate to="/posts" replace />;
  }
  return children;
}
