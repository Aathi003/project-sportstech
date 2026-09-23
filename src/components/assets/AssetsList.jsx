import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlus,
  FaUser,
  FaLaptop,
  FaDesktop,
  FaMobile,
  FaTabletAlt,
  FaKeyboard,
  FaMouse,
  FaHeadphones,
  FaPrint,
  FaServer,
  FaNetworkWired,
} from "react-icons/fa";
import Pagination from "components/common/Pagination";
import maleProfile from "assets/img/avatars/male_profile.png";
import femaleProfile from "assets/img/avatars/female_profile.png";
import Swal from "sweetalert2";
import assetAPI from "services/assetAPI";
import employeeAPI from "services/employeeAPI";
import { showSuccess, showError } from "utils/toastHelper";
import { MdEdit } from "react-icons/md";
import { GiSchoolBag } from "react-icons/gi";

const itemsPerPage = 10;

const getAssetIcon = (assetTypeName) => {
  if (!assetTypeName) return FaDesktop;
  const name = assetTypeName.toLowerCase();
  if (name.includes("laptop")) return FaLaptop;
  if (name.includes("desktop") || name.includes("computer")) return FaDesktop;
  if (name.includes("mobile") || name.includes("phone")) return FaMobile;
  if (name.includes("tablet")) return FaTabletAlt;
  if (name.includes("keyboard")) return FaKeyboard;
  if (name.includes("mouse")) return FaMouse;
  if (name.includes("headphone") || name.includes("headset"))
    return FaHeadphones;
  if (name.includes("printer")) return FaPrint;
  if (name.includes("server")) return FaServer;
  if (
    name.includes("network") ||
    name.includes("router") ||
    name.includes("switch")
  )
    return FaNetworkWired;
  if (name.includes("bag")) return GiSchoolBag;
  return FaDesktop;
};

