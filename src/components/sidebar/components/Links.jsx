/* eslint-disable */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HiUserGroup } from "react-icons/hi";

export function SidebarLinks(props) {
  let location = useLocation();
  const { routes, onClose } = props;

  const activeRoute = (routeName) => {
    return location.pathname.includes(routeName);
  };

  // Only close sidebar on mobile (<1200px)
  const handleLinkClick = () => {
    if (onClose && window.innerWidth < 1200) onClose();
  };

  const createLinks = (routes) => {
    return routes.map((route, index) => {
      if (route.layout === "/admin" || route.layout === "/rtl") {
        return (
          <Link
            key={index}
            to={route.layout + "/" + route.path}
            onClick={handleLinkClick}
          >
            <div className="relative mb-3 flex hover:cursor-pointer">
              <li
                className="my-[3px] flex cursor-pointer items-center px-8"
                key={index}
              >
                <span
                  className={
                    activeRoute(route.path)
                      ? "font-bold text-brand-500 dark:text-white"
                      : "font-medium text-gray-600"
                  }
                >
                  {route.icon ? route.icon : <HiUserGroup />}{" "}
                </span>
                <p
                  className={
                    "leading-1 ml-4 flex " +
                    (activeRoute(route.path)
                      ? "font-bold text-navy-700 dark:text-white"
                      : "font-medium text-gray-600")
                  }
                >
                  {route.name}
                </p>
              </li>
              {activeRoute(route.path) ? (
                <div className="absolute right-0 top-px h-9 w-1 rounded-lg bg-blue-500 dark:bg-brand-400" />
              ) : null}
            </div>
          </Link>
        );
      }
    });
  };
  return createLinks(routes);
}

export default SidebarLinks;
