// Department-wise Employees Bar Chart (Horizontal)
export const getDepartmentBarChartData = (apiData) => {
  if (!apiData || !Array.isArray(apiData)) return [];


  // apiData should be an array of objects: [{ department: 'Human resource', employee_count: 0 }, ...]
  const employeeCounts = apiData.map((dep) => dep.employee_count || 0);
  return [
    {
      name: "Employees",
      data: employeeCounts,
      color: "#5E7AC4",
    },
  ];
};

export const getDepartmentBarChartOptions = (apiData) => {
  if (!apiData || !Array.isArray(apiData)) return {};

  const departments = apiData.map(
    (dep) => dep.department || "Unknown"
  );

  return {
    chart: {
      type: "bar",
      toolbar: { show: false },
    },

    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "40%",
        borderRadius: 10,
      },
    },

    dataLabels: {
      enabled: false,
    },

    fill: {
      type: "gradient",
      gradient: {
        type: "horizontal", // horizontal for department chart
        shadeIntensity: 1,
        opacityFrom: 1,
        opacityTo: 1,
        colorStops: [
          [
            {
              offset: 0,
              color: "#5E7AC4", // EXACT Daily Traffic blue
              opacity: 1,
            },
            {
              offset: 100,
              color: "rgba(67, 24, 255, 0.28)", // light blue / white feel
              opacity: 1,
            },
          ],
        ],
      },
    },

    xaxis: {
      categories: departments,
      labels: {
        style: {
          colors: "#A3AED0",
          fontSize: "12px",
          fontWeight: "400",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },

    yaxis: {
      labels: {
        style: {
          colors: "#A3AED0",
          fontSize: "13px",
          fontFamily: "DM Sans, Inter, sans-serif",
        },
      },
    },

    tooltip: {
      theme: "dark",
      y: {
        formatter: (val) => `${val} Employees`,
      },
    },

    grid: {
      show: false,
    },
  };
};


export const barChartDataDailyTraffic = [
  {
    name: "Daily Traffic",
    data: [20, 30, 40, 20, 45, 50, 30],
  },
];

export const barChartOptionsDailyTraffic = {
  chart: {
    toolbar: {
      show: false,
    },
  },
  tooltip: {
    style: {
      fontSize: "12px",
      fontFamily: undefined,
      backgroundColor: "#000000",
    },
    onDatasetHover: {
      style: {
        fontSize: "12px",
        fontFamily: undefined,
      },
    },
    theme: "dark",
  },
  xaxis: {
    categories: ["00", "04", "08", "12", "14", "16", "18"],
    show: false,
    labels: {
      show: true,
      style: {
        colors: "#A3AED0",
        fontSize: "14px",
        fontWeight: "500",
      },
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    show: false,
    color: "black",
    labels: {
      show: true,
      style: {
        colors: "#CBD5E0",
        fontSize: "14px",
      },
    },
  },
  grid: {
    show: false,
    strokeDashArray: 5,
    yaxis: {
      lines: {
        show: true,
      },
    },
    xaxis: {
      lines: {
        show: false,
      },
    },
  },
  fill: {
    type: "gradient",
    gradient: {
      type: "vertical",
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.9,
      colorStops: [
        [
          {
            offset: 0,
            color: "#4318FF",
            opacity: 1,
          },
          {
            offset: 100,
            color: "rgba(67, 24, 255, 1)",
            opacity: 0.28,
          },
        ],
      ],
    },
  },
  dataLabels: {
    enabled: false,
  },
  plotOptions: {
    bar: {
      borderRadius: 10,
      columnWidth: "40px",
    },
  },
};

export const pieChartOptions = {
  labels: ["Your files", "System", "Empty"],
  colors: ["#4318FF", "#6AD2FF", "#EFF4FB"],
  chart: {
    width: "50px",
  },
  states: {
    hover: {
      filter: {
        type: "none",
      },
    },
  },
  legend: {
    show: false,
  },
  dataLabels: {
    enabled: false,
  },
  hover: { mode: null },
  plotOptions: {
    donut: {
      expandOnClick: false,
      donut: {
        labels: {
          show: false,
        },
      },
    },
  },
  fill: {
    colors: ["#4318FF", "#6AD2FF", "#EFF4FB"],
  },
  tooltip: {
    enabled: true,
    theme: "dark",
    style: {
      fontSize: "12px",
      fontFamily: undefined,
      backgroundColor: "#000000",
    },
  },
};

export const pieChartData = [63, 25, 12];

export const barChartDataWeeklyRevenue = [
  {
    name: "PRODUCT A",
    data: [400, 370, 330, 390, 320, 350, 360],
    color: "#6AD2Fa",
  },
  {
    name: "PRODUCT B",
    data: [400, 370, 330, 390, 320, 350, 360],
    color: "#4318FF",
  },
  {
    name: "PRODUCT C",
    data: [400, 370, 330, 390, 320, 350, 360],
    color: "#EFF4FB",
  },
];

export const barChartOptionsWeeklyRevenue = {
  chart: {
    stacked: true,
    toolbar: {
      show: false,
    },
  },
  tooltip: {
    style: {
      fontSize: "12px",
      fontFamily: undefined,
      backgroundColor: "#000000",
    },
    theme: "dark",
    onDatasetHover: {
      style: {
        fontSize: "12px",
        fontFamily: undefined,
      },
    },
  },
  xaxis: {
    categories: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"],
    show: false,
    labels: {
      show: true,
      style: {
        colors: "#A3AED0",
        fontSize: "14px",
        fontWeight: "500",
      },
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    show: false,
    color: "black",
    labels: {
      show: false,
      style: {
        colors: "#A3AED0",
        fontSize: "14px",
        fontWeight: "500",
      },
    },
  },
  grid: {
    borderColor: "rgba(163, 174, 208, 0.3)",
    show: true,
    yaxis: {
      lines: {
        show: false,
        opacity: 0.5,
      },
    },
    row: {
      opacity: 0.5,
    },
    xaxis: {
      lines: {
        show: false,
      },
    },
  },
  fill: {
    type: "solid",
    colors: ["#5E37FF", "#6AD2FF", "#E1E9F8"],
  },
  legend: {
    show: false,
  },
  colors: ["#5E37FF", "#6AD2FF", "#E1E9F8"],
  dataLabels: {
    enabled: false,
  },
  plotOptions: {
    bar: {
      borderRadius: 10,
      columnWidth: "20%",
    },
  },
};

export const lineChartDataTotalSpent = [
  {
    name: "Revenue",
    data: [50, 64, 48, 66, 49, 68],
    color: "#4318FF",
  },
  {
    name: "Profit",
    data: [30, 40, 24, 46, 20, 46],
    color: "#6AD2FF",
  },
];

export const lineChartOptionsTotalSpent = {
  legend: {
    show: false,
  },
  theme: {
    mode: "light",
  },
  chart: {
    type: "line",
    toolbar: {
      show: false,
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: "smooth",
  },
  tooltip: {
    style: {
      fontSize: "12px",
      fontFamily: undefined,
      backgroundColor: "#000000",
    },
    theme: "dark",
    x: {
      format: "dd/MM/yy HH:mm",
    },
  },
  grid: {
    show: false,
  },
  xaxis: {
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      style: {
        colors: "#A3AED0",
        fontSize: "12px",
        fontWeight: "500",
      },
    },
    type: "text",
    range: undefined,
    categories: ["SEP", "OCT", "NOV", "DEC", "JAN", "FEB"],
  },
  yaxis: {
    show: false,
  },
};
