import React, { useEffect, useState } from "react";
import Card from "components/card";
import BarChart from "components/charts/BarChart";
import {
  getDepartmentBarChartData,
  getDepartmentBarChartOptions,
} from "variables/charts";
import { MdBarChart } from "react-icons/md";
import departmentAPI from "services/departmentAPI";
import "./Checktable.css";
import dashboardAPI from "services/dashboard";

function CheckTable() {
  const [deptChartData, setDeptChartData] = useState([]);
  const [deptChartOptions, setDeptChartOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState(null);

  useEffect(() => {
    loadDepartmentData();
  }, []);

  const loadDepartmentData = () => {
    setLoading(true);

    departmentAPI.getDepartmentBarChartData(
      (response) => {
        setRawData(response?.data);

        if (
          response?.data &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          const chartData = getDepartmentBarChartData(response.data);
          const chartOptions = getDepartmentBarChartOptions(response.data);

          setDeptChartData(chartData);
          setDeptChartOptions(chartOptions);
        }
        setLoading(false);
      },
      (error) => {
        console.error("❌ ERROR CALLBACK:", error);
        setLoading(false);
      }
    );
  };

  return (
    <Card extra="flex flex-col bg-white w-full rounded-2xl sm:rounded-3xl py-4 sm:py-6 px-3 sm:px-4 md:px-6 text-center">
      <style>{`
        /* Custom CSS to add border radius to both ends of bars */
        .apexcharts-bar-area {
          border-radius: 8px !important;
        }
        
        .apexcharts-bar-series path {
          rx: 8;
          ry: 8;
        }
      `}</style>

      {/* Header - Fully Responsive */}
      <div className="mb-3 sm:mb-4 md:mb-auto flex items-center justify-between px-2 sm:px-4 md:px-6">
        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-navy-700 dark:text-white">
          Employees By Department
        </h2>
      </div>

      {/* Chart Container - Fully Responsive */}
      <div className="mt-2 sm:mt-4 md:mt-8 lg:mt-0">
        <div className="h-[300px] sm:h-[250px] md:h-[300px] w-full xl:h-[350px]">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-4 border-gray-300 border-t-brand-500"></div>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
                Loading...
              </p>
            </div>
          ) : !rawData || rawData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4">
              <p className="text-xs sm:text-sm md:text-base text-gray-400 text-center">
                No department data available
              </p>
            </div>
          ) : deptChartData.length === 0 ||
            Object.keys(deptChartOptions).length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4">
              <p className="text-xs sm:text-sm md:text-base text-red-500 text-center">
                Chart generation failed
              </p>
            </div>
          ) : (
            <BarChart
              chartData={deptChartData}
              chartOptions={deptChartOptions}
            />
          )}
        </div>
      </div>

      {/* Footer Stats - Fully Responsive */}
      {/* {rawData && rawData.length > 0 && !loading && (
        <div className="mt-3 sm:mt-4 flex items-center justify-start px-2 sm:px-4 md:px-6">
          <div className="flex items-center flex-wrap gap-1 sm:gap-2">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-orange-500 flex-shrink-0"></div>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600">
              No of Employees increased by{" "}
              <span className="font-bold text-green-500">+20%</span> from last
              Week
            </p>
          </div>
        </div>
      )} */}
    </Card>
  );
}

export default CheckTable;