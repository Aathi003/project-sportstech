import { apiGet, apiPost, apiUpdate } from "./apiHelper";
import departmentAPI from "./departmentAPI";
const attendanceAPI = {
  // Get attendance records - optionally filter by date and department
  getAttendanceRecords: (params, onSuccess, onError) => {
    let endpoint = "/attendance/report/";
    const queryParams = [];
    if (params?.from_date) queryParams.push(`from_date=${params.from_date}`);
    if (params?.to_date) queryParams.push(`to_date=${params.to_date}`);
    if (params?.date) queryParams.push(`date=${params.date}`);
    if (params?.department) queryParams.push(`department=${params.department}`);
    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join("&")}`;
    }
    return apiGet(endpoint, onSuccess, onError);
  },

  getLateComingReport: (params, onSuccess, onError) => {
    let endpoint = "/attendance/late-comes-report/";
    const queryParams = [];
    if (params?.from_date) queryParams.push(`from_date=${params.from_date}`);
    if (params?.to_date) queryParams.push(`to_date=${params.to_date}`);
    if (params?.date) queryParams.push(`date=${params.date}`);
    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join("&")}`;
    }
    return apiGet(endpoint, onSuccess, onError);
  },

  // getAttendanceRecordsByAdmin: (params, onSuccess, onError) => {
  //    if (
  //         !params ||
  //         params.employee_id === undefined ||
  //         params.employee_id === null ||
  //         params.employee_id === "" ||
  //         isNaN(Number(params.employee_id))
  //       ) {
  //         if (onError) onError({ message: "Employee ID not found", status: 400 });
  //         return;
  //       }
  //       return apiGet("/attendance/attendance-matrix/", params, onSuccess, onError);
  //     },

  getAttendanceRecordsByAdmin: (params, onSuccess, onError) => {
    let endpoint = "/attendance/attendance-matrix/";
    const queryParams = [];
    if (params?.month !== undefined)
      queryParams.push(`month=${params.month + 1}`);
    if (params?.year !== undefined) queryParams.push(`year=${params.year}`);
    if (queryParams.length > 0) endpoint += `?${queryParams.join("&")}`;
    return apiGet(endpoint, onSuccess, onError);
  },

  updateAttendanceStatus: (payload, onSuccess, onError) => {
    return apiPost(
      "/attendance/update-attendance/",
      payload,
      onSuccess,
      onError
    );
  },

  updateLatePunchReason: (payload, onSuccess, onError) => {
    return apiUpdate(
      "/attendance/update-late-coming-reason/",
      payload,
      onSuccess,
      onError
    );
  },

  // getAttendanceList: (params, onSuccess, onError) => {
  //   let endpoint = "/attendance/attendance-matrix/";
  //   const queryParams = [];
  //   if (params?.from_date) queryParams.push(`from_date=${params.from_date}`);

  // Get departments for filter dropdown
  getAllDepartments: (onSuccess, onError) => {
    return apiGet("/employee/get-departments/", onSuccess, onError);
  },
};

export default attendanceAPI;
