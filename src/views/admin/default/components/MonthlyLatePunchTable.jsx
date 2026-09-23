import { useEffect, useState } from "react";
import Card from "components/card";
import dashboardAPI from "services/dashboard";
import { getOfficeMonthRange } from "utils/getOfficeMonthRange";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt } from "react-icons/fa";

const formatDateForApi = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const renderMonthContent = (month, shortMonth, year) => (
  <span>{shortMonth}</span>
);

const getDefaultEndMonth = () => {
  const today = new Date();
  const day = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth();
  return day > 25 ? new Date(year, month + 1, 1) : new Date(year, month, 1);
};

const formatDateForLabel = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const MonthlyLatePunchTable = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeLabel, setRangeLabel] = useState({ from: "", to: "" });
  const [selectedMonth, setSelectedMonth] = useState(getDefaultEndMonth);

  useEffect(() => {
    const { start, end } = getOfficeMonthRange(selectedMonth);
    const from = formatDateForApi(start);
    const to = formatDateForApi(end);
    const currentEmployeeId =
      localStorage.getItem("employee_id") || localStorage.getItem("user_id");

    setLoading(true);
    setRangeLabel({ from, to });

    dashboardAPI.getLatePunchIn(
      { from_date: from, to_date: to },
      (response) => {
        const employees = Array.isArray(response?.employees)
          ? response.employees
          : [];

        const employeeRecords = employees.filter((employee) =>
          [
            employee?.employee,
            employee?.employee_id,
            employee?.emp_id,
            employee?.user,
            employee?.user_id,
          ].some(
            (value) =>
              value !== undefined && String(value) === String(currentEmployeeId)
          )
        );

        setRecords(employeeRecords.length > 0 ? employeeRecords : employees);
        setLoading(false);
      },
      () => {
        setRecords([]);
        setLoading(false);
      }
    );
  }, [selectedMonth]);

  return (
    <Card extra="w-full h-full px-3 pb-4 sm:px-4 overflow-hidden">
      <div className="flex flex-col gap-1 pb-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-navy-700 dark:text-white sm:text-xl">
            Monthly Late Punch In
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDateForLabel(rangeLabel.from)} -{" "}
            {formatDateForLabel(rangeLabel.to)}

          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Month
            </label>
            <DatePicker
              selected={selectedMonth}
              onChange={(date) =>
                date &&
                setSelectedMonth(
                  new Date(date.getFullYear(), date.getMonth(), 1)
                )
              }
              renderMonthContent={renderMonthContent}
              showMonthYearPicker
              dateFormat="MMMM yyyy"
              popperProps={{ strategy: "fixed" }}
              popperPlacement="bottom-start"
              wrapperClassName="w-full"
              calendarClassName="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
              maxDate={getDefaultEndMonth()}
              customInput={
                <div className="relative flex w-full min-w-[190px] cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 sm:min-w-[230px]">
                  <span className="flex-1 select-none whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-200">
                    {selectedMonth
                      ? (() => {
                          const { start, end } = getOfficeMonthRange(selectedMonth);
                          return `${start.getDate()} ${start.toLocaleString("default", { month: "short" })} – ${end.getDate()} ${end.toLocaleString("default", { month: "short", year: "numeric" })}`;
                        })()
                      : "Select month"}
                  </span>
                  <FaCalendarAlt className="ml-2 shrink-0 text-gray-400 dark:text-gray-500" />
                </div>
              }
            />
          </div>
          <div className="text-sm font-semibold text-orange-500 dark:text-orange-300">
            {records.length} record{records.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Loading late punch-in data...
            </div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              No late punch-in records found for this month.
            </div>
          ) : (
            <table className="w-full min-w-[420px] border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-navy-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-white">
                    S.No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-white">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-white">
                    Punch In
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr
                    key={`${record?.date || "date"}-${
                      record?.punch_in_time || index
                    }`}
                    className="border-t border-gray-100 dark:border-gray-700"
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-navy-700 dark:text-white">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {record?.date || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-500 dark:text-red-300">
                      {record?.punch_in_time || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MonthlyLatePunchTable;
