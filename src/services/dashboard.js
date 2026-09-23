import {
  apiGet,
  apiPost,
  apiDelete,
  apiPostFormData,
  apiPutFormData,
  apiUpdate,
} from "./apiHelper";

const dashboardAPI = {
  // Fetch permission late data
  getPermissionLate: (onSuccess, onError) => {
    return apiGet("dashboard/dash-permissionLate/", onSuccess, onError);
  },
  // Fetch dashboard statistics
  getDashboardStats: (onSuccess, onError) => {
    return apiGet("dashboard/dash-today-status/", onSuccess, onError);
  },

  // Fetch weekly revenue/chart data
  getWeeklyRevenueChart: (onSuccess, onError) => {
    return apiGet("dashboard/dash-week-chart/", onSuccess, onError);
  },
  getDepartmentBarChartData: (onSuccess, onError) => {
    return apiGet("dashboard/dash-dep-emp/", onSuccess, onError);
  },
  getLatePunchIn: (params, onSuccess, onError) => {
    let endpoint = "dashboard/dash-late-punch-in/";
    const queryParams = [];
    if (params?.from_date) queryParams.push(`from_date=${params.from_date}`);
    if (params?.to_date) queryParams.push(`to_date=${params.to_date}`);
    if (params?.date) queryParams.push(`date=${params.date}`);

    const isSuperAdmin = localStorage.getItem("is_super_admin") === "true";
    if (!isSuperAdmin) {
      const empId = params?.emp_id || localStorage.getItem("user_id");
      if (empId) queryParams.push(`emp_id=${empId}`);
    }

    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join("&")}`;
    }
    return apiGet(endpoint, onSuccess, onError);
  },
  // Fetch available leave balance

  getAvailableLeaveBalance: (onSuccess, onError) => {
    const userId = localStorage.getItem("user_id");
    return apiGet(
      `dashboard/dash-leave-balance/?employee_id=${userId}`,
      onSuccess,
      onError
    );
  },

getMonthlyLeaveBalance: (onSuccess, onError) => {
    return apiGet("dashboard/dash-month-leave/", onSuccess, onError);
  },
};

export default dashboardAPI;
