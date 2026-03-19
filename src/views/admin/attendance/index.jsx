import React, { useMemo, useState, useEffect } from "react";
import Card from "components/card";
import Pagination from "components/common/Pagination";
import attendanceAPI from "services/attendanceAPI";
import { showError } from "utils/toastHelper";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import dashboardAPI from "services/dashboard";
import { useAuth } from "contexts/AuthContext";

const columnHelper = createColumnHelper();

const Attendance = () => {
  const { logout, user, isSuperAdmin } = useAuth();
  const [sorting, setSorting] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateMode, setDateMode] = useState("single"); // "single" or "range"
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
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [reportMeta, setReportMeta] = useState({
    date: "",
    department: "All",
  });
  const [availableLeaveBalance, setAvailableLeaveBalance] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const fetchAttendance = () => {
    setLoading(true);
    const params = {};
    if (dateMode === "single") {
      if (selectedDate) params.from_date = selectedDate;
    } else {
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
    }
    if (selectedDepartment) params.department = selectedDepartment;
    attendanceAPI.getAttendanceRecords(
      params,
      (data) => {
        try {
          let attendanceArray = [];
          let reportData = data;

          // Handle { status: true, data: { attendance: [...] } }
          if (data?.data?.attendance && Array.isArray(data.data.attendance)) {
            attendanceArray = data.data.attendance;
            reportData = data.data;
          } else if (data?.attendance && Array.isArray(data.attendance)) {
            attendanceArray = data.attendance;
          } else if (Array.isArray(data)) {
            attendanceArray = data;
          } else if (data?.results && Array.isArray(data.results)) {
            attendanceArray = data.results;
          } else if (data?.data && Array.isArray(data.data)) {
            attendanceArray = data.data;
          } else if (data?.records && Array.isArray(data.records)) {
            attendanceArray = data.records;
          } else {
            attendanceArray = [];
          }

          // Filter attendance based on superadmin status
          let filteredAttendance = attendanceArray;
          if (!isSuperAdmin) {
            filteredAttendance = attendanceArray.filter(
              (rec) => String(rec.employee) === String(user)
            );
          }

          // Update report meta from summary
          setReportMeta({
            date:
              reportData?.date ||
              (dateMode === "single"
                ? selectedDate
                : fromDate && toDate
                ? `${fromDate} to ${toDate}`
                : fromDate) ||
              new Date().toISOString().split("T")[0],
            department: reportData?.department || selectedDepartment || "All",
            total_present: reportData?.summary?.total_present || 0,
            punch_out: reportData?.summary?.punch_out || 0,
            still_working: reportData?.summary?.still_working || 0,
          });

          const transformedData = filteredAttendance.map((rec, index) => ({
            sno: rec.sno || index + 1,
            emp_code: rec.emp_code || rec.employee_code || "-",
            name: rec.employee_name || rec.name || rec.user_name || "-",
            department: rec.department || rec.department_name || "-",
            date: rec.date || "-",
            punch_in: rec.punch_in || "-",
            punch_out: rec.punch_out || "-",
            total_hours: rec.total_hours || "-",
            status: rec.status || "-",
          }));

          setRecords(transformedData);

          // Extract unique departments from attendance data
          const uniqueDepts = [
            ...new Set(
              filteredAttendance
                .map((rec) => rec.department_name || rec.department)
                .filter(Boolean)
            ),
          ];
          if (uniqueDepts.length > 0) {
            setDepartments(uniqueDepts);
          }

          setLoading(false);
        } catch (error) {
          showError("Error loading attendance data. Please refresh the page.");
          setLoading(false);
        }
      },
      (error) => {
        console.log("Attendance API error:", error);
        if (error?.status === 401) {
          logout();
        }
        showError("Attendance data could not be loaded.");
        setRecords([]);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchAttendance();
  }, [dateMode, selectedDate, fromDate, toDate, selectedDepartment]);

  // Fetch available leave balance (like dashboard)
  useEffect(() => {
    if (dashboardAPI && dashboardAPI.getAvailableLeaveBalance) {
      dashboardAPI.getAvailableLeaveBalance(
        (res) => {
          let balance = 0;
          if (typeof res === "object") {
            if (typeof res.available_balance === "number") {
              balance = res.available_balance;
            } else if (typeof res.available_balance === "string") {
              balance = Number(res.available_balance) || 0;
            } else if (
              res.data &&
              typeof res.data.available_balance !== "undefined"
            ) {
              balance = Number(res.data.available_balance) || 0;
            }
          } else if (typeof res === "number") {
            balance = res;
          }
          setAvailableLeaveBalance(balance);
        },
        () => setAvailableLeaveBalance(0)
      );
    }
  }, []);

  // Format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "sno",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            S.NO
          </p>
        ),
        cell: (info) => {
          const rowIndex = info.row.index;
          const serialNumber =
            (currentPage - 1) * ITEMS_PER_PAGE + rowIndex + 1;
          return (
            <p className="whitespace-nowrap text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
              {serialNumber}
            </p>
          );
        },
      }),
      columnHelper.accessor("date", {
        id: "date",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            DATE
          </p>
        ),
        cell: (info) => (
          <p className="whitespace-nowrap text-xs text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),
      columnHelper.accessor("emp_code", {
        id: "emp_code",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            EMP CODE
          </p>
        ),
        cell: (info) => (
          <p className="whitespace-nowrap text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            NAME
          </p>
        ),
        cell: (info) => (
          <p className="whitespace-nowrap text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),
      columnHelper.accessor("department", {
        id: "department",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            DEPARTMENT
          </p>
        ),
        cell: (info) => (
          <p className="whitespace-nowrap text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),
      columnHelper.accessor("punch_in", {
        id: "punch_in",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            PUNCH IN
          </p>
        ),
        cell: (info) => (
          <p className="whitespace-nowrap text-xs text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),
      columnHelper.accessor("punch_out", {
        id: "punch_out",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            PUNCH OUT
          </p>
        ),
        cell: (info) => (
          <p className="whitespace-nowrap text-xs text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),
      columnHelper.accessor("total_hours", {
        id: "total_hours",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            TOTAL HOURS
          </p>
        ),
        cell: (info) => (
          <p className="whitespace-nowrap text-xs text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),
      columnHelper.accessor("status", {
        id: "status",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            STATUS
          </p>
        ),
        cell: (info) => {
          const status = info.getValue();
          const isPresent =
            status === "Present" || status === "present" || status === true;
          return (
            <span
              className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold sm:px-3 sm:py-1.5 sm:text-sm ${
                isPresent
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}
            >
              {isPresent ? "Present" : "Not Present"}
            </span>
          );
        },
      }),
    ],
    [currentPage]
  );

  // Filter records based on search
  const filteredRecords = useMemo(() => {
    let filtered = records;

    // Filter by department
    if (selectedDepartment) {
      filtered = filtered.filter(
        (rec) => rec.department === selectedDepartment
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((rec) => {
        return (
          (rec.name && rec.name.toLowerCase().includes(searchLower)) ||
          (rec.emp_code && rec.emp_code.toLowerCase().includes(searchLower)) ||
          (rec.department &&
            rec.department.toLowerCase().includes(searchLower)) ||
          (rec.status && rec.status.toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  }, [records, searchTerm, selectedDepartment]);

  // Reset page on search or department change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  // Count stats
  const presentCount =
    reportMeta?.total_present ||
    records.filter((r) => r.status === "Present" || r.status === "present")
      .length;

  const punchOutCount =
    reportMeta?.punch_out ||
    records.filter(
      (r) =>
        r.punch_out &&
        r.punch_out !== "-" &&
        r.punch_out !== null &&
        r.punch_out !== undefined &&
        r.punch_out !== ""
    ).length;

  const punchOutDone = punchOutCount;
  const stillWorking = reportMeta?.still_working || 0;
  const table = useReactTable({
    data: paginatedRecords,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="mt-3 grid h-full grid-cols-1 gap-5">
      {/* Summary Cards */}
      <div
        className={`grid grid-cols-4 gap-3 ${isSuperAdmin ? "sm:grid-cols-3" : "sm:grid-cols-4"} sm:gap-4`}
      >
        <Card extra="p-3 sm:p-4 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
            Total Employees Data
          </p>
          <p className="text-xl font-bold text-navy-700 dark:text-white sm:text-2xl">
            {records.length}
          </p>
        </Card>
        <Card extra="p-3 sm:p-4 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
            Present
          </p>
          <p className="text-xl font-bold text-green-600 sm:text-2xl">
            {presentCount}
          </p>
        </Card>
        <Card extra="p-3 sm:p-4 flex flex-col items-center justify-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
            Not Present
          </p>
          <p className="text-xl font-bold text-red-600 sm:text-2xl">
            {records.length - presentCount}
          </p>
        </Card>
        {!isSuperAdmin && (
          <Card extra="p-3 sm:p-4 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Available Leaves
            </p>
            <p className="text-xl font-bold text-blue-600 sm:text-2xl">
              {availableLeaveBalance}
            </p>
          </Card>
        )}
      </div>

      <Card extra={"w-full h-full px-3 pb-4 sm:px-6 sm:pb-6"}>
        {/* Header Section */}
        <div className="flex flex-col gap-3 pt-4 sm:gap-4">
          {/* Title Row with Date & Department Info */}
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:w-auto">
              <div className="text-base font-bold text-navy-700 dark:text-white sm:text-xl">
                Attendance Report
              </div>
              {/* <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 sm:gap-3 sm:text-sm">
                {dateMode === "single" ? (
                  <span>
                    <strong>Date:</strong> {formatDisplayDate(selectedDate)}
                  </span>
                ) : (
                  <>
                    <span>
                      <strong>From:</strong> {formatDisplayDate(fromDate)}
                    </span>
                    <span>
                      <strong>To:</strong> {formatDisplayDate(toDate)}
                    </span>
                  </>
                )}
                <span>
                  <strong>Department:</strong> {reportMeta.department || "All"}
                </span>
                <span>
                  <strong>Records:</strong> {filteredRecords.length}
                </span>
              </div> */}
            </div>
            <button
              onClick={fetchAttendance}
              className="linear w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-500 dark:active:bg-brand-600 sm:w-auto sm:text-base"
            >
              ↻ Refresh
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-3">
            {/* Date Mode Toggle + Date Inputs */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {/* Date Mode Toggle */}
              <div className="flex items-center gap-1 rounded-lg border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-navy-700">
                <button
                  onClick={() => setDateMode("single")}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition sm:flex-none sm:text-sm ${
                    dateMode === "single"
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-600"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateMode("range")}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition sm:flex-none sm:text-sm ${
                    dateMode === "range"
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-600"
                  }`}
                >
                  Date Range
                </button>
              </div>

              {/* Single Date Filter */}
              {dateMode === "single" && (
                <div className="flex items-center gap-2">
                  <label className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-300 sm:text-sm">
                    Date:
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white sm:w-auto"
                  />
                </div>
              )}

              {/* From & To Date Filters */}
              {dateMode === "range" && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-300 sm:text-sm">
                      From:
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        if (toDate && e.target.value > toDate) {
                          setToDate(e.target.value);
                        }
                      }}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white sm:w-auto"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-300 sm:text-sm">
                      To:
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white sm:w-auto"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Department + Search Row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {/* Department Filter */}
              <div className="flex items-center gap-2">
                <label className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-300 sm:text-sm">
                  Dept:
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white sm:w-auto"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="text"
                  placeholder="Search by name, emp code, status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 placeholder-gray-400 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:placeholder-gray-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="shrink-0 rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 sm:text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="mt-6 overflow-x-auto sm:mt-8">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                Loading attendance records...
              </p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                No attendance records found for this date
              </p>
              <button
                onClick={fetchAttendance}
                className="text-sm font-semibold text-brand-500 hover:text-brand-600"
              >
                ↻ Refresh
              </button>
            </div>
          ) : (
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-2 py-2.5 text-left sm:px-4 sm:py-3"
                        onClick={header.column.getToggleSortingHandler()}
                        style={{ cursor: "pointer" }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2 py-2.5 sm:px-4 sm:py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredRecords.length}
          onPageChange={setCurrentPage}
          className="mt-6 pb-4 sm:mt-8"
        />
      </Card>
    </div>
  );
};

export default Attendance;
