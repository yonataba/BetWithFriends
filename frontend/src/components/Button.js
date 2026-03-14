import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  ...props
}) {
  return (
    <button
      className={[styles.btn, styles[variant], styles[size]].join(" ")}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? "Loading…" : children}
    </button>
  );
}
