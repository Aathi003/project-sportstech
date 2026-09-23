import React, { useEffect, useState } from "react";
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

const Permissioncard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState("");
  const [sorting, setSorting] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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
    columnHelper.accessor("employee_name", {
      id: "employee_name",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white">NAME</p>
      ),
      cell: (info) => (
        <p className="max-w-[100px] truncate text-xs font-bold text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("from_date", {
      id: "from_date",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white">DATE</p>
      ),
      cell: (info) => (
        <p className="whitespace-nowrap text-xs text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("start_time", {
      id: "start_time",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white">START</p>
      ),
      cell: (info) => (
        <p className="whitespace-nowrap text-xs text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("end_time", {
      id: "end_time",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white">END</p>
      ),
      cell: (info) => (
        <p className="whitespace-nowrap text-xs text-navy-700 dark:text-white">
          {info.getValue()}
        </p>
      ),
    }),
    columnHelper.accessor("delay_time", {
      id: "delay_time",
      header: () => (
        <p className="text-xs font-bold text-gray-600 dark:text-white">DELAY</p>
      ),
      cell: (info) => (
        <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-900 dark:text-orange-300">
          +{info.getValue()} min
        </span>
      ),
    }),
  ];

  const fetchData = () => {
    setLoading(true);
    setError(null);
    dashboardAPI.getPermissionLate(
      (response) => {
        setData(response?.data || []);
        setDate(response?.date || "");
        setLoading(false);
      },
      (err) => {
        setError(err?.message || "Failed to fetch");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter((emp) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      emp.employee_name?.toLowerCase().includes(s) ||
      emp.from_date?.toLowerCase().includes(s)
    );
  });

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card extra="w-full h-full px-4 pb-4 sm:overflow-x-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between pt-4 pb-2">
        <div>
          <p className="text-xl font-bold text-navy-700 dark:text-white">
            Delayed Permission
          </p>
          {date && (
            <p className="mt-0.5 text-xs text-gray-400">{date}</p>
          )}
        </div>
      </div>

      {/* ── Search ── */}
      <div className="mb-3 flex items-center gap-2">
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── Scrollable Table ── */}
      <div className="overflow-x-auto">
        <div className="max-h-[240px] overflow-y-auto">
          {loading ? (
            <div className="py-6 text-center text-sm text-gray-500">
              Loading permission records...
            </div>
          ) : error ? (
            <div className="py-6 text-center text-sm text-red-500">
              {error}
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">
              No delayed permission records found.
            </div>
          ) : (
            <table className="w-full min-w-[400px]">
              {/* Sticky Header */}
              <thead className="sticky top-0 z-10 bg-white dark:bg-navy-800">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        onClick={header.column.getToggleSortingHandler()}
                        className="cursor-pointer border-b-[1px] border-gray-200 pb-2 pr-3 pt-2 text-start"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span className="ml-1 text-xs text-gray-400">
                          {{ asc: "↑", desc: "↓" }[header.column.getIsSorted()] ?? ""}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              {/* Body */}
              <tbody>
                {table.getRowModel().rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-100 dark:border-gray-700 ${
                      index % 2 === 0
                        ? "bg-gray-50 dark:bg-navy-900/20"
                        : "bg-white dark:bg-transparent"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-2 pr-3">
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

      {/* ── Record Count ── */}
      {!loading && filteredData.length > 0 && (
        <div className="mt-2 text-right text-xs text-gray-400">
          {filteredData.length} record{filteredData.length !== 1 ? "s" : ""} found
        </div>
      )}
    </Card>
  );
};

export default Permissioncard;