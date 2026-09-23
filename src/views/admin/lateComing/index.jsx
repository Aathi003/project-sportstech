import React, { useEffect, useMemo, useState } from "react";
import Card from "components/card";
import attendanceAPI from "services/attendanceAPI";
import { showError, showSuccess } from "utils/toastHelper";
import { useAuth } from "contexts/AuthContext";
import { IoTime } from "react-icons/io5";

const getAttendanceList = (data) => {
  if (data?.data?.attendance && Array.isArray(data.data.attendance)) {
    return data.data.attendance;
  }
  if (Array.isArray(data?.attendance)) {
    return data.attendance;
  }
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  if (Array.isArray(data?.records)) {
    return data.records;
  }
  if (Array.isArray(data)) {
    return data;
  }
  return [];
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const isLatePunchIn = (record) => {
  if (record?.is_late === true) return true;
  if (record?.late_time || record?.late_punch_in || record?.late_minutes) {
    return true;
  }

  const punchInValue =
    record?.punch_in || record?.punch_in_time || record?.check_in || "";
  const punchInMinutes = parseTimeToMinutes(String(punchInValue));

  if (punchInMinutes == null) return false;

  return punchInMinutes > 9 * 60 + 30;
};

const getLateTime = (record) => {
  return (
    record?.late_time ||
    record?.late_punch_in ||
    record?.late_minutes ||
    record?.punch_in ||
    record?.punch_in_time ||
    "-"
  );
};

const getLateReason = (record) => {
  return record?.late_reason || record?.reason || record?.remarks || "-";
};

const getEmployeeMatchValues = (record) => {
  return [
    record?.employee,
    record?.employee_id,
    record?.emp_id,
    record?.user,
    record?.user_id,
    record?.id,
  ]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map(String);
};

const LateComing = () => {
  const { isSuperAdmin, user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dateMode, setDateMode] = useState("single");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [modalState, setModalState] = useState({
    open: false,
    record: null,
    lateTime: "",
    lateReason: "",
  });

  const currentEmployeeId =
    localStorage.getItem("employee_id") ||
    localStorage.getItem("emp_id") ||
    localStorage.getItem("user_id") ||
    String(user || "");

  const loadLateComing = () => {
    setLoading(true);
    const params = {};
    if (dateMode === "single") {
      if (selectedDate) params.from_date = selectedDate;
    } else {
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
    }

    attendanceAPI.getLateComingReport(
      params,
      (data) => {
        const attendanceList = getAttendanceList(data);
        const lateRecords = attendanceList.filter(isLatePunchIn);

        const visibleRecords = isSuperAdmin
          ? lateRecords
          : lateRecords.filter((record) =>
              getEmployeeMatchValues(record).includes(String(currentEmployeeId))
            );
        setRecords(visibleRecords);
        setLoading(false);
      },
      (error) => {
        setRecords([]);
        setLoading(false);
        showError(error?.message || "Failed to load late coming report.");
      }
    );
  };

  useEffect(() => {
    loadLateComing();
  }, [
    dateMode,
    selectedDate,
    fromDate,
    toDate,
    isSuperAdmin,
    currentEmployeeId,
  ]);

  const tableRows = useMemo(() => {
    return records.map((record, index) => ({
      key: `${record?.id || record?.attendance_id || index}-${
        record?.date || "date"
      }`,
      sno: index + 1,
      date: record?.date || "-",
      empCode: record?.emp_code || record?.employee_code || "-",
      name: record?.employee_name || record?.name || record?.user_name || "-",
      lateTime: record?.late_time || "-",
      lateReason: record?.late_coming_reason || "-",
      raw: record,
    }));
  }, [records]);

  const openEditModal = (row) => {
    setModalState({
      open: true,
      record: row.raw,
      lateTime: row.lateTime === "-" ? "" : row.lateTime,
      lateReason: row.lateReason === "-" ? "" : row.lateReason,
    });
  };

  const closeEditModal = () => {
    setModalState({ open: false, record: null, lateTime: "", lateReason: "" });
  };

  const handleUpdateLateReason = () => {
    if (!modalState.record) return;
    if (!modalState.lateReason.trim()) {
      showError("Late reason is required.");
      return;
    }

    const record = modalState.record;
    const payload = {
      attendance_id: record?.attendanceid || record?.id || null,
      emp_id: 1,
      reason: modalState.lateReason.trim(),
    };

    setSubmitting(true);
    attendanceAPI.updateLatePunchReason(
      payload,
      () => {
        showSuccess("Late reason updated successfully.");
        setSubmitting(false);
        closeEditModal();
        loadLateComing();
      },
      (error) => {
        showError(error?.message || "Failed to update late reason.");
        setSubmitting(false);
      }
    );
  };

  return (
    <div className="mt-3">
      <Card extra="w-full p-4 sm:p-6">
        <div className="mb-5">
          <div>
            <div className="flex items-center gap-2">
              <IoTime className="h-5 w-5 text-brand-500" />
              <h2 className="text-lg font-bold text-navy-700 dark:text-white sm:text-xl">
                Late Coming
              </h2>
            </div>
            <p className="text-black mt-1 text-sm dark:text-gray-400">
              {isSuperAdmin
                ? "All employees with late punch-in for the selected date"
                : "Your late punch-in records for the selected date"}
            </p>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
            <div className="flex max-w-full items-center gap-1 self-start overflow-x-auto rounded-lg border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-navy-700">
              <button
                onClick={() => setDateMode("single")}
                className={`min-h-[36px] whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold transition ${
                  dateMode === "single"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-600"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setDateMode("range")}
                className={`min-h-[36px] whitespace-nowrap rounded-md px-3 py-2 text-xs font-semibold transition ${
                  dateMode === "range"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-600"
                }`}
              >
                Date Range
              </button>
            </div>

            {dateMode === "single" ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="text-sm font-semibold text-navy-700 dark:text-white">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:max-w-[220px]"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="text-sm font-semibold text-navy-700 dark:text-white">
                    From
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:max-w-[220px]"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="text-sm font-semibold text-navy-700 dark:text-white">
                    To
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:max-w-[220px]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="text-black py-10 text-center text-sm dark:text-gray-400">
              Loading late coming report...
            </div>
          ) : tableRows.length === 0 ? (
            <div className="text-black py-10 text-center text-sm dark:text-gray-400">
              No late punch-in records found.
            </div>
          ) : (
            <table className="w-full min-w-[600px] text-xs sm:min-w-[760px] sm:text-sm">
              <thead className="bg-gray-50 dark:bg-navy-800">
                <tr>
                  <th className="text-black whitespace-nowrap px-2 py-2 text-left text-[11px] font-bold uppercase dark:text-white sm:px-4 sm:py-3 sm:text-xs">
                    S.No
                  </th>
                  <th className="text-black whitespace-nowrap px-2 py-2 text-left text-[11px] font-bold uppercase dark:text-white sm:px-4 sm:py-3 sm:text-xs">
                    Date
                  </th>
                  <th className="text-black whitespace-nowrap px-2 py-2 text-left text-[11px] font-bold uppercase dark:text-white sm:px-4 sm:py-3 sm:text-xs">
                    Emp Code
                  </th>
                  <th className="text-black whitespace-nowrap px-2 py-2 text-left text-[11px] font-bold uppercase dark:text-white sm:px-4 sm:py-3 sm:text-xs">
                    Name
                  </th>
                  <th className="text-black whitespace-nowrap px-2 py-2 text-left text-[11px] font-bold uppercase dark:text-white sm:px-4 sm:py-3 sm:text-xs">
                    Late Time
                  </th>
                  <th className="text-black whitespace-nowrap px-2 py-2 text-left text-[11px] font-bold uppercase dark:text-white sm:px-4 sm:py-3 sm:text-xs">
                    Late Reason
                  </th>
                  <th className="text-black whitespace-nowrap px-2 py-2 text-left text-[11px] font-bold uppercase dark:text-white sm:px-4 sm:py-3 sm:text-xs">
                    Status
                  </th>
                  {isSuperAdmin && (
                    <th className="text-black px-4 py-3 text-left text-xs font-bold uppercase dark:text-white">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-t border-gray-100 dark:border-gray-700"
                  >
                    <td className="text-black whitespace-nowrap px-2 py-2 text-xs font-semibold dark:text-white sm:px-4 sm:py-3 sm:text-sm">
                      {row.sno}
                    </td>
                    <td className="text-black whitespace-nowrap px-2 py-2 text-xs dark:text-gray-200 sm:px-4 sm:py-3 sm:text-sm">
                      {row.date}
                    </td>
                    <td className="text-black whitespace-nowrap px-2 py-2 text-xs dark:text-gray-200 sm:px-4 sm:py-3 sm:text-sm">
                      {row.empCode}
                    </td>
                    <td className="text-black whitespace-nowrap px-2 py-2 text-xs dark:text-gray-200 sm:px-4 sm:py-3 sm:text-sm">
                      {row.name}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs font-semibold text-red-500 dark:text-red-300 sm:px-4 sm:py-3 sm:text-sm">
                      {row.lateTime} mins
                    </td>
                    <td className="text-black whitespace-nowrap px-2 py-2 text-xs dark:text-gray-200 sm:px-4 sm:py-3 sm:text-sm">
                      {row.lateReason}
                    </td>
                    <td className="text-black whitespace-nowrap px-2 py-2 text-xs dark:text-gray-200 sm:px-4 sm:py-3 sm:text-sm">
                      {row.is_acceptable ? (
                        <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700 dark:bg-green-900 dark:text-green-200 sm:text-xs">
                          Acceptable
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700 dark:bg-red-900 dark:text-red-200 sm:text-xs">
                          Not Acceptable
                        </span>
                      )}
                    </td>
                    {isSuperAdmin && (
                      <td className="px-2 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm">
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="whitespace-nowrap rounded-lg bg-blue-500 px-2 py-2 text-[10px] font-semibold text-white transition hover:bg-blue-600 sm:text-xs"
                        >
                          Update Late Reason
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {modalState.open && isSuperAdmin && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 p-4 px-2 backdrop-blur-sm backdrop-blur-sm sm:px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl dark:bg-navy-800 sm:p-6 ">
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Update Late Reason
            </h3>
            <p className="text-black mt-1 text-sm dark:text-gray-400">
              Update late punch-in time and reason for this employee.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-navy-700 dark:text-white">
                  Late Time
                </label>
                <input
                  type="text"
                  value={modalState.lateTime}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-navy-700 dark:text-white">
                  Late Reason
                </label>
                <textarea
                  rows={4}
                  value={modalState.lateReason}
                  onChange={(e) =>
                    setModalState((prev) => ({
                      ...prev,
                      lateReason: e.target.value,
                    }))
                  }
                  placeholder="Enter reason"
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                disabled={submitting}
                className="text-black rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold transition hover:bg-gray-200 disabled:opacity-60 dark:bg-navy-700 dark:text-gray-300 dark:hover:bg-navy-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateLateReason}
                disabled={submitting}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
              >
                {submitting ? "Updating..." : "Update Late Reason"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LateComing;
