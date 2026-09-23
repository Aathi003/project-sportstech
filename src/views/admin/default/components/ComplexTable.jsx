import React, { useEffect, useState } from "react";
import CardMenu from "components/card/CardMenu";
import Card from "components/card";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import dashboardAPI from "services/dashboard";

const columnHelper = createColumnHelper();

const ComplexTable = () => {
  const [sorting, setSorting] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewFromDate, setPreviewFromDate] = useState("");
  const [previewToDate, setPreviewToDate] = useState("");

  // ── Today's date string for max attribute ──
  const today = new Date().toISOString().split("T")[0];

  // ── Date Filter State ──
  const [dateMode, setDateMode] = useState("single");
  const [selectedDate, setSelectedDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const columns = [
    columnHelper.display({
      id: "sno",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white">S.NO</p>
      ),
      cell: (info) => (
        <p className="text-xs font-bold text-navy-700 dark:text-white">
          {info.row.index + 1}
        </p>
      ),
    }),
    columnHelper.accessor("date", {
      id: "date",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white whitespace-nowrap">DATE</p>
      ),
      cell: (info) => (
        <p className="text-xs font-bold text-navy-700 dark:text-white whitespace-nowrap">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("emp_code", {
      id: "emp_code",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white">EMP ID</p>
      ),
      cell: (info) => (
        <p className="text-xs font-bold text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("employee_name", {
      id: "employee_name",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white">NAME</p>
      ),
      cell: (info) => (
        <p className="max-w-[100px] sm:max-w-[120px] truncate text-xs font-bold text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("department", {
      id: "department",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white hidden sm:block">DEPT</p>
      ),
      cell: (info) => (
        <p className="max-w-[80px] truncate text-xs font-bold text-navy-700 dark:text-white hidden sm:block">
          {info.getValue() || "-"}
        </p>
      ),
    }),
    columnHelper.accessor("role", {
      id: "role",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white hidden md:block">ROLE</p>
      ),
      cell: (info) => (
        <p className="max-w-[70px] truncate text-xs font-bold text-navy-700 dark:text-white hidden md:block">
          {info.getValue() || "-"}
        </p>
      ),
    }),
    columnHelper.accessor("punch_in_time", {
      id: "punch_in_time",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white whitespace-nowrap">
          PUNCH IN
        </p>
      ),
      cell: (info) => (
        <p className="text-xs font-bold text-red-500 dark:text-red-400 whitespace-nowrap">
          {info.getValue() || "-"}
        </p>
      ),
    }),
  ];

  const fetchData = () => {
    setLoading(true);
    setError(null);

    const params = {};
    if (dateMode === "single") {
      if (selectedDate) {
        params.from_date = selectedDate;
        params.to_date = selectedDate;
      }
    } else {
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
    }

    dashboardAPI.getLatePunchIn(
      params,
      (response) => {
        setData(response?.employees || []);
        setPreviewFromDate(response?.from_date || "");
        setPreviewToDate(response?.to_date || "");
        setLoading(false);
      },
      (err) => {
        setError(err?.message || "Failed to fetch late punch-in data");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchData();
  }, [dateMode, selectedDate, fromDate, toDate]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card extra={"w-full h-full px-3 sm:px-4 pb-4 overflow-hidden"}>
      {/* ── Header ── */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 pt-4">
        <div className="text-lg sm:text-xl font-bold text-navy-700 dark:text-white">
          Late Punch-In
        </div>
        <div className="self-end sm:self-auto">
          <CardMenu />
        </div>
      </div>

      {/* ── Date Filters ── */}
      <div className="mb-4 flex flex-col gap-3 sm:gap-6">
        {/* Today / Date Range Toggle */}
        <div className="flex items-center gap-1 self-start rounded-lg border-2 border-gray-200 bg-white dark:border-gray-700 dark:bg-navy-700 overflow-x-auto max-w-full">
          <button
            onClick={() => setDateMode("single")}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition whitespace-nowrap min-h-[36px] ${
              dateMode === "single"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-600"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateMode("range")}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition whitespace-nowrap min-h-[36px] ${
              dateMode === "range"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-navy-600"
            }`}
          >
            Date Range
          </button>
        </div>

        {/* Single Date */}
        {dateMode === "single" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-300">
              Select Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-auto rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-navy-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white min-h-[44px]"
            />
          </div>
        )}

        {/* From & To Date Range */}
        {dateMode === "range" && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <label className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-300">
                From:
              </label>
              <input
                type="date"
                value={fromDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full sm:w-auto rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-navy-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white min-h-[44px]"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <label className="shrink-0 text-xs font-semibold text-gray-600 dark:text-gray-300">
                To:
              </label>
              <input
                type="date"
                value={toDate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full sm:w-auto rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-navy-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white min-h-[44px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Scrollable Table Container ── */}
      <div className="relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="max-h-[300px] sm:max-h-[240px] overflow-y-auto">
          {loading ? (
            <div className="py-8 sm:py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
              Loading late punch-in data...
            </div>
          ) : error || data.length === 0 ? (
            <div className="py-8 sm:py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              No late punch-in records found.
            </div>
          ) : (
            <table className="w-full min-w-[600px] sm:min-w-[640px] border-collapse">
              <thead className="sticky top-0 z-20 bg-white dark:bg-navy-800 shadow-sm">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        onClick={header.column.getToggleSortingHandler()}
                        className="cursor-pointer border-b border-gray-200 dark:border-gray-700 pb-3 pt-3 px-2 sm:px-3 text-start bg-white dark:bg-navy-800 select-none"
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getIsSorted() && (
                            <span className="text-[10px]">
                              {header.column.getIsSorted() === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-blue-50 dark:hover:bg-navy-800/50 transition-colors ${
                      index % 2 === 0
                        ? "bg-white dark:bg-navy-900/10"
                        : "bg-gray-50/50 dark:bg-navy-900/30"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td 
                        key={cell.id} 
                        className="py-3 px-2 sm:px-3 whitespace-nowrap"
                      >
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
      </div>

      {/* ── Record Count & Preview Dates ── */}
      {!loading && data.length > 0 && (
        <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="font-medium">
            {data.length} record{data.length !== 1 ? "s" : ""} found
          </div>
          {/* {(previewFromDate || previewToDate) && (
            <div className="text-[10px] sm:text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {previewFromDate && previewToDate 
                ? `${previewFromDate} to ${previewToDate}`
                : previewFromDate || previewToDate
              }
            </div>
          )} */}
        </div>
      )}
    </Card>
  );
};

export default ComplexTable;