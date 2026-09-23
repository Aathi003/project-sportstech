import React, { useState, useEffect } from "react";
import Card from "components/card";
import payslipAPI from "services/payslipAPI";
import configAPI from "services/configAPI";
import { API_BASE } from "services/apiConfig";
import { showError, showSuccess } from "utils/toastHelper";
import { FaFileInvoiceDollar, FaSearch, FaDownload } from "react-icons/fa";
import { jsPDF } from "jspdf";
import EmployeeProfileImage from "components/navbar/EmployeeProfileImage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../../contexts/AuthContext";
import Logo from "../../../assets/sportstech-logo.png";

// ──────────────────────────────────────────────────
// Logo URL constant
// ──────────────────────────────────────────────────
// const Logo =
//   "/assets/sportstech-logo.png"; // Replace with your actual logo URL or path

// ──────────────────────────────────────────────────
// Helper: Load logo as base64 via fetch → blob → FileReader
// This avoids CORS canvas tainting issues entirely
// ──────────────────────────────────────────────────
// const Logo= "https://d267gv22s9468h.cloudfront.net/sportstech-crypto/images/logo.png"
const getConfigRecord = (data) => {
  const configSource =
    data?.data ?? data?.results ?? (Array.isArray(data) ? data : [data]);
  return Array.isArray(configSource)
    ? configSource[0] || {}
    : configSource || {};
};

const getResolvedFileUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (
    fileUrl.startsWith("http") ||
    fileUrl.startsWith("data:") ||
    fileUrl.startsWith("blob:")
  ) {
    return fileUrl;
  }

  const apiBase = API_BASE?.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const originBase = apiBase?.replace(/\/api\/?$/, "") || "";
  const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;

  if (path.startsWith("/media/")) {
    return `${originBase}${path}`;
  }

  return `${apiBase}${path}`;
};

const scaleToFit = (origW, origH, maxWidth, maxHeight) => {
  let w = origW,
    h = origH;
  if (w > maxWidth) {
    h = (maxWidth / w) * h;
    w = maxWidth;
  }
  if (h > maxHeight) {
    w = (maxHeight / h) * w;
    h = maxHeight;
  }
  return { w, h };
};

const imgToDataUrl = (img, origW, origH) => {
  const canvas = document.createElement("canvas");
  canvas.width = origW;
  canvas.height = origH;
  canvas.getContext("2d").drawImage(img, 0, 0, origW, origH);
  return canvas.toDataURL("image/png"); // throws SecurityError if canvas is tainted
};

const loadLogo = (logoSrc = Logo, maxWidth = 200, maxHeight = 60) => {
  return new Promise((resolve) => {
    const resolveFromImg = (img, origW, origH) => {
      const { w, h } = scaleToFit(origW, origH, maxWidth, maxHeight);
      try {
        resolve({ dataUrl: imgToDataUrl(img, origW, origH), width: w, height: h });
      } catch {
        resolve(null);
      }
    };

    // Handle data URLs directly — no fetch needed
    if (logoSrc && logoSrc.startsWith("data:")) {
      const img = new Image();
      img.onload = () =>
        resolveFromImg(img, img.naturalWidth, img.naturalHeight);
      img.onerror = () => resolve(null);
      img.src = logoSrc;
      return;
    }

    fetch(logoSrc, { headers: { "ngrok-skip-browser-warning": "true" } })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (!ct.startsWith("image/")) throw new Error("not-image");
        return res.blob();
      })
      .then((blob) => {
        // blob: URL is same-origin — canvas will NOT be tainted
        const blobUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const origW = img.naturalWidth;
          const origH = img.naturalHeight;
          URL.revokeObjectURL(blobUrl);
          resolveFromImg(img, origW, origH);
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          resolve(null);
        };
        img.src = blobUrl;
      })
      .catch(() => {
        // CORS fallback: crossOrigin + cache-bust
        // Canvas may be tainted if server has no CORS headers; resolveFromImg handles that
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const origW = img.naturalWidth || 200;
          const origH = img.naturalHeight || 60;
          resolveFromImg(img, origW, origH);
        };
        img.onerror = () => resolve(null);
        img.src =
          logoSrc + (logoSrc.includes("?") ? "&" : "?") + "_t=" + Date.now();
      });
  });
};

