import { apiGet, apiPost } from "./apiHelper";

const payslipAPI = {
  // Get all employees for dropdown
  getAllEmployees: (onSuccess, onError) => {
    return apiGet("/employee/get-all-employee/", onSuccess, onError);
  },

  // Generate payslip
  generatePayslip: (data, onSuccess, onError) => {
    // Prevent API call if employee_id is missing or invalid
    if (
      !data ||
      data.employee_id === undefined ||
      data.employee_id === null ||
      data.employee_id === "" ||
      isNaN(Number(data.employee_id))
    ) {
      if (onError) onError({ message: "Employee ID not found", status: 400 });
      return;
    }
    return apiPost("/salary/generate/", data, onSuccess, onError);
  },

  // Get payslip by employee and month
  // getPayslip: (params, onSuccess, onError) => {
  //   const queryString = new URLSearchParams(params).toString();
  //   return apiGet(`/payslip/get/?${queryString}`, onSuccess, onError);
  // },
};

export default payslipAPI;
