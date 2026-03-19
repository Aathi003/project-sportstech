import React from "react";
import Dropdown from "components/dropdown";
import { FiAlignJustify } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import navbarimage from "assets/img/layout/Navbar.png";
import { BsArrowBarUp } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import {
  IoMdNotificationsOutline,
  IoMdInformationCircleOutline,
} from "react-icons/io";
import avatar from "assets/img/avatars/avatar4.png";
import EmployeeProfileImage from "./EmployeeProfileImage";
import { useAuth } from "contexts/AuthContext";
import { toast } from "react-toastify";

const Navbar = (props) => {
  const { onOpenSidenav, onCloseSidenav, sidebarOpen, brandText } = props;
  const [darkmode, setDarkmode] = React.useState(false);
  const { user, name, isSuperAdmin, logout, email } = useAuth();
  const navigate = useNavigate();

  // Determine user info for display
  let userId = user || "";
  let userEmail =
    email || (typeof user === "string" && user.includes("@")) ? user : "";
  let userDisplayName = name || (userEmail ? userEmail.split("@")[0] : userId);

  // If super admin, show only label

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/auth/sign-in");
  };

  return (
    <nav className="sticky top-4 z-40 flex flex-row flex-wrap items-center justify-between rounded-xl bg-white/10 p-2 backdrop-blur-xl dark:bg-[#0b14374d]">
      <div className="ml-[6px]">
        <p className="shrink text-[33px] capitalize text-navy-700 dark:text-white">
          <Link
            to="#"
            className="font-bold capitalize hover:text-navy-700 dark:hover:text-white"
          >
            {brandText}
            <span></span>
          </Link>
        </p>
      </div>

      <div className="relative mt-[3px] flex h-[61px] w-[355px] flex-grow items-center justify-around gap-2 rounded-full bg-white px-2 py-2 shadow-xl shadow-shadow-500 dark:!bg-navy-800 dark:shadow-none md:w-[365px] md:flex-grow-0 md:gap-1 xl:w-[365px] xl:gap-2">
        <div className="flex h-full items-center rounded-full bg-lightPrimary text-navy-700 dark:bg-navy-900 dark:text-white xl:w-[225px]">
          <p className="pl-3 pr-2 text-xl">
            <FiSearch className="h-4 w-4 text-gray-400 dark:text-white" />
          </p>
          <input
            type="text"
            placeholder="Search..."
            className="block h-full w-full rounded-full bg-lightPrimary text-sm font-medium text-navy-700 outline-none placeholder:!text-gray-400 dark:bg-navy-900 dark:text-white dark:placeholder:!text-white sm:w-fit"
          />
        </div>
        <span
          className="flex cursor-pointer text-xl text-gray-600 dark:text-white xl:hidden"
          onClick={() => {
            if (sidebarOpen) {
              onCloseSidenav();
            } else {
              onOpenSidenav();
            }
          }}
        >
          <FiAlignJustify className="h-5 w-5" />
        </span>
        {/* start Notification */}
        
        <div
          className="cursor-pointer text-gray-600"
          onClick={() => {
            if (darkmode) {
              document.body.classList.remove("dark");
              setDarkmode(false);
            } else {
              document.body.classList.add("dark");
              setDarkmode(true);
            }
          }}
        >
          {darkmode ? (
            <RiSunFill className="h-4 w-4 text-gray-600 dark:text-white" />
          ) : (
            <RiMoonFill className="h-4 w-4 text-gray-600 dark:text-white" />
          )}
        </div>
        {/* Profile & Dropdown */}
        <Dropdown
          button={<EmployeeProfileImage employeeId={userId} />}
          children={
            <div className="flex w-56 flex-col justify-start rounded-[20px] bg-white bg-cover bg-no-repeat shadow-xl shadow-shadow-500 dark:!bg-navy-700 dark:text-white dark:shadow-none">
              <div className="p-4">
                {isSuperAdmin ? (
                  <div className="flex flex-col items-start">
                    <p className="text-sm font-bold text-navy-700 dark:text-white">
                      Hey ,Admin
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <EmployeeProfileImage
                        employeeId={userId}
                        style={{ height: 32, width: 32, borderRadius: "50%" }}
                      />
                      <div>
                        <p className="text-sm font-bold text-navy-700 dark:text-white">
                          Hey,{" "}
                          {userDisplayName.charAt(0).toUpperCase() +
                            userDisplayName.slice(1)}
                        </p>
                        {userEmail && (
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                            Email: {userEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="h-px w-full bg-gray-200 dark:bg-white/20 " />

              <div className="flex flex-col p-4">
                <Link
                  to="/admin/profile"
                  className="text-sm text-gray-800 dark:text-white hover:dark:text-white"
                >
                  Profile Settings
                </Link>
                <Link
                  to="/admin/calendar"
                  className="mt-3 text-sm text-gray-800 dark:text-white hover:dark:text-white"
                >
                  Calender
                </Link>
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full cursor-pointer border-none bg-none p-0 text-left text-sm font-medium text-red-500 transition duration-150 ease-out hover:text-red-500 hover:ease-in"
                >
                  Log Out
                </button>
              </div>
            </div>
          }
          classNames={"py-2 top-8 -left-[180px] w-max"}
        />
      </div>
    </nav>
  );
};

export default Navbar;
