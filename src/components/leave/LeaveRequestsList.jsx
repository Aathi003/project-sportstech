import React, { useState, useEffect } from "react";
import dashboardAPI from "services/dashboard";
import {
  FaCalendar,
  FaUser,
  FaCheck,
  FaTimes,
  FaClock,
  FaEye,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import Swal from "sweetalert2";
import leaveAPI from "services/leaveAPI";
import { showSuccess, showError } from "utils/toastHelper";
import { MdEdit } from "react-icons/md";
import LeavePermissionRequest from "components/leave/LeavePermissionRequest";
import maleProfile from "assets/img/avatars/male_profile.png";
import femaleProfile from "assets/img/avatars/female_profile.png";
import employeeAPI from "services/employeeAPI";

export default function LeaveRequestsList() {
  // Request Type Filter State
  const [requestTypeFilter, setRequestTypeFilter] = useState(() => {
    const filter = localStorage.getItem("request_type");
    if (filter) {
      localStorage.removeItem("request_type");
      return filter;
    }
    return "all";
  });

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState(() => {
    const filter = localStorage.getItem("leave_status_filter");
    if (filter) {
      localStorage.removeItem("leave_status_filter");
      return filter;
    }
    return "all";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");
  const [availableLeaveBalance, setAvailableLeaveBalance] = useState(0);

  // New states for edit functionality
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editRequestData, setEditRequestData] = useState(null);
  // Cache states for pre-loaded data
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [requestTypes, setRequestTypes] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Reject modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestToReject, setRequestToReject] = useState(null);

  // Expanded text states
  const [expandedReasons, setExpandedReasons] = useState({});
  const [dateFilter] = useState(() => {
    const filter = localStorage.getItem("leave_date_filter");
    if (filter) {
      localStorage.removeItem("leave_date_filter");
      return filter;
    }
    return "";
  });
  const [monthlyFrom] = useState(() => {
    const from = localStorage.getItem("monthly_leave_from");
    if (from) {
      localStorage.removeItem("monthly_leave_from");
      return from;
    }
    return "";
  });
  const [monthlyTo] = useState(() => {
    const to = localStorage.getItem("monthly_leave_to");
    if (to) {
      localStorage.removeItem("monthly_leave_to");
      return to;
    }
    return "";
  });

  const itemsPerPage = 10;
  const isSuperAdmin = localStorage.getItem("is_super_admin");

  const normalizeToIsoDate = (value) => {
    if (!value) return "";

    const raw = String(value).trim();
    if (!raw) return "";

    const direct = raw.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) {
      return direct;
    }

    const dmy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmy) {
      const [, dd, mm, yyyy] = dmy;
      return `${yyyy}-${mm}-${dd}`;
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return "";
  };

  useEffect(() => {
    const userRole = localStorage.getItem("user_role");
    const storedUserName = localStorage.getItem("user_name");
    const userEmail = localStorage.getItem("user_email");
    const isSuperAdmin = localStorage.getItem("is_super_admin");

    const isAdminUser = isSuperAdmin === "true" || isSuperAdmin === true;

    setIsAdmin(isAdminUser);
    setUserName(storedUserName || "");

    loadLeaveRequests();
    loadPreLoadedData();

    if (!isAdminUser && dashboardAPI && dashboardAPI.getAvailableLeaveBalance) {
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

  const loadPreLoadedData = () => {
    leaveAPI.getLeaveTypes(
      (data) => {
        const types = Array.isArray(data)
          ? data
          : data?.results || data?.data || [];
        setLeaveTypes(types);
      },
      (error) => {
        setLeaveTypes([]);
      }
    );

    leaveAPI.getRequestTypes(
      (data) => {
        const types = Array.isArray(data)
          ? data
          : data?.results || data?.data || [];
        setRequestTypes(types);
        setDataLoaded(true);
      },
      (error) => {
        setRequestTypes([]);
        setDataLoaded(true);
      }
    );
  };

  const loadLeaveRequests = () => {
    setLoading(true);
    leaveAPI.getAllLeaves(
      (data) => {
        let requestsArray = [];

        if (Array.isArray(data)) {
          requestsArray = data;
        } else if (data?.results && Array.isArray(data.results)) {
          requestsArray = data.results;
        } else if (data?.data && Array.isArray(data.data)) {
          requestsArray = data.data;
        } else if (data?.leave && Array.isArray(data.leave)) {
          requestsArray = data.leave;
        }

        setLeaveRequests(requestsArray);
        setLoading(false);
        localStorage.setItem("isCompleted", "false");
      },
      (error) => {
        showError("Failed to load leave requests");
        setLeaveRequests([]);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const today = new Date();
  const todayDateString = today.toISOString().split("T")[0];

  const uniqueRequestTypes = Array.from(
    new Set(leaveRequests.map((req) => req.request_type).filter(Boolean))
  );

  const filteredRequests = leaveRequests.filter((request) => {
    const statusLower = request.status
      ? String(request.status).toLowerCase()
      : "";
    const matchesStatus =
      statusFilter === "all" || statusLower === statusFilter;

    const requestTypeLower = request.request_type
      ? String(request.request_type).toLowerCase()
      : "";
    const matchesRequestType =
      requestTypeFilter === "all" ||
      requestTypeLower === String(requestTypeFilter).toLowerCase();

    const matchesSearch =
      !searchTerm ||
      request.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leave_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.role_name?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesDate = true;

    if (dateFilter && dateFilter !== "") {
      const targetDate = normalizeToIsoDate(dateFilter);
      const candidateDates = [
        normalizeToIsoDate(request.from_date),
        normalizeToIsoDate(request.date),
        normalizeToIsoDate(request.created_at),
      ].filter(Boolean);

      matchesDate = candidateDates.includes(targetDate);
    }

    let matchesMonthlyRange = true;
    if (monthlyFrom && monthlyTo) {
      const reqFrom = request.from_date ? new Date(request.from_date) : null;
      const reqTo = request.to_date ? new Date(request.to_date) : reqFrom;
      const rangeFrom = new Date(monthlyFrom);
      const rangeTo = new Date(monthlyTo);
      if (reqFrom && reqTo) {
        matchesMonthlyRange = reqFrom <= rangeTo && reqTo >= rangeFrom;
      } else {
        matchesMonthlyRange = false;
      }
    }

    return (
      matchesStatus &&
      matchesRequestType &&
      matchesSearch &&
      matchesDate &&
      matchesMonthlyRange
    );
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusColor = (status) => {
    const statusLower = status ? String(status).toLowerCase() : "";
    switch (statusLower) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status ? String(status).toLowerCase() : "";
    switch (statusLower) {
      case "approved":
        return <FaCheck className="text-green-600" />;
      case "rejected":
        return <FaTimes className="text-red-600" />;
      case "pending":
        return <FaClock className="text-yellow-600" />;
      default:
        return null;
    }
  };

  const handleApprove = (requestId) => {
    setLoading(true);
    const userId = Number(localStorage.getItem("user_id"));
    leaveAPI.updateLeaveStatus(
      requestId,
      { status: "Approved", id: requestId, user_id: userId },
      (response) => {
        showSuccess("Leave request approved successfully!");
        loadLeaveRequests();
        setShowDetailsModal(false);
      },
      (error) => {
        showError("Failed to approve leave request");
        setLoading(false);
      }
    );
  };

  const handleReject = (requestId, reason = "") => {
    setLoading(true);
    const userId = Number(localStorage.getItem("user_id"));

    leaveAPI.updateLeaveStatus(
      requestId,
      { status: "Rejected", id: requestId, user_id: userId, reason: reason },
      (response) => {
        showSuccess("Leave request rejected successfully!");
        loadLeaveRequests();
        setShowDetailsModal(false);
        setShowRejectModal(false);
        setRejectReason("");
        setRequestToReject(null);
      },
      (error) => {
        showError("Failed to reject leave request");
        setLoading(false);
      }
    );
  };

  const handleDelete = (requestId) => {
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
        setLoading(true);
        leaveAPI.deleteLeave(
          requestId,
          (response) => {
            showSuccess("Leave request deleted successfully!");
            setShowDetailsModal(false);
            setLoading(false);
            loadLeaveRequests();
          },
          (error) => {
            showError("Failed to delete leave request");
            setLoading(false);
          }
        );
      }
    });
  };

  const calculateDuration = (fromDate, toDate, duration_type) => {
    if (!fromDate) return "-";
    const from = new Date(fromDate);
    const to = toDate ? new Date(toDate) : from;
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (duration_type === "halfday") return "Half Day";
    return `${diffDays} Day${diffDays > 1 ? "s" : ""}`;
  };

  const renderDuration = (request) => {
    if (request.request_type === "Permission") return <span>2 Hours</span>;
    const isHalfDay = request.duration_type === "halfday";
    const halfLabel =
      request.half_day_type === "second" ? "Second Half" : "First Half";
    return (
      <span className="flex flex-col">
        <span>
          {calculateDuration(
            request.from_date,
            request.to_date,
            request.duration_type
          )}
        </span>
        {isHalfDay && (
          <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
            {halfLabel}
          </span>
        )}
      </span>
    );
  };

  const [employee, setEmployee] = useState(null);
  const userId =
    localStorage.getItem("employee_id") || localStorage.getItem("user_id");

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Filters Section */}
      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-4">
        {/* Search by Name or Type */}
        {isSuperAdmin === "true" && (
          <div>
            <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
              Search by Name or Type
            </label>
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-xs text-navy-700 placeholder-gray-400 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm"
            />
          </div>
        )}

        {/* Filter by Status */}
        <div>
          <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
            Filter by Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-xs text-navy-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Filter by Request Type */}
        <div>
          <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
            Filter by Request Type
          </label>
          <select
            value={requestTypeFilter}
            onChange={(e) => {
              setRequestTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-xs text-navy-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm"
          >
            <option value="all">All Types</option>
            <option value="Leave">Leave</option>
            <option value="Permission">Permission</option>
          </select>
        </div>

        {/* Available Leaves Card for non-super admin users */}
        {!isAdmin && (
          <div className="flex w-full justify-center">
            <div
              className="inline-flex w-full max-w-md 
      items-center justify-center 
      gap-2 rounded-lg border-2 border-gray-300 
      px-3 py-1.5 
      text-xs font-bold text-white sm:text-sm 
      md:text-base lg:text-lg"
            >
              <p className="text-[14px] text-blue-500 dark:text-white sm:text-[13.5px]">
                Available Leaves: {availableLeaveBalance}
              </p>
            </div>
          </div>
        )}

        {/* LeavePermissionRequest Button */}
        <div>
          <LeavePermissionRequest onClose={loadLeaveRequests} />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center rounded-lg bg-white p-8 dark:bg-navy-800 sm:p-12">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500 sm:h-12 sm:w-12"></div>
            <p className="mt-4 text-xs text-navy-700 dark:text-white sm:text-sm">
              Loading requests...
            </p>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && paginatedRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg bg-white p-8 dark:bg-navy-800 sm:p-12">
          <FaCalendar className="text-4xl text-gray-300 dark:text-gray-600 sm:text-5xl" />
          <p className="mt-4 text-center text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
            {leaveRequests.length === 0
              ? "No leave requests yet"
              : "No matching requests found"}
          </p>
        </div>
      )}

      {/* Requests Table */}
      {!loading && paginatedRequests.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow-none dark:bg-navy-800 xl:shadow-lg">
          <div className="overflow-x-auto">
            {/* Premium Card Layout for Mobile, Table for Desktop */}
            <div className="block md:hidden">
              {paginatedRequests.map((request, index) => (
                <div
                  key={request.id || index}
                  className="mb-8 flex flex-col gap-2 rounded-3xl border border-gray-100 bg-white px-4 py-4 text-[15px] shadow-xl dark:border-gray-700 dark:bg-navy-800 dark:shadow-none"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-base font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </div>
                    <h2 className="ml-1 text-base font-extrabold text-navy-900 dark:text-white">
                      Leave Request
                    </h2>
                  </div>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900">
                      <img
                        className="h-full w-full rounded-full object-cover"
                        src={
                          request?.profile_picture &&
                          request.profile_picture.trim() !== ""
                            ? request.profile_picture.startsWith("data:")
                              ? request.profile_picture
                              : `${request.profile_picture}`
                            : request?.gender?.trim().toLowerCase() === "male"
                            ? maleProfile
                            : request?.gender?.trim().toLowerCase() === "female"
                            ? femaleProfile
                            : maleProfile
                        }
                        alt="Profile"
                      />
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-navy-900 dark:text-white">
                        {request.employee_name || "-"}
                      </div>
                      {!(isAdmin && request.employee_name === userName) && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {request.department_name || "-"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        Request Type
                      </div>
                      <div className="text-[15px] font-bold text-navy-900 dark:text-white">
                        {request.request_type || "-"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        Leave Type
                      </div>
                      <div className="text-[15px] font-bold text-navy-900 dark:text-white">
                        {request.request_type === "Permission"
                          ? "-"
                          : request.leave_type || "-"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        Start Date
                      </div>
                      <div className="text-[15px] font-bold text-navy-900 dark:text-white">
                        {request.from_date
                          ? new Date(request.from_date).toLocaleDateString()
                          : "-"}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        Duration
                      </div>
                      <div className="text-[15px] font-bold text-navy-900 dark:text-white">
                        {renderDuration(request)}
                      </div>
                    </div>
                  </div>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <div className="flex flex-col gap-0.5">
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                      Status
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-0.5 text-[13px] font-bold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status
                          ? String(request.status).charAt(0).toUpperCase() +
                            String(request.status).slice(1)
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="mt-2 flex items-center justify-center gap-6">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailsModal(true);
                      }}
                      className="bg-transparent m-0 flex items-center justify-center border-none p-0 text-xl text-blue-600 outline-none dark:text-blue-400"
                      title="View Details"
                      style={{ lineHeight: 1 }}
                    >
                      <FaEye size={20} />
                    </button>
                    {request.status &&
                      String(request.status).toLowerCase() === "pending" && (
                        <>
                          <button
                            onClick={() => {
                              const editData = request.id
                                ? request
                                : { ...request, id: request.leaveid };
                              setEditRequestData(editData);
                              setShowRequestModal(true);
                            }}
                            className="bg-transparent m-0 flex items-center justify-center border-none p-0 text-xl text-blue-600 outline-none dark:text-blue-400"
                            title="Edit Leave Request"
                            style={{ lineHeight: 1 }}
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(request.leaveid)}
                            disabled={loading}
                            className="bg-transparent m-0 flex items-center justify-center border-none p-0 text-xl text-red-600 outline-none dark:text-red-400"
                            title="Delete"
                            style={{ lineHeight: 1 }}
                          >
                            <FaTrash size={18} />
                          </button>
                        </>
                      )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <table className="hidden w-full md:table">
              <thead className="md:table-header-group">
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-navy-700">
                  <th className="px-4 py-4 text-left text-sm font-bold text-navy-700 dark:text-white">
                    S.No
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-navy-700 dark:text-white">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-[13px] font-bold text-navy-700 dark:text-white">
                    Request Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-navy-700 dark:text-white">
                    Leave type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-navy-700 dark:text-white">
                    Start Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-navy-700 dark:text-white">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-navy-700 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-navy-700 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="md:table-row-group">
                {paginatedRequests.map((request, index) => (
                  <tr
                    key={request.id || index}
                    className="border-b border-gray-200 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-navy-700 md:table-row"
                  >
                    <td className="px-4 py-4 font-bold text-navy-700 dark:text-white">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900">
                          <img
                            className="h-full w-full rounded-full object-cover"
                            src={
                              request?.profile_picture &&
                              request.profile_picture.trim() !== ""
                                ? request.profile_picture.startsWith("data:")
                                  ? request.profile_picture
                                  : `${request.profile_picture}`
                                : request?.gender?.trim().toLowerCase() ===
                                  "male"
                                ? maleProfile
                                : request?.gender?.trim().toLowerCase() ===
                                  "female"
                                ? femaleProfile
                                : maleProfile
                            }
                            alt="Profile"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-navy-700 dark:text-white">
                            {request.employee_name || "-"}
                          </p>
                          {!(isAdmin && request.employee_name === userName) && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {request.department_name || "-"}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-navy-700 dark:text-white">
                        {request.request_type || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-navy-700 dark:text-white">
                        {request.request_type === "Permission"
                          ? "-"
                          : request.leave_type || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-navy-700 dark:text-white">
                        {request.from_date
                          ? new Date(request.from_date).toLocaleDateString()
                          : "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-navy-700 dark:text-white">
                        {renderDuration(request)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status
                          ? String(request.status).charAt(0).toUpperCase() +
                            String(request.status).slice(1)
                          : "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsModal(true);
                          }}
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {request.status &&
                          String(request.status).toLowerCase() ===
                            "pending" && (
                            <>
                              <button
                                onClick={() => {
                                  const editData = request.id
                                    ? request
                                    : { ...request, id: request.leaveid };
                                  setEditRequestData(editData);
                                  setShowRequestModal(true);
                                }}
                                className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
                                title="Edit Leave Request"
                              >
                                <MdEdit size={20} />
                              </button>
                              <button
                                onClick={() => handleDelete(request.leaveid)}
                                disabled={loading}
                                className="rounded-lg p-2 text-red-600 transition hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-4 border-t border-gray-200 bg-gray-50 px-4 py-6 dark:border-gray-700 dark:bg-navy-700 sm:flex-row sm:justify-center md:gap-3 md:py-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 sm:hidden">
                {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredRequests.length)}{" "}
                of {filteredRequests.length}
              </p>
              <div className="flex items-center gap-2 sm:gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-xs font-bold text-navy-700 transition hover:bg-gray-100 disabled:opacity-30 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 sm:px-4 sm:py-2"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1 sm:gap-2">
                  {(() => {
                    if (totalPages <= 3) {
                      return Array.from(
                        { length: totalPages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-lg px-2 py-2 text-xs font-bold transition sm:px-3 ${
                            currentPage === page
                              ? "bg-blue-500 text-white"
                              : "border-2 border-gray-200 bg-white text-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-navy-700 dark:text-gray-300 dark:hover:bg-navy-600"
                          }`}
                        >
                          {page}
                        </button>
                      ));
                    }
                    let start = currentPage - 1;
                    let end = currentPage + 1;
                    if (start < 1) {
                      start = 1;
                      end = 3;
                    }
                    if (end > totalPages) {
                      end = totalPages;
                      start = Math.max(1, end - 2);
                    }
                    return Array.from(
                      { length: end - start + 1 },
                      (_, i) => start + i
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-lg px-2 py-2 text-xs font-bold transition sm:px-3 ${
                          currentPage === page
                            ? "bg-blue-500 text-white"
                            : "border-2 border-gray-200 bg-white text-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-navy-700 dark:text-gray-300 dark:hover:bg-navy-600"
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-xs font-bold text-navy-700 transition hover:bg-gray-100 disabled:opacity-30 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 sm:px-4 sm:py-2"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-2 backdrop-blur-sm sm:p-4">
          <div className="relative max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-navy-800 sm:rounded-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-navy-800 sm:px-6 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-2">
                  <FaCalendar className="text-blue-650 text-base sm:text-lg md:text-xl" />
                  <h2 className="text-sm font-bold text-navy-700 dark:text-white sm:text-base md:text-lg lg:text-2xl">
                    Leave Request Details
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                    }}
                    className="text-xl font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 sm:text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                {/* Employee Name with Profile Picture */}
                <div className="lg:col-span-2">
                  <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                    Employee
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-navy-700 sm:gap-3 sm:p-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900 sm:h-12 sm:w-12">
                      <img
                        className="h-full w-full rounded-full object-cover"
                        src={
                          selectedRequest?.profile_picture &&
                          selectedRequest.profile_picture.trim() !== ""
                            ? selectedRequest.profile_picture.startsWith(
                                "data:"
                              )
                              ? selectedRequest.profile_picture
                              : `${selectedRequest.profile_picture}`
                            : selectedRequest?.gender?.trim().toLowerCase() ===
                              "male"
                            ? maleProfile
                            : selectedRequest?.gender?.trim().toLowerCase() ===
                              "female"
                            ? femaleProfile
                            : maleProfile
                        }
                        alt="Profile"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                        {selectedRequest.employee_name || "-"}
                      </p>
                      {!(
                        isAdmin && selectedRequest.employee_name === userName
                      ) && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {selectedRequest.department_name || "-"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Department - Only show if not admin's own request */}
                {(!isAdmin ||
                  (isAdmin && selectedRequest.employee_name !== userName)) && (
                  <div>
                    <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                      Department
                    </label>
                    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                      <span className="text-xs font-semibold text-navy-700 dark:text-white sm:text-sm">
                        {selectedRequest?.department_name &&
                        selectedRequest.department_name === "N/A"
                          ? "-"
                          : selectedRequest.department_name || "-"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Role - Only show if not admin's own request */}
                {(!isAdmin ||
                  (isAdmin && selectedRequest.employee_name !== userName)) && (
                  <div>
                    <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                      Role
                    </label>
                    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                      <span className="text-xs font-semibold text-navy-700 dark:text-white sm:text-sm">
                        {selectedRequest.role_name || "-"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Request Type */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                    Request Type
                  </label>
                  <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                    <span className="text-xs font-semibold text-navy-700 dark:text-white sm:text-sm">
                      {selectedRequest.request_type || "-"}
                    </span>
                  </div>
                </div>

                {/* Leave Type */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                    Leave Type
                  </label>
                  <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                    <span className="text-xs font-semibold text-navy-700 dark:text-white sm:text-sm">
                      {selectedRequest.request_type === "Permission"
                        ? "-"
                        : selectedRequest.leave_type || "-"}
                    </span>
                  </div>
                </div>

                {/* Start Date */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                    Start Date
                  </label>
                  <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                    <span className="text-xs text-navy-700 dark:text-white sm:text-sm">
                      {selectedRequest.from_date
                        ? new Date(
                            selectedRequest.from_date
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>

                {/* End Date - Only for non-Permission */}
                {selectedRequest.request_type !== "Permission" && (
                  <div>
                    <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                      End Date
                    </label>
                    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                      <span className="text-xs text-navy-700 dark:text-white sm:text-sm">
                        {selectedRequest.to_date
                          ? new Date(
                              selectedRequest.to_date
                            ).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Start Time - Only for Permission */}
                {selectedRequest.request_type === "Permission" && (
                  <div>
                    <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                      Start Time
                    </label>
                    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                      <span className="text-xs text-navy-700 dark:text-white sm:text-sm">
                        {selectedRequest.start_time || "-"}
                      </span>
                    </div>
                  </div>
                )}

                {/* End Time - Only for Permission */}
                {selectedRequest.request_type === "Permission" && (
                  <div>
                    <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                      End Time
                    </label>
                    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                      <span className="text-xs text-navy-700 dark:text-white sm:text-sm">
                        {selectedRequest.end_time || "-"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Duration */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                    Duration
                  </label>
                  <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                    <span className="text-xs text-navy-700 dark:text-white sm:text-sm">
                      {selectedRequest ? renderDuration(selectedRequest) : "-"}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                    Status
                  </label>
                  <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold sm:gap-2 sm:px-3 ${getStatusColor(
                        selectedRequest.status
                      )}`}
                    >
                      {getStatusIcon(selectedRequest.status)}
                      {selectedRequest.status
                        ? String(selectedRequest.status)
                            .charAt(0)
                            .toUpperCase() +
                          String(selectedRequest.status).slice(1)
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Request Reason */}
                {selectedRequest.reason && (
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                      Request Reason
                    </label>
                    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                      <p className="break-words text-xs text-navy-700 dark:text-white sm:text-sm">
                        {selectedRequest.reason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reject Reason - Only show if rejected */}
                {selectedRequest.status &&
                  String(selectedRequest.status).toLowerCase() === "rejected" &&
                  selectedRequest.approval_reason && (
                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                        Reject Reason
                      </label>
                      <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                        <p className="break-words text-xs text-navy-700 dark:text-white sm:text-sm">
                          {expandedReasons[selectedRequest.id]
                            ? selectedRequest.approval_reason
                            : selectedRequest.approval_reason?.substring(
                                0,
                                100
                              )}
                          {selectedRequest.approval_reason &&
                            selectedRequest.approval_reason.length > 100 &&
                            !expandedReasons[selectedRequest.id] &&
                            "..."}
                        </p>
                        {selectedRequest.approval_reason &&
                          selectedRequest.approval_reason.length > 100 && (
                            <button
                              onClick={() =>
                                setExpandedReasons({
                                  ...expandedReasons,
                                  [selectedRequest.id]:
                                    !expandedReasons[selectedRequest.id],
                                })
                              }
                              className="mt-2 text-xs font-bold text-brand-500 transition hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 sm:text-sm"
                            >
                              {expandedReasons[selectedRequest.id]
                                ? "See Less"
                                : "See More"}
                            </button>
                          )}
                      </div>
                    </div>
                  )}

                {/* Remarks */}
                {selectedRequest.remarks && (
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                      Remarks
                    </label>
                    <div className="rounded-lg border-2 border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-navy-700 sm:px-4 sm:py-2.5">
                      <p className="break-words text-xs text-navy-700 dark:text-white sm:text-sm">
                        {selectedRequest.remarks}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedRequest.status &&
                String(selectedRequest.status).toLowerCase() === "pending" &&
                isAdmin && (
                  <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-700 sm:flex-row sm:pt-6 lg:col-span-2">
                    <button
                      onClick={() =>
                        handleApprove(
                          selectedRequest.id || selectedRequest.leaveid
                        )
                      }
                      disabled={loading}
                      className="w-full rounded-lg bg-green-500 px-4 py-2.5 text-xs font-bold text-white transition duration-200 hover:bg-green-600 disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-700 sm:py-3 sm:text-sm"
                    >
                      <FaCheck className="mr-2 inline" /> Approve
                    </button>
                    <button
                      onClick={() => {
                        setRequestToReject(selectedRequest);
                        setShowRejectModal(true);
                      }}
                      disabled={loading}
                      className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-xs font-bold text-white transition duration-200 hover:bg-red-600 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700 sm:py-3 sm:text-sm"
                    >
                      <FaTimes className="mr-2 inline" /> Reject
                    </button>
                  </div>
                )}

              {(!selectedRequest.status ||
                String(selectedRequest.status).toLowerCase() !== "pending") && (
                <div className="flex w-full justify-center border-t border-gray-200 pt-4 dark:border-gray-700 sm:pt-6 lg:col-span-2">
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(selectedRequest.leaveid)}
                      disabled={loading}
                      className="flex items-center justify-center rounded-lg bg-orange-500 px-8 py-3 text-sm font-bold text-white shadow-md transition duration-200 hover:bg-orange-600 disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-700"
                      style={{ minWidth: "140px" }}
                    >
                      <FaTrash className="mr-2 text-lg" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Request Modal - LeavePermissionRequest Component */}
      {showRequestModal && (
        <LeavePermissionRequest
          editData={editRequestData}
          leaveTypes={leaveTypes}
          requestTypes={requestTypes}
          onClose={() => {
            setShowRequestModal(false);
            setEditRequestData(null);
            loadLeaveRequests();
          }}
        />
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && requestToReject && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-2 backdrop-blur-sm sm:p-4">
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-navy-800 sm:rounded-2xl">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6 sm:py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-navy-700 dark:text-white sm:text-lg md:text-xl">
                  Reject Leave Request
                </h2>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    setRequestToReject(null);
                  }}
                  className="text-xl font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 sm:text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="space-y-3 p-4 sm:space-y-4 sm:p-6">
              <div>
                <p className="mb-2 text-xs font-semibold text-navy-700 dark:text-white sm:text-sm">
                  Employee: {requestToReject.employee_name}
                </p>
                <p className="mb-3 text-xs text-gray-600 dark:text-gray-400 sm:mb-4 sm:text-sm">
                  Please provide a reason for rejecting this leave request.
                </p>
              </div>

              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows="4"
                className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-xs text-navy-700 placeholder-gray-400 transition focus:border-red-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:px-6 sm:py-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRequestToReject(null);
                }}
                className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-xs font-bold text-navy-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (rejectReason.trim()) {
                    handleReject(
                      requestToReject.id || requestToReject.leaveid,
                      rejectReason
                    );
                  } else {
                    showError("Please provide a reason for rejection");
                  }
                }}
                disabled={loading || !rejectReason.trim()}
                className="w-full rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700 sm:text-sm"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