// ──────────────────────────────────────────────────
// PDF generation helper
// ──────────────────────────────────────────────────
const generatePayslipPDF = async (data) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth(); // 595

  // Colors
  const primary = [31, 78, 120];
  const light = [234, 242, 248];
  const dark = [34, 34, 34];
  const gray = [102, 102, 102];
  const green = [213, 245, 227];
  const greenBorder = [171, 235, 198];
  const red = [250, 219, 216];
  const redBorder = [245, 183, 177];

  // ── Header background ──
  doc.setFillColor(...primary);
  doc.rect(0, 0, 595, 110, "F");

  // ── Logo in header — always use default bundled logo ──
  let logoData = null;
  try {
    logoData = await loadLogo(Logo, 180, 55);
  } catch (e) {
    console.error("Failed to load logo for PDF", e);
  }

  if (logoData?.dataUrl) {
    doc.addImage(logoData.dataUrl, "PNG", 40, 12, logoData.width, logoData.height);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("SPORTSTECH", 40, 42);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const address =
    data.companyAddress ||
    "88/3 ,Melakkal Main road ,Kochadai, Madurai - 625016";
  const addressLines = doc.splitTextToSize(address, 280);
  doc.text(addressLines, 42, 62);

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Payslip - ${data.month || ""}`, pageW - 40, 55, {
    align: "right",
  });

  // ── Employee Details Box ──
  doc.setFillColor(...light);
  doc.setDrawColor(314, 234, 248);
  doc.roundedRect(40, 130, 515, 110, 8, 8, "FD");

  doc.setTextColor(...dark);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Details :", 50, 150);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const leftX = 50;
  const rightX = 300;
  let y = 172;

  doc.text(`Employee Name: ${data.employeeName || "-"}`, leftX, y);
  doc.text(`Employee Code: ${data.employeeId || "-"}`, leftX, y + 18);
  doc.text(`Department: ${data.department || "-"}`, leftX, y + 36);
  doc.text(`Designation: ${data.designation || "-"}`, leftX, y + 54);

  doc.text(`UAN:  ${data.uan || "-"}`, rightX, y);
  doc.text(`ESIC No:   ${data.esic || "-"}`, rightX, y + 18);
  doc.text(`Absent Days: ${data.absent_days || "-"}`, rightX, y + 36);
  doc.text(`Total Working Days: ${data.total_days || "-"}`, rightX, y + 54);
  // console.log("00000000000", data.absent_days);

  // ── Table Header ──
  const tableTop = 260;
  const col1 = 50;
  const col2 = 220;
  const col3 = 330;
  const col4 = 480;

  doc.setFillColor(...primary);
  doc.rect(40, tableTop, 515, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Earnings", col1, tableTop + 17);
  doc.text("Amount", col2, tableTop + 17);
  doc.text("Deductions", col3, tableTop + 17);
  doc.text("Amount", col4, tableTop + 17);

  // ── Table Rows ──
  const rows = [
    ["Gross Salary", data.gross || 0, "PF", data.pf || 0],
    ["Basic Salary", data.basic || 0, "ESI", data.esic_amount || 0],
    ["HRA", data.hra || 0, "Professional Tax", data.pt || 0],
    ["Special Allowance", data.special || 0, "LOP", data.lop_amount || 0],
    ["Bonus", data.bonus || 0, "Permission LOP", data.permission_lop || 0],
  ];

  let rowY = tableTop + 25;

  rows.forEach((row, i) => {
    doc.setFillColor(
      i % 2 === 0 ? 248 : 255,
      i % 2 === 0 ? 249 : 255,
      i % 2 === 0 ? 249 : 255
    );
    doc.rect(60, rowY, 515, 28, "F");

    doc.setTextColor(...dark);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(String(row[0]), col1, rowY + 18);
    doc.text(`Rs. ${Number(row[1]).toLocaleString()}`, col2, rowY + 18);
    doc.text(String(row[2]), col3, rowY + 18);
    doc.text(`Rs. ${Number(row[3]).toLocaleString()}`, col4, rowY + 18);

    rowY += 28;
  });

  // ── Totals Row ──
  doc.setFillColor(...primary);
  doc.rect(40, rowY, 515, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Total Earnings", col1, rowY + 18);
  doc.text(`Rs. ${Number(data.gross || 0).toLocaleString()}`, col2, rowY + 18);
  doc.text("Total Deductions", col3, rowY + 18);
  doc.text(
    `Rs. ${Number(data.totalDeductions || 0).toLocaleString()}`,
    col4,
    rowY + 18
  );

  rowY += 28;

  // ── Salary Summary Boxes ──
  const boxY = rowY + 25;

  doc.setFillColor(...green);
  doc.setDrawColor(...greenBorder);
  doc.roundedRect(40, boxY, 240, 70, 8, 8, "FD");

  doc.setTextColor(...dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Salary Summary", 55, boxY + 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Gross Salary: Rs. ${Number(data.gross || 0).toLocaleString()}`,
    55,
    boxY + 40
  );
  doc.text(
    `Total Deductions: Rs. ${Number(
      data.totalDeductions || 0
    ).toLocaleString()}`,
    55,
    boxY + 56
  );

  doc.setFillColor(...red);
  doc.setDrawColor(...redBorder);
  doc.roundedRect(310, boxY, 245, 70, 8, 8, "FD");

  doc.setTextColor(...dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Net Salary", 325, boxY + 20);
  doc.setFontSize(20);
  doc.text(
    `Rs. ${Number(data.netSalary || 0).toLocaleString()}`,
    325,
    boxY + 52
  );

  // ── Footer ──
  doc.setDrawColor(204, 204, 204);
  doc.line(40, 730, 555, 730);

  doc.setTextColor(...gray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const footerText = `This is a system-generated payslip. Generated on: ${new Date().toLocaleDateString()}`;
  doc.text(footerText, 40, 745);

  const fileName = `Payslip_${(data.employeeName || "employee").replace(
    /\s+/g,
    "_"
  )}_${(data.month || "").replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};

// ──────────────────────────────────────────────────
// React Component
// ──────────────────────────────────────────────────
const Payslip = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Month starts as null (empty) instead of new Date()
  const [selectedMonthDate, setSelectedMonthDate] = useState(null);

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState("");
  const [payslipData, setPayslipData] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");


  // Pre-cached logo base64 for PDF generation
  const [logoBase64, setLogoBase64] = useState(null);
  const [logoData, setLogoData] = useState(null); // { base64, width, height }

  useEffect(() => {
    configAPI.getConfig(
      async (data) => {
        const configData = getConfigRecord(data);
        setCompanyName(configData.company_name || "");
        setCompanyAddress(configData.company_address || "");
        setCompanyLogo(configData.company_logo || "");

        // Fetch logo as base64 for PDF
        let logoUrl = configData.company_logo || "";
        if (logoUrl) {
          logoUrl = getResolvedFileUrl(logoUrl);
          const logo = await loadLogo(logoUrl);
          // If API logo fetch fails (CORS on /media/), fall back to bundled asset
          setLogoData(logo || (await loadLogo(Logo)));
        } else {
          setLogoData(await loadLogo(Logo));
        }
      },
      () => {
        setCompanyName("");
        setCompanyAddress("");
        setCompanyLogo("");
        setLogoData(null);
      }
    );
  }, []);

  // Auth context
  const { user, isSuperAdmin } = useAuth();

  // Fetch employees on mount
  useEffect(() => {
    payslipAPI.getAllEmployees(
      (data) => {
        let empList = [];
        if (Array.isArray(data)) empList = data;
        else if (data?.results) empList = data.results;
        else if (data?.data) empList = data.data;

        // Filter employees based on superadmin status
        let filtered = empList;
        if (!isSuperAdmin) {
          // Only show logged-in user
          filtered = empList.filter((emp) => String(emp.id) === String(user));
        }
        setEmployees(filtered);
        setFilteredEmployees(filtered);

        // Auto-select for non-super admin
        if (!isSuperAdmin && filtered.length === 1) {
          const emp = filtered[0];
          setSelectedEmployee(emp);
          const name = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
          setSelectedEmployeeName(name || emp.user_name || emp.emp_code);
          setSearchTerm(name || emp.user_name || emp.emp_code);
        }
      },
      (error) => {
        console.error("Failed to load employees:", error);
        showError("Failed to load employees");
      }
    );
  }, [isSuperAdmin, user]);

  // Filter employees based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(employees);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = employees.filter(
        (emp) =>
          (emp.first_name && emp.first_name.toLowerCase().includes(term)) ||
          (emp.last_name && emp.last_name.toLowerCase().includes(term)) ||
          (emp.emp_code && emp.emp_code.toLowerCase().includes(term)) ||
          (emp.user_name && emp.user_name.toLowerCase().includes(term))
      );
      setFilteredEmployees(filtered);
    }
  }, [searchTerm, employees]);

  const renderMonthContent = (month, shortMonth, longMonth, day) => {
    const fullYear = new Date(day).getFullYear();
    const tooltipText = `${longMonth} ${fullYear}`;
    return <span title={tooltipText}>{shortMonth}</span>;
  };

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    const name = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
    setSelectedEmployeeName(name || emp.user_name || emp.emp_code);
    setSearchTerm(name || emp.user_name || emp.emp_code);
    setShowDropdown(false);

    // Clear previous payslip when a new employee is selected
    setPayslipData(null);
  };

  const handleGenerate = () => {
    if (!selectedEmployee) {
      showError("Please select an employee");
      return;
    }
    if (!selectedMonthDate) {
      showError("Please select a month");
      return;
    }

    // Custom month logic: Jan 26–Feb 25, Feb 26–Mar 25, etc.
    const today = new Date();
    const selYear = selectedMonthDate.getFullYear();
    const selMonth = selectedMonthDate.getMonth(); // 0=Jan

    // Calculate start/end for selected custom month
    let startDate, endDate;
    if (selMonth === 0) {
      // January: Jan 26–Feb 25
      startDate = new Date(selYear, 0, 26);
      endDate = new Date(selYear, 1, 25);
    } else {
      // Other months: Feb 26–Mar 25, Mar 26–Apr 25, etc.
      startDate = new Date(selYear, selMonth, 26);
      endDate = new Date(selYear, selMonth + 1, 25);
    }

    // Prevent payslip for future months
    if (today < startDate) {
      showError("Cannot generate payslip for future months.");
      return;
    }

    setLoading(true);

    const year = selYear;
    const month = selMonth + 1;

    payslipAPI.generatePayslip(
      {
        employee_id: selectedEmployee.id,
        month,
        year,
      },
      (response) => {
        setLoading(false);
        if (response?.status && response?.data) {
          const d = response.data;

          // Build unified payslipData for both screen and PDF
          const unified = {
            companyName: companyName || "SPORTSTECH",
            companyAddress: companyAddress || "-",
            companyLogo: companyLogo || "-",
            month:
              d.payslip_date ||
              `${startDate.toLocaleString("default", {
                month: "long",
              })} ${startDate.getDate()} to ${endDate.toLocaleString(
                "default",
                { month: "long" }
              )} ${endDate.getDate()}, ${endDate.getFullYear()}`,
            employeeName: d.employee_name || "",
            employeeId: d.emp_code || "",
            department: d.department || "",
            designation: d.designation || "",
            uan: d.uan_number || "-",
            esic: d.esic_number || "-",
            absent_days: d.absent_days || 0,
            bank: d.bank_account || "",
            gross: Number(d.gross_salary) || 0,
            basic: Number(d.basic_salary) || 0,
            hra: Number(d.hra) || 0,
            special: Number(d.special_allowance) || 0,
            bonus: Number(d.bonus) || 0,
            pf: Number(d.pf_amount) || 0,
            esic_amount: Number(d.esic_amount) || 0,
            pt: Number(d.professional_tax) || 0,
            tds: Number(d.tds) || 0,
            gross: Number(d.gross_salary) || 0,
            totalDeductions: Number(d.total_deductions) || 0,
            netSalary: Number(d.net_salary) || 0,
            present_days: d.present_days || 0,
            lop_amount: Number(d.lop_amount) || 0,
            permission_lop: Number(d.permission_lop) || 0,
            from_date: d.from_date || "",
            to_date: d.to_date || "",
            total_days: d.total_days || 0,
          };

          setPayslipData(unified);
        } else {
          showError(response?.message || "Failed to generate payslip");
        }
      },
      (error) => {
        setLoading(false);
        showError(error?.message || "Failed to generate payslip");
      }
    );
  };

  // Download handler — passes pre-cached logoBase64 into PDF generator
  const handleDownloadPDF = async (logoUrl) => {
    if (!payslipData) return;
    setDownloading(true);
    try {
      await generatePayslipPDF({
        ...payslipData,
        logoUrl,
        companyLogo: logoData || logoUrl,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      showError("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mt-3">
      <Card extra="w-full p-3 sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-3">
          <FaFileInvoiceDollar className="h-5 w-5 text-brand-500 sm:h-6 sm:w-6" />
          <h2 className="text-lg font-bold text-navy-700 dark:text-white sm:text-xl">
            Payslip Generator
          </h2>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {/* Employee Search & Select */}
          <div className="relative">
            <label className="mb-2 block text-sm font-bold text-navy-700 dark:text-white">
              Employee Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value.trim()) {
                    setSelectedEmployee(null);
                    setSelectedEmployeeName("");
                    setPayslipData(null);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search employee..."
                className="w-full rounded-lg border-2 border-gray-200 bg-white py-2.5 pl-10 pr-4 text-navy-700 placeholder-gray-400 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white"
              />
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-navy-700">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-brand-50 dark:hover:bg-navy-600 ${
                        selectedEmployee?.id === emp.id
                          ? "bg-brand-50 dark:bg-navy-600"
                          : ""
                      }`}
                    >
                      <EmployeeProfileImage
                        employeeId={emp.id}
                        style={{ height: 32, width: 32, borderRadius: "50%" }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-navy-700 dark:text-white">
                          {`${emp.first_name || ""} ${
                            emp.last_name || ""
                          }`.trim() || emp.user_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {emp.emp_code || "No ID"}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    No employees found
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Month Picker */}
          <div className="flex w-full flex-col">
            <label className="mb-2 block text-sm font-bold text-navy-700 dark:text-white">
              Month <span className="text-red-500">*</span>
            </label>
            <DatePicker
              selected={selectedMonthDate}
              onChange={(date) => {
                setSelectedMonthDate(date);
                setPayslipData(null);
              }}
              renderMonthContent={renderMonthContent}
              showMonthYearPicker
              dateFormat="MMMM yyyy"
              maxDate={new Date()}
              isClearable
              className="w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2.5 text-navy-700 transition focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white"
              placeholderText="Select month and year"
            />
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading || !selectedEmployee || !selectedMonthDate}
              className={`w-full rounded-lg px-6 py-2.5 font-bold text-white transition duration-200 ${
                loading || !selectedEmployee || !selectedMonthDate
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600 active:bg-brand-700"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate Payslip"
              )}
            </button>
          </div>
        </div>

        {/* Selected info summary */}
        {selectedEmployee && !payslipData && (
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-navy-700">
            <p className="text-sm text-navy-700 dark:text-white">
              <span className="font-bold">Selected:</span>{" "}
              {selectedEmployeeName}
              {selectedMonthDate && (
                <>
                  {" "}
                  &bull;{" "}
                  {selectedMonthDate.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </>
              )}
            </p>
          </div>
        )}
      </Card>

      {/* ══════ PAYSLIP PREVIEW TABLE ══════ */}
      {payslipData && (
        <Card extra="mt-4 w-full overflow-hidden">
          {/* Header Bar */}
          <div className="flex flex-col gap-3 bg-[#1F4E78] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <div className="py-2">
              <img
                src={companyLogo || Logo}
                alt={payslipData.companyName}
                className="ml-2 h-14 sm:h-16"
              />
              <p className="ml-2 mt-2 text-xs text-blue-100 sm:text-sm">
                {payslipData.companyAddress}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm font-bold text-white sm:text-lg">
                Payslip - {payslipData.month}
              </p>
              <button
                onClick={() => handleDownloadPDF(companyLogo)}
                disabled={downloading}
                className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/30 disabled:opacity-50 sm:text-sm"
              >
                {downloading ? (
                  <>
                    <svg
                      className="h-3 w-3 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Preparing...
                  </>
                ) : (
                  <>
                    <FaDownload className="h-3 w-3" />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {/* Employee Details */}
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-900 dark:bg-navy-700 sm:mb-6 sm:p-4">
              <h4 className="mb-2 text-xs font-bold text-navy-700 dark:text-white sm:mb-3 sm:text-sm">
                Employee Details :
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:gap-x-8 sm:text-sm md:grid-cols-5">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Name</span>
                  <p className="font-semibold text-navy-700 dark:text-white">
                    {payslipData.employeeName}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Employee Code
                  </span>
                  <p className="font-semibold text-navy-700 dark:text-white">
                    {payslipData.employeeId}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Department
                  </span>
                  <p className="font-semibold text-navy-700 dark:text-white">
                    {payslipData.department || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Designation
                  </span>
                  <p className="font-semibold text-navy-700 dark:text-white">
                    {payslipData.designation || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">UAN</span>
                  <p className="font-semibold text-navy-700 dark:text-white">
                    {payslipData.uan || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    ESIC No
                  </span>
                  <p className="font-semibold text-navy-700 dark:text-white">
                    {payslipData.esic || "-"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Total Working Days
                  </span>
                  <p className="font-semibold text-navy-700 dark:text-white">
                    {payslipData.total_days || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Total Present Days
                  </span>
                  <p className="font-semibold text-navy-700 dark:text-white">
                    {payslipData.present_days || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Absent Days
                  </span>
                  <p className="font-semibold text-navy-700 dark:text-white">
                    {payslipData.absent_days}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Bank A/C
                  </span>
                  <p className="font-semibold text-navy-700 dark:text-white">
                    {payslipData.bank || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Table */}
            <div className="mb-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 sm:mb-6">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="bg-[#1F4E78] text-white">
                    <th className="px-2 py-2 text-left text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">
                      Earnings
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">
                      Amount
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">
                      Deductions
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 dark:bg-navy-700">
                    <td className="px-2 py-2 text-xs text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      Gross Salary
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      ₹ {payslipData.gross?.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-xs text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      PF
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-red-500 sm:px-4 sm:py-2.5 sm:text-sm">
                      ₹ {payslipData.pf?.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-white dark:bg-navy-800">
                    <td className="px-2 py-2 text-xs text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      Basic Salary
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      ₹ {payslipData.basic?.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-xs text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      ESI
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-red-500 sm:px-4 sm:py-2.5 sm:text-sm">
                      ₹ {payslipData.esic_amount?.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-navy-700">
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      Special Allowance
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      ₹ {payslipData.special?.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      Prof. Tax
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-red-500 sm:px-4 sm:py-2.5 sm:text-sm">
                      ₹ {payslipData.pt?.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-white dark:bg-navy-800">
                    <td className="px-2 py-2 text-xs text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      Bonus
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      ₹ {payslipData.bonus?.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-xs text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      LOP
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-red-500 sm:px-4 sm:py-2.5 sm:text-sm">
                      ₹ {payslipData.lop_amount?.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-navy-700">
                    <td className="px-2 py-2 text-xs text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      HRA
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      ₹ {payslipData.hra?.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-xs text-navy-700 dark:text-white sm:px-4 sm:py-2.5 sm:text-sm">
                      Permission LOP
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-semibold text-red-500 sm:px-4 sm:py-2.5 sm:text-sm">
                      ₹{" "}
                      {payslipData.permission_lop
                        ? Number(payslipData.permission_lop).toLocaleString()
                        : 0}
                    </td>
                  </tr>
                  {/* Totals Row */}
                  <tr className="bg-[#1F4E78] text-white">
                    <td className="px-2 py-2 text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">
                      Total Earnings
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">
                      ₹ {payslipData.gross?.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">
                      Total Deductions
                    </td>
                    <td className="px-2 py-2 text-right text-xs font-bold sm:px-4 sm:py-3 sm:text-sm">
                      ₹ {payslipData.totalDeductions?.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-900/20 sm:p-4">
                <h4 className="mb-2 text-xs font-bold text-navy-700 dark:text-white sm:text-sm">
                  Salary Summary
                </h4>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Gross Salary
                  </span>
                  <span className="font-bold text-green-600">
                    ₹ {payslipData.gross?.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total Deductions
                  </span>
                  <span className="font-bold text-red-500">
                    ₹ {payslipData.totalDeductions?.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-900/20 sm:p-4">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 sm:text-sm">
                  Net Salary
                </p>
                <p className="text-2xl font-bold text-[#1F4E78] dark:text-blue-300 sm:text-3xl">
                  ₹ {payslipData.netSalary?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 flex flex-col gap-1 border-t border-gray-200 pt-3 text-[10px] text-gray-500 dark:border-gray-700 dark:text-gray-400 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:pt-4 sm:text-xs">
              <p>
                This is a system-generated payslip. Generated on:{" "}
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default Payslip;
