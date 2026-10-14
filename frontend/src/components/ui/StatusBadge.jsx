const tones = {
  neutral: "bg-soft text-ink",
  success: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  warning: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  danger: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};
export default function StatusBadge({ tone = "neutral", children }) {
  return <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${tones[tone] || tones.neutral}`}>{children}</span>;
}