export default function AssetsList() {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [assetTypes, setAssetTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [assetFormErrors, setAssetFormErrors] = useState({});
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [newAssetData, setNewAssetData] = useState({
    pictureFile: null,
    picturePreview: "",
    picture: "",
    asset_type: "",
    brand: "",
    model: "",
    variant: "",
    purchase_date: "",
    serial_number: "",
    floor_location: "",
    assigned_to: "",
    assigned_date: "",
  });

  useEffect(() => {
    loadAssets();
    loadCategories();
    loadAssetTypes();
    loadBrands();
    loadModels();
    loadVariants();
    loadEmployees();
  }, []);

  // Close employee dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".employee-dropdown-container")) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearchTerm) return true;
    const term = employeeSearchTerm.toLowerCase();
    const name = (
      emp.user_name || `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
    ).toLowerCase();
    return name.includes(term);
  });

  const loadAssets = () => {
    setLoading(true);
    assetAPI.getAllAssets(
      (data) => {
        let assetsArray = [];
        if (Array.isArray(data)) {
          assetsArray = data;
        } else if (data?.results && Array.isArray(data.results)) {
          assetsArray = data.results;
        } else if (data?.data && Array.isArray(data.data)) {
          assetsArray = data.data;
        } else if (data?.assets && Array.isArray(data.assets)) {
          assetsArray = data.assets;
        }
        setAssets(assetsArray);
        setLoading(false);
      },
      (error) => {
        showError(error?.message || "Failed to load assets");
        setAssets([]);
        setLoading(false);
      }
    );
  };

  const loadCategories = () => {
    assetAPI.getCategories(
      (data) => {
        const categoriesArray = Array.isArray(data)
          ? data
          : data?.results || data?.data || [];
        setCategories(categoriesArray);
      },
      (error) => {
        setCategories([]);
      }
    );
  };

  const loadAssetTypes = () => {
    if (assetAPI.getAssetTypes) {
      assetAPI.getAssetTypes(
        (data) => {
          const typesArray = Array.isArray(data)
            ? data
            : data?.results || data?.data || [];
          setAssetTypes(typesArray);
        },
        (error) => {
          setAssetTypes([]);
        }
      );
    }
  };

  const loadBrands = () => {
    if (assetAPI.getBrands) {
      assetAPI.getBrands(
        (data) => {
          const brandsArray = Array.isArray(data)
            ? data
            : data?.results || data?.data || [];
          setBrands(brandsArray);
        },
        (error) => {
          setBrands([]);
        }
      );
    }
  };

  const loadModels = () => {
    if (assetAPI.getModels) {
      assetAPI.getModels(
        (data) => {
          const modelsArray = Array.isArray(data)
            ? data
            : data?.results || data?.data || [];
          setModels(modelsArray);
        },
        (error) => {
          setModels([]);
        }
      );
    }
  };

  const loadVariants = () => {
    if (assetAPI.getVariants) {
      assetAPI.getVariants(
        (data) => {
          const variantsArray = Array.isArray(data)
            ? data
            : data?.results || data?.data || [];
          setVariants(variantsArray);
        },
        (error) => {
          setVariants([]);
        }
      );
    }
  };

  const loadEmployees = () => {
    employeeAPI.getActiveEmployees(
      (data) => {
        let employeesArray = [];
        if (Array.isArray(data)) {
          employeesArray = data;
        } else if (data?.results && Array.isArray(data.results)) {
          employeesArray = data.results;
        } else if (data?.data && Array.isArray(data.data)) {
          employeesArray = data.data;
        } else if (data?.employees && Array.isArray(data.employees)) {
          employeesArray = data.employees;
        }
        setEmployees(employeesArray);
      },
      (error) => {
        employeeAPI.getAllEmployees(
          (data) => {
            let employeesArray = [];
            if (Array.isArray(data)) {
              employeesArray = data;
            } else if (data?.results && Array.isArray(data.results)) {
              employeesArray = data.results;
            } else if (data?.data && Array.isArray(data.data)) {
              employeesArray = data.data;
            } else if (data?.employees && Array.isArray(data.employees)) {
              employeesArray = data.employees;
            }
            setEmployees(employeesArray);
          },
          (fallbackError) => {
            setEmployees([]);
          }
        );
      }
    );
  };

  // Filter assets based on search and category
  const filteredAssets = assets.filter((asset) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      asset?.asset_type_name?.toLowerCase().includes(term) ||
      asset?.brand_name?.toLowerCase().includes(term) ||
      asset?.model_name?.toLowerCase().includes(term) ||
      asset?.variant_name?.toLowerCase().includes(term) ||
      asset?.serial_number?.toLowerCase().includes(term) ||
      asset?.assigned_to_name?.toLowerCase().includes(term) ||
      (asset?.assigned_to
        ? String(asset.assigned_to).toLowerCase().includes(term)
        : false) ||
      asset?.floor_location?.toLowerCase().includes(term);

    const matchesCategory =
      filterCategory === "all" ||
      asset?.category?.toLowerCase() === filterCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAssets = filteredAssets.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleDeleteAsset = (assetId) => {
    Swal.fire({
      title: "Delete Asset?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    }).then((result) => {
      if (result.isConfirmed) {
        assetAPI.deleteAsset(
          assetId,
          () => {
            showSuccess("Asset deleted successfully");
            loadAssets();
          },
          (error) => {
            let errorMessage = "Failed to delete asset";
            if (error?.message) {
              errorMessage = error.message;
            } else if (error?.detail) {
              errorMessage = error.detail;
            } else if (error?.data?.message) {
              errorMessage = error.data.message;
            } else if (error?.data?.error) {
              errorMessage = error.data.error;
            } else if (typeof error === "string") {
              errorMessage = error;
            }
            showError(errorMessage);
          }
        );
      }
    });
  };

  const handleViewDetails = (asset) => {
    setSelectedAsset(asset);
    setShowDetailsModal(true);
  };

  const handleEditAsset = (asset) => {
    setIsEditingInModal(true);
    setSelectedAsset(asset);
    setAssetFormErrors({});
    setNewAssetData({
      pictureFile: null,
      picturePreview: asset.picture || "",
      picture: asset.picture || "",
      asset_type: asset.asset_type || "",
      brand: asset.brand || "",
      model: asset.model || "",
      variant: asset.variant || "",
      purchase_date: asset.purchase_date || "",
      serial_number: asset.serial_number || "",
      floor_location: asset.floor_location || "",
      assigned_to: asset.assigned_to || "",
      assigned_date: asset.assigned_date || "",
    });

    // Set employee search term for the dropdown
    if (asset.assigned_to) {
      const emp = employees.find(
        (e) => (e.id || e.employee_id) == asset.assigned_to
      );
      if (emp) {
        setEmployeeSearchTerm(
          emp.user_name ||
            `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
        );
      } else {
        setEmployeeSearchTerm("");
      }
    } else {
      setEmployeeSearchTerm("");
    }

    setShowAddModal(true);
  };

  const handleAddAsset = () => {
    setIsEditingInModal(false);
    setSelectedAsset(null);
    setAssetFormErrors({});
    setEmployeeSearchTerm("");
    setNewAssetData({
      pictureFile: null,
      picturePreview: "",
      picture: "",
      asset_type: "",
      brand: "",
      model: "",
      variant: "",
      purchase_date: "",
      serial_number: "",
      floor_location: "",
      assigned_to: "",
      assigned_date: "",
    });
    setShowAddModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setNewAssetData((prev) => ({
      ...prev,
      pictureFile: file,
      picturePreview: previewUrl,
    }));
  };

  const handleRemoveImage = () => {
    const clearLocal = () => {
      if (
        newAssetData.picturePreview &&
        newAssetData.picturePreview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(newAssetData.picturePreview);
      }
      setNewAssetData((prev) => ({
        ...prev,
        pictureFile: null,
        picturePreview: "",
        picture: "",
      }));
    };

    // If editing an existing asset that has a saved picture on the server, call the delete API
    if (isEditingInModal && selectedAsset && newAssetData.picture) {
      const assetId = selectedAsset.assetid || selectedAsset.id;
      assetAPI.deleteAssetPicture(
        assetId,
        () => {
          clearLocal();
          // showSuccess("Asset picture deleted successfully");
        },
        (err) => {
          showError(err?.message || "Failed to delete asset picture");
          clearLocal(); // Still clear local even if server fails
        }
      );
    } else {
      // For new assets or if no saved picture exists, just clear locally
      clearLocal();
    }
  };

  const handleSaveAsset = () => {
    const errors = {};
    if (!newAssetData.asset_type) errors.asset_type = "Asset type is required";
    if (!String(newAssetData.brand).trim()) errors.brand = "Brand is required";
    if (!newAssetData.purchase_date)
      errors.purchase_date = "Purchase date is required";
    if (!newAssetData.serial_number)
      errors.serial_number = "Serial number is required";
    setAssetFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      showError("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("asset_type", newAssetData.asset_type);
    formData.append("brand", newAssetData.brand);
    formData.append("model", newAssetData.model || "");
    formData.append("variant", newAssetData.variant || "");
    formData.append("purchase_date", newAssetData.purchase_date);
    formData.append("serial_number", newAssetData.serial_number || "");
    formData.append("floor_location", newAssetData.floor_location || "");

    if (newAssetData.assigned_to) {
      formData.append("assigned_to", newAssetData.assigned_to);
    }
    if (newAssetData.assigned_date) {
      formData.append("assigned_date", newAssetData.assigned_date);
    }
    if (newAssetData.pictureFile) {
      formData.append("picture", newAssetData.pictureFile);
    }

    setLoading(true);

    if (isEditingInModal && selectedAsset) {
      const assetId = selectedAsset.assetid || selectedAsset.id;
      assetAPI.updateAsset(
        assetId,
        formData,
        () => {
          setLoading(false);
          showSuccess("Asset updated successfully");
          setShowAddModal(false);
          setIsEditingInModal(false);
          loadAssets();
        },
        (error) => {
          setLoading(false);
          let errorMessage = "Failed to update asset";
          let serialNumberError = undefined;
          if (error?.response?.data?.serial_number) {
            serialNumberError =
              error.response.data.serial_number[0] ||
              "Serial number already exists";
            errorMessage = serialNumberError;
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          if (serialNumberError) {
            setAssetFormErrors((prev) => ({
              ...prev,
              serial_number: serialNumberError,
            }));
          }
          showError(errorMessage);
        }
      );
    } else {
      assetAPI.createAsset(
        formData,
        () => {
          setLoading(false);
          showSuccess("Asset added successfully");
          setShowAddModal(false);
          loadAssets();
        },
        (error) => {
          setLoading(false);
          let errorMessage = "Failed to add asset";
          let serialNumberError = undefined;
          if (error?.response?.data?.serial_number) {
            serialNumberError =
              error.response.data.serial_number[0] ||
              "Serial number already exists";
            errorMessage = serialNumberError;
          } else if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.response?.data?.detail) {
            errorMessage = error.response.data.detail;
          } else if (error?.message) {
            errorMessage = error.message;
          }
          if (serialNumberError) {
            setAssetFormErrors((prev) => ({
              ...prev,
              serial_number: serialNumberError,
            }));
          }
          showError(errorMessage);
        }
      );
    }
  };

  return (
    <div className="w-full">
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-4 shadow-lg dark:bg-navy-800 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white"
          />
        </div>
        <div className="mb-1 flex items-center justify-center">
          <button
            onClick={handleAddAsset}
            className="sm-text-[14px] flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 text-[12px] font-bold text-white transition hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 md:text-[16px] lg:text-[18px]"
          >
            <FaPlus size={18} />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Assets Table */}
      {loading ? (
        <div className="flex items-center justify-center rounded-xl bg-white p-8 shadow-lg dark:bg-navy-800">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500 dark:border-gray-600"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading assets...
            </p>
          </div>
        </div>
      ) : currentAssets.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-lg dark:bg-navy-800">
          <p className="text-gray-600 dark:text-gray-400">No assets found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-lg dark:bg-navy-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-navy-700">
                  <th className="px-3 py-3 text-left text-xs font-bold text-navy-700 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    S.No
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-navy-700 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    Category
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-navy-700 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    Details
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-navy-700 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    Serial Number
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-navy-700 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    Assign Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-navy-700 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    Location
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-navy-700 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentAssets.map((asset, index) => (
                  <tr
                    key={asset.id || index}
                    className="border-b border-gray-200 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-navy-700"
                  >
                    <td className="px-3 py-3 text-xs font-bold text-navy-700 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 sm:h-10 sm:w-10">
                          {asset?.picture &&
                          typeof asset.picture === "string" &&
                          (asset.picture.startsWith("http") ||
                            asset.picture.startsWith("/")) ? (
                            <img
                              src={
                                asset.picture.startsWith("http")
                                  ? asset.picture
                                  : `${window.location.origin}${asset.picture}`
                              }
                              alt={asset.asset_type_name || "Asset"}
                              className="h-8 w-8 rounded-lg object-cover sm:h-10 sm:w-10"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            React.createElement(
                              getAssetIcon(asset?.asset_type_name),
                              { size: 16, className: "sm:w-5 sm:h-5" }
                            )
                          )}
                        </div>
                        <span className="whitespace-nowrap font-medium">
                          {asset?.asset_type_name || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-900 sm:px-4 sm:py-4 sm:text-sm">
                      <div className="space-y-0.5">
                        <p className="dark:text-white">
                          <strong>Brand : </strong>
                          {asset.brand_name || "  -"}
                        </p>
                        <p className="dark:text-white">
                          <strong>Model : </strong>
                          {asset.model_name || "  -"}
                        </p>
                        <p className="dark:text-white">
                          <strong>Variant : </strong>
                          {asset.variant_name || "  -"}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700 dark:text-gray-300 sm:px-4 sm:py-4 sm:text-sm">
                      <span className="whitespace-nowrap">
                        {asset.serial_number || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-700 dark:text-gray-300 sm:px-4 sm:py-4 sm:text-sm">
                      {(() => {
                        if (!asset.assigned_to) {
                          return (
                            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 dark:bg-red-900 dark:text-red-200 sm:px-3 sm:py-1 sm:text-xs">
                              Not Assigned
                            </span>
                          );
                        }
                        const emp = employees.find(
                          (e) => (e.id || e.employee_id) == asset.assigned_to
                        );
                        if (!emp || emp.is_active === false) {
                          return (
                            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800 dark:bg-red-900 dark:text-red-200 sm:px-3 sm:py-1 sm:text-xs">
                              Not Assigned
                            </span>
                          );
                        }
                        let profileImg = maleProfile;
                        if (
                          emp.gender &&
                          emp.gender.toLowerCase() === "female"
                        ) {
                          profileImg = femaleProfile;
                        }
                        const empName = emp.user_name;
                        return (
                          <span className="flex items-center gap-1.5 whitespace-nowrap sm:gap-2">
                            <img
                              src={profileImg}
                              alt={emp.gender === "female" ? "Female" : "Male"}
                              className="inline-block h-5 w-5 flex-shrink-0 rounded-full border border-gray-300 object-cover dark:border-gray-600 sm:h-6 sm:w-6"
                              style={{ background: "#fff" }}
                            />
                            <span className="truncate">{empName}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-700 dark:text-gray-300 sm:px-4 sm:py-4 sm:text-sm">
                      <span className="whitespace-nowrap">
                        {asset.floor_location || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center sm:px-4 sm:py-4">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEditAsset(asset)}
                          className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900 sm:p-2"
                          title="Edit"
                        >
                          <MdEdit size={18} className="sm:h-5 sm:w-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteAsset(asset.assetid || asset.id)
                          }
                          className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900 sm:p-2"
                          title="Delete"
                        >
                          <FaTrash size={14} className="sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={filteredAssets.length}
            onPageChange={setCurrentPage}
            className="mt-8 pb-4"
          />
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAsset && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-navy-800">
            {/* Modal Header */}
            <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-navy-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-navy-700 dark:text-white">
                  {selectedAsset.asset_type_name}
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Asset Name
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedAsset.asset_type_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Brand
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedAsset.brand_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Model
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedAsset.model_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Variant
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedAsset.variant_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Purchase Date
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedAsset.purchase_date || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Serial Number
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedAsset.serial_number || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Floor Location
                  </label>
                  <p className="mt-1 font-mono text-gray-900 dark:text-white">
                    {selectedAsset.floor_location || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assigned to Employee
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedAsset.assigned_to
                      ? (() => {
                          const emp = employees.find(
                            (e) =>
                              (e.id || e.employee_id) ==
                              selectedAsset.assigned_to
                          );
                          if (!emp) return "Not Found";
                          let profileImg = maleProfile;
                          if (
                            emp.gender &&
                            emp.gender.toLowerCase() === "female"
                          ) {
                            profileImg = femaleProfile;
                          }
                          const empName =
                            emp.user_name ||
                            (emp.first_name && emp.last_name
                              ? `${emp.first_name} ${emp.last_name}`
                              : emp.first_name || "Unknown");
                          return (
                            <span className="flex items-center gap-2">
                              <img
                                src={profileImg}
                                alt={
                                  emp.gender === "female" ? "Female" : "Male"
                                }
                                className="inline-block h-6 w-6 rounded-full border border-gray-300 object-cover dark:border-gray-600"
                                style={{ background: "#fff" }}
                              />
                              {empName}
                            </span>
                          );
                        })()
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assigned Date
                  </label>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedAsset.assigned_date || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-navy-700">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full rounded-lg bg-gray-300 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-400 dark:bg-navy-600 dark:text-white dark:hover:bg-navy-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Asset Modal */}
      {showAddModal && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-navy-800">
            {/* Modal Header */}
            <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-navy-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-navy-700 dark:text-white">
                  {isEditingInModal ? "Edit Asset" : "Add New Asset"}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditingInModal(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Asset Image Upload */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Asset Image
                </label>
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 text-center dark:border-gray-600">
                  {newAssetData.picturePreview ? (
                    <div className="relative">
                      <img
                        src={newAssetData.picturePreview}
                        alt="Asset preview"
                        className="mx-auto max-h-40 rounded-lg"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="asset-image-input"
                      />
                      <label
                        htmlFor="asset-image-input"
                        className="cursor-pointer text-gray-600 dark:text-gray-400"
                      >
                        <p className="text-sm">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 10MB
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Asset Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Asset Type <span className="font-bold text-red-600">*</span>
                  </label>
                  <select
                    value={newAssetData.asset_type}
                    onChange={(e) => {
                      setNewAssetData({
                        ...newAssetData,
                        asset_type: e.target.value,
                      });
                      setAssetFormErrors((prev) => ({
                        ...prev,
                        asset_type: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border ${
                      assetFormErrors.asset_type
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-white px-4 py-2 text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white`}
                  >
                    <option value="">-- Select Type --</option>
                    {assetTypes.map((type) => (
                      <option key={type.asset_typeid} value={type.asset_typeid}>
                        {type.asset_type_name}
                      </option>
                    ))}
                  </select>
                  {assetFormErrors.asset_type && (
                    <p className="mt-1 text-xs text-red-600">
                      {assetFormErrors.asset_type}
                    </p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Brand <span className="font-bold text-red-600">*</span>
                  </label>
                  <select
                    value={newAssetData.brand}
                    onChange={(e) => {
                      setNewAssetData({
                        ...newAssetData,
                        brand: e.target.value,
                        model: "",
                      });
                      setAssetFormErrors((prev) => ({
                        ...prev,
                        brand: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border ${
                      assetFormErrors.brand
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-white px-4 py-2 text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white`}
                  >
                    <option value="">-- Select Brand --</option>
                    {brands.map((brand) => (
                      <option key={brand.brandid} value={brand.brandid}>
                        {brand.brand_name}
                      </option>
                    ))}
                  </select>
                  {assetFormErrors.brand && (
                    <p className="mt-1 text-xs text-red-600">
                      {assetFormErrors.brand}
                    </p>
                  )}
                </div>

                {/* Model */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Model
                  </label>
                  <select
                    value={newAssetData.model}
                    onChange={(e) => {
                      setNewAssetData({
                        ...newAssetData,
                        model: e.target.value,
                      });
                      setAssetFormErrors((prev) => ({
                        ...prev,
                        model: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border ${
                      assetFormErrors.model
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-white px-4 py-2 text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white`}
                  >
                    <option value="">-- Select Model --</option>
                    {models
                      .filter(
                        (model) =>
                          String(model.brand) === String(newAssetData.brand)
                      )
                      .map((model) => (
                        <option key={model.modelid} value={model.modelid}>
                          {model.model_name}
                        </option>
                      ))}
                  </select>
                  {assetFormErrors.model && (
                    <p className="mt-1 text-xs text-red-600">
                      {assetFormErrors.model}
                    </p>
                  )}
                </div>

                {/* Variant */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Variant
                  </label>
                  <select
                    value={newAssetData.variant}
                    onChange={(e) => {
                      setNewAssetData({
                        ...newAssetData,
                        variant: e.target.value,
                      });
                      setAssetFormErrors((prev) => ({
                        ...prev,
                        variant: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border ${
                      assetFormErrors.variant
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-white px-4 py-2 text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white`}
                  >
                    <option value="">-- Select Variant --</option>
                    {variants.map((variant) => (
                      <option key={variant.variantid} value={variant.variantid}>
                        {variant.variant_name}
                      </option>
                    ))}
                  </select>
                  {assetFormErrors.variant && (
                    <p className="mt-1 text-xs text-red-600">
                      {assetFormErrors.variant}
                    </p>
                  )}
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Purchase Date{" "}
                    <span className="font-bold text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={newAssetData.purchase_date}
                    onChange={(e) => {
                      setNewAssetData({
                        ...newAssetData,
                        purchase_date: e.target.value,
                      });
                      setAssetFormErrors((prev) => ({
                        ...prev,
                        purchase_date: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border ${
                      assetFormErrors.purchase_date
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-white px-4 py-2 text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white`}
                  />
                  {assetFormErrors.purchase_date && (
                    <p className="mt-1 text-xs text-red-600">
                      {assetFormErrors.purchase_date}
                    </p>
                  )}
                </div>

                {/* Serial Number */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Serial Number{" "}
                    <span className="font-bold text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAssetData.serial_number}
                    onChange={(e) => {
                      setNewAssetData({
                        ...newAssetData,
                        serial_number: e.target.value,
                      });
                      setAssetFormErrors((prev) => ({
                        ...prev,
                        serial_number: undefined,
                      }));
                    }}
                    placeholder="Enter serial number"
                    className={`w-full rounded-lg border ${
                      assetFormErrors.serial_number
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-white px-4 py-2 text-gray-700 placeholder-gray-400 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white`}
                  />
                  {assetFormErrors.serial_number && (
                    <div className="pt-1 text-xs text-red-600">
                      {assetFormErrors.serial_number}
                    </div>
                  )}
                </div>

                {/* Floor Location */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Floor Location
                  </label>
                  <select
                    value={newAssetData.floor_location}
                    onChange={(e) => {
                      setNewAssetData({
                        ...newAssetData,
                        floor_location: e.target.value,
                      });
                      setAssetFormErrors((prev) => ({
                        ...prev,
                        floor_location: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border ${
                      assetFormErrors.floor_location
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-white px-4 py-2 text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white`}
                  >
                    <option value="">-- Select Floor --</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                  </select>
                  {assetFormErrors.floor_location && (
                    <p className="mt-1 text-xs text-red-600">
                      {assetFormErrors.floor_location}
                    </p>
                  )}
                </div>

                {/* Assigned Employee (Searchable Dropdown) */}
                <div className="employee-dropdown-container">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assign to Employee (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={employeeSearchTerm || ""}
                      onChange={(e) => {
                        setEmployeeSearchTerm(e.target.value);
                        setShowEmployeeDropdown(true);
                        if (!e.target.value.trim()) {
                          setNewAssetData({
                            ...newAssetData,
                            assigned_to: "",
                          });
                        }
                      }}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      placeholder="Search employee..."
                      className={`w-full rounded-lg border ${
                        assetFormErrors.assigned_to
                          ? "border-red-500"
                          : "border-gray-300"
                      } bg-white px-4 py-2 text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white`}
                    />
                    {showEmployeeDropdown && (
                      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-navy-700">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((emp) => (
                            <button
                              key={emp.id || emp.user_name}
                              type="button"
                              onClick={() => {
                                setNewAssetData({
                                  ...newAssetData,
                                  assigned_to: emp.id || emp.user_name,
                                });
                                setEmployeeSearchTerm(
                                  emp.user_name ||
                                    `${emp.first_name || ""} ${
                                      emp.last_name || ""
                                    }`.trim()
                                );
                                setShowEmployeeDropdown(false);
                                setAssetFormErrors((prev) => ({
                                  ...prev,
                                  assigned_to: undefined,
                                }));
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-blue-50 dark:hover:bg-navy-600"
                            >
                              <span className="text-sm font-semibold text-navy-700 dark:text-white">
                                {emp.user_name ||
                                  `${emp.first_name || ""} ${
                                    emp.last_name || ""
                                  }`.trim()}
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No employees found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {newAssetData.assigned_to && (
                    <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                      Selected: {employeeSearchTerm}
                    </p>
                  )}
                </div>

                {/* Assigned Date (Optional) */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assigned Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newAssetData.assigned_date}
                    // max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setNewAssetData({
                        ...newAssetData,
                        assigned_date: e.target.value,
                      });
                      setAssetFormErrors((prev) => ({
                        ...prev,
                        assigned_date: undefined,
                      }));
                    }}
                    className={`w-full rounded-lg border ${
                      assetFormErrors.assigned_date
                        ? "border-red-500"
                        : "border-gray-300"
                    } bg-white px-4 py-2 text-gray-700 outline-none transition focus:border-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white`}
                  />
                  {assetFormErrors.assigned_date && (
                    <p className="mt-1 text-xs text-red-600">
                      {assetFormErrors.assigned_date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 text-[13px] dark:border-gray-700 dark:bg-navy-700">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditingInModal(false);
                }}
                className="flex-1 rounded-lg bg-gray-300 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-400 dark:bg-navy-600 dark:text-white dark:hover:bg-navy-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsset}
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
              >
                {isEditingInModal ? "Update Asset" : "Add Asset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
