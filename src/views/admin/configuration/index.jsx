import React, { useState, useEffect, useRef } from "react";
import { MdSave } from "react-icons/md";
import {
  FaCalendarAlt,
  FaClock,
  FaPercentage,
  FaMoneyBillWave,
  FaShieldAlt,
  FaFileInvoiceDollar,
  FaBuilding,
  FaImage,
  FaMapMarkerAlt,
  FaFileContract,
} from "react-icons/fa";
import Card from "components/card";
import configAPI from "services/configAPI";
import { showSuccess, showError } from "utils/toastHelper";
// Handle sync button actions

// import { showSuccess, showError } from "utils/toastHelper";
import { FaReact } from "react-icons/fa";

const getConfigRecord = (data) => {
  const configSource =
    data?.data ?? data?.results ?? (Array.isArray(data) ? data : [data]);
  return Array.isArray(configSource)
    ? configSource[0] || {}
    : configSource || {};
};

const IMAGE_MAX_SIZE = 4 * 1024 * 1024;
const TERMS_FILE_MAX_SIZE = 10 * 1024 * 1024;

const normalizeMediaValue = (value) => {
  if (!value || typeof value !== "string") {
    return value;
  }

  if (value.startsWith("blob:") || value.startsWith("data:")) {
    return value;
  }

  if (value.startsWith("http")) {
    try {
      const { pathname } = new URL(value);
      const mediaPathIndex = pathname.indexOf("/media/");

      if (mediaPathIndex >= 0) {
        return pathname.slice(mediaPathIndex);
      }

      return pathname || value;
    } catch {
      return value;
    }
  }

  return value.startsWith("media/") ? `/${value}` : value;
};

const getDisplayFileName = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const normalizedValue = normalizeMediaValue(value);
    return decodeURIComponent(
      normalizedValue.split("/").pop() || normalizedValue
    );
  }
  return value.name || "";
};

const getTermsFileValue = (configData) => {
  const termsValue = configData?.term_and_conditions || "";
  const fileValue = configData?.term_and_conditions_file;

  if (fileValue) {
    return normalizeMediaValue(fileValue);
  }

  if (
    typeof termsValue === "string" &&
    (termsValue.startsWith("/media/") ||
      termsValue.startsWith("http") ||
      /\.(pdf|doc|docx|txt|jpg|jpeg|png|webp)$/i.test(termsValue))
  ) {
    return normalizeMediaValue(termsValue);
  }

  return null;
};

const getTermsUploadFieldName = (configData) => {
  if (
    configData &&
    typeof configData === "object" &&
    Object.prototype.hasOwnProperty.call(configData, "term_and_conditions_file")
  ) {
    return "term_and_conditions_file";
  }

  return "term_and_conditions";
};

const getOfficeTimingRecord = (data) => {
  const source =
    data?.data ?? data?.results ?? (Array.isArray(data) ? data : [data]);
  return Array.isArray(source) ? source[0] || {} : source || {};
};

