import {
  apiPost,
  apiGet,
  apiUpdate,
  apiDelete,
  apiPutFormData,
  apiPatch,
} from 



"./apiHelper";

/**
 * Leave Management API endpoints
 */
export const leaveAPI = {
  /**
   * Apply for leave/permission
   * @param {object} leaveData - Leave application data
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  applyLeave: (leaveData, onSuccess, onError) =>
    apiPost(
      "leave/leave-post/",
      leaveData,
      (response) => {
        localStorage.setItem("isCompleted", "true");
        if (onSuccess) onSuccess(response);
      },
      onError
    ),

  updateLeave: (leaveId, actionData, onSuccess, onError) =>
    apiPutFormData(
      `/leave/update-status/${leaveId}/`,
      actionData,
      onSuccess,
      onError
    ),

  /**
   * Get all leave requests
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getAllLeaves: (onSuccess, onError) => {
    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name");

    return apiGet(`/leave/get-all/?user_id=${userId}`, onSuccess, onError);
    // return apiGet(`/leave/get-all/?user_name=${userName}`, onSuccess, onError);
  },

  /**
   * Update leave request status (approve/reject)
   * @param {number} leaveId - Leave request ID
   * @param {object} actionData - { status: 'approved' or 'rejected', remarks: '' }
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  updateLeaveStatus: (leaveId, actionData, onSuccess, onError) =>
    apiUpdate(
      `/leave/update-status/${leaveId}/`,
      actionData,
      onSuccess,
      onError
    ),

  /**
   * Get leave types
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getLeaveTypes: (onSuccess, onError) =>
    apiGet("/leave/get-leave-types/", onSuccess, onError),

  /**
   * Get request types (for permission requests)
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getRequestTypes: (onSuccess, onError) =>
    apiGet("/leave/request-type/", onSuccess, onError),

  /**
   * Update request type status
   * @param {number} requestTypeId - Request type ID
   * @param {object} actionData - Action data
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  updateRequestTypeStatus: (requestTypeId, actionData, onSuccess, onError) =>
    apiUpdate(
      `/leave/request-type/action/${requestTypeId}/`,
      actionData,
      onSuccess,
      onError
    ),

  /**
   * Delete leave request from database
   * @param {number} leaveId - Leave request ID
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  deleteLeave: (leaveId, onSuccess, onError) =>
    apiDelete(`/leave/delete-leave/${leaveId}/`, onSuccess, onError),

  /**
   * Update leave request using 'update-leave/<int:pk>/' endpoint
   * @param {number} leaveId - Leave request ID
   * @param {object} data - Data to update
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  updateLeaveAction: (leaveId, formData, onSuccess, onError) =>
    apiPutFormData(
      `/leave/update-leave/${leaveId}/`,
      formData,
      onSuccess,
      onError
    ),
};

export default leaveAPI;
