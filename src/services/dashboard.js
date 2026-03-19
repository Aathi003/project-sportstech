import {
  apiGet,
  apiPost,
  apiDelete,
  apiPostFormData,
  apiPutFormData,
  apiUpdate,
} from "./apiHelper";

const dashboardAPI = {
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
  getLatePunchIn: (onSuccess, onError) => {
    return apiGet("dashboard/dash-late-punch-in/", onSuccess, onError);
  },

  // Fetch available leave balance
  getAvailableLeaveBalance: (onSuccess, onError) => {
    return apiGet("dashboard/dash-leave-balance/", onSuccess, onError);
  },
};

export default dashboardAPI;
