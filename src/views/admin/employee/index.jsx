import React, { useMemo, useState, useEffect } from "react";
import Card from "components/card";
import CardMenu from "components/card/CardMenu";
import Pagination from "components/common/Pagination";
import AddEmployeeModal from "components/modal/AddEmployeeModal";
import employeeAPI from "services/employeeAPI";
import { showError, showSuccess } from "utils/toastHelper";
import { FaEye } from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useAuth } from "contexts/AuthContext";
import { IoDocumentText } from "react-icons/io5";
import maleProfile from "assets/img/avatars/male_profile.png";
import femaleProfile from "assets/img/avatars/female_profile.png";

const columnHelper = createColumnHelper();

const Employee = () => {
  const { isSuperAdmin, logout } = useAuth();
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedEmployeeForDocs, setSelectedEmployeeForDocs] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Get current user role and admin status from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const isSuperAdmin = localStorage.getItem("is_super_admin");

    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserRole(user.role || "");
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    // Set admin status
    setIsAdmin(isSuperAdmin === "true" || isSuperAdmin === true);
  }, []);

  const fetchEmployees = () => {
    setLoading(true);
    employeeAPI.getAllEmployees(
      (data) => {
        try {
          // Handle different response formats
          let employeeArray = [];

          if (Array.isArray(data)) {
            employeeArray = data;
          } else if (data?.results && Array.isArray(data.results)) {
            employeeArray = data.results;
          } else if (data?.data && Array.isArray(data.data)) {
            employeeArray = data.data;
          } else if (data?.employee && Array.isArray(data.employee)) {
            employeeArray = data.employee;
          } else {
            employeeArray = [];
          }

          // Transform API data to match table format
          const transformedData = employeeArray.map((emp) => {
            // Extract role name - handle both object and string formats
            let roleName = "N/A";
            if (emp.role) {
              if (typeof emp.role === "object" && emp.role.role_name) {
                roleName = emp.role.role_name;
              } else if (typeof emp.role === "string") {
                roleName = emp.role;
              }
            }

            // Extract department name - handle both object and string formats
            let departmentName = "-";
            if (emp.department) {
              if (
                typeof emp.department === "object" &&
                emp.department.department_name
              ) {
                departmentName = emp.department.department_name;
              } else if (typeof emp.department === "string") {
                departmentName = emp.department;
              }
            }

            return {
              id: emp.id,
              name: `${emp.user_name || "-"}`.trim(),
              email: emp.email || "-",
              role: roleName || "-",
              department: departmentName || "-",
              status: emp.is_active ? "Active" : "Inactive",
              joinDate: emp.doj_date
                ? new Date(emp.doj_date).toLocaleDateString()
                : "-",
              ...emp,
            };
          });

          setEmployees(transformedData);
          setLoading(false);
        } catch (error) {
          showError("Error loading employee data. Please refresh the page.");
          setLoading(false);
        }
      },
      (error) => {
        // Handle different error types
        if (error?.status === 401) {
          showError("Unauthorized. Please login again.");
          logout();
        } else if (error?.status === 403) {
          showError("You do not have permission to view employees.");
        } else if (error?.status === 404) {
          showError("Employee endpoint not found.");
        } else if (error?.status >= 500) {
          showError("Server error. Please try again later.");
        } else {
          showError(
            error?.message ||
              "Failed to load employees. Please check your connection."
          );
        }

        setEmployees([]);
        setLoading(false);
      }
    );
  };

  // Load employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle successful employee addition/update
  const handleEmployeeSubmit = () => {
    setTimeout(() => {
      fetchEmployees();
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingEmployee(null);
    }, 500);
  };

  // Handle view documents
  const handleViewDocuments = (employee) => {
    setSelectedEmployeeForDocs(employee);
    setDocumentModalOpen(true);
  };

  // Handle edit employee
  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  // Handle status toggle with confirmation
  const handleStatusToggle = (emp, currentIsActive) => {
    const actionText = currentIsActive ? "deactivate" : "activate";
    const confirmText = currentIsActive ? "Yes, Deactivate" : "Yes, Activate";
    const confirmButtonColor = currentIsActive ? "#dc2626" : "#16a34a";

    Swal.fire({
      title: "Confirm Status Change",
      text: `Are you sure you want to ${actionText} ${emp.first_name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: "#6b7280",
      confirmButtonText: confirmText,
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        updateEmployeeStatus(emp, !currentIsActive);
      }
    });
  };

  // Update employee status
  const updateEmployeeStatus = (emp, newStatus) => {
    setTogglingId(emp.id);
    const statusData = {
      id: emp.id,
      is_active: newStatus,
    };

    employeeAPI.updateEmployeeStatus(
      emp.id,
      statusData,
      (response) => {
        showSuccess(
          `Employee status updated to ${newStatus ? "Active" : "Inactive"}`
        );
        fetchEmployees();
        setTogglingId(null);
      },
      (error) => {
        showError(error?.message || "Failed to update employee status");
        setTogglingId(null);
      }
    );
  };

  // Handle delete employee
  const handleDeleteEmployee = (id, name) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        employeeAPI.deleteEmployee(
          id,
          (response) => {
            showSuccess(response?.message || `${name} deleted successfully`);
            setTimeout(() => fetchEmployees(), 500);
          },
          (error) => {
            showError(error?.message || "Failed to delete employee");
          }
        );
      }
    });
  };

  const columns = useMemo(
    () => [
      // S.No Column
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
            <p className="text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
              {serialNumber}
            </p>
          );
        },
      }),
      columnHelper.accessor("name", {
        id: "name",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            NAME
          </p>
        ),
        cell: (info) => {
          const emp = info.row.original;
          const profileSrc =
            emp.profile_picture && emp.profile_picture.trim() !== ""
              ? emp.profile_picture.startsWith("data:")
                ? emp.profile_picture
                : emp.profile_picture
              : emp.gender?.trim().toLowerCase() === "female"
              ? femaleProfile
              : maleProfile;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900">
                <img
                  className="h-full w-full rounded-full object-cover"
                  src={profileSrc}
                  alt="Profile"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                  {info.getValue()}
                </p>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("joinDate", {
        id: "joinDate",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            JOINDATE
          </p>
        ),
        cell: (info) => (
          <p className="text-xs text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),
      columnHelper.accessor("email", {
        id: "email",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            EMAIL
          </p>
        ),
        cell: (info) => (
          <p className="break-all text-xs text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),
      columnHelper.accessor("role_name", {
        id: "role_name",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            ROLE
          </p>
        ),
        cell: (info) => (
          <p className="text-xs text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),
      columnHelper.accessor("department_name", {
        id: "department_name",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            DEPARTMENT
          </p>
        ),
        cell: (info) => (
          <p className="text-xs text-navy-700 dark:text-white sm:text-sm">
            {info.getValue()}
          </p>
        ),
      }),

      // Status column - only visible to admin users
      ...(isAdmin
        ? [
            columnHelper.accessor("status", {
              id: "status",
              header: () => (
                <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
                  STATUS
                </p>
              ),
              cell: (info) => {
                const emp = info.row.original;
                const isActive = emp.is_active || info.getValue() === "Active";
                const isToggling = togglingId === emp.id;

                return (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(emp, isActive)}
                      disabled={isToggling}
                      className="relative inline-flex cursor-pointer items-center transition hover:opacity-80"
                    >
                      <div
                        className={`h-6 w-10 rounded-full transition sm:h-7 sm:w-12 ${
                          isActive
                            ? "bg-green-500 dark:bg-green-600"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 h-5 w-5 rounded-full border border-gray-300 bg-white transition-all sm:h-6 sm:w-6 ${
                            isActive
                              ? "left-[3px] translate-x-5 sm:left-[4px] sm:translate-x-6"
                              : "left-[3px] sm:left-[4px]"
                          }`}
                        ></div>
                      </div>
                    </button>
                    <span
                      className={`ml-2 text-xs font-bold sm:ml-3 sm:text-sm ${
                        isActive
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                );
              },
            }),
          ]
        : []),

      // Combined ACTIONS column (Docs + Edit together inside one column)
      columnHelper.display({
        id: "actions",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white sm:text-sm">
            ACTIONS
          </p>
        ),
        cell: (info) => {
          const emp = info.row.original;
          return (
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={() => handleViewDocuments(emp)}
                className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900 sm:p-2"
                title="Show Documents"
              >
                <FaEye size={18} className="sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => handleEditEmployee(emp)}
                className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900 sm:p-2"
                title="Edit Employee"
              >
                <MdEdit size={18} className="sm:h-5 sm:w-5" />
              </button>
            </div>
          );
        },
      }),
    ],
    [isAdmin, togglingId, currentPage]
  );

  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    const loggedInUserId = Number(localStorage.getItem("user_id"));
    const isSuperAdmin =
      localStorage.getItem("is_super_admin") === "true" ||
      localStorage.getItem("is_super_admin") === true;
    let filtered = employees;

    if (!isSuperAdmin) {
      filtered = employees.filter((emp) => {
        return Number(emp.id) === loggedInUserId;
      });
    }
    if (!searchTerm.trim()) {
      return filtered;
    }
    const searchLower = searchTerm.toLowerCase();
    return filtered.filter((emp) => {
      return (
        (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
        (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
        (emp.emp_code && emp.emp_code.toLowerCase().includes(searchLower)) ||
        (emp.role_name && emp.role_name.toLowerCase().includes(searchLower)) ||
        (emp.department_name &&
          emp.department_name.toLowerCase().includes(searchLower)) ||
        (emp.status && emp.status.toLowerCase().includes(searchLower))
      );
    });
  }, [employees, searchTerm, isAdmin]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage]);

  const table = useReactTable({
    data: paginatedEmployees,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="mt-3 grid h-full grid-cols-1 gap-5">
      <Card extra={"w-full h-full px-4 pb-4 sm:px-6 sm:pb-6 overflow-visible"}>
        {/* Header Section - Responsive */}
        <div className="flex flex-col gap-3 pt-4 sm:gap-4">
          {/* Title and Add Button Row */}
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="text-center text-lg font-bold text-navy-700 dark:text-white sm:text-left sm:text-xl">
              Employee List ({filteredEmployees.length})
            </div>
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setEditingEmployee(null);
                  setIsModalOpen(true);
                }}
                className="linear w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-brand-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-brand-500 dark:active:bg-brand-600 sm:w-auto sm:text-base"
              >
                + Add Employee
              </button>
            )}
          </div>

          {/* Search Bar - Responsive */}
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, employee code, role, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 placeholder-gray-400 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:placeholder-gray-500 sm:px-4 sm:py-2.5"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 sm:px-4 sm:py-2.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table Section — NO horizontal scroll, box extends with content */}
        <div className="mt-6 sm:mt-8">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                Loading employees...
              </p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
                No employees found
              </p>
              <button
                onClick={fetchEmployees}
                className="text-sm font-semibold text-brand-500 hover:text-brand-600"
              >
                ↻ Refresh
              </button>
            </div>
          ) : (
            <table className="w-full table-auto border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-gray-200 dark:border-gray-700"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-2 py-2.5 text-center align-middle sm:px-4 sm:py-3"
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
                    className="border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 h-16"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-2 py-2.5 text-center sm:px-4 sm:py-3"
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

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          totalItems={filteredEmployees.length}
          onPageChange={setCurrentPage}
          className="mt-6 pb-4 sm:mt-8"
        />
      </Card>
      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleEmployeeSubmit}
        isEditMode={isEditMode}
        editingEmployee={editingEmployee}
      />

      {/* Document Viewer Modal - Responsive */}
      {documentModalOpen && selectedEmployeeForDocs && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-sm sm:p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-navy-800 sm:rounded-2xl">
            {/* Header - Responsive */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-navy-800 sm:px-6 sm:py-4">
              <div>
                <h2 className="text-lg font-bold text-navy-700 dark:text-white sm:text-2xl">
                  Documents
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                  {selectedEmployeeForDocs.name}
                </p>
              </div>
              <button
                onClick={() => setDocumentModalOpen(false)}
                className="text-2xl font-bold text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300 sm:text-3xl"
              >
                ✕
              </button>
            </div>

            {/* Documents List - Responsive */}
            <div className="space-y-2.5 p-4 sm:space-y-3 sm:p-6">
              {[
                {
                  key: "sslcCertificate",
                  label: "SSLC Certificate",
                  bgColor: "bg-purple-100 dark:bg-purple-900",
                  iconColor: "text-purple-600 dark:text-purple-300",
                },
                {
                  key: "relieving_letter",
                  label: "Relieving Letter",
                  bgColor: "bg-orange-100 dark:bg-orange-900",
                  iconColor: "text-orange-600 dark:text-orange-300",
                },
                {
                  key: "bank_passbook",
                  label: "Bank Passbook",
                  bgColor: "bg-indigo-100 dark:bg-indigo-900",
                  iconColor: "text-indigo-600 dark:text-indigo-300",
                },
                {
                  key: "salary_slips",
                  label: "Salary Slips",
                  bgColor: "bg-yellow-100 dark:bg-yellow-900",
                  iconColor: "text-yellow-600 dark:text-yellow-300",
                },
                {
                  key: "aadhaar_card",
                  label: "Aadhaar",
                  bgColor: "bg-pink-100 dark:bg-pink-900",
                  iconColor: "text-pink-600 dark:text-pink-300",
                },
                {
                  key: "pan_card",
                  label: "PAN Card",
                  bgColor: "bg-blue-100 dark:bg-blue-900",
                  iconColor: "text-blue-600 dark:text-blue-300",
                },
              ].map((doc) => {
                const fileUrl = selectedEmployeeForDocs[doc.key];
                const isUploaded = fileUrl ? true : false;

                // Construct full URL if needed
                let fullUrl = "";
                if (fileUrl) {
                  if (fileUrl.startsWith("http")) {
                    fullUrl = fileUrl;
                  } else {
                    fullUrl = `${fileUrl}`;
                  }
                }

                const fileName = fileUrl ? fileUrl.split("/").pop() : null;

                return (
                  <div
                    key={doc.key}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-navy-700 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
                  >
                    <div className="flex flex-1 items-center gap-3 sm:gap-4">
                      <div className={`${doc.bgColor} rounded-lg p-2 sm:p-3`}>
                        <div className={`${doc.iconColor} text-xl sm:text-2xl`}>
                          <IoDocumentText />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy-700 dark:text-white sm:text-base">
                          {doc.label}
                        </p>
                        {isUploaded ? (
                          <div>
                            <p className="text-xs font-medium text-green-600 dark:text-green-400 sm:text-sm">
                              Uploaded
                            </p>
                            <p className="mt-0.5 break-all text-[10px] text-gray-500 dark:text-gray-400 sm:mt-1 sm:text-xs">
                              {fileName}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-red-500 dark:text-red-400 sm:text-sm">
                            Not uploaded
                          </p>
                        )}
                      </div>
                    </div>
                    {isUploaded && (
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full whitespace-nowrap rounded-lg bg-brand-500 px-3 py-1.5 text-center text-xs font-medium text-white transition hover:bg-brand-600 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
                      >
                        View/Download
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;