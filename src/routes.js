import AttendanceMatrix from "views/admin/attendance/AttendanceMatrix";

import Permission from "views/admin/permission";

import {
  MdHome,
  MdPerson,
  MdLock,
  MdFingerprint,
  MdSettings,
} from "react-icons/md";
import { FaCalendar, FaBox, FaFileInvoiceDollar } from "react-icons/fa";
import { HiUserGroup } from "react-icons/hi";
import { IoTime } from "react-icons/io5";
import Dashboard from "views/admin/default";
import Employee from "views/admin/employee";
import LeaveRequests from "views/admin/leaveRequests";
import Assets from "views/admin/assets";
import CalendarPage from "views/admin/calendar";
import Attendance from "views/admin/attendance";
import Payslip from "views/admin/payslip";
import LateComing from "views/admin/lateComing";
// import Profile from "views/admin/profile";
import SignIn from "views/auth/SignIn";
import AdminConfig from "views/admin/configuration";
import { VscGraphLine } from "react-icons/vsc";

import { AiFillExclamationCircle } from "react-icons/ai";
import { FaCalendarWeek } from "react-icons/fa";



// import Attendance from "views/admin/attendance";

const routes = [
  {
    name: "Dashboard",
    layout: "/admin",
    path: "dashboard",
    icon: <MdHome className="h-5 w-5" color="blue-600" />,
    component: <Dashboard />,
    roles: ["admin", "super_admin"],
  },
  {
    name: "Assets",
    layout: "/admin",
    path: "assets",
    icon: <FaBox className="h-5 w-5" color="blue-600-600" />,
    component: <Assets />,
    roles: ["super_admin"],
  },
  {
    name: "Calendar",
    layout: "/admin",
    path: "calendar",
    icon: <FaCalendarWeek  className="h-5 w-5" color="blue-600-600" />,
    component: <CalendarPage />,
    roles: ["admin", "super_admin"],
  },

  {
    name: "Employee",
    layout: "/admin",
    path: "employee",
    icon: <HiUserGroup className="h-5 w-5" color="blue-600" />,
    component: <Employee />,
    roles: ["admin", "super_admin"],
  },
  {
    name: "Leave Requests",
    layout: "/admin",
    path: "leave-requests",
    icon: <FaCalendar className="h-5 w-5" color="blue-600" />,
    component: <LeaveRequests />,
    roles: ["admin", "super_admin"],
  },

  {
    name: "Late Permission",
    layout: "/admin",
    path: "permission",
    icon: <IoTime className="h-5 w-5" color="blue-600" />,
    component: <Permission />,
    roles: ["super_admin"],
  },
  {
    name: "Late Coming",
    layout: "/admin",
    path: "late-coming",
    icon: <AiFillExclamationCircle  className="h-5 w-5" color="blue-600" />,
    component: <LateComing />,
    roles: ["admin", "super_admin"],
  },
  {
    name: "Attendance List",
    layout: "/admin",
    path: "attendance",
    icon: <MdFingerprint className="h-5 w-5" color="blue-600" />,
    component: <Attendance />,
    roles: ["super_admin"],
  },

  {
    name: "Attendance Matrix",
    layout: "/admin",
    path: "attendance-matrix",
    icon: <VscGraphLine className="h-5 w-5" color="blue-600" />,
    component: <AttendanceMatrix />,
    roles: ["admin", "super_admin"],
  },

  {
    name: "Payslip",
    layout: "/admin",
    path: "payslip",
    icon: <FaFileInvoiceDollar className="h-5 w-5" color="blue-600-600" />,
    component: <Payslip />,
    roles: ["admin", "super_admin"],
  },

  {
    name: "Configuration",
    layout: "/admin",
    path: "configuration",
    icon: <MdSettings className="h-5 w-5" color="blue-600" />,
    component: <AdminConfig />,
    roles: ["super_admin"],
  },
  // {
  //   name: "Profile",
  //   layout: "/admin",
  //   path: "profile",
  //   icon: <MdPerson className="h-5 w-5" color="blue-600" />,
  //   component: <Profile />,
  //   roles: ["admin", "super_admin"],
  // },
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    icon: <MdLock className="h-5 w-5" color="blue-600" />,
    component: <SignIn />,
  },
];

export default routes;
