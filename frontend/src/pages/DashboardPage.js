import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { groupsApi, betsApi } from "../api";
import Layout from "../components/Layout";
import BetCard from "../components/BetCard";
import Button from "../components/Button";
import styles from "./DashboardPage.module.css";

const BET_TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "open", label: "Open" },
  { key: "resolved", label: "Resolved" },
  { key: "cancelled", label: "Cancelled" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [betTab, setBetTab] = useState("");

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.list().then((r) => r.data),
  });

  const { data: pendingForMe = [] } = useQuery({
    queryKey: ["pendingForMe"],
    queryFn: () => betsApi.listPendingForMe().then((r) => r.data),
  });

  const { data: myBets = [], isLoading: betsLoading } = useQuery({
    queryKey: ["myBets", betTab],
    queryFn: () => betsApi.listMine(betTab).then((r) => r.data),
  });

  const acceptMutation = useMutation({
    mutationFn: ({ groupId, betId }) => betsApi.accept(groupId, betId),
    onSuccess: () => {
      queryClient.invalidateQueries(["pendingForMe"]);
      queryClient.invalidateQueries(["myBets"]);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ groupId, betId }) => betsApi.reject(groupId, betId),
    onSuccess: () => {
      queryClient.invalidateQueries(["pendingForMe"]);
      queryClient.invalidateQueries(["myBets"]);
    },
  });

  const openBets = myBets.filter((b) => b.status === "open");
  const resolvedBets = myBets.filter((b) => b.status === "resolved");

  return (
    <Layout>
      <div className={styles.welcome}>
        <h2>Welcome back, {user?.nickname || user?.first_name || user?.email}!</h2>
        <Button size="sm" onClick={() => navigate("/groups/new")}>+ New Group</Button>
      </div>

      {/* Pending proposals awaiting my response */}
      {pendingForMe.length > 0 && (
        <section className={styles.pendingSection}>
          <h3 className={styles.pendingSectionTitle}>
            ⏰ Awaiting Your Response ({pendingForMe.length})
          </h3>
          {pendingForMe.map((bet) => (
            <div key={bet.id} className={styles.pendingCard}>
              <div
                className={styles.pendingInfo}
                onClick={() => navigate(`/groups/${bet.group}/bets/${bet.id}`)}
                role="button"
                tabIndex={0}
              >
                <span className={styles.pendingTitle}>{bet.title}</span>
                <span className={styles.pendingMeta}>
                  {bet.group_name} ·{" "}
                  {bet.challenger.nickname || bet.challenger.first_name || bet.challenger.email}
                  {" vs "}
                  {bet.opponent.nickname || bet.opponent.first_name || bet.opponent.email}
                </span>
              </div>
              <div className={styles.pendingActions}>
                <Button
                  size="sm"
                  onClick={() => acceptMutation.mutate({ groupId: bet.group, betId: bet.id })}
                  disabled={acceptMutation.isPending || rejectMutation.isPending}
                >
                  ✓ Accept
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/groups/${bet.group}/bets/${bet.id}`)}
                >
                  Counter
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => rejectMutation.mutate({ groupId: bet.group, betId: bet.id })}
                  disabled={acceptMutation.isPending || rejectMutation.isPending}
                >
                  ✗ Reject
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Stats bar */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{groups.length}</span>
          <span className={styles.statLabel}>Groups</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{openBets.length}</span>
          <span className={styles.statLabel}>Open Bets</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{resolvedBets.length}</span>
          <span className={styles.statLabel}>Resolved</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>
            {resolvedBets.filter((b) => b.winner?.id === user?.id).length}
          </span>
          <span className={styles.statLabel}>Won</span>
        </div>
      </div>

      {/* Groups */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Your Groups</h3>
          <button className={styles.seeAll} onClick={() => navigate("/groups")}>See all →</button>
        </div>
        {groups.length === 0 ? (
          <p className={styles.empty}>
            No groups yet.{" "}
            <button className={styles.link} onClick={() => navigate("/groups")}>Browse groups</button>
          </p>
        ) : (
          <div className={styles.groupGrid}>
            {groups.map((g) => (
              <div key={g.id} className={styles.groupCard} onClick={() => navigate(`/groups/${g.id}`)}>
                <span className={styles.groupName}>{g.name}</span>
                <span className={styles.groupMeta}>
                  {g.member_count} member{g.member_count !== 1 ? "s" : ""} · {g.my_role}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bets */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>My Bets</h3>
        <div className={styles.tabs}>
          {BET_TABS.map((t) => (
            <button
              key={t.key}
              className={`${styles.tab} ${betTab === t.key ? styles.tabActive : ""}`}
              onClick={() => setBetTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {betsLoading ? (
          <p className={styles.empty}>Loading…</p>
        ) : myBets.length === 0 ? (
          <p className={styles.empty}>No bets here yet.</p>
        ) : (
          <div className={styles.betList}>
            {myBets.map((bet) => (
              <BetCard
                key={bet.id}
                bet={bet}
                groupName={bet.group_name}
                onClick={() => navigate(`/groups/${bet.group}/bets/${bet.id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
