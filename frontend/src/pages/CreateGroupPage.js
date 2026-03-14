import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { groupsApi } from "../api";
import Layout from "../components/Layout";
import Button from "../components/Button";
import styles from "./FormPage.module.css";

export default function CreateGroupPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => groupsApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      navigate(`/groups/${res.data.id}`);
    },
    onError: () => setError("Failed to create group. Please try again."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Group name is required.");
    setError("");
    mutation.mutate({ name: name.trim(), description: description.trim() });
  };

  return (
    <Layout>
      <div className={styles.container}>
        <h2>Create a New Group</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Group Name *
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Friday Night Crew"
              maxLength={100}
            />
          </label>
          <label className={styles.label}>
            Description
            <textarea
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description…"
            />
          </label>
          <div className={styles.actions}>
            <Button variant="secondary" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
