import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import styles from "./LoginPage.module.css";
import { useState } from "react";
import Button from "../components/Button";

export default function LoginPage() {
  const { loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.googleLogin(credentialResponse.credential);
      await loginWithTokens({ access: data.access, refresh: data.refresh });
      navigate("/");
    } catch (err) {
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.emailLogin(emailForm.email, emailForm.password);
      await loginWithTokens({ access: data.access, refresh: data.refresh });
      navigate("/");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>BetWithFriends</h1>
        <p className={styles.subtitle}>Challenge your friends, track your bets.</p>

        {error && <div className={styles.error}>{error}</div>}

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google login was cancelled or failed.")}
          useOneTap={false}
          width="100%"
          text="continue_with"
          shape="rectangular"
          theme="outline"
        />

        <div className={styles.divider}><span>or</span></div>

        <form onSubmit={handleEmailLogin} className={styles.emailForm}>
          <input
            className={styles.input}
            type="email"
            placeholder="Email"
            value={emailForm.email}
            onChange={(e) => setEmailForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={emailForm.password}
            onChange={(e) => setEmailForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
          <Button type="submit" loading={loading} style={{ width: "100%" }}>
            Sign in with Email
          </Button>
        </form>
      </div>
    </div>
  );
}
