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
  // Initialize with default static data as fallback
  const [chartData, setChartData] = useState(barChartDataWeeklyRevenue);
  const [chartOptions, setChartOptions] = useState(barChartOptionsWeeklyRevenue);
  const [loading, setLoading] = useState(true);

  // Get super admin and user id from localStorage
  const isSuperAdmin = localStorage.getItem("is_super_admin") === "true" || localStorage.getItem("is_super_admin") === true;
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    loadWeeklyRevenueData();
    // eslint-disable-next-line
  }, []);

  const loadWeeklyRevenueData = () => {
    setLoading(true);
    // If super admin, show all employees' weekly leaves
    // If not, show only this user's weekly leaves
    dashboardAPI.getWeeklyRevenueChart(
      (res) => {
        let payload = res?.data?.weekly_trend || [];

        if (!Array.isArray(payload) || payload.length === 0) {
          setLoading(false);
          return;
        }

        // If not super admin, filter each day's details to only this user
        if (!isSuperAdmin && userId) {
          payload = payload.map((item) => {
            // Filter leave details
            let approved_leave_details = Array.isArray(item.approved_leave_details)
              ? item.approved_leave_details.filter((emp) => String(emp.id) === String(userId))
              : [];
            let approved_permission_details = Array.isArray(item.approved_permission_details)
              ? item.approved_permission_details.filter((emp) => String(emp.id) === String(userId))
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

        // Extract categories (days) and data from API response
        const categories = payload.map((item) => item.day || "");

        // Leave data
        const leaveApprovedData = payload.map((item) => item.Leave_Approved || 0);

        // Permission data
        const permissionApprovedData = payload.map((item) => item.Permission_Approved || 0);

        // Leave details info (employee names and departments)
        const approvedLeaveDetailsInfo = payload.map((item) => {
          if (Array.isArray(item.approved_leave_details) && item.approved_leave_details.length > 0) {
            return item.approved_leave_details
              .map((emp) => `${emp.name} <span style="color:#ff4444">(${emp.dept})</span>`)
              .join("<br/>");
          } else {
            return isSuperAdmin ? "No employees on leave" : "No leave for you this day";
          }
        });

        // Permission details info (employee names and departments)
        const approvedPermissionDetailsInfo = payload.map((item) => {
          if (Array.isArray(item.approved_permission_details) && item.approved_permission_details.length > 0) {
            return item.approved_permission_details
              .map((emp) => `${emp.name} <span style="color:#0088ff">(${emp.dept})</span>`)
              .join("<br/>");
          } else {
            return isSuperAdmin ? "No employees on permission" : "No permission for you this day";
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

        // Update categories in chart options AND format tooltip
        setChartOptions((prev) => ({
          ...prev,
          xaxis: {
            ...prev.xaxis,
            categories: categories,
          },
          tooltip: {
            ...prev.tooltip,
            shared: false,
            intersect: true,
            custom: function ({ series, seriesIndex, dataPointIndex, w }) {
              const paddingStyle = "padding: 10px 16px;";
              const day = w.globals.labels[dataPointIndex];

              if (seriesIndex === 0) {
                // Leave Approved - show count and employee names
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
                // Permission Approved - show count and employee names
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
                // Hidden series - show both leave and permission details
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

              return false; // Use default for others
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
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Weekly Employees Leaves & Permissions
        </h2>
        <button className="!linear z-[1] flex items-center justify-center rounded-lg bg-lightPrimary p-2 text-brand-500 !transition !duration-200 hover:bg-gray-100 active:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-white/20 dark:active:bg-white/10">
          <MdBarChart className="h-6 w-6" />
        </button>
      </div>

      <div className="md:mt-16 lg:mt-0">
        <div className="h-[250px] w-full xl:h-[350px]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500"></div>
            </div>
          ) : (
            <BarChart chartData={chartData} chartOptions={chartOptions} />
          )}
        </div>
      </div>
    </Card>
  );
};

export default WeeklyRevenue;