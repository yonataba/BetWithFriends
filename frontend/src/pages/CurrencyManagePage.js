import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { currenciesApi } from "../api";
import Layout from "../components/Layout";
import Button from "../components/Button";
import styles from "./CurrencyManagePage.module.css";

export default function CurrencyManagePage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ code: "", name: "", symbol: "" });
  const [formError, setFormError] = useState("");

  const { data: currencies = [], isLoading } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => currenciesApi.list().then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: () => currenciesApi.create({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      symbol: form.symbol.trim(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(["currencies"]);
      setForm({ code: "", name: "", symbol: "" });
      setFormError("");
    },
    onError: (err) => {
      setFormError(
        err?.response?.data?.detail || "Failed to add currency."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (code) => currenciesApi.delete(code),
    onSuccess: () => queryClient.invalidateQueries(["currencies"]),
  });

  const handleAdd = (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.code.trim() || !form.name.trim()) {
      setFormError("Code and name are required.");
      return;
    }
    addMutation.mutate();
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Layout>
      <h2 className={styles.title}>Manage Currencies</h2>

      {/* Add form */}
      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Add Currency</h3>
        <form className={styles.form} onSubmit={handleAdd}>
          <input
            className={styles.input}
            placeholder="Code (e.g. JPY)"
            value={form.code}
            onChange={set("code")}
            maxLength={10}
          />
          <input
            className={styles.input}
            placeholder="Name (e.g. Japanese Yen)"
            value={form.name}
            onChange={set("name")}
            maxLength={100}
            style={{ flex: 2 }}
          />
          <input
            className={styles.input}
            placeholder="Symbol (e.g. ¥)"
            value={form.symbol}
            onChange={set("symbol")}
            maxLength={5}
            style={{ flex: "0 0 80px" }}
          />
          <Button type="submit" size="sm" disabled={addMutation.isPending}>
            {addMutation.isPending ? "Adding…" : "Add"}
          </Button>
        </form>
        {formError && <p className={styles.error}>{formError}</p>}
      </section>

      {/* Currency list */}
      <section className={styles.card}>
        <h3 className={styles.sectionTitle}>Current Currencies</h3>
        {isLoading ? (
          <p>Loading…</p>
        ) : currencies.length === 0 ? (
          <p className={styles.empty}>No currencies yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Symbol</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {currencies.map((c) => (
                <tr key={c.code}>
                  <td className={styles.code}>{c.code}</td>
                  <td>{c.name}</td>
                  <td className={styles.symbol}>{c.symbol}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteMutation.mutate(c.code)}
                      disabled={deleteMutation.isPending}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </Layout>
  );
}
