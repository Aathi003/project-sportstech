import { apiGet, apiPatch, apiPost } from "./apiHelper";

const wfhAPI = {
  // Toggle Work From Home for an employee
  // POST /admin/permission/
  // Body: { requester_id, employee_id, is_wfh_enabled }
  updateEmployeeWorkFromHome: (
    requesterId,
    employeeId,
    isWfhEnabled,
    onSuccess,
    onError
  ) => {
    return apiPatch(
      "/wfh/admin/permission/",
      {
        requester_id: requesterId,
        employee_id: employeeId,
        is_wfh_enabled: isWfhEnabled,
      },
      onSuccess,
      onError
    );
  },

  // Employee check-in from the dashboard
  // POST /check-in/
  // Body: { employee_id }
  checkIn: (employeeId, onSuccess, onError) => {
    return apiPost(
      "/wfh/check-in/",
      { employee_id: employeeId },
      onSuccess,
      onError
    );
  },

  // Employee check-out from the dashboard
  // POST /check-out/
  // Body: { employee_id }
  checkOut: (employeeId, onSuccess, onError) => {
    return apiPost(
      "/wfh/check-out/",
      { employee_id: employeeId },
      onSuccess,
      onError
    );
  },

  // GET /wfh/status/{employee_id}/
  getStatus: (onSuccess, onError) => {
    const userId =
      localStorage.getItem("employee_id") ||
      localStorage.getItem("user_id") ||
      localStorage.getItem("emp_id");
    return apiGet(`/wfh/status/?employee_id=${userId}`, onSuccess, onError);
  },
};

export default wfhAPI;
