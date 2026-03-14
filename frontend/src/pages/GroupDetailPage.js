import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { groupsApi, betsApi } from "../api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import BetCard from "../components/BetCard";
import Button from "../components/Button";
import styles from "./GroupDetailPage.module.css";

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.get(groupId).then((r) => r.data),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", groupId],
    queryFn: () => groupsApi.getMembers(groupId).then((r) => r.data),
  });

  const { data: bets = [], isLoading: betsLoading } = useQuery({
    queryKey: ["bets", groupId],
    queryFn: () => betsApi.list(groupId).then((r) => r.data),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => groupsApi.regenerateCode(groupId),
    onSuccess: () => queryClient.invalidateQueries(["group", groupId]),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => groupsApi.removeMember(groupId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", groupId] }),
  });

  const isAdmin = group?.my_role === "group_admin";

  const copyCode = () => {
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (groupLoading) return <Layout><p>Loading…</p></Layout>;
  if (!group) return <Layout><p>Group not found.</p></Layout>;

  return (
    <Layout>
      <div className={styles.groupHeader}>
        <div>
          <h2 className={styles.groupName}>{group.name}</h2>
          {group.description && <p className={styles.desc}>{group.description}</p>}
        </div>
        <Button size="sm" onClick={() => navigate(`/groups/${groupId}/bets/new`)}>
          + New Bet
        </Button>
      </div>

      {/* Invite code */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Invite Code</h3>
        <div className={styles.codeRow}>
          <span className={styles.code}>{group.invite_code}</span>
          <Button size="sm" variant="secondary" onClick={copyCode}>
            {copied ? "Copied!" : "Copy"}
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
            >
              {regenerateMutation.isPending ? "Regenerating…" : "Regenerate"}
            </Button>
          )}
        </div>
        <p className={styles.codeHint}>Share this code with friends so they can join the group.</p>
      </section>

      {/* Members */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Members ({members.length})
        </h3>
        <div className={styles.memberList}>
          {members.map((m) => (
            <div key={m.id} className={styles.member}>
              {m.user.avatar_url && (
                <img src={m.user.avatar_url} alt="" className={styles.avatar} />
              )}
              <div>
                <span className={styles.memberName}>
                  {m.user.nickname || m.user.first_name
                    ? `${m.user.nickname || m.user.first_name}${
                        m.user.last_name ? " " + m.user.last_name : ""
                      }`.trim()
                    : m.user.email}
                </span>
                <span className={styles.memberRole}>{m.role}</span>
              </div>
              {isAdmin && m.user.id !== user?.id && (
                <Button
                  size="sm"
                  variant="danger"
                  disabled={removeMemberMutation.isPending}
                  onClick={() => {
                    const name = m.user.nickname || m.user.first_name || m.user.email;
                    if (window.confirm(`Remove ${name} from the group?`)) {
                      removeMemberMutation.mutate(m.user.id);
                    }
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bets */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Bets</h3>
        {betsLoading ? (
          <p>Loading bets…</p>
        ) : bets.length === 0 ? (
          <p className={styles.empty}>No bets yet. Create one!</p>
        ) : (
          bets.map((bet) => (
            <BetCard
              key={bet.id}
              bet={bet}
              onClick={() => navigate(`/groups/${groupId}/bets/${bet.id}`)}
            />
          ))
        )}
      </section>
    </Layout>
  );
}
