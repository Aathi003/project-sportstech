import MiniCalendar from "components/calendar/MiniCalendar";
import { useEffect, useState } from "react";
import { leaveAPI } from "services/leaveAPI";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
import TotalSpent from "views/admin/default/components/TotalSpent";
import PieChartCard from "views/admin/default/components/PieChartCard";
import { IoMdHome } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { IoDocuments } from "react-icons/io5";
import { MdBarChart, MdDashboard } from "react-icons/md";
import { IoNotifications } from "react-icons/io5";
import { IoIosNotifications } from "react-icons/io";
import dashboardAPI from "services/dashboard";
import ProfileCard from "components/card/ProfileCard";

import { columnsDataCheck, columnsDataComplex } from "./variables/columnsData";

import Widget from "components/widget/Widget";
import CheckTable from "views/admin/default/components/CheckTable";
import ComplexTable from "views/admin/default/components/ComplexTable";
import DailyTraffic from "views/admin/default/components/DailyTraffic";
import TaskCard from "views/admin/default/components/TaskCard";
import tableDataCheck from "./variables/tableDataCheck.json";
import tableDataComplex from "./variables/tableDataComplex.json";

const Dashboard = () => {
  // Get user name from localStorage
  const userName = localStorage.getItem("user_name") || "User";
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [approvedLeaveCount, setApprovedLeaveCount] = useState(0);
  const [rejectedLeaveCount, setRejectedLeaveCount] = useState(0);
  const [todayLeaveCount, setTodayLeaveCount] = useState(0);

  // Total leaves (all time)
  const [totalPendingLeaveCount, setTotalPendingLeaveCount] = useState(0);
  const [totalApprovedLeaveCount, setTotalApprovedLeaveCount] = useState(0);
  const [totalRejectedLeaveCount, setTotalRejectedLeaveCount] = useState(0);
  const [totalAllLeaveCount, setTotalAllLeaveCount] = useState(0);
  const [availableLeaveBalance, setAvailableLeaveBalance] = useState(0);

  const navigate = useNavigate();

  const [todayDate, setTodayDate] = useState("");

  useEffect(() => {
    // Get today's leave stats
    dashboardAPI.getDashboardStats((res) => {
      const stats = res?.data;

      setTodayDate(stats?.date);
      setTodayLeaveCount(stats?.total_received_today || 0);
      setPendingLeaveCount(stats?.pending || 0);
      setApprovedLeaveCount(stats?.approved || 0);
      setRejectedLeaveCount(stats?.rejected || 0);
    });

    // Get total leave stats (all time)
    leaveAPI.getAllLeaves((data) => {
      let requests = [];
      if (Array.isArray(data)) {
        requests = data;
      } else if (data?.results && Array.isArray(data.results)) {
        requests = data.results;
      } else if (data?.data && Array.isArray(data.data)) {
        requests = data.data;
      } else if (data?.leave_requests && Array.isArray(data.leave_requests)) {
        requests = data.leave_requests;
      }

      const pending = requests.filter(
        (req) => req.status && req.status.toLowerCase() === "pending"
      );
      const approved = requests.filter(
        (req) => req.status && req.status.toLowerCase() === "approved"
      );
      const rejected = requests.filter(
        (req) => req.status && req.status.toLowerCase() === "rejected"
      );

      setTotalPendingLeaveCount(pending.length);
      setTotalApprovedLeaveCount(approved.length);
      setTotalRejectedLeaveCount(rejected.length);
      setTotalAllLeaveCount(requests.length);
    });

    // Get available leave balance
    dashboardAPI.getAvailableLeaveBalance?.(
      (res) => {
        // Handle response shape: {success, available_balance}
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
  }, []);

  const [greeting, setGreeting] = useState("");

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
    "Wishing you a productive afternoon and a great evening",
    "Good afternoon! Stay motivated and finish strong",
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
    "Good evening! Prepare for a great tomorrow",
    "Wishing you a peaceful evening and a restful night",
    "Good evening! Take care and see you tomorrow",
    "Have a great evening! Rest well for tomorrow",
  ];
  const isSuperAdmin =
    localStorage.getItem("is_super_admin") === "true" ||
    localStorage.getItem("is_super_admin") === true;

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let greetingsList = [];

      if (hour < 12) {
        greetingsList = morningGreetings;
      } else if (hour < 17) {
        greetingsList = afternoonGreetings;
      } else {
        greetingsList = eveningGreetings;
      }

      const random =
        greetingsList[Math.floor(Math.random() * greetingsList.length)];

      setGreeting(random);
    };

    updateGreeting();

    const interval = setInterval(updateGreeting, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      {/* Dashboard Header */}
      <div className="mb-3"></div>

      {/* TODAY LEAVES SECTION - NOW WITH WIDGET STYLE */}

      {/* Greeting - Responsive */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="w-full sm:w-[30%]">
          {isSuperAdmin && (
            <h1 className="text-lg font-bold text-navy-700 dark:text-white sm:text-xl md:text-2xl">
              Today Leaves
            </h1>
          )}
        </div>
        <div className="w-full text-left sm:w-[70%] sm:text-right">
          <h2 className="text-sm font-semibold text-gray-700 sm:text-base md:text-lg">
            Hey <span className="font-bold text-blue-600">{userName}</span>,{" "}
            {greeting}
          </h2>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="mb-5 w-full">
          {/* Today Leaves Grid - WIDGET STYLE - FULLY RESPONSIVE */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            {/* All Leaves Widget - TODAY */}
            <div
              className="cursor-pointer"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "all");
                localStorage.setItem("leave_date_filter", todayDate);
                navigate("/admin/leave-requests");
              }}
            >
              <Widget
                icon={
                  todayLeaveCount > 0 ? (
                    <span className="relative">
                      <IoIosNotifications className="h-6 w-6 text-blue-500 sm:h-7 sm:w-7" />
                      <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white sm:h-5 sm:w-5 sm:text-xs">
                        {todayLeaveCount}
                      </span>
                    </span>
                  ) : (
                    <IoIosNotifications className="h-6 w-6 text-gray-400 sm:h-7 sm:w-7" />
                  )
                }
                title={"All Leaves"}
                subtitle={
                  todayLeaveCount > 0 ? `${todayLeaveCount} Total` : "No Leaves"
                }
              />
            </div>

            {/* Pending Leaves Widget - TODAY */}
            <div
              className="cursor-pointer"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "pending");
                localStorage.setItem("leave_date_filter", todayDate);
                navigate("/admin/leave-requests");
              }}
            >
              <Widget
                icon={
                  pendingLeaveCount > 0 ? (
                    <span className="relative">
                      <IoIosNotifications className="h-6 w-6 animate-bounce text-red-500 sm:h-7 sm:w-7" />
                      <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white sm:h-5 sm:w-5 sm:text-xs">
                        {pendingLeaveCount}
                      </span>
                    </span>
                  ) : (
                    <IoIosNotifications className="h-6 w-6 text-gray-400 sm:h-7 sm:w-7" />
                  )
                }
                title={"Leave Requests"}
                subtitle={
                  pendingLeaveCount > 0
                    ? `${pendingLeaveCount} Pending`
                    : "No Pending"
                }
              />
            </div>

            {/* Approved Leaves Widget - TODAY */}
            <div
              className="cursor-pointer"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "approved");
                localStorage.setItem("leave_date_filter", todayDate);
                navigate("/admin/leave-requests");
              }}
            >
              <Widget
                icon={
                  approvedLeaveCount > 0 ? (
                    <span className="relative">
                      <IoIosNotifications className="h-6 w-6 text-green-500 sm:h-7 sm:w-7" />
                      <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white sm:h-5 sm:w-5 sm:text-xs">
                        {approvedLeaveCount}
                      </span>
                    </span>
                  ) : (
                    <IoIosNotifications className="h-6 w-6 text-gray-400 sm:h-7 sm:w-7" />
                  )
                }
                title={"Approved Leaves"}
                subtitle={
                  approvedLeaveCount > 0
                    ? `${approvedLeaveCount} Approved`
                    : "No Approved"
                }
              />
            </div>

            {/* Rejected Leaves Widget - TODAY */}
            <div
              className="cursor-pointer"
              onClick={() => {
                localStorage.setItem("leave_status_filter", "rejected");
                localStorage.setItem("leave_date_filter", todayDate);
                navigate("/admin/leave-requests");
              }}
            >
              <Widget
                icon={
                  rejectedLeaveCount > 0 ? (
                    <span className="relative">
                      <IoIosNotifications className="h-6 w-6 text-red-700 sm:h-7 sm:w-7" />
                      <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white sm:h-5 sm:w-5 sm:text-xs">
                        {rejectedLeaveCount}
                      </span>
                    </span>
                  ) : (
                    <IoIosNotifications className="h-6 w-6 text-gray-400 sm:h-7 sm:w-7" />
                  )
                }
                title={"Rejected Leaves"}
                subtitle={
                  rejectedLeaveCount > 0
                    ? `${rejectedLeaveCount} Rejected`
                    : `No Rejected`
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* TOTAL EMPLOYEES LEAVES SECTION - FULLY RESPONSIVE CARD STYLE */}
      <div className="mb-5 w-full">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-lg font-bold text-navy-700 dark:text-white sm:text-xl md:text-2xl">
            Total Leaves
          </h1>
        </div>

        {/* Total Leaves Grid - FULLY RESPONSIVE CARD STYLE */}
        <div
          className={`mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-${
            isSuperAdmin ? 4 : 5
          } xl:grid-cols-${isSuperAdmin ? 4 : 5}`}
        >
          {/* All Leaves Card - TOTAL - RESPONSIVE */}
          <div
            className="h-28 w-full cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-transform hover:scale-105 dark:border dark:border-[#2d3748] dark:bg-[#23272f] dark:shadow-lg sm:h-32 md:h-32"
            onClick={() => {
              localStorage.setItem("leave_status_filter", "all");
              localStorage.removeItem("leave_date_filter");
              navigate("/admin/leave-requests");
            }}
          >
            <div className="flex flex-col items-center justify-center p-3 py-2 sm:p-5 sm:py-3">
              <div className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                {totalAllLeaveCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300 sm:text-sm">
                Total Leaves
              </div>
            </div>
            <div className="bg-blue-500 py-2 text-center text-sm font-semibold text-white dark:bg-blue-600 sm:py-3 sm:text-base">
              All Leaves
            </div>
          </div>

          {/* Pending Leaves Card - TOTAL - RESPONSIVE */}
          <div
            className="h-28 w-full cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-transform hover:scale-105 dark:border dark:border-[#2d3748] dark:bg-[#23272f] dark:shadow-lg sm:h-32 md:h-32"
            onClick={() => {
              localStorage.setItem("leave_status_filter", "pending");
              localStorage.removeItem("leave_date_filter");
              navigate("/admin/leave-requests");
            }}
          >
            <div className="flex flex-col items-center justify-center p-3 py-2 sm:p-5 sm:py-3">
              <div className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                {totalPendingLeaveCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300 sm:text-sm">
                Pending Leaves
              </div>
            </div>
            <div className="bg-yellow-500 py-2 text-center text-sm font-semibold text-white dark:bg-yellow-600 sm:py-3 sm:text-base">
              Leave Requests
            </div>
          </div>

          {/* Approved Leaves Card - TOTAL - RESPONSIVE */}
          <div
            className="h-28 w-full cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-transform hover:scale-105 dark:border dark:border-[#2d3748] dark:bg-[#23272f] dark:shadow-lg sm:h-32 md:h-32"
            onClick={() => {
              localStorage.setItem("leave_status_filter", "approved");
              localStorage.removeItem("leave_date_filter");
              navigate("/admin/leave-requests");
            }}
          >
            <div className="flex flex-col items-center justify-center p-3 py-2 sm:p-5 sm:py-3">
              <div className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                {totalApprovedLeaveCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300 sm:text-sm">
                Approved Leaves
              </div>
            </div>
            <div className="bg-green-500 py-2 text-center text-sm font-semibold text-white dark:bg-green-600 sm:py-3 sm:text-base">
              Approved Leaves
            </div>
          </div>

          {/* Rejected Leaves Card - TOTAL - RESPONSIVE */}
          <div
            className="h-28 w-full cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-transform hover:scale-105 dark:border dark:border-[#2d3748] dark:bg-[#23272f] dark:shadow-lg sm:h-32 md:h-32"
            onClick={() => {
              localStorage.setItem("leave_status_filter", "rejected");
              localStorage.removeItem("leave_date_filter");
              navigate("/admin/leave-requests");
            }}
          >
            <div className="flex flex-col items-center justify-center p-3 py-2 sm:p-5 sm:py-3">
              <div className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                {totalRejectedLeaveCount}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-300 sm:text-sm">
                Rejected Leaves
              </div>
            </div>
            <div className="bg-red-500 py-2 text-center text-sm font-semibold text-white dark:bg-red-600 sm:py-3 sm:text-base">
              Rejected Leaves
            </div>
          </div>
          {!isSuperAdmin && (
            <div
              className="h-28 w-full cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-transform hover:scale-105 dark:border dark:border-[#2d3748] dark:bg-[#23272f] dark:shadow-lg sm:h-32 md:h-32"
              style={{ pointerEvents: "none" }}
            >
              <div className="flex flex-col items-center justify-center p-3 py-2 sm:p-5 sm:py-3">
                <div className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                  {availableLeaveBalance}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-300 sm:text-sm">
                  Available Leaves
                </div>
              </div>
              <div className="bg-blue-500 py-2 text-center text-sm font-semibold text-white dark:bg-blue-600 sm:py-3 sm:text-base">
                Available Leaves
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts - RESPONSIVE */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <WeeklyRevenue />
        {isSuperAdmin ? (
          <div className="w-full">
            <CheckTable />
          </div>
        ) : (
          <div className="flex w-full justify-center">
            <ProfileCard />
          </div>
        )}
      </div>

      {/* Tables & Charts - RESPONSIVE */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {isSuperAdmin && (
          <ComplexTable
            columnsData={columnsDataComplex}
            tableData={tableDataComplex}
          />
        )}

        {/* Task chart & Calendar - RESPONSIVE */}
        <div className="grid grid-cols-1 gap-5 rounded-[20px] sm:grid-cols-2">
          {/* <TaskCard /> */}
          <div className="grid grid-cols-1 rounded-[20px]">
            {/* <MiniCalendar /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
