import { HiX } from "react-icons/hi";
import { NavLink } from "react-router-dom";
import routes from "routes.js";

const Sidebar = ({ open, onClose }) => {
  const isSuperAdmin = localStorage.getItem("is_super_admin") === "true";

  const role = isSuperAdmin ? "super_admin" : "admin";
  const basePath = isSuperAdmin ? "/admin" : "/employee";

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar overlay"
        onClick={onClose}
        className={`bg-slate-900/35 fixed inset-0 z-40 backdrop-blur-[2px] transition-opacity duration-200 xl:hidden ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />
      <div
        className={`border-slate-200 shadow-slate-900/10 fixed left-0 top-0 z-50 flex h-screen w-64 flex-col rounded-r-2xl border-r bg-white pb-10 shadow-2xl transition-all duration-200 dark:border-white/10 dark:bg-gradient-to-br dark:from-[#151e3a] dark:to-[#1a223f] dark:text-white
          ${open ? "translate-x-0" : "-translate-x-full"}
          xl:translate-x-0`}
      >
        <span
          className="absolute right-4 top-4 cursor-pointer xl:hidden"
          onClick={onClose}
        >
          <HiX className="text-gray-500 dark:text-gray-300" />
        </span>

        <div className="border-black/20 flex flex-col items-center gap-3 border-b px-6 pb-6 pt-8">
          <button
            type="button"
            onClick={() => {
              window.location.href = `${basePath}/dashboard`;
              if (onClose) onClose();
            }}
            className="focus:outline-none"
          >
            <img
              src="https://www.sportstech.de/cdn/shop/files/logo__4_59d2ab76-f9f0-4f4f-804d-618913cd4325.svg?v=1775131600&width=212"
              alt="Logo"
              className="mx-auto w-48 dark:hidden"
            />
            <img
              src="/Frame4.png"
              alt="SportsTech Logo Dark"
              className="mx-auto hidden w-48 dark:block"
            />
          </button>
        </div>

        <ul className="mt-6 flex flex-col gap-2 px-2">
          {routes
            .filter(
              (route) =>
                route.layout === "/admin" &&
                (!route.roles || route.roles.includes(role))
            )
            .map((route, index) => (
              <li key={index}>
                <NavLink
                  to={`${basePath}/${route.path}`}
                  onClick={() => {
                    // When navigating from sidebar to Leave Requests, show all leaves by default
                    if (route.path === "leave-requests") {
                      localStorage.setItem("leave_status_filter", "all");
                      localStorage.removeItem("leave_date_filter");
                    }
                    if (onClose) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-5 py-3 text-base font-medium transition-all duration-150
                    ${
                      isActive
                        ? "bg-blue-100/80 text-blue-700 shadow-sm dark:bg-blue-400/20 dark:text-blue-200"
                        : "text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 dark:text-gray-200 dark:hover:bg-blue-400/10 dark:hover:text-blue-200"
                    }`
                  }
                >
                  <span className="text-xl text-blue-500 transition-colors duration-150 dark:text-blue-400">
                    {route.icon}
                  </span>
                  <span className="tracking-normal">{route.name}</span>
                </NavLink>
              </li>
            ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
