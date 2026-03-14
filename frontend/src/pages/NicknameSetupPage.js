import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";
import Button from "../components/Button";
import styles from "./LoginPage.module.css";

export default function NicknameSetupPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(user?.first_name || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed) return setError("Please enter a nickname.");
    if (trimmed.length > 50) return setError("Max 50 characters.");
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.updateProfile({ nickname: trimmed });
      setUser(data);
      navigate("/", { replace: true });
    } catch {
      setError("Failed to save nickname. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Choose a Nickname</h1>
        <p className={styles.subtitle}>This is how other players will see you.</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.emailForm}>
          <input
            className={styles.input}
            type="text"
            placeholder="e.g. SuperBettor"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={50}
            autoFocus
          />
          <Button type="submit" loading={loading} style={{ width: "100%" }}>
            Save &amp; Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
