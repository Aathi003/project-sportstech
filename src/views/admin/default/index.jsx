import MiniCalendar from "components/calendar/MiniCalendar";
import { useEffect, useState } from "react";
import { useAuth } from "contexts/AuthContext";
import { leaveAPI } from "services/leaveAPI";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
import TotalSpent from "views/admin/default/components/TotalSpent";
import PieChartCard from "views/admin/default/components/PieChartCard";
import { useNavigate } from "react-router-dom";
import { IoIosNotifications } from "react-icons/io";
import dashboardAPI from "services/dashboard";
import employeeAPI from "services/employeeAPI";
import wfhAPI from "services/wfh";
import { showSuccess, showError } from "utils/toastHelper";
import Swal from "sweetalert2";
import ProfileCard from "components/card/ProfileCard";
import { columnsDataCheck, columnsDataComplex } from "./variables/columnsData";
import Widget from "components/widget/Widget";
import CheckTable from "views/admin/default/components/CheckTable";
import ComplexTable from "views/admin/default/components/ComplexTable";
import Demo from "./components/Demo";
import MonthlyLatePunchTable from "./components/MonthlyLatePunchTable";
import TermsConditionsCard from "./components/TermsConditionsCard";
import tableDataComplex from "./variables/tableDataComplex.json";
import { AiFillHome } from "react-icons/ai";
import Attendance from "../attendance";
// import Permissioncard from "./components/Permissioncard";
// import Permission from "../permission";

