import { apiGet, apiPost, apiPostFormData, apiUpdate } from "./apiHelper";
import { apiPutFormData } from "./apiHelper";
// import { apiGet,apiPut} from "./apiHelper";

const configAPI = {
  // Get admin configuration
  getConfig: (onSuccess, onError) => {
    return apiGet("/admin-config/get-config/", onSuccess, onError);
  },

  getOfficeTimingDetails: (onSuccess, onError) => {
    return apiGet(
      "/admin-config/get-office-timing-details/",
      onSuccess,
      onError
    );
  },

  // Save/update admin configuration
  saveConfig: (data, onSuccess, onError) => {
    return apiPost("/admin-config/config/", data, onSuccess, onError);
  },

  syncPermissionHours: (onSuccess, onError) => {
    return apiGet("/admin-config/sync-permission-hours/", onSuccess, onError);
  },

  // Update admin configuration
  updateConfig: (id, data, onSuccess, onError) => {
    return apiUpdate(`/admin-config/config/${id}/`, data, onSuccess, onError);
  },

  fetchAttenceeReport: (data, onSuccess, onError) => {
    return apiPost("/attendance/fetch-from-device/", data, onSuccess, onError);
  },

  savePayslipPdfContent: (data, onSuccess, onError) => {
    return apiPostFormData("/admin-config/config/", data, onSuccess, onError);
  },

  updatePayslipPdfContent: (id, data, onSuccess, onError) => {
    return apiPutFormData(
      `/admin-config/config/${id}/`,
      data,
      onSuccess,
      onError
    );
  },
  updateOfficeTimingDetails: (id, data, onSuccess, onError) => {
    return apiPutFormData(
      `/admin-config/update-office-timing/${id}/`,
      data,
      onSuccess,
      onError
    );
  },
};

export default configAPI;
