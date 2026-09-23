import Footer from "components/footer/FooterAuthDefault";
// import authImg from "assets/img/auth/auth.png";
import authImg from "assets/img/auth/dsds.webp";
import { Link, Routes, Route, Navigate } from "react-router-dom";
import routes from "routes.js";
import FixedPlugin from "components/fixedPlugin/FixedPlugin";

export default function Auth() {
  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.layout === "/auth") {
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
    <div>
      <div className="relative float-right h-full min-h-screen w-full !bg-white dark:!bg-navy-900">
        <main className={`mx-auto min-h-screen`}>
          <div className="relative flex">
            <div className="mx-auto flex min-h-full w-full flex-col justify-start pt-12 md:max-w-[75%]  lg:max-w-[1013px] lg:px-8 lg:pt-0 xl:min-h-[100vh] xl:max-w-[1383px] xl:px-0 xl:pl-[70px]">
              <div className="mb-auto flex flex-col pl-5 pr-5 md:pl-12 md:pr-0 lg:max-w-[48%] lg:pl-0 xl:max-w-full">
                <div className="flex h-20 items-center justify-center lg:ml-20 lg:justify-start">
                  {/* Normal mode logo */}
                  <img
                    src="https://www.sportstech.de/cdn/shop/files/logo__4_59d2ab76-f9f0-4f4f-804d-618913cd4325.svg?v=1775131600&width=212"
                    alt="SportsTech Logo"
                    className="block h-20 w-56 dark:hidden"
                  />
                  {/* Dark mode logo (replace with your dark logo URL) */}
                  <img
                    src="/Frame4.png"
                    alt="SportsTech Logo Dark"
                    className="hidden h-12 w-60 dark:block"
                  />
                </div>
                <Routes>
                  {getRoutes(routes)}
                  <Route
                    path="/"
                    element={<Navigate to="/auth/sign-in" replace />}
                  />
                </Routes>
                <div className="absolute right-0 hidden h-full min-h-screen md:block lg:w-[49vw] 2xl:w-[44vw]">
                  <div
                    className="absolute flex h-full w-full items-end justify-center bg-cover bg-center lg:rounded-bl-[120px] xl:rounded-bl-[200px]"
                    style={{ backgroundImage: `url(${authImg})` }}
                  />
                </div>
              </div>
              <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
