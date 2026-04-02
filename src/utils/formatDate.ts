const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "short",
  day: "numeric"
});

export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}