const AdminConfig = () => {
  const [activeTab, setActiveTab] = useState("leave");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payslipSaving, setPayslipSaving] = useState(false);
  const [configId, setConfigId] = useState(null);
  const [payslipErrors, setPayslipErrors] = useState({});
  const [termsUploadFieldName, setTermsUploadFieldName] = useState(
    "term_and_conditions"
  );
  const originalConfig = useRef({});
  const originalOfficeTiming = useRef({});

  const [config, setConfig] = useState({
    leave: "",
    permission: "",
    grace_time: "",
    provisional_tax: "",
    pf: "",
    esi: "",
  });
  const [payslipContent, setPayslipContent] = useState({
    company_name: "",
    company_logo: null,
    company_address: "",
    company_gst_number: "",
    term_and_conditions: "",
    term_and_conditions_file: null,
  });
  const [officeTiming, setOfficeTiming] = useState({
    id: "",
    date: "",
    office_start_time: "",
  });
  const [officeTimingLoading, setOfficeTimingLoading] = useState(false);
  const [officeTimingSaving, setOfficeTimingSaving] = useState(false);
  const [officeTimingReasonModal, setOfficeTimingReasonModal] = useState({
    open: false,
    reason: "",
    saveMode: "leave",
  });

  useEffect(() => {
    loadConfig();
    loadOfficeTimingDetails();
  }, []);

  const loadConfig = () => {
    setLoading(true);
    configAPI.getConfig(
      (data) => {
        const configData = getConfigRecord(data);
        const loadedConfig = {
          leave: configData.leave != null ? parseInt(configData.leave, 10) : 0,
          permission:
            configData.permission != null
              ? parseInt(configData.permission, 10)
              : 0,
          grace_time:
            configData.grace_time != null
              ? parseInt(configData.grace_time, 10)
              : 0,
          provisional_tax: configData.provisional_tax ?? "",
          pf: configData.pf ?? "",
          esi: configData.esi ?? "",
        };

        if (configData?.id) {
          setConfigId(configData.id);
        }

        setConfig(loadedConfig);
        originalConfig.current = { ...loadedConfig };
        setTermsUploadFieldName(getTermsUploadFieldName(configData));

        setPayslipContent({
          company_name: configData.company_name || "",
          company_logo: normalizeMediaValue(configData.company_logo) || null,
          company_address: configData.company_address || "",
          company_gst_number: configData.company_gst_number || "",
          term_and_conditions:
            normalizeMediaValue(configData.term_and_conditions) || "",
          term_and_conditions_file: getTermsFileValue(configData),
        });

        setLoading(false);
      },
      (error) => {
        setLoading(false);
      }
    );
  };

  const loadOfficeTimingDetails = () => {
    setOfficeTimingLoading(true);
    configAPI.getOfficeTimingDetails(
      (data) => {
        console.log(
          "getOfficeTimingDetails raw response:",
          JSON.stringify(data)
        );
        const officeTimingData = getOfficeTimingRecord(data);
        const loadedOfficeTiming = {
          id: officeTimingData.id || "",
          date: officeTimingData.date || "",
          office_start_time: officeTimingData.office_start_time || "",
        };

        setOfficeTiming(loadedOfficeTiming);
        originalOfficeTiming.current = { ...loadedOfficeTiming };
        setOfficeTimingLoading(false);
      },
      () => {
        setOfficeTimingLoading(false);
      }
    );
  };

  // Loading state for each sync button
  const [syncLoading, setSyncLoading] = useState({});

  const handleSyncAction = (key) => {
    setSyncLoading((prev) => ({ ...prev, [key]: true }));
    if (key === "sync_attendance") {
      configAPI.fetchAttenceeReport(
        { value: config[key] },
        // Success callback
        () => {
          setSyncLoading((prev) => ({ ...prev, [key]: false }));
          showSuccess("Attendance synced successfully.");
        },
        // Error callback
        () => {
          setSyncLoading((prev) => ({ ...prev, [key]: false }));
          showError("Failed to sync attendance. Please try again.");
        }
      );
    } else if (key === "sync_permission_hours") {
      configAPI.syncPermissionHours(
        (data) => {
          setSyncLoading((prev) => ({ ...prev, [key]: false }));
          if (data && data.success === true) {
            showSuccess(data.message);
          } else {
            showError(data.message);
          }
        },
        (data) => {
          setSyncLoading((prev) => ({ ...prev, [key]: false }));
          showError(
            data && data.message
              ? data.message
              : "Failed to sync permission hours. Please try again."
          );
        }
      );
    } else {
      setSyncLoading((prev) => ({ ...prev, [key]: false }));
      showError("Unknown sync action.");
    }
  };

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handlePayslipContentChange = (field, value) => {
    setPayslipContent((prev) => ({ ...prev, [field]: value }));
    setPayslipErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePayslipFileChange = (
    field,
    event,
    { maxSize, invalidSizeMessage, invalidTypeMessage, acceptFile }
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (acceptFile && !acceptFile(file)) {
      showError(invalidTypeMessage);
      return;
    }

    if (file.size > maxSize) {
      showError(invalidSizeMessage);
      return;
    }

    handlePayslipContentChange(field, file);
  };

  const handleCompanyLogoChange = (event) => {
    handlePayslipFileChange("company_logo", event, {
      maxSize: IMAGE_MAX_SIZE,
      invalidSizeMessage: "Company logo should be below 4 MB.",
      invalidTypeMessage: "Please choose a valid image file.",
      acceptFile: (file) => file.type.startsWith("image/"),
    });
  };

  const handleTermsFileChange = (event) => {
    handlePayslipFileChange("term_and_conditions_file", event, {
      maxSize: TERMS_FILE_MAX_SIZE,
      invalidSizeMessage: "Terms and conditions file should be below 10 MB.",
      invalidTypeMessage: "Please choose a valid PDF file.",
      acceptFile: (file) =>
        file.type === "application/pdf" || /\.pdf$/i.test(file.name),
    });
  };

  const handleOfficeTimingChange = (field, value) => {
    setOfficeTiming((prev) => ({ ...prev, [field]: value }));
  };

  const leaveSettings = [
    {
      key: "leave",
      label: "Leave",
      description: "Number of leave days allowed per month",
      icon: <FaCalendarAlt className="text-blue-500" />,
      unit: "days",
      step: "1",
      max: 99,
    },
    {
      key: "permission",
      label: "Permission",
      description: "Permission hours allowed per month",
      icon: <FaClock className="text-orange-500" />,
      unit: "hours",
      step: "1",
      max: 99,
    },
    {
      key: "grace_time",
      label: "Grace Time",
      description: "Grace time allowed for late punch-in",
      icon: <FaReact className="text-green-500" />,
      unit: "Minutes",
      step: "1",
      max: 60,
    },
  ];

  const salarySettings = [
    {
      key: "provisional_tax",
      label: "Provisional Tax (PT)",
      description: "Professional tax deduction",
      icon: <FaPercentage className="text-purple-500" />,
      unit: "₹",
      step: "0.01",
    },
    {
      key: "pf",
      label: "PF (Provident Fund)",
      description: "Provident fund contribution",
      icon: <FaMoneyBillWave className="text-green-500" />,
      unit: "%",
      step: "0.01",
    },
    {
      key: "esi",
      label: "ESI (Employee State Insurance)",
      description: "ESI contribution",
      icon: <FaShieldAlt className="text-red-500" />,
      unit: "%",
      step: "0.01",
    },
  ];

  // New settings for syncing permission hours and attendance
  const syncSettings = [
    {
      key: "sync_permission_hours",
      label: "Sync Permission Hours",
      description:
        "Automatically sync permission hours with attendance records",
      icon: <FaClock className="text-blue-400" />,
      unit: "hours",
      step: "1",
    },
    {
      key: "sync_attendance",
      label: "Sync Attendance",
      description: "Enable automatic attendance synchronization",
      icon: <FaCalendarAlt className="text-green-400" />,
      unit: "",
      step: "1",
    },
  ];

  const handleNumberChange = (field, rawValue) => {
    if (rawValue === "") {
      setConfig((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    const num = Number(rawValue);
    // Find max from settings
    const allSettings = [...leaveSettings, ...salarySettings];
    const setting = allSettings.find((s) => s.key === field);
    if (setting?.max !== undefined && num > setting.max) return;
    if (num < 0) return;
    setConfig((prev) => ({ ...prev, [field]: num }));
  };

  const handleBlur = (field) => {
    if (config[field] === "") {
      setConfig((prev) => ({ ...prev, [field]: 0 }));
    }
  };

  const getChangedConfigFields = () => {
    const changedFields = {};

    Object.keys(config).forEach((key) => {
      if (String(config[key]) !== String(originalConfig.current[key])) {
        changedFields[key] = config[key];
      }
    });

    return changedFields;
  };

  const hasOfficeTimingChanges = () => {
    return (
      String(officeTiming.date || "") !==
        String(originalOfficeTiming.current.date || "") ||
      String(officeTiming.office_start_time || "") !==
        String(originalOfficeTiming.current.office_start_time || "")
    );
  };

  const hasOfficeStartTimeChanged = () => {
    return (
      String(officeTiming.office_start_time || "") !==
      String(originalOfficeTiming.current.office_start_time || "")
    );
  };

  const saveConfigChanges = ({
    skipNoChangesError = false,
    onSuccess,
    onError,
  } = {}) => {
    const changedFields = getChangedConfigFields();

    if (configId && Object.keys(changedFields).length === 0) {
      if (!skipNoChangesError) {
        showError("No changes to update.");
      }
      onSuccess?.({ skipped: true });
      return;
    }

    setSaving(true);

    const handleSuccess = (data) => {
      const saved = getConfigRecord(data);
      if (saved?.id) setConfigId(saved.id);
      originalConfig.current = { ...config };
      setSaving(false);
      // Show a toast only for Salary Deductions tab
      if (activeTab === "salary") {
        showSuccess("Salary Deductions updated successfully.");
      } else if (activeTab === "leave") {
        showSuccess("Leave & Permission updated successfully.");
      } else if (activeTab === "sync") {
        showSuccess("Sync Settings updated successfully.");
      }
      onSuccess?.({ skipped: false, data: saved });
    };

    const handleFailure = (error) => {
      showError("Failed to save configuration. Please try again.");
      setSaving(false);
      onError?.(error);
    };

    if (configId) {
      configAPI.updateConfig(
        configId,
        changedFields,
        handleSuccess,
        handleFailure
      );
      return;
    }

    configAPI.saveConfig(config, handleSuccess, handleFailure);
  };

  const handleSave = () => {
    saveConfigChanges();
  };

  const handlePayslipContentSave = () => {
    const nextErrors = {};

    if (!payslipContent.company_name.trim()) {
      nextErrors.company_name = "Company name is required";
    }
    if (!payslipContent.company_logo) {
      nextErrors.company_logo = "Company logo is required";
    }
    if (!payslipContent.company_address.trim()) {
      nextErrors.company_address = "Company address is required";
    }
    if (!payslipContent.company_gst_number.trim()) {
      nextErrors.company_gst_number = "Company GST number is required";
    }
    if (!payslipContent.term_and_conditions_file) {
      nextErrors.term_and_conditions_file =
        "Terms and conditions file is required";
    }

    if (Object.keys(nextErrors).length > 0) {
      setPayslipErrors(nextErrors);
      showError("Please fill in all required payslip content fields.");
      return;
    }

    const formData = new FormData();

    formData.append("company_name", payslipContent.company_name.trim());
    formData.append("company_address", payslipContent.company_address.trim());
    formData.append(
      "company_gst_number",
      payslipContent.company_gst_number.trim()
    );

    if (payslipContent.company_logo instanceof File) {
      formData.append("company_logo", payslipContent.company_logo);
    }
    if (payslipContent.term_and_conditions_file instanceof File) {
      formData.append(
        termsUploadFieldName,
        payslipContent.term_and_conditions_file
      );
    }

    setPayslipSaving(true);
    const handleSuccess = (data) => {
      const savedConfig = getConfigRecord(data);
      if (savedConfig?.id) {
        setConfigId(savedConfig.id);
      }
      setTermsUploadFieldName(getTermsUploadFieldName(savedConfig));
      setPayslipContent((prev) => ({
        ...prev,
        company_name: savedConfig.company_name || prev.company_name,
        company_logo:
          normalizeMediaValue(savedConfig.company_logo) || prev.company_logo,
        company_address: savedConfig.company_address || prev.company_address,
        company_gst_number:
          savedConfig.company_gst_number || prev.company_gst_number,
        term_and_conditions:
          normalizeMediaValue(savedConfig.term_and_conditions) ||
          prev.term_and_conditions,
        term_and_conditions_file:
          getTermsFileValue(savedConfig) || prev.term_and_conditions_file,
      }));
      showSuccess("Payslip PDF content saved successfully.");
      setPayslipErrors({});
      setPayslipSaving(false);
    };

    const handleError = (error) => {
      showError(error?.message || "Failed to save payslip PDF content.");
      setPayslipSaving(false);
    };

    if (configId) {
      configAPI.updatePayslipPdfContent(
        configId,
        formData,
        handleSuccess,
        handleError
      );
      return;
    }

    configAPI.savePayslipPdfContent(formData, handleSuccess, handleError);
  };

  const submitOfficeTimingUpdate = (
    reason = "",
    { onSuccess, onError, skipSuccessToast = false } = {}
  ) => {
    setOfficeTimingSaving(true);

    const payload = {
      id: officeTiming.id,
      date: officeTiming.date,
      office_start_time: officeTiming.office_start_time,
      reason: officeTiming.reason || reason,
    };

    configAPI.updateOfficeTimingDetails(
      officeTiming.id,

      payload,
      (data) => {
        const savedOfficeTiming = getOfficeTimingRecord(data);
        const nextOfficeTiming = {
          id: savedOfficeTiming.id || officeTiming.id,
          date: savedOfficeTiming.date || officeTiming.date,
          office_start_time:
            savedOfficeTiming.office_start_time ||
            officeTiming.office_start_time,
          reason: savedOfficeTiming.reason || officeTiming.reason || reason,
        };
  

        setOfficeTiming(nextOfficeTiming);
        originalOfficeTiming.current = { ...nextOfficeTiming };
        setOfficeTimingReasonModal({
          open: false,
          reason: "",
          saveMode: "leave",
        });
        setOfficeTimingSaving(false);
        if (!skipSuccessToast) {
          showSuccess("Office timing updated successfully.");
        }
        onSuccess?.(nextOfficeTiming);
      },
      (error) => {
        setOfficeTimingSaving(false);
        showError("Failed to update office timing.");
        onError?.(error);
      }
    );
  };

  const handleOfficeTimingSave = () => {
    if (!officeTiming.date || !officeTiming.office_start_time) {
      showError("Date and office start time are required.");
      return;
    }

    const startTimeChanged = hasOfficeStartTimeChanged();

    if (startTimeChanged) {
      setOfficeTimingReasonModal({ open: true, reason: "", saveMode: "leave" });
      return;
    }

    submitOfficeTimingUpdate("");
  };

  const handleLeaveAndOfficeTimingSave = () => {
    const configChangedFields = getChangedConfigFields();
    const officeTimingChanged = hasOfficeTimingChanges();

    if (!officeTiming.date || !officeTiming.office_start_time) {
      showError("Date and office start time are required.");
      return;
    }

    if (Object.keys(configChangedFields).length === 0 && !officeTimingChanged) {
      showError("No changes to update.");
      return;
    }

    if (officeTimingChanged && hasOfficeStartTimeChanged()) {
      setOfficeTimingReasonModal({ open: true, reason: "", saveMode: "leave" });
      return;
    }

    if (Object.keys(configChangedFields).length > 0) {
      saveConfigChanges({
        skipNoChangesError: true,
        onSuccess: () => {
          if (officeTimingChanged) {
            submitOfficeTimingUpdate("", { skipSuccessToast: false });
          }
        },
      });
      return;
    }

    submitOfficeTimingUpdate("");
  };

  if (loading) {
    return (
      <div className="mt-5 flex h-64 items-center justify-center">
        <div className="border-t-transparent h-12 w-12 animate-spin rounded-full border-4 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-3 px-2 sm:px-0">
      {/* Tab Buttons */}
      <div className="mb-5 grid w-full grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-navy-600 dark:bg-navy-700 sm:flex sm:gap-0">
        <button
          onClick={() => setActiveTab("leave")}
          className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium transition sm:flex-1 sm:text-sm ${
            activeTab === "leave"
              ? "bg-blue-500 text-white shadow"
              : "text-gray-600 hover:text-brand-500 dark:text-gray-300"
          }`}
        >
          <FaCalendarAlt className="shrink-0" />
          <span>Leave & Permission</span>
        </button>
        <button
          onClick={() => setActiveTab("salary")}
          className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium transition sm:flex-1 sm:text-sm ${
            activeTab === "salary"
              ? "bg-blue-500 text-white shadow"
              : "text-gray-600 hover:text-brand-500 dark:text-gray-300"
          }`}
        >
          <FaMoneyBillWave className="shrink-0" />
          <span>Salary Deductions</span>
        </button>
        <button
          onClick={() => setActiveTab("sync")}
          className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium transition sm:flex-1 sm:text-sm ${
            activeTab === "sync"
              ? "bg-blue-500 text-white shadow"
              : "text-gray-600 hover:text-brand-500 dark:text-gray-300"
          }`}
        >
          <FaClock className="shrink-0" />
          <span>Sync Settings</span>
        </button>
        <button
          onClick={() => setActiveTab("payslip")}
          className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium transition sm:flex-1 sm:text-sm ${
            activeTab === "payslip"
              ? "bg-blue-500 text-white shadow"
              : "text-gray-600 hover:text-brand-500 dark:text-gray-300"
          }`}
        >
          <FaFileInvoiceDollar className="shrink-0" />
          <span>Payslip PDF</span>
        </button>
      </div>

      <Card extra="p-3 sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy-700 dark:text-white sm:text-lg">
          {activeTab === "leave"
            ? "Leave & Permission"
            : activeTab === "salary"
            ? "Salary Deductions"
            : activeTab === "sync"
            ? "Sync Settings"
            : "Payslip PDF Content Management"}
        </h2>

        <div className="space-y-2">
          {activeTab === "leave" && (
            <>
              {leaveSettings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex flex-col gap-2 border-b border-gray-100 py-4 dark:border-navy-600 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-navy-700">
                      {setting.icon}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-navy-700 dark:text-white">
                        {setting.label}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-2 self-end sm:w-auto sm:self-auto">
                    <input
                      type="number"
                      min="0"
                      max={setting.max}
                      step={setting.step}
                      placeholder="0"
                      value={config[setting.key]}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handleNumberChange(setting.key, e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xs font-medium text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:w-24 sm:text-sm"
                    />
                    <span className="w-10 text-xs text-gray-500 sm:text-sm">
                      {setting.unit}
                    </span>
                  </div>
                </div>
              ))}

              <div className="grid gap-3 py-4 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-600">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-700 dark:text-white">
                    <FaCalendarAlt className="text-blue-500" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={officeTiming.date}
                    onChange={(e) =>
                      handleOfficeTimingChange("date", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-600">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-700 dark:text-white">
                    <FaClock className="text-orange-500" />
                    Office Start Time
                  </label>
                  <input
                    type="time"
                    value={officeTiming.office_start_time}
                    onChange={(e) =>
                      handleOfficeTimingChange(
                        "office_start_time",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:text-sm"
                  />
                </div>
              </div>

              {officeTimingLoading && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading office timing details...
                </p>
              )}
            </>
          )}

          {activeTab === "salary" && (
            <>
              {salarySettings.map((setting) => (
                <div
                  key={setting.key}
                  className="flex flex-col gap-2 border-b border-gray-100 py-4 dark:border-navy-600 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-navy-700">
                      {setting.icon}
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-navy-700 dark:text-white">
                        {setting.label}
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-2 self-end sm:w-auto sm:self-auto">
                    <input
                      type="number"
                      min="0"
                      step={setting.step}
                      placeholder="0"
                      value={config[setting.key]}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handleNumberChange(setting.key, e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-xs font-medium text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:w-24 sm:text-sm"
                    />
                    <span className="w-10 text-xs text-gray-500 sm:text-sm">
                      {setting.unit}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
          {activeTab === "sync" &&
            syncSettings.map((setting, index) => (
              <div
                key={setting.key}
                className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${
                  index !== syncSettings.length - 1
                    ? "border-b border-gray-100 dark:border-navy-600"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-navy-700">
                    {setting.icon}
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-navy-700 dark:text-white">
                      {setting.label}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    className="flex min-w-[90px] items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-60"
                    onClick={() => handleSyncAction(setting.key)}
                    disabled={!!syncLoading[setting.key]}
                  >
                    {syncLoading[setting.key] ? (
                      <>
                        <svg
                          className="mr-2 h-4 w-4 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          ></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      "Update"
                    )}
                  </button>
                </div>
              </div>
            ))}
          {activeTab === "payslip" && (
            <div className="space-y-5">
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-600">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-700 dark:text-white">
                    <FaBuilding className="text-blue-500" />
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={payslipContent.company_name}
                    onChange={(e) =>
                      handlePayslipContentChange("company_name", e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:text-sm"
                    placeholder="Enter company name"
                  />
                  {payslipErrors.company_name && (
                    <p className="mt-2 text-xs text-red-500">
                      {payslipErrors.company_name}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-600">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-700 dark:text-white">
                    <FaImage className="text-pink-500" />
                    Company Logo <span className="text-red-500">*</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600">
                    Upload Image (Max 4MB)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCompanyLogoChange}
                      hidden
                    />
                  </label>
                  {payslipContent.company_logo && (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {getDisplayFileName(payslipContent.company_logo)}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setPayslipContent((prev) => ({
                            ...prev,
                            company_logo: null,
                          }))
                        }
                        className="flex-shrink-0 rounded-full bg-red-100 p-1 text-red-500 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {payslipErrors.company_logo && (
                    <p className="mt-2 text-xs text-red-500">
                      {payslipErrors.company_logo}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-600">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-700 dark:text-white">
                    <FaMapMarkerAlt className="text-green-500" />
                    Company Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={payslipContent.company_address}
                    onChange={(e) =>
                      handlePayslipContentChange(
                        "company_address",
                        e.target.value
                      )
                    }
                    className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-xs text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:text-sm"
                    placeholder="Enter company address"
                  />
                  {payslipErrors.company_address && (
                    <p className="mt-2 text-xs text-red-500">
                      {payslipErrors.company_address}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-600">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-700 dark:text-white">
                    <FaMoneyBillWave className="text-yellow-500" />
                    Company GST Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={payslipContent.company_gst_number}
                    onChange={(e) =>
                      handlePayslipContentChange(
                        "company_gst_number",
                        e.target.value
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:text-sm"
                    placeholder="Enter GST number"
                  />
                  {payslipErrors.company_gst_number && (
                    <p className="mt-2 text-xs text-red-500">
                      {payslipErrors.company_gst_number}
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 p-4 dark:border-navy-600">
                <div className="mt-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-700 dark:text-white">
                    <FaFileContract className="text-purple-500" />
                    Terms and Conditions File{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600">
                    Upload PDF (Max 10MB)
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleTermsFileChange}
                      hidden
                    />
                  </label>
                  {payslipContent.term_and_conditions_file && (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {getDisplayFileName(
                          payslipContent.term_and_conditions_file
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setPayslipContent((prev) => ({
                            ...prev,
                            term_and_conditions_file: null,
                          }))
                        }
                        className="flex-shrink-0 rounded-full bg-red-100 p-1 text-red-500 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {payslipErrors.term_and_conditions_file && (
                    <p className="mt-2 text-xs text-red-500">
                      {payslipErrors.term_and_conditions_file}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section Update Button for Leave & Permission and Salary Deductions */}
        {(activeTab === "leave" || activeTab === "salary") && (
          <div className="mt-6 flex justify-end border-t border-gray-100 pt-5 dark:border-navy-600">
            <button
              onClick={
                activeTab === "leave"
                  ? handleLeaveAndOfficeTimingSave
                  : handleSave
              }
              disabled={
                activeTab === "leave" ? saving || officeTimingSaving : saving
              }
              className="flex min-w-[110px] items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-60"
            >
              <MdSave className="h-5 w-5" />
              {activeTab === "leave"
                ? saving || officeTimingSaving
                  ? "Updating..."
                  : "Update"
                : saving
                ? configId
                  ? "Updating..."
                  : "Saving..."
                : "Update"}
            </button>
          </div>
        )}
        {activeTab === "payslip" && (
          <div className="mt-6 flex justify-end border-t border-gray-100 pt-5 dark:border-navy-600">
            <button
              onClick={handlePayslipContentSave}
              disabled={payslipSaving}
              className="flex min-w-[110px] items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-600 disabled:opacity-60"
            >
              <MdSave className="h-5 w-5" />
              {payslipSaving ? "Saving..." : "Update"}
            </button>
          </div>
        )}
      </Card>

      {officeTimingReasonModal.open && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-navy-800">
            <h3 className="mb-1 text-lg font-bold text-navy-700 dark:text-white">
              Change Office Start Time
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Please provide a reason for changing the office start time.
            </p>
            <textarea
              rows={3}
              value={officeTimingReasonModal.reason}
              onChange={(e) =>
                setOfficeTimingReasonModal((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="Enter reason..."
              className="w-full resize-none rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() =>
                  setOfficeTimingReasonModal({
                    open: false,
                    reason: "",
                    saveMode: "leave",
                  })
                }
                disabled={officeTimingSaving}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-navy-700 dark:text-gray-300 dark:hover:bg-navy-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!officeTimingReasonModal.reason.trim()) {
                    showError(
                      "Reason is required when office start time changes."
                    );
                    return;
                  }

                  const submitReason = officeTimingReasonModal.reason.trim();
                  const configChangedFields = getChangedConfigFields();

                  if (
                    officeTimingReasonModal.saveMode === "leave" &&
                    Object.keys(configChangedFields).length > 0
                  ) {
                    saveConfigChanges({
                      skipNoChangesError: true,
                      onSuccess: () => {
                        submitOfficeTimingUpdate(submitReason);
                      },
                    });
                    return;
                  }

                  submitOfficeTimingUpdate(submitReason);
                }}
                disabled={officeTimingSaving}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
              >
                {officeTimingSaving ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConfig;
