import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { groupsApi } from "../api";
import Layout from "../components/Layout";
import Button from "../components/Button";
import styles from "./GroupsPage.module.css";

export default function GroupsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => groupsApi.list().then((r) => r.data),
  });

  const joinMutation = useMutation({
    mutationFn: () => groupsApi.joinByCode(code.trim().toUpperCase()),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["groups"]);
      setCode("");
      setJoinError("");
      navigate(`/groups/${res.data.id}`);
    },
    onError: (err) => {
      setJoinError(
        err?.response?.data?.detail ||
        err?.response?.data?.code?.[0] ||
        "Invalid invite code."
      );
    },
  });

  const handleJoin = (e) => {
    e.preventDefault();
    setJoinError("");
    if (code.trim()) joinMutation.mutate();
  };

  return (
    <Layout>
      {/* Join by code */}
      <section className={styles.joinSection}>
        <h2 className={styles.sectionTitle}>Join a Group</h2>
        <form className={styles.joinForm} onSubmit={handleJoin}>
          <input
            className={styles.codeInput}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter invite code"
            maxLength={8}
            autoComplete="off"
            spellCheck={false}
          />
          <Button type="submit" size="sm" disabled={!code.trim() || joinMutation.isPending}>
            {joinMutation.isPending ? "Joining…" : "Join"}
          </Button>
        </form>
        {joinError && <p className={styles.error}>{joinError}</p>}
      </section>

      {/* My groups */}
      <div className={styles.header}>
        <h2>My Groups</h2>
        <Button size="sm" onClick={() => navigate("/groups/new")}>
          + Create Group
        </Button>
      </div>

      {isLoading ? (
        <p>Loading…</p>
      ) : groups.length === 0 ? (
        <p className={styles.empty}>You're not in any groups yet. Join one with a code or create your own!</p>
      ) : (
        <ul className={styles.list}>
          {groups.map((g) => (
            <li
              key={g.id}
              className={styles.item}
              onClick={() => navigate(`/groups/${g.id}`)}
            >
              <div>
                <span className={styles.name}>{g.name}</span>
                {g.description && (
                  <span className={styles.desc}>{g.description}</span>
                )}
              </div>
              <div className={styles.meta}>
                <span>{g.member_count} members</span>
                <span className={styles.role}>{g.my_role}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
