import { useEffect, useState } from "react";
import Card from "components/card";
import BarChart from "components/charts/BarChart";
import {
  barChartDataWeeklyRevenue,
  barChartOptionsWeeklyRevenue,
} from "variables/charts";
import { MdBarChart } from "react-icons/md";
import dashboardAPI from "services/dashboard";

const WeeklyRevenue = () => {
  const [chartData, setChartData] = useState(barChartDataWeeklyRevenue);
  const [chartOptions, setChartOptions] = useState(
    barChartOptionsWeeklyRevenue
  );
  const [loading, setLoading] = useState(true);

  const isSuperAdmin =
    localStorage.getItem("is_super_admin") === "true" ||
    localStorage.getItem("is_super_admin") === true;
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    loadWeeklyRevenueData();
    // eslint-disable-next-line
  }, []);

  const loadWeeklyRevenueData = () => {
    setLoading(true);
    dashboardAPI.getWeeklyRevenueChart(
      (res) => {
        let payload = res?.data?.weekly_trend || [];

        if (!Array.isArray(payload) || payload.length === 0) {
          setLoading(false);
          return;
        }

        if (!isSuperAdmin && userId) {
          payload = payload.map((item) => {
            let approved_leave_details = Array.isArray(
              item.approved_leave_details
            )
              ? item.approved_leave_details.filter(
                  (emp) => String(emp.id) === String(userId)
                )
              : [];
            let approved_permission_details = Array.isArray(
              item.approved_permission_details
            )
              ? item.approved_permission_details.filter(
                  (emp) => String(emp.id) === String(userId)
                )
              : [];
            return {
              ...item,
              Leave_Approved: approved_leave_details.length,
              Permission_Approved: approved_permission_details.length,
              approved_leave_details,
              approved_permission_details,
            };
          });
        }

        const categories = payload.map((item) => item.day || "");

        const leaveApprovedData = payload.map(
          (item) => item.Leave_Approved || 0
        );

        const permissionApprovedData = payload.map(
          (item) => item.Permission_Approved || 0
        );

        const approvedLeaveDetailsInfo = payload.map((item) => {
          if (
            Array.isArray(item.approved_leave_details) &&
            item.approved_leave_details.length > 0
          ) {
            return item.approved_leave_details
              .map(
                (emp) =>
                  `${emp.name} <span style="color:#ff4444">(${emp.dept})</span>`
              )
              .join("<br/>");
          } else {
            return isSuperAdmin
              ? "No employees on leave"
              : "No leave for you this day";
          }
        });

        const approvedPermissionDetailsInfo = payload.map((item) => {
          if (
            Array.isArray(item.approved_permission_details) &&
            item.approved_permission_details.length > 0
          ) {
            return item.approved_permission_details
              .map(
                (emp) =>
                  `${emp.name} <span style="color:#0088ff">(${emp.dept})</span>`
              )
              .join("<br/>");
          } else {
            return isSuperAdmin
              ? "No employees on permission"
              : "No permission for you this day";
          }
        });

        const newChartData = [
          {
            name: "Leave Approved",
            data: leaveApprovedData,
            color: "#FF5B5B",
          },
          {
            name: "Permission Approved",
            data: permissionApprovedData,
            color: "#0088FF",
          },
        ];

        setChartData(newChartData);

        setChartOptions((prev) => ({
          ...prev,
          xaxis: {
            ...prev.xaxis,
            categories: categories,
          },
          plotOptions: {
            ...prev.plotOptions,
            bar: {
              ...prev.plotOptions?.bar,
              columnWidth: "20%",
              borderRadius: 5,
            },
          },
          tooltip: {
            ...prev.tooltip,
            shared: false,
            intersect: true,
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
              const paddingStyle = "padding: 10px 16px;";
              const day = w.globals.labels[dataPointIndex];

              if (seriesIndex === 0) {
                return (
                  '<div class="apexcharts-tooltip-title" style="' +
                  paddingStyle +
                  'font-weight: bold; background: black; color: #ffffff; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">' +
                  day +
                  "</div>" +
                  '<div class="apexcharts-tooltip-text" style="text-align:left;' +
                  paddingStyle +
                  '">' +
                  '<div style="margin-bottom: 8px;"><b style="color: #ffffff;">Leave Approved:</b> ' +
                  leaveApprovedData[dataPointIndex] +
                  "</div>" +
                  '<div style="font-size: 12px; line-height: 1.5;">' +
                  approvedLeaveDetailsInfo[dataPointIndex] +
                  "</div>" +
                  "</div>"
                );
              } else if (seriesIndex === 1) {
                return (
                  '<div class="apexcharts-tooltip-title" style="' +
                  paddingStyle +
                  'font-weight: bold; background: black; color: #ffffff; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">' +
                  day +
                  "</div>" +
                  '<div class="apexcharts-tooltip-text" style="text-align:left;' +
                  paddingStyle +
                  '">' +
                  '<div style="margin-bottom: 8px;"><b style="color: #ffffff;">Permission Approved:</b> ' +
                  permissionApprovedData[dataPointIndex] +
                  "</div>" +
                  '<div style="font-size: 12px; line-height: 1.5;">' +
                  approvedPermissionDetailsInfo[dataPointIndex] +
                  "</div>" +
                  "</div>"
                );
              } else if (seriesIndex === 2) {
                return (
                  '<div class="apexcharts-tooltip-title" style="' +
                  paddingStyle +
                  'font-weight: bold; background: #1f2937; color: #ffffff; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">' +
                  day +
                  "</div>" +
                  '<div class="apexcharts-tooltip-text" style="text-align:left;' +
                  paddingStyle +
                  '">' +
                  '<div style="margin-bottom: 12px; font-size: 12px; line-height: 1.5;">' +
                  approvedLeaveDetailsInfo[dataPointIndex] +
                  "</div>" +
                  '<div style="font-size: 12px; line-height: 1.5;">' +
                  approvedPermissionDetailsInfo[dataPointIndex] +
                  "</div>" +
                  "</div>"
                );
              }

              return false;
            },
          },
        }));

        setLoading(false);
      },
      (error) => {
        console.error("Failed to load weekly revenue data:", error);
        setLoading(false);
      }
    );
  };

  return (
    <Card extra="flex flex-col bg-white w-full rounded-3xl py-6 px-2 text-center">
      <div className="mb-auto flex items-center justify-between px-6">
        <h2 className="text-sm md:text-lg lg:text-xl font-bold text-navy-700 dark:text-white">
          Weekly Employees Leaves & Permissions
        </h2>
      </div>

      <div className="md:mt-16 lg:mt-0">
        {/* FIXED: removed flex items-center so chart fills full width */}
        <div className="h-[250px] w-full xl:h-[350px]">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500"></div>
            </div>
          ) : (
            (() => {
              const hasLeave =
                Array.isArray(chartData) &&
                chartData[0]?.data?.some((val) => val > 0);
              const hasPermission =
                Array.isArray(chartData) &&
                chartData[1]?.data?.some((val) => val > 0);
              if (hasLeave || hasPermission) {
                return (
                  <BarChart chartData={chartData} chartOptions={chartOptions} />
                );
              } else {
                return (
                  <div className="flex h-full w-full flex-col items-center justify-center">
                    {/* <span className="mb-2 text-3xl text-gray-300">😴</span> */}
                    <p className="text-sm text-gray-500">
                      No leave or permission records for this week. Enjoy your
                      work!
                    </p>
                  </div>
                );
              }
            })()
          )}
        </div>
      </div>
    </Card>
  );
};

export default WeeklyRevenue;