import { apiGet, apiPost, apiUpdate } from "./apiHelper";

const configAPI = {
  // Get admin configuration
  getConfig: (onSuccess, onError) => {
    return apiGet("/admin-config/get-config/", onSuccess, onError);
  },

  // Save/update admin configuration
  saveConfig: (data, onSuccess, onError) => {
    return apiPost("/admin-config/config/", data, onSuccess, onError);
  },

  // Update admin configuration
  updateConfig: (id, data, onSuccess, onError) => {
    return apiPost(
      `/admin-config/config/?id=${id}`, data, onSuccess, onError );
  },
};

export default configAPI;
