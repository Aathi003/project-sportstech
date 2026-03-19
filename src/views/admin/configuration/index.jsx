import React, { useState, useEffect, useRef } from "react";
import { MdSave } from "react-icons/md";
import {
  FaCalendarAlt,
  FaClock,
  FaPercentage,
  FaMoneyBillWave,
  FaShieldAlt,
} from "react-icons/fa";
import Card from "components/card";
import configAPI from "services/configAPI";
import { showSuccess, showError } from "utils/toastHelper";

const AdminConfig = () => {
  const [activeTab, setActiveTab] = useState("leave");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configId, setConfigId] = useState(null);
  const originalConfig = useRef({});

  const [config, setConfig] = useState({
    leave: "",
    permission: "",
    provisional_tax: "",
    pf: "",
    esi: "",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    setLoading(true);
    configAPI.getConfig(
      (data) => {
        const configData = data?.data || data?.results?.[0] || data;
        if (configData && configData.id) {
          setConfigId(configData.id);
          const loadedConfig = {
            leave:
              configData.leave != null ? parseInt(configData.leave, 10) : 0,
            permission:
              configData.permission != null
                ? parseInt(configData.permission, 10)
                : 0,
            provisional_tax: configData.provisional_tax ?? "",
            pf: configData.pf ?? "",
            esi: configData.esi ?? "",
          };
          setConfig(loadedConfig);
          originalConfig.current = { ...loadedConfig };
        }
        setLoading(false);
      },
      (error) => {
        console.log("No config found, using defaults");
        setLoading(false);
      }
    );
  };

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
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
      unit: "₹",
      step: "0.01",
    },
    {
      key: "esi",
      label: "ESI (Employee State Insurance)",
      description: "ESI contribution",
      icon: <FaShieldAlt className="text-red-500" />,
      unit: "₹",
      step: "0.01",
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

  const handleSave = () => {
    setSaving(true);

    const onSuccess = (data) => {
      const saved = data?.data || data?.results?.[0] || data?.[0] || data;
      if (saved?.id) setConfigId(saved.id);
      originalConfig.current = { ...config };
      setSaving(false);
    };

    const onError = (error) => {
      showError("Failed to save configuration. Please try again.");
      setSaving(false);
    };

    if (configId) {
      // Only send changed fields
      const changedFields = {};
      Object.keys(config).forEach((key) => {
        if (String(config[key]) !== String(originalConfig.current[key])) {
          changedFields[key] = config[key];
        }
      });

      if (Object.keys(changedFields).length === 0) {
        showError("No changes to update.");
        setSaving(false);
        return;
      }

      configAPI.updateConfig(configId, changedFields, onSuccess, onError);
    } else {
      configAPI.saveConfig(config, onSuccess, onError);
    }
  };

  if (loading) {
    return (
      <div className="mt-5 flex h-64 items-center justify-center">
        <div className="border-t-transparent h-12 w-12 animate-spin rounded-full border-4 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {/* Tab Buttons */}
      <div className="mb-5 flex rounded-lg border border-gray-200 bg-gray-50 dark:border-navy-600 dark:bg-navy-700">
        <button
          onClick={() => setActiveTab("leave")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-l-lg px-3 py-3 text-xs font-medium transition sm:text-sm ${
            activeTab === "leave"
              ? "bg-brand-500 text-white"
              : "text-gray-600 hover:text-brand-500 dark:text-gray-300"
          }`}
        >
          <FaCalendarAlt className="shrink-0" />
          <span>Leave & Permission</span>
        </button>
        <button
          onClick={() => setActiveTab("salary")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-r-lg px-3 py-3 text-xs font-medium transition sm:text-sm ${
            activeTab === "salary"
              ? "bg-brand-500 text-white"
              : "text-gray-600 hover:text-brand-500 dark:text-gray-300"
          }`}
        >
          <FaMoneyBillWave className="shrink-0" />
          <span>Salary Deductions</span>
        </button>
      </div>

      <Card extra="p-4 sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy-700 dark:text-white sm:text-lg">
          {activeTab === "leave" ? "Leave & Permission" : "Salary Deductions"}
        </h2>

        <div className="space-y-1">
          {activeTab === "leave"
            ? leaveSettings.map((setting, index) => (
                <div
                  key={setting.key}
                  className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    index !== leaveSettings.length - 1
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
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:w-24"
                    />
                    <span className="w-10 text-sm text-gray-500">
                      {setting.unit}
                    </span>
                  </div>
                </div>
              ))
            : salarySettings.map((setting, index) => (
                <div
                  key={setting.key}
                  className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between ${
                    index !== salarySettings.length - 1
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
                    <input
                      type="number"
                      min="0"
                      step={setting.step}
                      placeholder="0"
                      value={config[setting.key]}
                      onChange={(e) =>
                        handleNumberChange(setting.key, e.target.value)
                      }
                      className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-navy-700 focus:border-brand-500 focus:outline-none dark:border-navy-600 dark:bg-navy-700 dark:text-white sm:w-24"
                    />
                    <span className="w-6 text-sm text-gray-500">
                      {setting.unit}
                    </span>
                  </div>
                </div>
              ))}
        </div>

        {/* Save / Update Button */}
        <div className="mt-6 flex justify-end border-t border-gray-100 pt-5 dark:border-navy-600">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            <MdSave className="h-5 w-5" />
            {saving
              ? configId
                ? "Updating..."
                : "Saving..."
              : configId
              ? "Update"
              : "Save"}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AdminConfig;