const Dashboard = () => {
  const { latecoming } = useAuth();
  const [dismissedLatecoming, setDismissedLatecoming] = useState(false);
  const [isWorkFromHome, setIsWorkFromHome] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const userName = localStorage.getItem("user_name") || "User";
  const isSuperAdmin =
    localStorage.getItem("is_super_admin") === "true" ||
    localStorage.getItem("is_super_admin") === true;

  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [approvedLeaveCount, setApprovedLeaveCount] = useState(0);
  const [rejectedLeaveCount, setRejectedLeaveCount] = useState(0);
  const [todayLeaveCount, setTodayLeaveCount] = useState(0);
  const [todayDate, setTodayDate] = useState("");

  const [totalPendingLeaveCount, setTotalPendingLeaveCount] = useState(0);
  const [totalApprovedLeaveCount, setTotalApprovedLeaveCount] = useState(0);
  const [totalRejectedLeaveCount, setTotalRejectedLeaveCount] = useState(0);
  const [totalAllLeaveCount, setTotalAllLeaveCount] = useState(0);

  // Permission states
  const [totalPermissions, setTotalPermissions] = useState(0);
  const [permissionApproved, setPermissionApproved] = useState(0);
  const [permissionRejected, setPermissionRejected] = useState(0);
  const [permissionPending, setPermissionPending] = useState(0);
  const [availableLeaveBalance, setAvailableLeaveBalance] = useState(0);

  const [greeting, setGreeting] = useState("");
  const navigate = useNavigate();

  // Reset dismiss state whenever a new latecoming value arrives
  useEffect(() => {
    if (latecoming) {
      setDismissedLatecoming(false);
    }
  }, [latecoming]);

  useEffect(() => {
    const userId =
      localStorage.getItem("employee_id") ||
      localStorage.getItem("user_id") ||
      localStorage.getItem("emp_id");

    const isWfhFromStorage = localStorage.getItem("is_wfh_enabled") === "true";

    // 1. Apply WFH flag from login response immediately (no flicker)
    if (isWfhFromStorage) setIsWorkFromHome(true);

    // 2. Confirm WFH flag from employee API (overrides storage if needed)
    if (userId && employeeAPI.getEmployeeById) {
      employeeAPI.getEmployeeById(
        userId,
        (res) => {
          const data = res?.data || res?.employee || res || {};
          const isWfh =
            data?.is_wfh_enabled === true ||
            String(data?.is_wfh_enabled).toLowerCase() === "true" ||
            data?.is_wfh === true;
          if (isWfh) setIsWorkFromHome(true);
        },
        () => {}
      );
    }

    // 3. Pull check-in state and elapsed time from status API
    if (userId) {
      wfhAPI.getStatus(
        (res) => {
          console.log("WFH status response:", res); // Debug log
          // Response may be flat or nested — find the oconbject that has elapsed_seconds
          const flat = res || {};

          const data =
            flat?.data?.attendance?.elapsed_seconds != null
              ? flat.data
              : flat?.data?.attendance?.elapsed_seconds != null
              ? flat.data
              : Object.values(flat).find(
                  (v) =>
                    v && typeof v === "object" && v?.elapsed_seconds != null
                ) || flat;

          const isWfh =
            data?.is_wfh === true ||
            data?.is_wfh_enabled === true ||
            String(data?.is_wfh_enabled).toLowerCase() === "true";
          if (isWfh) setIsWorkFromHome(true);

          const attendance = data?.attendance || data || {};
          const checkedIn = data?.checked_in === true;
          const checkedOut = data?.checked_out === true;
          const elapsed = attendance?.elapsed_seconds ?? data?.attendance?.elapsed_seconds;

          if (checkedIn && !checkedOut) {
            setIsCheckedIn(true);
            if (elapsed != null) {
              setElapsedSeconds(Math.max(0, Math.floor(Number(elapsed))));
            }
          } else {
            // checked_out==true or not checked in — hide timer
            setIsCheckedIn(false);
            setElapsedSeconds(0);
          }
        },
        () => {}
      );
    }
  }, []);

  // Timer: tick every second while checked in
  useEffect(() => {
    if (!isCheckedIn) return undefined;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn]);

  const formatElapsed = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [hrs, mins, secs]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  };

  const handleCheckIn = () => {
    const employeeId = localStorage.getItem("user_id");
    setCheckingIn(true);
    wfhAPI.checkIn(
      employeeId,
      () => {
        // Re-fetch status so elapsed time comes from the server
        wfhAPI.getStatus(
          (res) => {
            const flat = res || {};
            const data =
              flat?.elapsed_seconds != null
                ? flat
                : flat?.data?.elapsed_seconds != null
                ? flat.data
                : Object.values(flat).find(
                    (v) =>
                      v && typeof v === "object" && v?.elapsed_seconds != null
                  ) || flat;
            const isWfh =
              data?.is_wfh === true ||
              data?.is_wfh_enabled === true ||
              String(data?.is_wfh_enabled).toLowerCase() === "true";
            if (isWfh) setIsWorkFromHome(true);
            const elapsed = data?.elapsed_seconds;
            setElapsedSeconds(
              elapsed != null ? Math.max(0, Math.floor(Number(elapsed))) : 0
            );
          },
          () => setElapsedSeconds(0)
        );
        setIsCheckedIn(true);
        setCheckingIn(false);
      },
      (error) => {
        showError(error?.message || "Failed to check in");
        setCheckingIn(false);
      }
    );
  };

  const handleCheckOut = () => {
    Swal.fire({
      title: "Confirm Check Out",
      text: "Are you sure you want to check out? Once you check out, you won't be able to check in again until the next day.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Check Out",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        performCheckOut();
      }
    });
  };

  const performCheckOut = () => {
    const employeeId = localStorage.getItem("user_id");
    setCheckingOut(true);
    wfhAPI.checkOut(
      employeeId,
      () => {
        setIsCheckedIn(false);
        setElapsedSeconds(0);
        setCheckingOut(false);
      },
      (error) => {
        showError(error?.message || "Failed to check out");
        setCheckingOut(false);
      }
    );
  };

  useEffect(() => {
    dashboardAPI.getDashboardStats((res) => {
      const stats = res?.data;
      setTodayDate(stats?.date);
      setTodayLeaveCount(stats?.total_received_today || 0);
      setPendingLeaveCount(stats?.pending || 0);
      setApprovedLeaveCount(stats?.approved || 0);
      setRejectedLeaveCount(stats?.rejected || 0);

      // Set permission counts if present
      setTotalPermissions(stats?.total_permissions || 0);
      setPermissionApproved(stats?.permission_approved || 0);
      setPermissionRejected(stats?.permission_rejected || 0);
      setPermissionPending(stats?.permission_pending || 0);
    });

    // Single call for monthly leave balance
    dashboardAPI.getMonthlyLeaveBalance((data) => {
      setTotalAllLeaveCount(data?.total_requests || 0);
      setTotalPendingLeaveCount(data?.pending || 0);
      setTotalApprovedLeaveCount(data?.approved || 0);
      setTotalRejectedLeaveCount(data?.rejected || 0);
    });

    dashboardAPI.getAvailableLeaveBalance?.(
      (res) => {
        let balance = 0;
        if (typeof res === "object") {
          if (typeof res.available_balance === "number") {
            balance = res.available_balance;
          } else if (typeof res.available_balance === "string") {
            balance = Number(res.available_balance) || 0;
          } else if (res.data?.available_balance !== undefined) {
            balance = Number(res.data.available_balance) || 0;
          }
        } else if (typeof res === "number") {
          balance = res;
        }
        setAvailableLeaveBalance(balance);
      },
      () => setAvailableLeaveBalance(0)
    );
  }, []);

  const morningGreetings = [
    "Very good morning!",
    "Rise and shine!",
    "Wishing you a wonderful morning",
    "Good morning! Stay positive",
    "Have a great day ahead!",
    "Morning! Hope your day starts great",
    "Good morning! Make it a fantastic day",
    "Warm morning wishes",
    "Good morning, have a productive day",
    "Good morning! Let's make it a great day",
    "Fresh morning greetings",
    "Good morning! Seize the day",
    "Morning! Wishing you success today",
    "Good morning! Stay motivated",
    "Have a bright morning and a great day",
  ];

  const afternoonGreetings = [
    "Good Afternoon! Keep going",
    "Hope your afternoon is going well",
    "Have a productive afternoon",
    "Good afternoon! Stay focused",
    "Wishing you a successful afternoon",
    "Good afternoon! Keep up the great work",
    "Have a wonderful afternoon",
    "Good afternoon! Stay energized",
    "Hope your afternoon is filled with accomplishments",
    "Good afternoon! Keep pushing forward",
    "Wishing you a fantastic afternoon",
    "Good afternoon! Stay positive and productive",
    "Have a great rest of the day!",
    "Good afternoon! Make the most of your day",
    "Good afternoon! Keep striving for success",
  ];

  const eveningGreetings = [
    "Good Evening! Relax and enjoy",
    "Good evening! Hope you had a successful day",
    "Have a peaceful evening",
    "Good evening! Take care",
    "Wishing you a restful evening",
    "Good evening! Unwind and recharge",
    "Have a great evening ahead",
    "Good evening! Hope you had a productive day",
    "Wishing you a pleasant evening",
    "Good evening! Take time to relax",
    "Have a wonderful evening",
    "Good evening! Enjoy your time off",
    "Wishing you a calm and restful evening",
    "Good evening! Reflect on the day's achievements",
    "Have a relaxing evening and a good night!",
  ];

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let greetingsList =
        hour < 12
          ? morningGreetings
          : hour < 17
          ? afternoonGreetings
          : eveningGreetings;
      const random =
        greetingsList[Math.floor(Math.random() * greetingsList.length)];
      setGreeting(random);
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      {/* ── Greeting ── */}
      <div className="mb-3"></div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center"></div>

      {/* ── Work From Home / Check-in banner ── */}
      {isWorkFromHome && (
        <div
          className="mb-4 w-full rounded-xl border border-blue-400 bg-blue-50 px-4 py-3 shadow-lg dark:border-blue-600 dark:bg-blue-900/30"
          role="alert"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <span className="text-lg text-blue-600 dark:text-blue-400">
                <AiFillHome />
              </span>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Hey <span className="font-bold text-blue-600">{userName}</span>,
                you are marked as{" "}
                <span className="font-bold">Work From Home</span> today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isCheckedIn && (
                <span className="whitespace-nowrap rounded-lg bg-white px-3 py-1.5 font-mono text-sm font-semibold text-blue-700 shadow-sm dark:bg-[#1a1f2b] dark:text-blue-300">
                  ⏱ {formatElapsed(elapsedSeconds)}
                </span>
              )}
              <button
                type="button"
                onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                disabled={checkingIn || checkingOut}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  isCheckedIn
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {checkingIn || checkingOut
                  ? "Please wait..."
                  : isCheckedIn
                  ? "Check Out"
                  : "Check In"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Latecoming Popup (below greeting, above Today Leaves) ── */}
      {latecoming !== null && !dismissedLatecoming && (
        <div
          className="mb-4 w-full rounded-xl border border-red-400 bg-red-50 px-4 py-3 shadow-lg dark:border-red-600 dark:bg-red-900/30"
          role="alert"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex w-full items-center gap-3">
              <span className="text-lg text-red-600 dark:text-red-400">⚠</span>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Hey <span className="font-bold text-blue-600">{userName}</span>,
                You arrived late to the office by{" "}
                <span className="font-bold text-blue-600">{latecoming}</span>{" "}
                minutes after the official office time.
              </p>
            </div>
            <button
              onClick={() => setDismissedLatecoming(true)}
              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Greeting ── */}
      <div className="mb-3"></div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="w-full sm:w-[30%]">
          {isSuperAdmin && (
            <h1 className="text-lg font-bold text-navy-700 dark:text-white sm:text-lg md:text-xl">
              Today Leaves & Permissions
            </h1>
          )}
        </div>
        <div className="w-full text-left sm:w-[70%] sm:text-right">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-white sm:text-base md:text-lg">
            Hey <span className="font-bold text-blue-600">{userName}</span>,{" "}
            {greeting}
          </h2>
        </div>
      </div>

      {/* ── Today Leaves (Super Admin only) ── */}
      {isSuperAdmin && (
        <div className="mb-5 w-full">
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {/* Today leave */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-white p-2 shadow-md transition-transform hover:scale-110 dark:bg-[#23272f]"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "all");
                localStorage.setItem("leave_date_filter", todayDate);
                localStorage.setItem("request_type", "Leave");
                localStorage.removeItem("monthly_leave_from");
                localStorage.removeItem("monthly_leave_to");
                navigate("/admin/leave-requests");
              }}
            >
              <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {todayLeaveCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-300">
                Total leave
              </span>
            </div>
            {/* Pending leave */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-white p-2 shadow-md transition-transform hover:scale-110 dark:bg-[#23272f]"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "pending");
                localStorage.setItem("leave_date_filter", todayDate);
                localStorage.setItem("request_type", "Leave");
                localStorage.removeItem("monthly_leave_from");
                localStorage.removeItem("monthly_leave_to");
                navigate("/admin/leave-requests");
              }}
            >
              <span className="text-3xl font-bold text-yellow-400 dark:text-yellow-400">
                {pendingLeaveCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-300">
                Pending leave
              </span>
            </div>
            {/* Approved leave */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-white  p-2 shadow-md transition-transform hover:scale-110 dark:bg-[#23272f]"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "approved");
                localStorage.setItem("leave_date_filter", todayDate);
                localStorage.setItem("request_type", "Leave");
                localStorage.removeItem("monthly_leave_from");
                localStorage.removeItem("monthly_leave_to");
                navigate("/admin/leave-requests");
              }}
            >
              <span className="text-3xl font-bold text-green-500 dark:text-green-300">
                {approvedLeaveCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-300">
                Approved leave
              </span>
            </div>
            {/* Rejected leave */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-white  p-2 shadow-md transition-transform hover:scale-110 dark:bg-[#23272f]"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "rejected");
                localStorage.setItem("leave_date_filter", todayDate);
                localStorage.setItem("request_type", "Leave");
                localStorage.removeItem("monthly_leave_from");
                localStorage.removeItem("monthly_leave_to");
                navigate("/admin/leave-requests");
              }}
            >
              <span className="text-3xl font-bold text-red-500 dark:text-red-500">
                {rejectedLeaveCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-300">
                Rejected leave
              </span>
            </div>
            {/* Today permission */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-white p-2 shadow-md transition-transform hover:scale-110 dark:bg-[#23272f]"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "all");
                localStorage.setItem("leave_date_filter", todayDate);
                localStorage.setItem("request_type", "Permission");
                localStorage.removeItem("monthly_leave_from");
                localStorage.removeItem("monthly_leave_to");
                navigate("/admin/leave-requests");
              }}
            >
              <span className="text-3xl font-bold text-blue-700 dark:text-purple-300">
                {totalPermissions}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-300">
                Total permission
              </span>
            </div>
            {/* Permission pending */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-white p-2 shadow-md transition-transform  hover:scale-110 dark:bg-[#23272f]"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "pending");
                localStorage.setItem("leave_date_filter", todayDate);
                localStorage.setItem("request_type", "Permission");
                localStorage.removeItem("monthly_leave_from");
                localStorage.removeItem("monthly_leave_to");
                navigate("/admin/leave-requests");
              }}
            >
              <span className="text-3xl font-bold text-yellow-500 dark:text-pink-300">
                {permissionPending}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-300">
                Permission pending
              </span>
            </div>
            {/* Permission approved */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-white p-2 shadow-md transition-transform hover:scale-110 dark:bg-[#23272f]"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "approved");
                localStorage.setItem("leave_date_filter", todayDate);
                localStorage.setItem("request_type", "Permission");
                localStorage.removeItem("monthly_leave_from");
                localStorage.removeItem("monthly_leave_to");
                navigate("/admin/leave-requests");
              }}
            >
              <span className="text-3xl font-bold text-green-500 dark:text-green-300">
                {permissionApproved}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-300">
                Permission approved
              </span>
            </div>
            {/* Permission rejected */}
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg bg-white p-2 shadow-md transition-transform hover:scale-110 dark:bg-[#23272f]"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "rejected");
                localStorage.setItem("leave_date_filter", todayDate);
                localStorage.setItem("request_type", "Permission");
                localStorage.removeItem("monthly_leave_from");
                localStorage.removeItem("monthly_leave_to");
                navigate("/admin/leave-requests");
              }}
            >
              <span className="text-3xl font-bold text-red-500 dark:text-gray-300">
                {permissionRejected}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-300">
                Permission rejected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Total Leaves ── */}
      <div className="mb-5 w-full">
        <div className="mb-3">
          <h1 className="text-lg font-bold text-navy-700 dark:text-white sm:text-lg md:text-xl">
            Monthly Leaves
          </h1>
        </div>

        <div
          className={`mt-3 grid grid-cols-2 gap-3 ${
            isSuperAdmin ? "sm:grid-cols-4" : "md:grid-cols-5"
          }`}
        >
          {/* All */}
          <div
            className="flex h-28 w-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-md transition-transform hover:scale-105 dark:border dark:border-[#2d3748] dark:bg-[#23272f] sm:h-32"
            onClick={() => {
              dashboardAPI.getMonthlyLeaveBalance((data) => {
                if (data && data.from_date && data.to_date) {
                  localStorage.setItem("monthly_leave_from", data.from_date);
                  localStorage.setItem("monthly_leave_to", data.to_date);
                  localStorage.setItem("monthly_leave_card_clicked", "true");
                }
                localStorage.setItem("leave_status_filter", "all");
                localStorage.removeItem("leave_date_filter");
                localStorage.setItem("request_type", "Leave");
                navigate("/admin/leave-requests");
              });
            }}
          >
            <div className="flex flex-1 flex-col items-center justify-center p-3 py-2 sm:p-5 sm:py-3">
              <div className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                {totalAllLeaveCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300 sm:text-sm">
                Total Leaves
              </div>
            </div>
            <div className="bg-blue-500 py-2 text-center text-sm font-semibold text-white sm:py-3 sm:text-base">
              All Leaves
            </div>
          </div>

          {/* Pending */}
          <div
            className="flex h-28 w-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-md transition-transform hover:scale-105 dark:border dark:border-[#2d3748] dark:bg-[#23272f] sm:h-32"
            onClick={() => {
              dashboardAPI.getMonthlyLeaveBalance((data) => {
                if (data && data.from_date && data.to_date) {
                  localStorage.setItem("monthly_leave_from", data.from_date);
                  localStorage.setItem("monthly_leave_to", data.to_date);
                  localStorage.setItem("monthly_leave_card_clicked", "true");
                }
                localStorage.setItem("leave_status_filter", "pending");
                localStorage.removeItem("leave_date_filter");
                localStorage.setItem("request_type", "Leave");
                navigate("/admin/leave-requests");
              });
            }}
          >
            <div className="flex flex-1 flex-col items-center justify-center p-3 py-2 sm:p-5 sm:py-3">
              <div className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                {totalPendingLeaveCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300 sm:text-sm">
                Pending Leaves
              </div>
            </div>
            <div className="bg-yellow-500 py-2 text-center text-sm font-semibold text-white sm:py-3 sm:text-base">
              Leave Requests
            </div>
          </div>

          {/* Approved */}
          <div
            className="flex h-28 w-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-md transition-transform hover:scale-105 dark:border dark:border-[#2d3748] dark:bg-[#23272f] sm:h-32"
            onClick={() => {
              dashboardAPI.getMonthlyLeaveBalance((data) => {
                if (data && data.from_date && data.to_date) {
                  localStorage.setItem("monthly_leave_from", data.from_date);
                  localStorage.setItem("monthly_leave_to", data.to_date);
                  localStorage.setItem("monthly_leave_card_clicked", "true");
                }
                localStorage.setItem("leave_status_filter", "approved");
                localStorage.removeItem("leave_date_filter");
                localStorage.setItem("request_type", "Leave");
                navigate("/admin/leave-requests");
              });
            }}
          >
            <div className="flex flex-1 flex-col items-center justify-center p-3 py-2 sm:p-5 sm:py-3">
              <div className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                {totalApprovedLeaveCount}
              </div>
              <div className="text-[12px] text-gray-500 dark:text-gray-300">
                Approved Leaves
              </div>
            </div>
            <div className="bg-green-500 py-2 text-center text-sm font-semibold text-white sm:py-3 sm:text-base">
              Approved Leaves
            </div>
          </div>

          {/* Rejected */}
          <div
            className="flex h-28 w-full cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-md transition-transform hover:scale-105 dark:border dark:border-[#2d3748] dark:bg-[#23272f] sm:h-32"
            onClick={() => {
              dashboardAPI.getMonthlyLeaveBalance((data) => {
                if (data && data.from_date && data.to_date) {
                  localStorage.setItem("monthly_leave_from", data.from_date);
                  localStorage.setItem("monthly_leave_to", data.to_date);
                  localStorage.setItem("monthly_leave_card_clicked", "true");
                }
                localStorage.setItem("leave_status_filter", "rejected");
                localStorage.removeItem("leave_date_filter");
                localStorage.setItem("request_type", "Leave");
                navigate("/admin/leave-requests");
              });
            }}
          >
            <div className="flex flex-1 flex-col items-center justify-center p-3 py-2 sm:p-5 sm:py-3">
              <div className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                {totalRejectedLeaveCount}
              </div>
              <div className="text-[12px] text-gray-500 dark:text-gray-300">
                Rejected Leaves
              </div>
            </div>
            <div className="bg-red-500 py-2 text-center text-sm font-semibold text-white sm:py-3 sm:text-base">
              Rejected Leaves
            </div>
          </div>

          {/* Available (non-admin only) */}
          {!isSuperAdmin && (
            <div
              className="col-span-2 flex h-28 w-full flex-col overflow-hidden rounded-xl bg-white shadow-md dark:border dark:border-[#2d3748] dark:bg-[#23272f] sm:h-32 md:col-span-1"
              style={{ pointerEvents: "none" }}
            >
              <div className="flex flex-1 flex-col items-center justify-center p-3 py-2 sm:p-5 sm:py-3">
                <div className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                  {availableLeaveBalance}
                </div>
                <div className="text-[12px] text-gray-500 dark:text-gray-300">
                  Available Leaves
                </div>
              </div>
              <div className="bg-blue-500 py-2 text-center text-sm font-semibold text-white sm:py-3 sm:text-base">
                Available Leaves
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {isSuperAdmin ? <WeeklyRevenue /> : <Demo />}
        {isSuperAdmin ? (
          <div className="w-full">
            <CheckTable />
          </div>
        ) : (
          <MonthlyLatePunchTable />
        )}
      </div>

      {!isSuperAdmin && (
        <div className="mt-5 w-full">
          <TermsConditionsCard />
        </div>
      )}

      {/* ── Complex Table (Super Admin only) ── */}
      {isSuperAdmin && (
        <div className="mt-5 w-full">
          <ComplexTable
            columnsData={columnsDataComplex}
            tableData={tableDataComplex}
          />
          {/* <div className="w-full">
            <Permission />
          </div> */}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
