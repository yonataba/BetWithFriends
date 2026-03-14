import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.brand}>BetWithFriends</Link>
      <div className={styles.links}>
        <Link to="/groups">Groups</Link>
        {user?.is_staff && (
          <Link to="/admin/currencies">Currencies</Link>
        )}
        {user && (
          <span className={styles.user}>
            {user.avatar_url && (
              <img src={user.avatar_url} alt="" className={styles.avatar} />
            )}
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Log out
            </button>
          </span>
        )}
      </div>
    </nav>
  );
}
