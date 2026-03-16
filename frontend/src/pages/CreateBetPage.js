import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { groupsApi, betsApi, currenciesApi } from "../api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Button from "../components/Button";
import styles from "./FormPage.module.css";


export default function CreateBetPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ["members", groupId],
    queryFn: () => groupsApi.getMembers(groupId).then((r) => r.data),
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => currenciesApi.list().then((r) => r.data),
  });

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.get(groupId).then((r) => r.data),
  });

  const isAdmin = group?.my_role === "group_admin";

  const [form, setForm] = useState({
    title: "",
    description: "",
    challenger_id: user?.id || "",
    opponent_id: "",
    challenger_amount: "",
    opponent_amount: "",
    currency: "ILS",
    due_date: "", // yyyy-mm-dd
  });
  const [error, setError] = useState("");

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const mutation = useMutation({
    mutationFn: (data) => betsApi.create(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bets", groupId] });
      navigate(`/groups/${groupId}`);
    },
    onError: (err) => {
      const detail = err.response?.data;
      setError(
        typeof detail === "string"
          ? detail
          : JSON.stringify(detail) || "Failed to create bet."
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.challenger_id || !form.opponent_id || !form.challenger_amount || !form.opponent_amount) {
      return setError("Please fill in all required fields.");
    }
    setError("");
    mutation.mutate({
      ...form,
      challenger_id: Number(form.challenger_id),
      opponent_id: Number(form.opponent_id),
      challenger_amount: form.challenger_amount,
      opponent_amount: form.opponent_amount,
      due_date: form.due_date || null,
    });
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h2>Create a Bet</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Title *
            <input
              className={styles.input}
              value={form.title}
              onChange={set("title")}
              placeholder="e.g. Who runs a 5K first"
              maxLength={200}
            />
          </label>
          <label className={styles.label}>
            Description
            <textarea
              className={styles.input}
              value={form.description}
              onChange={set("description")}
              rows={2}
            />
          </label>
          <label className={styles.label}>
            Challenger *
            <select
              className={styles.input}
              value={form.challenger_id}
              onChange={set("challenger_id")}
              disabled={!isAdmin}
            >
              {members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.nickname
                    ? m.user.nickname
                    : m.user.first_name
                    ? `${m.user.first_name} ${m.user.last_name}`
                    : m.user.email}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Opponent *
            <select className={styles.input} value={form.opponent_id} onChange={set("opponent_id")}>
              <option value="">-- select opponent --</option>
              {members
                .filter((m) => m.user.id !== Number(form.challenger_id))
                .map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.nickname
                      ? m.user.nickname
                      : m.user.first_name
                      ? `${m.user.first_name} ${m.user.last_name}`
                      : m.user.email}
                  </option>
                ))}
            </select>
          </label>
          <div className={styles.row}>
            <label className={styles.label} style={{ flex: 1 }}>
              Challenger wins *
              <input
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={form.challenger_amount}
                onChange={set("challenger_amount")}
                placeholder="e.g. 10"
              />
            </label>
            <label className={styles.label} style={{ flex: 1 }}>
              Opponent wins *
              <input
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={form.opponent_amount}
                onChange={set("opponent_amount")}
                placeholder="e.g. 40"
              />
            </label>
            <label className={styles.label} style={{ flex: 1 }}>
              Currency
              <select className={styles.input} value={form.currency} onChange={set("currency")}>
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} – {c.name}</option>
                ))}
              </select>
            </label>
          </div>
          <label className={styles.label}>
            Due Date
            <input
              className={styles.input}
              type="date"
              value={form.due_date}
              onChange={set("due_date")}
            />
          </label>
          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {isAdmin ? "Create Bet" : "Propose Bet"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
