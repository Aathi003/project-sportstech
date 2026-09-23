import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import attendanceAPI from "services/attendanceAPI";
import employeeAPI from "services/employeeAPI";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EmployeeProfileImage from "../../../components/navbar/EmployeeProfileImage";
import {
  FaCalendarAlt,
  FaRegCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaSignInAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "contexts/AuthContext";

const DatePickerPortal = ({ children }) => {
  if (typeof document === "undefined") return children;
  return createPortal(
    <div style={{ position: "relative", zIndex: 9999 }}>{children}</div>,
    document.body
  );
};

const renderMonthContent = (month, shortMonth, year) => (
  <span>{shortMonth}</span>
);

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getDefaultEndMonth = () => {
  const today = new Date();
  const d = today.getDate();
  const y = today.getFullYear();
  const m = today.getMonth();
  return d > 25 ? new Date(y, m + 1, 1) : new Date(y, m, 1);
};

const getCycleBounds = (endMonthDate) => {
  const endYear = endMonthDate.getFullYear();
  const endMonth = endMonthDate.getMonth();
  const fromDate = new Date(endYear, endMonth - 1, 26);
  const toDate = new Date(endYear, endMonth, 25);
  return { fromDate, toDate, apiMonth: endMonth, apiYear: endYear };
};

const getEmptySelectedMatrixSummary = () => ({
  date: "—",
  punchIn: "—",
  punchOut: "—",
  totalHours: "—",
  status: "—",
  statusKey: "idle",
});

const AttendanceMatrix = () => {
  const { user, isSuperAdmin } = useAuth();
  const [matrix, setMatrix] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getDefaultEndMonth);
  const [selectedMatrixSummary, setSelectedMatrixSummary] = useState(
    getEmptySelectedMatrixSummary
  );
  const [selectedCellKey, setSelectedCellKey] = useState("");
  const [expandedEmps, setExpandedEmps] = useState(() => new Set());
  const [shouldFilterToEmployee, setShouldFilterToEmployee] = useState(
    !isSuperAdmin
  );

  const employeeKeys = useMemo(
    () =>
      new Set(
        [
          user,
          localStorage.getItem("employee_id"),
          localStorage.getItem("emp_id"),
          localStorage.getItem("user_id"),
        ]
          .filter(
            (value) => value !== null && value !== undefined && value !== ""
          )
          .map((value) => String(value))
      ),
    []
  );

  const pad = (n) => n.toString().padStart(2, "0");
  const fmtDate = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const showEmployeePunchDetails = !isSuperAdmin;

  const toggleEmpExpand = (code) => {
    setExpandedEmps((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  useEffect(() => {
    if (isSuperAdmin) {
      setShouldFilterToEmployee(false);
      return;
    }

    const profileId =
      localStorage.getItem("employee_id") ||
      localStorage.getItem("user_id") ||
      localStorage.getItem("emp_id") ||
      user;

    if (!profileId) {
      setShouldFilterToEmployee(true);
      return;
    }

    employeeAPI.getEmployeeById(
      profileId,
      (data) => {
        const profile = data?.data || data?.employee || data?.user || data;
        const roleLabel = String(
          profile?.role_name ||
            profile?.designation ||
            profile?.role?.role_name ||
            profile?.role ||
            ""
        ).toLowerCase();

        setShouldFilterToEmployee(!roleLabel.includes("admin"));
      },
      () => {
        setShouldFilterToEmployee(true);
      }
    );
  }, [isSuperAdmin, user]);

  const formatDateKey = (dateValue) => {
    if (!dateValue) return "Select a matrix box";
    const [year, month, day] = String(dateValue).split("-").map(Number);
    const parsedDate =
      year && month && day
        ? new Date(year, month - 1, day)
        : new Date(dateValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(dateValue);
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPunchTime = (timeStr) => {
    if (!timeStr) return "—";
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr.slice(0, 5);
    if (/\d{2}:\d{2}:\d{2}/.test(timeStr)) return timeStr.slice(0, 5);
    const d = new Date(timeStr);
    if (!isNaN(d)) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return timeStr;
  };

  const renderPunchTimes = (rec, defaultClassName, compact = false) => {
    if (!rec?.punch_in) {
      return null;
    }
    const punchInClassName =
      rec?.punch_in && rec.punch_in >= "09:46:00"
        ? "text-red-500 dark:text-red-400"
        : defaultClassName;

    return (
      <div
        className={punchInClassName}
        style={{
          fontSize: compact ? 9 : 10,
          marginTop: compact ? 1 : 2,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {formatPunchTime(rec.punch_in)}
      </div>
    );
  };

  const getStatusMeta = (rec) => {
    const status = rec?.status?.toLowerCase() || "";

    if (!rec) {
      return {
        label: "No Record",
        badgeClass:
          "bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-300",
      };
    }
    if (rec.is_holiday === true && status === "present") {
      return {
        label: "Holiday Duty",
        badgeClass:
          "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
      };
    }
    if (rec.is_holiday === true) {
      return {
        label: "Holiday",
        badgeClass:
          "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
      };
    }
    if (rec.is_weekoff === true && status === "present") {
      return {
        label: "Week Off Duty",
        badgeClass:
          "bg-amber-100 text-amber-700 dark:bg-amber-600/35 dark:text-amber-100",
      };
    }
    if (rec.is_weekoff === true) {
      return {
        label: "Week Off",
        badgeClass:
          "bg-amber-100 text-amber-700 dark:bg-amber-600/35 dark:text-amber-100",
      };
    }
    if (status === "present") {
      return {
        label: "Present",
        badgeClass:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-600/35 dark:text-emerald-100",
      };
    }
    if (status === "absent") {
      return {
        label: "Absent",
        badgeClass:
          "bg-rose-100 text-rose-700 dark:bg-rose-600/35 dark:text-rose-100",
      };
    }
    if (status.includes("halfday")) {
      return {
        label: "Half Day",
        badgeClass:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200",
      };
    }

    return {
      label: rec.status || "Unknown",
      badgeClass:
        "bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-300",
    };
  };

  const getEmpSummary = (emp) => {
    let present = 0;
    let absent = 0;
    let weekoff = 0;
    let holiday = 0;
    dates.forEach((dateStr) => {
      const rec = emp.attendance[dateStr];
      if (!rec) return;
      const status = rec.status?.toLowerCase();

      if (rec.is_holiday === true) {
        if (status === "present") present += 1;
        else holiday += 1;
      } else if (rec.is_weekoff === true) {
        if (status === "present") present += 1;
        else weekoff += 1;
      } else if (status === "present") {
        present += 1;
      } else if (status === "absent") {
        absent += 1;
      }
    });
    return { present, absent, weekoff, holiday };
  };

  const handleMatrixCellSelect = (rec, date, employeeCode) => {
    const statusMeta = getStatusMeta(rec);

    setSelectedCellKey(`${employeeCode}-${date}`);
    setSelectedMatrixSummary({
      date: formatDateKey(date),
      punchIn: formatPunchTime(rec?.punch_in),
      punchOut: formatPunchTime(rec?.punch_out),
      totalHours: rec?.total_hours || "—",
      status: statusMeta.label,
      statusKey: statusMeta.badgeClass,
    });
  };

  useEffect(() => {
    setLoading(true);
    setSelectedCellKey("");
    setExpandedEmps(new Set());
    setSelectedMatrixSummary(getEmptySelectedMatrixSummary());
    const { fromDate, toDate, apiMonth, apiYear } =
      getCycleBounds(selectedMonth);

    const dateArr = [];
    const cursor = new Date(fromDate);
    while (cursor <= toDate) {
      dateArr.push(fmtDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    attendanceAPI.getAttendanceRecordsByAdmin(
      { month: apiMonth, year: apiYear },
      (data) => {
        let records = data?.data?.attendance ?? [];

        if (shouldFilterToEmployee && employeeKeys.size > 0) {
          records = records.filter((rec) => {
            const recordKeys = [
              rec.employee,
              rec.emp_id,
              rec.employee_id,
              rec.id,
            ]
              .filter(
                (value) => value !== null && value !== undefined && value !== ""
              )
              .map((value) => String(value));
            return recordKeys.some((value) => employeeKeys.has(value));
          });
        }

        const uniqueDepts = Array.from(
          new Set(records.map((r) => r.department_name).filter(Boolean))
        ).map((name) => ({ department_name: name }));
        setDepartments(uniqueDepts);

        if (selectedDepartment) {
          records = records.filter(
            (r) => r.department_name === selectedDepartment
          );
        }

        const dateSet = new Set(dateArr);
        const empMap = {};

        records.forEach((rec) => {
          if (!dateSet.has(rec.date)) return;
          if (!empMap[rec.emp_code]) {
            empMap[rec.emp_code] = {
              emp_code: rec.emp_code,
              emp_id: rec.emp_id || rec.employee || rec.id || null,
              employee_name: rec.employee_name,
              department: rec.department_name || "",
              gender: rec.gender || "",
              profile_picture: rec.profile_picture || null,
              attendance: {},
            };
          }
          empMap[rec.emp_code].attendance[rec.date] = rec;
        });

        setDates(dateArr);
        setMatrix(Object.values(empMap));
        setLoading(false);
      },
      () => {
        setDates(dateArr);
        setMatrix([]);
        setLoading(false);
      }
    );
  }, [selectedMonth, selectedDepartment, shouldFilterToEmployee, employeeKeys]);

  const baseCell = {
    minWidth: 44,
    width: 44,
    maxWidth: 44,
    height: 52,
    padding: "4px 2px",
    verticalAlign: "middle",
    textAlign: "center",
  };

  const SNO_COL_WIDTH = 56;
  const EMP_ID_COL_WIDTH = 120;
  const EMP_DETAIL_COL_WIDTH = 280;
  const EMP_ID_LEFT = SNO_COL_WIDTH;
  const EMP_DETAIL_LEFT = SNO_COL_WIDTH + EMP_ID_COL_WIDTH;

  const renderCell = (rec, date, employeeCode) => {
    const cellKey = `${employeeCode}-${date}`;
    const isSelected = cellKey === selectedCellKey;
    const employeeCellClassName = showEmployeePunchDetails
      ? `cursor-pointer transition hover:brightness-95 ${
          isSelected ? "ring-2 ring-inset ring-sky-500" : ""
        }`
      : "";

    if (!rec)
      return (
        <td
          key={date}
          className="border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
          style={baseCell}
        />
      );

    const status = rec.status?.toLowerCase();

    if (rec.is_holiday === true) {
      if (status === "present") {
        return (
          <td
            key={date}
            className={`border border-gray-200 bg-green-100 dark:border-gray-700 dark:bg-green-900/40 ${employeeCellClassName}`}
            style={baseCell}
            onClick={
              showEmployeePunchDetails
                ? () => handleMatrixCellSelect(rec, date, employeeCode)
                : undefined
            }
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#7e22ce",
                lineHeight: 1,
              }}
            >
              H/D
            </div>
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              className="inline-block"
            >
              <path
                d="M3.5 8.5l3 3 5.5-6"
                stroke="#15803d"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {renderPunchTimes(rec, "text-blue-800 dark:text-blue-300", true)}
          </td>
        );
      }

      if (status === "absent") {
        return (
          <td
            key={date}
            className={`border border-gray-200 bg-purple-100 dark:border-gray-700 dark:bg-purple-900/40 ${employeeCellClassName}`}
            style={baseCell}
            onClick={
              showEmployeePunchDetails
                ? () => handleMatrixCellSelect(rec, date, employeeCode)
                : undefined
            }
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#7e22ce",
                lineHeight: 1,
              }}
            >
              H/D
            </div>
          </td>
        );
      }

      return (
        <td
          key={date}
          className={`border border-gray-200 bg-purple-100 font-semibold text-purple-700 dark:border-gray-700 dark:bg-purple-900/40 dark:text-purple-400 ${employeeCellClassName}`}
          style={{ ...baseCell, fontSize: 11 }}
          onClick={
            showEmployeePunchDetails
              ? () => handleMatrixCellSelect(rec, date, employeeCode)
              : undefined
          }
        >
          H/D
        </td>
      );
    }

    if (rec.is_weekoff === true) {
      if (status === "present") {
        return (
          <td
            key={date}
            className={`border border-gray-200 bg-green-100 dark:border-green-500/40 dark:bg-green-600/30 ${employeeCellClassName}`}
            style={baseCell}
            onClick={
              showEmployeePunchDetails
                ? () => handleMatrixCellSelect(rec, date, employeeCode)
                : undefined
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="inline-block"
            >
              <path
                d="M3.5 8.5l3 3 5.5-6"
                stroke="#15803d"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {renderPunchTimes(rec, "text-blue-800 dark:text-blue-300")}
          </td>
        );
      }
      if (status === "absent") {
        return (
          <td
            key={date}
            className={`border border-gray-200 bg-yellow-100 dark:border-amber-500/40 dark:bg-amber-600/30 ${employeeCellClassName}`}
            style={baseCell}
            onClick={
              showEmployeePunchDetails
                ? () => handleMatrixCellSelect(rec, date, employeeCode)
                : undefined
            }
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#d97706",
                lineHeight: 1,
              }}
            >
              W/O
            </div>
          </td>
        );
      }

      return (
        <td
          key={date}
          className={`border border-gray-200 bg-yellow-100 font-semibold text-yellow-700 dark:border-amber-500/40 dark:bg-amber-600/30 dark:text-amber-200 ${employeeCellClassName}`}
          style={{ ...baseCell, fontSize: 11 }}
          onClick={
            showEmployeePunchDetails
              ? () => handleMatrixCellSelect(rec, date, employeeCode)
              : undefined
          }
        >
          W/O
        </td>
      );
    }

    if (status === "present") {
      return (
        <td
          key={date}
          className={`border border-gray-200 bg-green-100 dark:border-green-500/40 dark:bg-green-600/30 ${employeeCellClassName}`}
          style={baseCell}
          onClick={
            showEmployeePunchDetails
              ? () => handleMatrixCellSelect(rec, date, employeeCode)
              : undefined
          }
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            className="inline-block"
          >
            <path
              d="M3.5 8.5l3 3 5.5-6"
              stroke="#15803d"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {renderPunchTimes(rec, "text-blue-800 dark:text-blue-300")}
        </td>
      );
    }

    if (status === "absent") {
      return (
        <td
          key={date}
          className={`border border-gray-200 bg-red-100 dark:border-red-500/40 dark:bg-red-600/30 ${employeeCellClassName}`}
          style={baseCell}
          onClick={
            showEmployeePunchDetails
              ? () => handleMatrixCellSelect(rec, date, employeeCode)
              : undefined
          }
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            className="inline-block"
          >
            <path
              d="M5 5l6 6M11 5l-6 6"
              stroke="#b91c1c"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </td>
      );
    }

    if (status?.includes("halfday")) {
      return (
        <td
          key={date}
          className={`border border-gray-200 bg-orange-100 font-semibold text-orange-700 dark:border-gray-700 dark:bg-orange-900/40 dark:text-orange-400 ${employeeCellClassName}`}
          style={{ ...baseCell, fontSize: 12 }}
          onClick={
            showEmployeePunchDetails
              ? () => handleMatrixCellSelect(rec, date, employeeCode)
              : undefined
          }
        >
          ½L
          {renderPunchTimes(rec, "text-orange-900 dark:text-orange-300")}
        </td>
      );
    }

    return (
      <td
        key={date}
        className={`border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60 ${employeeCellClassName}`}
        style={{ ...baseCell, fontSize: 11 }}
        onClick={
          showEmployeePunchDetails
            ? () => handleMatrixCellSelect(rec, date, employeeCode)
            : undefined
        }
      >
        <span className="text-gray-600 dark:text-gray-400">{rec.status}</span>
        {renderPunchTimes(rec, "text-gray-600 dark:text-gray-400")}
      </td>
    );
  };

  const renderMobileCell = (rec, dateStr, employeeCode) => {
    const d = new Date(dateStr);
    const dayNum = d.getDate();
    const isToday = dateStr === todayStr;
    const cellKey = `${employeeCode}-${dateStr}`;
    const isSelected = cellKey === selectedCellKey;
    const status = rec?.status?.toLowerCase();

    const checkIcon = (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path
          d="M3.5 8.5l3 3 5.5-6"
          stroke="#15803d"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
    const crossIcon = (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path
          d="M5 5l6 6M11 5l-6 6"
          stroke="#b91c1c"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    );

    let bg = "bg-gray-50 dark:bg-gray-800/60";
    let content = null;

    if (!rec) {
      bg = "bg-gray-100 dark:bg-gray-800";
    } else if (rec.is_holiday === true) {
      if (status === "present") {
        bg = "bg-green-100 dark:bg-green-900/40";
        content = (
          <>
            <span className="text-[8px] font-bold leading-none text-purple-700 dark:text-purple-300">
              H/D
            </span>
            {checkIcon}
          </>
        );
      } else {
        bg = "bg-purple-100 dark:bg-purple-900/40";
        content = (
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
            H/D
          </span>
        );
      }
    } else if (rec.is_weekoff === true) {
      if (status === "present") {
        bg = "bg-green-100 dark:bg-green-600/30";
        content = checkIcon;
      } else {
        bg = "bg-yellow-100 dark:bg-amber-600/30";
        content = (
          <span className="text-[10px] font-bold text-yellow-700 dark:text-amber-200">
            W/O
          </span>
        );
      }
    } else if (status === "present") {
      bg = "bg-green-100 dark:bg-green-600/30";
      content = checkIcon;
    } else if (status === "absent") {
      bg = "bg-red-100 dark:bg-red-600/30";
      content = crossIcon;
    } else if (status?.includes("halfday")) {
      bg = "bg-orange-100 dark:bg-orange-900/40";
      content = (
        <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300">
          ½L
        </span>
      );
    } else if (rec) {
      content = (
        <span className="text-[8px] leading-none text-gray-600 dark:text-gray-400">
          {rec.status}
        </span>
      );
    }

    const punch = rec?.punch_in ? formatPunchTime(rec.punch_in) : null;
    const isLate = rec?.punch_in && rec.punch_in >= "09:46:00";
    const isTappable = showEmployeePunchDetails && !!rec;

    return (
      <div key={dateStr} className="flex flex-col items-center">
        <span
          className={`mb-0.5 text-[10px] font-semibold ${
            isToday
              ? "text-blue-600 dark:text-blue-300"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {dayNum}
        </span>
        <div
          onClick={
            isTappable
              ? () => handleMatrixCellSelect(rec, dateStr, employeeCode)
              : undefined
          }
          className={`flex h-11 w-full flex-col items-center justify-center rounded-md border ${bg} ${
            isToday
              ? "border-blue-400 dark:border-blue-500"
              : "border-gray-200 dark:border-gray-700"
          } ${isSelected ? "ring-sky-500 ring-2 ring-inset" : ""} ${
            isTappable ? "cursor-pointer active:brightness-95" : ""
          }`}
        >
          {content}
          {punch && (
            <span
              className={`mt-0.5 text-[8px] font-bold leading-none ${
                isLate
                  ? "text-red-500 dark:text-red-400"
                  : "text-blue-800 dark:text-blue-300"
              }`}
            >
              {punch}
            </span>
          )}
        </div>
      </div>
    );
  };

  const filteredMatrix = isSuperAdmin
    ? matrix.filter((emp) => {
        const q = search.toLowerCase().trim();
        return (
          emp.emp_code?.toLowerCase().includes(q) ||
          emp.employee_name?.toLowerCase().includes(q) ||
          emp.department?.toLowerCase().includes(q)
        );
      })
    : matrix;

  const monthGroups = [];
  dates.forEach((dateStr) => {
    const d = new Date(dateStr);
    const label = d.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    if (
      !monthGroups.length ||
      monthGroups[monthGroups.length - 1].label !== label
    ) {
      monthGroups.push({ label, count: 1 });
    } else {
      monthGroups[monthGroups.length - 1].count += 1;
    }
  });

  const cycleBounds = getCycleBounds(selectedMonth);
  const { fromDate, toDate } = cycleBounds;
  const cycleLabel = `${fmtDate(fromDate)} → ${fmtDate(toDate)}`;
  const todayStr = fmtDate(new Date());

  // Offset of the first cycle date within a Monday-first week (0 = Monday, 6 = Sunday).
  // Used to pad the employee weekly calendar so dates land under the right weekday.
  const firstDateOffset = (() => {
    if (!dates.length) return 0;
    const [fy, fm, fd] = dates[0].split("-").map(Number);
    return (new Date(fy, fm - 1, fd).getDay() + 6) % 7;
  })();

  const selectedStatusLower = String(
    selectedMatrixSummary.status || ""
  ).toLowerCase();
  const selectedStatusTone = selectedStatusLower.includes("present")
    ? {
        // NOTE: uses green-* classes (not emerald-*) because these exact
        // class strings already exist elsewhere in this file, so Tailwind
        // JIT is guaranteed to have generated them.
        card: "border-green-200 bg-green-50 dark:border-green-800/50 dark:bg-green-900/20",
        label: "text-green-600 dark:text-green-300",
        pill: "border-green-200 bg-green-100",
        dot: "bg-green-100",
        cardBorder: "#bbf7d0",
        cardBg: "#f0fdf4",
        accent: "#15803d",
        pillBg: "#dcfce7",
        pillBorder: "#86efac",
      }
    : selectedStatusLower.includes("absent")
    ? {
        card: "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20",
        label: "text-red-600 dark:text-red-300",
        pill: "border-red-300 bg-red-100",
        dot: "bg-red-500",
        cardBorder: "#fecaca",
        cardBg: "#fef2f2",
        accent: "#b91c1c",
        pillBg: "#fee2e2",
        pillBorder: "#fca5a5",
      }
    : selectedStatusLower.includes("week off")
    ? {
        card: "border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20",
        label: "text-amber-600 dark:text-amber-300",
        pill: "border-amber-300 bg-amber-100",
        dot: "bg-amber-500",
        cardBorder: "#fde68a",
        cardBg: "#fffbeb",
        accent: "#b45309",
        pillBg: "#fef3c7",
        pillBorder: "#fcd34d",
      }
    : selectedStatusLower.includes("holiday")
    ? {
        card: "border-violet-200 bg-violet-50 dark:border-violet-800/50 dark:bg-violet-900/20",
        label: "text-violet-600 dark:text-violet-300",
        pill: "border-violet-300 bg-violet-100",
        dot: "bg-violet-500",
        cardBorder: "#ddd6fe",
        cardBg: "#f5f3ff",
        accent: "#6d28d9",
        pillBg: "#ede9fe",
        pillBorder: "#c4b5fd",
      }
    : selectedStatusLower.includes("half")
    ? {
        card: "border-orange-200 bg-orange-50 dark:border-orange-800/50 dark:bg-orange-900/20",
        label: "text-orange-600 dark:text-orange-300",
        pill: "border-orange-300 bg-orange-100",
        dot: "bg-orange-500",
        cardBorder: "#fed7aa",
        cardBg: "#fff7ed",
        accent: "#c2410c",
        pillBg: "#ffedd5",
        pillBorder: "#fdba74",
      }
    : {
        card: "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40",
        label: "text-gray-500 dark:text-gray-400",
        pill: "border-gray-300 bg-gray-100",
        dot: "bg-gray-400",
        cardBorder: "#e5e7eb",
        cardBg: "#f9fafb",
        accent: "#4b5563",
        pillBg: "#f3f4f6",
        pillBorder: "#d1d5db",
      };

  const tableWrapperClass = `isolate w-full hidden overflow-x-auto rounded-lg border border-gray-200 shadow-sm scrollbar-thin scrollbar-thumb-blue-200 dark:border-gray-700 dark:scrollbar-thumb-blue-900 ${
    isSuperAdmin ? "md:block" : ""
  } ${showEmployeePunchDetails ? "xl:mx-0 xl:max-w-none" : "w-full"}`;
  const listWrapperClass = `space-y-2 ${
    isSuperAdmin ? "md:hidden" : "mx-auto w-full max-w-[1720px]"
  }`;

  return (
    <div className="min-h-screen bg-white p-3 transition-colors duration-200 dark:bg-gray-900 sm:p-5">
      <div
        className={`mb-5 ${
          showEmployeePunchDetails
            ? "grid gap-3 lg:grid-cols-12 lg:items-end"
            : ""
        }`}
      >
        <div
          className={`grid gap-3 ${
            isSuperAdmin
              ? "sm:grid-cols-3"
              : "w-full sm:max-w-[280px] sm:grid-cols-1 lg:min-w-[280px]"
          } ${showEmployeePunchDetails ? "lg:col-span-4" : ""}`}
        >
          {isSuperAdmin && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID or department..."
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Month
            </label>
            <DatePicker
              selected={selectedMonth}
              onChange={(date) =>
                setSelectedMonth(
                  new Date(date.getFullYear(), date.getMonth(), 1)
                )
              }
              renderMonthContent={renderMonthContent}
              showMonthYearPicker
              dateFormat="MMMM yyyy"
              popperContainer={DatePickerPortal}
              popperProps={{ strategy: "fixed" }}
              popperPlacement="top-end"
              wrapperClassName="w-full"
              calendarClassName="dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
              customInput={
                <div className="relative flex w-full min-w-[190px] cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 sm:min-w-[230px] lg:min-w-[260px]">
                  <span className="flex-1 select-none whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-200">
                    {selectedMonth
                      ? selectedMonth.toLocaleString("default", {
                          month: "long",
                          year: "numeric",
                        })
                      : "Select month and year"}
                  </span>
                  <FaCalendarAlt className="ml-2 shrink-0 text-gray-400 dark:text-gray-500" />
                </div>
              }
            />
          </div>

          {isSuperAdmin && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">All Departments</option>
                {departments.map((dep) => (
                  <option key={dep.department_name} value={dep.department_name}>
                    {dep.department_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {showEmployeePunchDetails ? (
          <div className="border-slate-200 grid w-full gap-2 rounded-2xl border bg-white/90 px-4 py-2 text-xs font-semibold text-gray-600 shadow-sm dark:border-gray-700 dark:bg-navy-900/90 dark:text-gray-300 lg:col-span-8 2xl:grid-cols-[minmax(0,1fr)_auto] 2xl:items-center">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="inline-block h-3 w-3 rounded border border-green-400 bg-green-200 dark:border-green-300 dark:bg-green-500" />
                Present
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="inline-block h-3 w-3 rounded border border-red-400 bg-red-200 dark:border-red-300 dark:bg-red-500" />
                Absent
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="inline-block h-3 w-3 rounded border border-yellow-400 bg-yellow-200 dark:border-amber-300 dark:bg-amber-500" />
                Week Off
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="inline-block h-3 w-3 rounded border border-purple-400 bg-purple-200 dark:border-purple-500 dark:bg-purple-800" />
                Holiday
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm dark:border-gray-700 dark:bg-navy-800 dark:text-gray-200 2xl:justify-self-end">
              <FaCalendarAlt className="text-[11px]" />
              <span className="whitespace-nowrap">
                {formatDateKey(cycleBounds.fromDate)} {" -  "}
                {formatDateKey(cycleBounds.toDate)}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={
          showEmployeePunchDetails
            ? "mb-4 flex flex-col xl:grid xl:grid-cols-12 xl:items-stretch xl:gap-4"
            : "mb-4"
        }
      >
        <div
          className={
            showEmployeePunchDetails ? "order-2 xl:order-1 xl:col-span-8" : ""
          }
        >
          {!showEmployeePunchDetails ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1 rounded-xl border border-blue-300 bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-500 dark:border-gray-600 dark:text-gray-400 ">
                <FaCalendarAlt /> Cycle: {cycleLabel}
              </span>

              <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 sm:gap-4">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded border border-green-400 bg-green-200 dark:border-green-300 dark:bg-green-500" />
                  Present
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded border border-red-400 bg-red-200 dark:border-red-300 dark:bg-red-500" />
                  Absent
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded border border-yellow-400 bg-yellow-200 dark:border-amber-300 dark:bg-amber-500" />
                  Week Off
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 rounded border border-purple-400 bg-purple-200 dark:border-purple-500 dark:bg-purple-800" />
                  Holiday
                </span>
              </div>
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-500 dark:text-gray-400">
              <svg
                className="mr-3 h-5 w-5 animate-spin text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Loading attendance data…
            </div>
          ) : (
            <>
              <div className={tableWrapperClass}>
                <table
                  className="min-w-[600px] border-separate border-spacing-0 text-xs sm:min-w-full sm:text-sm"
                  style={{
                    fontSize: 13,
                    minWidth: "max-content",
                    width: "100%",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        className="border border-gray-300 bg-gray-200 px-3 py-3 text-center text-sm font-semibold text-gray-700 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-100"
                        rowSpan={2}
                        style={{
                          minWidth: SNO_COL_WIDTH,
                          width: SNO_COL_WIDTH,
                          maxWidth: SNO_COL_WIDTH,
                          position: "sticky",
                          left: 0,
                          zIndex: 60,
                        }}
                      >
                        S.No
                      </th>
                      <th
                        className="border border-gray-300 bg-gray-200 dark:border-navy-700 dark:bg-navy-800"
                        colSpan={2}
                        style={{
                          minWidth: EMP_ID_COL_WIDTH + EMP_DETAIL_COL_WIDTH,
                          position: "sticky",
                          left: EMP_ID_LEFT,
                          zIndex: 55,
                          boxShadow: "1px 0 0 0 rgba(203, 213, 225, 0.95)",
                        }}
                      />
                      {monthGroups.map((mg) => (
                        <th
                          key={mg.label}
                          className="border border-blue-400 bg-blue-300 px-2 py-2 text-center text-sm font-semibold text-blue-700 dark:border-blue-700 dark:bg-blue-700 dark:text-blue-300"
                          colSpan={mg.count}
                        >
                          {mg.label}
                        </th>
                      ))}
                    </tr>

                    <tr>
                      <th
                        className="whitespace-nowrap border border-gray-300 bg-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-100"
                        style={{
                          minWidth: EMP_ID_COL_WIDTH,
                          width: EMP_ID_COL_WIDTH,
                          maxWidth: EMP_ID_COL_WIDTH,
                          position: "sticky",
                          left: EMP_ID_LEFT,
                          zIndex: 60,
                        }}
                      >
                        EMP ID
                      </th>
                      <th
                        className="whitespace-nowrap border border-gray-300 bg-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:border-navy-700 dark:bg-navy-800 dark:text-gray-100"
                        style={{
                          minWidth: EMP_DETAIL_COL_WIDTH,
                          width: EMP_DETAIL_COL_WIDTH,
                          maxWidth: EMP_DETAIL_COL_WIDTH,
                          position: "sticky",
                          left: EMP_DETAIL_LEFT,
                          zIndex: 60,
                          boxShadow: "1px 0 0 0 rgba(203, 213, 225, 0.95)",
                        }}
                      >
                        EMP DETAIL
                      </th>
                      {dates.map((dateStr) => {
                        const d = new Date(dateStr);
                        const isToday = dateStr === todayStr;
                        const weekday = d.toLocaleDateString("en-US", {
                          weekday: "short",
                        });
                        const isSunday = d.getDay() === 0;
                        return (
                          <th
                            key={dateStr}
                            title={dateStr}
                            className={
                              isToday
                                ? "border border-blue-300 bg-blue-200 px-1 py-2 text-center text-sm font-bold text-blue-800 dark:border-blue-600 dark:bg-blue-800 dark:text-blue-200"
                                : "border border-gray-300 bg-gray-50 px-1 py-2 text-center text-sm font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            }
                            style={{ minWidth: 44, width: 44 }}
                          >
                            <div style={{ lineHeight: 1.2 }}>{d.getDate()}</div>
                            <div
                              className={
                                isToday
                                  ? "text-blue-700 dark:text-blue-300"
                                  : isSunday
                                  ? "text-red-500 dark:text-red-400"
                                  : "text-gray-500 dark:text-gray-400"
                              }
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                lineHeight: 1.2,
                              }}
                            >
                              {weekday}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMatrix.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3 + dates.length}
                          className="bg-white py-10 text-center text-sm text-gray-400 dark:bg-gray-900 dark:text-gray-500"
                        >
                          No attendance data found for this cycle ({cycleLabel}
                          ).
                        </td>
                      </tr>
                    ) : (
                      filteredMatrix.map((emp, idx) => (
                        <tr
                          key={emp.emp_code}
                          className={
                            idx % 2 === 0
                              ? "bg-white hover:bg-blue-50 dark:bg-gray-900 dark:hover:bg-blue-900/20"
                              : "bg-gray-50 hover:bg-blue-50 dark:bg-gray-800/60 dark:hover:bg-blue-900/20"
                          }
                        >
                          <td
                            className={`border border-gray-200 px-3 py-2.5 text-center text-sm font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400 ${
                              idx % 2 === 0
                                ? "bg-white dark:bg-navy-900"
                                : "bg-gray-50 dark:bg-navy-800"
                            }`}
                            style={{
                              minWidth: SNO_COL_WIDTH,
                              width: SNO_COL_WIDTH,
                              maxWidth: SNO_COL_WIDTH,
                              position: "sticky",
                              left: 0,
                              zIndex: 30,
                            }}
                          >
                            {idx + 1}
                          </td>

                          <td
                            className={`whitespace-nowrap border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:text-gray-200 ${
                              idx % 2 === 0
                                ? "bg-white dark:bg-navy-900"
                                : "bg-gray-50 dark:bg-navy-800"
                            }`}
                            style={{
                              minWidth: EMP_ID_COL_WIDTH,
                              width: EMP_ID_COL_WIDTH,
                              maxWidth: EMP_ID_COL_WIDTH,
                              position: "sticky",
                              left: EMP_ID_LEFT,
                              zIndex: 30,
                            }}
                          >
                            {emp.emp_code}
                          </td>

                          <td
                            className={`whitespace-nowrap border border-gray-200 px-4 py-2.5 text-sm dark:border-gray-700 ${
                              idx % 2 === 0
                                ? "bg-white dark:bg-navy-900"
                                : "bg-gray-50 dark:bg-navy-800"
                            }`}
                            style={{
                              minWidth: EMP_DETAIL_COL_WIDTH,
                              width: EMP_DETAIL_COL_WIDTH,
                              maxWidth: EMP_DETAIL_COL_WIDTH,
                              position: "sticky",
                              left: EMP_DETAIL_LEFT,
                              zIndex: 30,
                              boxShadow: "1px 0 0 0 rgba(203, 213, 225, 0.92)",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              {emp.profile_picture ? (
                                <EmployeeProfileImage
                                  src={emp.profile_picture}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                                  {emp.employee_name
                                    ?.charAt(0)
                                    ?.toUpperCase() || "?"}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span
                                  className="font-bold text-gray-800 dark:text-gray-100"
                                  style={{ fontSize: 14 }}
                                >
                                  {emp.employee_name}
                                </span>
                                <span
                                  className="text-gray-500 dark:text-gray-400"
                                  style={{ fontSize: 12 }}
                                >
                                  {emp.department || "—"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {dates.map((dateStr) =>
                            renderCell(
                              emp.attendance[dateStr],
                              dateStr,
                              emp.emp_code
                            )
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className={listWrapperClass}>
                {filteredMatrix.length === 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500">
                    No attendance data found for this cycle ({cycleLabel}).
                  </div>
                ) : (
                  filteredMatrix.map((emp, idx) => {
                    const summary = getEmpSummary(emp);
                    const isOpen =
                      expandedEmps.has(emp.emp_code) ||
                      filteredMatrix.length === 1;
                    return (
                      <div
                        key={emp.emp_code}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
                      >
                        <button
                          type="button"
                          onClick={() => toggleEmpExpand(emp.emp_code)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition active:bg-gray-50 dark:active:bg-gray-800"
                        >
                          <span className="w-5 shrink-0 text-center text-xs font-semibold text-gray-400 dark:text-gray-500">
                            {idx + 1}
                          </span>

                          {emp.profile_picture ? (
                            <EmployeeProfileImage
                              src={emp.profile_picture}
                              className="h-9 w-9 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
                              {emp.employee_name?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </div>
                          )}

                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">
                              {emp.employee_name}
                            </span>
                            <span className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                              {emp.emp_code} · {emp.department || "—"}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <span className="rounded-md bg-green-100 px-1.5 py-0.5 text-[11px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              P {summary.present}
                            </span>
                            <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              A {summary.absent}
                            </span>
                            <span className="rounded-md bg-yellow-100 px-1.5 py-0.5 text-[11px] font-bold text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300">
                              W {summary.weekoff}
                            </span>
                          </div>

                          {isSuperAdmin && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              className={`shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            >
                              <path
                                d="M6 9l6 6 6-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>

                        {isOpen && (
                          <div className="border-t border-gray-100 px-3 py-3 dark:border-gray-800">
                            <div className="grid grid-cols-7 gap-1.5">
                              {/* Weekly calendar layout for employees: Mon–Sun header,
                                  then empty slots so the first cycle date lands under
                                  its correct weekday. Super admin keeps the plain grid. */}
                              {showEmployeePunchDetails &&
                                WEEKDAY_LABELS.map((day) => (
                                  <div
                                    key={day}
                                    className="pb-1 text-center text-[11px] font-bold uppercase tracking-wide text-gray-700 dark:text-gray-200"
                                  >
                                    {day}
                                  </div>
                                ))}
                              {showEmployeePunchDetails &&
                                Array.from({ length: firstDateOffset }).map(
                                  (_, i) => <div key={`pad-${i}`} />
                                )}
                              {dates.map((dateStr) =>
                                renderMobileCell(
                                  emp.attendance[dateStr],
                                  dateStr,
                                  emp.emp_code
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {showEmployeePunchDetails ? (
          <div className="order-1 mb-4 xl:order-2 xl:col-span-4 xl:mb-0 xl:mt-0 xl:h-full">
            <div className="border-slate-200 rounded-2xl border bg-white/90 px-3 py-3 shadow-sm dark:border-gray-700 dark:bg-navy-900/90 xl:flex xl:h-full xl:flex-col">
              <div className="mb-3 inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                Punch Details
              </div>

              {/* Info cards: Date / In / Out / Hours / Status — 2-col grid on mobile, single row from lg up */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:grid-rows-5">
                <div className="flex min-h-[64px] flex-row items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-800/50 dark:bg-blue-900/20">
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-200">
                    <FaCalendarAlt className="text-[11px]" />{" "}
                    <span>Selected Date</span>
                  </span>
                  <span className="truncate text-sm font-semibold uppercase text-blue-900 dark:text-blue-100">
                    {selectedMatrixSummary.date}
                  </span>
                </div>

                <div
                  className={`flex min-h-[64px] flex-row items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${selectedStatusTone.card}`}
                >
                  <span
                    className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${selectedStatusTone.label} dark:text-white`}
                  >
                    <FaCheckCircle className="text-[12px]" />
                    <span>Status</span>
                  </span>
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${selectedStatusTone.pill} dark:text-white`}
                    style={{
                      backgroundColor: selectedStatusTone.pillBg,
                      borderColor: selectedStatusTone.pillBorder,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: selectedStatusTone.accent }}
                    />
                    <span style={{ color: selectedStatusTone.accent }}>
                      {selectedMatrixSummary.status}
                    </span>
                  </span>
                </div>

                <div className="flex min-h-[64px] flex-row items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-800/50 dark:bg-green-900/20">
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-green-600 dark:text-green-300">
                    <FaSignInAlt className="text-[10px]" />
                    In Time
                  </span>
                  <span className="truncate text-sm font-semibold text-green-700 dark:text-green-100">
                    {selectedMatrixSummary.punchIn}
                  </span>
                </div>

                <div className="flex min-h-[64px] flex-row items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 dark:border-red-800/50 dark:bg-red-900/20">
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-300">
                    <FaSignOutAlt className="text-[10px]" />
                    Out Time
                  </span>
                  <span className="truncate text-sm font-semibold text-red-700 dark:text-red-100">
                    {selectedMatrixSummary.punchOut}
                  </span>
                </div>

                <div className="col-span-2 flex min-h-[64px] flex-row items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2.5 dark:border-indigo-900/40 dark:bg-indigo-900/10 lg:col-span-1">
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-500 dark:text-indigo-300">
                    <FaClock className="text-[10px]" />
                    Total Hours
                  </span>
                  <span className="text-blue-700 truncate text-sm font-semibold dark:text-gray-100">
                    {selectedMatrixSummary.totalHours}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AttendanceMatrix;
