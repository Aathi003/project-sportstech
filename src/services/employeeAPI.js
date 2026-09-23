import {
  apiGet,
  apiPost,
  apiDelete,
  apiPostFormData,
  apiPutFormData,
  apiUpdate,
  apiPatch,
  apiPatchNoPayload,
} from "./apiHelper";

const employeeAPI = {
  getAllEmployees: (onSuccess, onError) => {
    return apiGet("/employee/get-all-employee/", onSuccess, onError);
  },

  getActiveEmployees: (onSuccess, onError) => {
    return apiGet("/employee/active-employees/", onSuccess, onError);
  },

  updateEmployeeProbationStatus: (id, statusData, onSuccess, onError) => {
    apiPatch(
      `/employee/probationary-status/?id=${id}`,
      statusData,
      onSuccess,
      onError
    );
  },

  getEmployeeById: (id, onSuccess, onError) => {
    return apiGet(`/employee/get-employee/${id}/`, onSuccess, onError);
  },

  postEmployee: (formData, onSuccess, onError) => {
    return apiPostFormData(
      "/employee/post-employee/",
      formData,
      onSuccess,
      onError
    );
  },

  getAllDepartments: (onSuccess, onError) => {
    return apiGet("/employee/get-departments/", onSuccess, onError);
  },

  getAllRoles: (onSuccess, onError) => {
    return apiGet("/employee/get-roles/", onSuccess, onError);
  },

  deleteProfilePicture: (id, onSuccess, onError) => {
    return apiDelete(`/employee/delete-profile/${id}/`, onSuccess, onError);
  },

  updateEmployee: (id, statusData, onSuccess, onError) => {
    return apiPutFormData(
      `/employee/update-employee/${id}/`,
      statusData,
      onSuccess,
      onError
    );
  },

  updateEmployeeStatus: (id, statusData, onSuccess, onError) => {
    return apiPatch(
      `/employee/employee-status/${id}/`,
      statusData,
      onSuccess,
      onError
    );
  },

  updateEmployeeAuthStatus: (
    userId,
    empId,
    isAuthorized,
    onSuccess,
    onError
  ) => {
    return apiPatchNoPayload(
      `/employee/update-emp-auth-status/?user_id=${encodeURIComponent(
        userId
      )}&emp_id=${encodeURIComponent(empId)}&is_authorized=${encodeURIComponent(
        isAuthorized
      )}`,
      onSuccess,
      onError
    );
  },
};

export default employeeAPI;
