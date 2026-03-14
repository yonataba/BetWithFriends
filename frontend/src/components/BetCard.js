import styles from "./BetCard.module.css";
import dayjs from "dayjs";

const STATUS_COLORS = {
  pending: "#f59e0b",
  open: "#22c55e",
  rejected: "#ef4444",
  resolved: "#6366f1",
  cancelled: "#94a3b8",
};

export default function BetCard({ bet, onClick, groupName }) {
  return (
    <div className={styles.card} onClick={onClick} role="button" tabIndex={0}>
      <div className={styles.header}>
        <span className={styles.title}>{bet.title}</span>
        <div className={styles.badges}>
          {groupName && <span className={styles.group}>{groupName}</span>}
          <span
            className={styles.status}
            style={{ background: STATUS_COLORS[bet.status] }}
          >
            {bet.status}
          </span>
        </div>
      </div>
      <div className={styles.participants}>
        {bet.challenger.nickname || bet.challenger.first_name || bet.challenger.email} vs{" "}
        {bet.opponent.nickname || bet.opponent.first_name || bet.opponent.email}
      </div>
      <div className={styles.meta}>
        <span>
          {bet.challenger.nickname || bet.challenger.first_name || bet.challenger.email}: {bet.challenger_amount} {bet.currency}
          {" vs "}
          {bet.opponent.nickname || bet.opponent.first_name || bet.opponent.email}: {bet.opponent_amount} {bet.currency}
        </span>
        {bet.due_date && (
          <span>Due {dayjs(bet.due_date).format("MMM D, YYYY")}</span>
        )}
      </div>
    </div>
  );
}
