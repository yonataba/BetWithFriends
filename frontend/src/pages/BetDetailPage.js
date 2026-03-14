import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { betsApi, groupsApi, currenciesApi } from "../api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Button from "../components/Button";
import styles from "./BetDetailPage.module.css";
import dayjs from "dayjs";

export default function BetDetailPage() {
  const { groupId, betId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [resolveMode, setResolveMode] = useState(false);
  const [winnerId, setWinnerId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState("");
  const [counterMode, setCounterMode] = useState(false);
  const [counterForm, setCounterForm] = useState({ challenger_amount: "", opponent_amount: "" });
  const [counterError, setCounterError] = useState("");

  const { data: bet, isLoading } = useQuery({
    queryKey: ["bet", groupId, betId],
    queryFn: () => betsApi.get(groupId, betId).then((r) => r.data),
  });

  const { data: group } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.get(groupId).then((r) => r.data),
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => currenciesApi.list().then((r) => r.data),
  });

  const resolveMutation = useMutation({
    mutationFn: (data) => betsApi.resolve(groupId, betId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet", groupId, betId] });
      queryClient.invalidateQueries({ queryKey: ["bets", groupId] });
      setResolveMode(false);
    },
    onError: (err) => setError(err.response?.data?.detail || "Failed to resolve bet."),
  });

  const editMutation = useMutation({
    mutationFn: (data) => betsApi.update(groupId, betId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet", groupId, betId] });
      queryClient.invalidateQueries({ queryKey: ["bets", groupId] });
      setEditMode(false);
      setEditError("");
    },
    onError: (err) => setEditError(err.response?.data?.detail || "Failed to update bet."),
  });

  const acceptMutation = useMutation({
    mutationFn: () => betsApi.accept(groupId, betId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet", groupId, betId] });
      queryClient.invalidateQueries({ queryKey: ["bets", groupId] });
      queryClient.invalidateQueries(["pendingForMe"]);
    },
    onError: (err) => setError(err.response?.data?.detail || "Failed to accept."),
  });

  const rejectMutation = useMutation({
    mutationFn: () => betsApi.reject(groupId, betId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet", groupId, betId] });
      queryClient.invalidateQueries({ queryKey: ["bets", groupId] });
      queryClient.invalidateQueries(["pendingForMe"]);
    },
    onError: (err) => setError(err.response?.data?.detail || "Failed to reject."),
  });

  const counterMutation = useMutation({
    mutationFn: (data) => betsApi.counter(groupId, betId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet", groupId, betId] });
      queryClient.invalidateQueries({ queryKey: ["bets", groupId] });
      queryClient.invalidateQueries(["pendingForMe"]);
      setCounterMode(false);
      setCounterError("");
    },
    onError: (err) => setCounterError(err.response?.data?.detail || "Failed to send counter offer."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => betsApi.cancel(groupId, betId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bets", groupId] });
      navigate(`/groups/${groupId}`);
    },
    onError: (err) => setError(err.response?.data?.detail || "Failed to delete bet."),
  });

  if (isLoading) return <Layout><p>Loading…</p></Layout>;
  if (!bet) return <Layout><p>Bet not found.</p></Layout>;

  const isAdmin = group?.my_role === "group_admin";
  const isCreator = bet.creator?.id === user?.id;
  const isPending = bet.status === "pending";
  const isMyTurn = isPending && bet.awaiting_response_from?.id === user?.id;
  const canResolve = (isAdmin || isCreator) && bet.status === "open";
  const canEdit = (isAdmin || isCreator) && bet.status === "open";

  const startEdit = () => {
    setEditForm({
      title: bet.title,
      description: bet.description,
      challenger_amount: bet.challenger_amount,
      opponent_amount: bet.opponent_amount,
      currency: bet.currency,
      due_date: bet.due_date ? dayjs(bet.due_date).format("YYYY-MM-DD") : "",
    });
    setEditMode(true);
  };
  const setEditField = (key) => (e) =>
    setEditForm((f) => ({ ...f, [key]: e.target.value }));
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editForm.title) return setEditError("Title is required.");
    setEditError("");
    editMutation.mutate({
      ...editForm,
      due_date: editForm.due_date || null,
    });
  };

  const handleResolve = (e) => {
    e.preventDefault();
    if (!winnerId) return setError("Please select a winner.");
    setError("");
    resolveMutation.mutate({ winner_id: Number(winnerId), outcome_notes: notes });
  };

  return (
    <Layout>
      <button className={styles.back} onClick={() => navigate(`/groups/${groupId}`)}>
        ← Back to group
      </button>

      <div className={styles.card}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{bet.title}</h2>
          <span
            className={styles.status}
            data-status={bet.status}
          >
            {bet.status}
          </span>
        </div>

        {bet.description && <p className={styles.desc}>{bet.description}</p>}

        <table className={styles.table}>
          <tbody>
            <tr>
              <td>Challenger</td>
              <td>
                <strong>
                  {bet.challenger.nickname || bet.challenger.first_name || bet.challenger.email}
                </strong>
              </td>
            </tr>
            <tr>
              <td>Opponent</td>
              <td>
                <strong>
                  {bet.opponent.nickname || bet.opponent.first_name || bet.opponent.email}
                </strong>
              </td>
            </tr>
            <tr>
              <td>Stakes</td>
              <td>
                <strong>{bet.challenger.nickname || bet.challenger.first_name || bet.challenger.email}</strong> wins {bet.challenger_amount} {bet.currency}
                {" / "}
                <strong>{bet.opponent.nickname || bet.opponent.first_name || bet.opponent.email}</strong> wins {bet.opponent_amount} {bet.currency}
              </td>
            </tr>
            {bet.due_date && (
              <tr>
                <td>Due Date</td>
                <td>{dayjs(bet.due_date).format("MMM D, YYYY")}</td>
              </tr>
            )}
            {bet.winner && (
              <tr>
                <td>Winner</td>
                <td>
                  <strong>🏆 {bet.winner.nickname || bet.winner.first_name || bet.winner.email}</strong>
                </td>
              </tr>
            )}
            {bet.outcome_notes && (
              <tr>
                <td>Notes</td>
                <td>{bet.outcome_notes}</td>
              </tr>
            )}
            {bet.resolved_at && (
              <tr>
                <td>Resolved</td>
                <td>{dayjs(bet.resolved_at).format("MMM D, YYYY HH:mm")}</td>
              </tr>
            )}
            <tr>
              <td>Created</td>
              <td>{dayjs(bet.created_at).format("MMM D, YYYY")}</td>
            </tr>
          </tbody>
        </table>

        {/* Pending proposal response */}
        {isPending && (
          <div className={styles.pendingBanner}>
            {isMyTurn ? (
              <>
                <p className={styles.pendingMsg}>
                  <strong>{bet.creator?.nickname || bet.creator?.first_name || bet.creator?.email}</strong> proposed this bet — your turn to respond.
                </p>
                {error && <div className={styles.error}>{error}</div>}
                {!counterMode && (
                  <div className={styles.actions}>
                    <Button
                      onClick={() => acceptMutation.mutate()}
                      disabled={acceptMutation.isPending || rejectMutation.isPending}
                    >
                      ✓ Accept
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setCounterForm({
                          challenger_amount: bet.challenger_amount,
                          opponent_amount: bet.opponent_amount,
                        });
                        setCounterMode(true);
                      }}
                    >
                      ↩ Counter Offer
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => rejectMutation.mutate()}
                      disabled={acceptMutation.isPending || rejectMutation.isPending}
                    >
                      ✗ Reject
                    </Button>
                  </div>
                )}
                {counterMode && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setCounterError("");
                      counterMutation.mutate(counterForm);
                    }}
                    className={styles.editForm}
                  >
                    <h3>Counter Offer</h3>
                    {counterError && <div className={styles.error}>{counterError}</div>}
                    <div className={styles.row}>
                      <label className={styles.label} style={{ flex: 1 }}>
                        {bet.challenger.nickname || bet.challenger.first_name || bet.challenger.email} wins
                        <input
                          className={styles.input}
                          type="number" min="0" step="0.01"
                          value={counterForm.challenger_amount}
                          onChange={(e) => setCounterForm((f) => ({ ...f, challenger_amount: e.target.value }))}
                        />
                      </label>
                      <label className={styles.label} style={{ flex: 1 }}>
                        {bet.opponent.nickname || bet.opponent.first_name || bet.opponent.email} wins
                        <input
                          className={styles.input}
                          type="number" min="0" step="0.01"
                          value={counterForm.opponent_amount}
                          onChange={(e) => setCounterForm((f) => ({ ...f, opponent_amount: e.target.value }))}
                        />
                      </label>
                    </div>
                    <div className={styles.actions}>
                      <Button variant="secondary" type="button" onClick={() => setCounterMode(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={counterMutation.isPending}>
                        {counterMutation.isPending ? "Sending…" : "Send Counter Offer"}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <p className={styles.pendingMsg}>
                ⏳ Waiting for{" "}
                <strong>
                  {bet.awaiting_response_from?.nickname ||
                    bet.awaiting_response_from?.first_name ||
                    bet.awaiting_response_from?.email}
                </strong>{" "}
                to respond.
              </p>
            )}
          </div>
        )}

        {(canEdit || canResolve || isAdmin) && !editMode && !resolveMode && !isMyTurn && (
          <div className={styles.actions}>
            {canEdit && (
              <Button variant="secondary" onClick={startEdit} size="md">
                Edit Bet
              </Button>
            )}
            {canResolve && (
              <Button onClick={() => setResolveMode(true)} size="md">
                Mark as Resolved
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="danger"
                size="md"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm("Permanently delete this bet? This cannot be undone.")) {
                    deleteMutation.mutate();
                  }
                }}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete Bet"}
              </Button>
            )}
          </div>
        )}

        {editMode && (
          <form onSubmit={handleEditSubmit} className={styles.editForm}>
            <h3>Edit Bet</h3>
            {editError && <div className={styles.error}>{editError}</div>}
            <label className={styles.label}>
              Title *
              <input
                className={styles.input}
                value={editForm.title}
                onChange={setEditField("title")}
                maxLength={200}
              />
            </label>
            <label className={styles.label}>
              Description
              <textarea
                className={styles.input}
                value={editForm.description}
                onChange={setEditField("description")}
                rows={2}
              />
            </label>
            <div className={styles.row}>
              <label className={styles.label} style={{ flex: 1 }}>
                Challenger wins *
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.challenger_amount}
                  onChange={setEditField("challenger_amount")}
                />
              </label>
              <label className={styles.label} style={{ flex: 1 }}>
                Opponent wins *
                <input
                  className={styles.input}
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.opponent_amount}
                  onChange={setEditField("opponent_amount")}
                />
              </label>
              <label className={styles.label} style={{ flex: 1 }}>
                Currency
                <select
                  className={styles.input}
                  value={editForm.currency}
                  onChange={setEditField("currency")}
                >
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
                value={editForm.due_date}
                onChange={setEditField("due_date")}
              />
            </label>
            <div className={styles.actions}>
              <Button variant="secondary" type="button" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={editMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {resolveMode && (
          <form onSubmit={handleResolve} className={styles.resolveForm}>
            <h3>Resolve Bet</h3>
            {error && <div className={styles.error}>{error}</div>}
            <label className={styles.label}>
              Winner *
              <select
                className={styles.input}
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
              >
                <option value="">-- select winner --</option>
                <option value={bet.challenger.id}>
                  {bet.challenger.nickname || bet.challenger.first_name || bet.challenger.email}
                </option>
                <option value={bet.opponent.id}>
                  {bet.opponent.nickname || bet.opponent.first_name || bet.opponent.email}
                </option>
              </select>
            </label>
            <label className={styles.label}>
              Outcome Notes
              <textarea
                className={styles.input}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </label>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setResolveMode(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={resolveMutation.isPending}>
                Confirm
              </Button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
}
