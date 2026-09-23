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

  useEffect(() => {
    dashboardAPI.getWeeklyRevenueChart(
      (res) => {
        let payload = res;

        // Support multiple response shapes
        if (Array.isArray(res)) {
          payload = res;
        } else if (res?.results && Array.isArray(res.results)) {
          payload = res.results;
        } else if (res?.data && Array.isArray(res.data)) {
          payload = res.data;
        } else if (res?.items && Array.isArray(res.items)) {
          payload = res.items;
        }

        if (!Array.isArray(payload) || payload.length === 0) {
          return;
        }

        const labels = payload.map(
          (item) =>
            item.label || item.date || item.day || item.week || item.name || ""
        );

        const values = payload.map(
          (item) => item.value || item.total || item.amount || item.count || 0
        );

        setChartData([
          {
            name: "Revenue",
            data: values,
            color: "#4318FF",
          },
        ]);

        setChartOptions((prev) => ({
          ...prev,
          xaxis: {
            ...prev.xaxis,
            categories: labels,
          },
        }));
      },
      () => {
        // On error, keep default chart data/options
      }
    );
  }, []);

  return (
    <Card extra="flex flex-col bg-white w-full rounded-3xl py-6 px-2 text-center">
      <div className="mb-auto flex items-center justify-between px-6">
        <h2 className="text-lg font-bold text-navy-700 dark:text-white">
          Weekly Revenue
        </h2>
        {/* <button className="!linear z-[1] flex items-center justify-center rounded-lg bg-lightPrimary p-2 text-brand-500 !transition !duration-200 hover:bg-gray-100 active:bg-gray-200 dark:bg-navy-700 dark:text-white dark:hover:bg-white/20 dark:active:bg-white/10">
          <MdBarChart className="h-6 w-6" />
        </button> */}
      </div>

      <div className="md:mt-16 lg:mt-0">
        <div className="h-[250px] w-full xl:h-[350px]">
          <BarChart chartData={chartData} chartOptions={chartOptions} />
        </div>
      </div>
    </Card>
  );
};

export default WeeklyRevenue;
