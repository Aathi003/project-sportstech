import {
  apiPost,
  apiGet,
  apiUpdate,
  apiDelete,
  apiPostFormData,
  apiPutFormData,
} from "./apiHelper";

/**
 * Asset Management API endpoints
 */
const assetAPI = {
  /**
   * Get all assets
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getAllAssets: (onSuccess, onError) =>
    apiGet("/asset/get-all/", onSuccess, onError),

  /**
   * Get asset by ID
   * @param {number} assetId - Asset ID
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getAssetById: (assetId, onSuccess, onError) =>
    apiGet(`/asset/${assetId}/`, onSuccess, onError),

  /**
   * Create new asset
   * @param {object} assetData - Asset data
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  createAsset: (assetData, onSuccess, onError) =>
    apiPostFormData("/asset/Asset-post/", assetData, onSuccess, onError),

  /**
   * Update asset
   * @param {number} assetId - Asset ID
   * @param {object} assetData - Updated asset data
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  updateAsset: (assetId, assetData, onSuccess, onError) =>
    apiPutFormData(`/asset/update/${assetId}/`, assetData, onSuccess, onError),

  /**
   * Delete asset
   * @param {number} assetId - Asset ID
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  deleteAsset: (assetId, onSuccess, onError) =>
    apiDelete(`/asset/delete/${assetId}/`, onSuccess, onError),

  /**
   * Delete asset picture by asset ID
   * @param {number} assetId - Asset ID
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  deleteAssetPicture: (assetId, onSuccess, onError) =>
    apiDelete(`/asset/delete-picture/${assetId}/`, onSuccess, onError),

  /**
   * Get asset categories
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getCategories: (onSuccess, onError) =>
    apiGet("/asset/categories/", onSuccess, onError),

  /**
   * Get asset types
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getAssetTypes: (onSuccess, onError) =>
    apiGet("/asset/get-types/", onSuccess, onError),

  /**
   * Get asset brands
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getBrands: (onSuccess, onError) =>
    apiGet("/asset/get-brands/", onSuccess, onError),

  /**
   * Get asset models
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getModels: (onSuccess, onError) =>
    apiGet("/asset/get-models/", onSuccess, onError),

  /**
   * Get asset variants
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  getVariants: (onSuccess, onError) =>
    apiGet("/asset/get-variants/", onSuccess, onError),

  /**
   * Assign asset to employee
   * @param {number} assetId - Asset ID
   * @param {object} assignmentData - { employee_id, date_assigned }
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  assignAsset: (assetId, assignmentData, onSuccess, onError) =>
    apiUpdate(`/asset/${assetId}/assign/`, assignmentData, onSuccess, onError),

  /**
   * Transfer asset between employees
   * @param {number} assetId - Asset ID
   * @param {object} transferData - { from_employee_id, to_employee_id, date_transferred }
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   */
  transferAsset: (assetId, transferData, onSuccess, onError) =>
    apiUpdate(`/asset/${assetId}/transfer/`, transferData, onSuccess, onError),
};

export default assetAPI;
