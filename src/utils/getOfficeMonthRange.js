// Office month runs from 26th of the previous month to 25th of the selected month.
// Pass the selected month's date (any day) — it always returns that period.
export function getOfficeMonthRange(selectedDate = new Date()) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  const start = new Date(year, month - 1, 26);
  const end = new Date(year, month, 25, 23, 59, 59, 999);
  return { start, end };
}
