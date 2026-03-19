import { apiGet } from "./apiHelper";
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

  // Get departments for filter dropdown
  getAllDepartments: (onSuccess, onError) => {
    return apiGet("/employee/get-departments/", onSuccess, onError);
  },
};

export default attendanceAPI;
