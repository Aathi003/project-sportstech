import { useEffect, useState, useCallback } from "react";
import Card from "components/card";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "assets/css/MiniCalendar.css";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { leaveAPI } from "services/leaveAPI";

const Demo = () => {
  const [value, setValue] = useState(new Date());
  const [leaveDates, setLeaveDates] = useState([]);
  const [permissionDates, setPermissionDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaveData();
    // eslint-disable-next-line
  }, []);

  const loadLeaveData = () => {
    setLoading(true);
    leaveAPI.getAllLeaves(
      (res) => {
        const records = res?.data || res || [];
        const leaves = [];
        const permissions = [];

        if (Array.isArray(records)) {
          records.forEach((item) => {
            const status = (item.status || "").toLowerCase();
            if (status !== "approved") return;

            const type = (
              item.request_type ||
              item.leave_type ||
              ""
            ).toLowerCase();
            const startDate = item.start_date || item.from_date || item.date;
            const endDate = item.end_date || item.to_date || startDate;

            if (!startDate) return;

            // Collect all dates in the range
            const dates = getDatesInRange(startDate, endDate);

            if (type === "permission") {
              permissions.push(...dates);
            } else {
              leaves.push(...dates);
            }
          });
        }

        setLeaveDates(leaves);
        setPermissionDates(permissions);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load leave data:", error);
        setLoading(false);
      }
    );
  };

  const getDatesInRange = (start, end) => {
    const dates = [];
    const startD = new Date(start);
    const endD = end ? new Date(end) : startD;
    const current = new Date(startD);
    while (current <= endD) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const tileClassName = useCallback(
    ({ date, view }) => {
      if (view !== "month") return null;
      const dateStr = formatDate(date);
      const isLeave = leaveDates.includes(dateStr);
      const isPermission = permissionDates.includes(dateStr);
      if (isLeave && isPermission) return "tile-leave tile-permission";
      if (isLeave) return "tile-leave";
      if (isPermission) return "tile-permission";
      return "tile-normal";
    },
    [leaveDates, permissionDates]
  );

  return (
    <Card extra="flex flex-col bg-white w-full h-full rounded-3xl py-6 px-4 text-center dark:!bg-navy-800">
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Leave & Permission Calendar
        </h2>
      </div>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-4 px-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-green-400"></span>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            Present
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-red-400"></span>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            Leave
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-300"></span>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            Permission
          </span>
        </div>
      </div>

      <div className="demo-calendar-fullwidth w-full flex-1">
        {loading ? (
          <div className="flex h-[300px] w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500"></div>
          </div>
        ) : (
          <Calendar
            onChange={setValue}
            value={value}
            prevLabel={<MdChevronLeft className="ml-1 h-6 w-6" />}
            nextLabel={<MdChevronRight className="ml-1 h-6 w-6" />}
            view="month"
            tileClassName={tileClassName}
          />
        )}
      </div>
    </Card>
  );
};

export default Demo;
