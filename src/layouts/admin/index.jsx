import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Navbar from "components/navbar";
import Sidebar from "components/sidebar";
import Footer from "components/footer/Footer";
import routes from "routes.js";
import { useAuth } from "contexts/AuthContext";

export default function Admin(props) {
  const { ...rest } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const basePath = isSuperAdmin ? "/admin" : "/employee";
  // Sidebar closed by default on mobile, open on desktop
  const [open, setOpen] = React.useState(window.innerWidth >= 1200);
  const [currentRoute, setCurrentRoute] = React.useState("Dashboard");

  React.useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth >= 1200);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  React.useEffect(() => {
    setCurrentRoute(getActiveRoute(routes));
  }, [location.pathname, basePath]);

  // Restrict navigation to only allowed routes
  React.useEffect(() => {
    const pathname = location.pathname.toLowerCase();
    const isOnEmployeeRoot = pathname.startsWith("/employee");
    const isOnAdminRoot = pathname.startsWith("/admin");

    if (isSuperAdmin && isOnEmployeeRoot) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (!isSuperAdmin && isOnAdminRoot) {
      navigate("/employee/dashboard", { replace: true });
      return;
    }

    const role = isSuperAdmin ? "super_admin" : "admin";
    const allowedPaths = routes
      .filter((route) => !route.roles || route.roles.includes(role))
      .map((route) => `${basePath}/${route.path.toLowerCase()}`);

    if (
      pathname !== basePath &&
      pathname !== `${basePath}/` &&
      !allowedPaths.includes(pathname)
    ) {
      navigate(`${basePath}/dashboard`, { replace: true });
    }
  }, [location.pathname, isSuperAdmin, basePath, navigate]);

  const getActiveRoute = (routes) => {
    const pathname = location.pathname.toLowerCase();
    for (let i = 0; i < routes.length; i++) {
      const routePath = `${basePath}/${routes[i].path}`.toLowerCase();
      if (pathname === routePath || pathname.startsWith(`${routePath}/`)) {
        return routes[i].name;
      }
    }
    return "Dashboard";
  };
  const getActiveNavbar = (routes) => {
    const pathname = location.pathname.toLowerCase();
    for (let i = 0; i < routes.length; i++) {
      const routePath = `${basePath}/${routes[i].path}`.toLowerCase();
      if (pathname === routePath || pathname.startsWith(`${routePath}/`)) {
        return routes[i].secondary;
      }
    }
    return false;
  };
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route path={`/${prop.path}`} element={prop.component} key={key} />
        );
      } else {
        return null;
      }
    });
  };

  document.documentElement.dir = "ltr";
  return (
    <div className="flex h-full w-full">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {/* Navbar & Main Content */}
      <div className="h-full w-full bg-lightPrimary dark:!bg-navy-900">
        {/* Main Content */}
        <main
          className={`mx-[12px] h-full flex-none transition-all md:pr-2 xl:ml-[313px]`}
        >
          {/* Routes */}
          <div className="h-full">
            <Navbar
              onOpenSidenav={() => setOpen(true)}
              onCloseSidenav={() => setOpen(false)}
              sidebarOpen={open}
              logoText={"Horizon UI Tailwind React"}
              brandText={currentRoute}
              secondary={getActiveNavbar(routes)}
              {...rest}
            />
            <div className="pt-5s mx-auto mb-auto h-full min-h-[84vh] p-2 md:pr-2">
              <Routes>
                {getRoutes(routes)}

                <Route path="/" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </div>
            <div className="p-3">
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
