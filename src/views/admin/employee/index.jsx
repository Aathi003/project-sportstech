import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "components/card";
import CardMenu from "components/card/CardMenu";
import Pagination from "components/common/Pagination";
import AddEmployeeModal from "components/modal/AddEmployeeModal";
import employeeAPI from "services/employeeAPI";
import { API_BASE } from "services/apiConfig";
import wfhAPI from "services/wfh";
import { showError, showSuccess } from "utils/toastHelper";
import {
  FaEye,
  FaInfoCircle,
  FaDownload,
  FaPrint,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { MdEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useAuth } from "contexts/AuthContext";
// import { IoDocumentText } from "react-icons/io5";
import maleProfile from "assets/img/avatars/male_profile.png";
import femaleProfile from "assets/img/avatars/female_profile.png";
import logoImg from "assets/sportstech-logo.png";
import { IoDocumentText } from "react-icons/io5";

const columnHelper = createColumnHelper();

const Employee = () => {
  const { isSuperAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sorting, setSorting] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedEmployeeForDocs, setSelectedEmployeeForDocs] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] =
    useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [authTogglingId, setAuthTogglingId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("-");
  const [isAdmin, setIsAdmin] = useState(false);
  const [probationTogglingId, setProbationTogglingId] = useState(null);
  const [wfhTogglingId, setWfhTogglingId] = useState(null);
  // ── NEW: probation filter state ──
  const [probationFilter, setProbationFilter] = useState("all"); // "all" | "on" | "off"
  const [authorizedFilter, setAuthorizedFilter] = useState("all"); // "all" | "authorized" | "not_authorized"
  const [wfhFilter, setWfhFilter] = useState("all"); // "all" | "wfh" | "not_wfh"
  const [downloadingProfilePdf, setDownloadingProfilePdf] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [processedBlackLogo, setProcessedBlackLogo] = useState(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadBlackLogoAsBase64(logoImg).then((res) => {
      if (res) setProcessedBlackLogo(res);
    });

    const userData = localStorage.getItem("user");
    const isSuperAdmin = localStorage.getItem("is_super_admin");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserRole(user.role || "-");
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
    setIsAdmin(isSuperAdmin === "true" || isSuperAdmin === true);
  }, []);

  const fetchEmployees = () => {
    setLoading(true);
    employeeAPI.getAllEmployees(
      (data) => {
        try {
          let employeeArray = [];
          if (Array.isArray(data)) {
            employeeArray = data;
          } else if (data?.results && Array.isArray(data.results)) {
            employeeArray = data.results;
          } else if (data?.data && Array.isArray(data.data)) {
            employeeArray = data.data;
          } else if (data?.employee && Array.isArray(data.employee)) {
            employeeArray = data.employee;
          } else {
            employeeArray = [];
          }

          const transformedData = employeeArray.map((emp) => {
            let roleName = "-";
            if (emp.role) {
              if (typeof emp.role === "object" && emp.role.role_name) {
                roleName = emp.role.role_name || "-";
              } else if (typeof emp.role === "string") {
                roleName = emp.role || "-";
              }
            }

            let departmentName = "-";
            if (emp.department) {
              if (
                (typeof emp.department === "object" &&
                  emp.department.department_name) ||
                "-"
              ) {
                departmentName = emp.department.department_name || "-";
              } else if (typeof emp.department === "string") {
                departmentName = emp.department || "-";
              }
            }

            return {
              id: emp.id,
              user_id: emp.user_id || emp.user?.id || emp.user || null,
              employee_id: emp.employee_id || emp.id || null,
              name: `${emp.user_name || "-"}`.trim(),
              email: emp.email || "-",
              role: roleName || "-",
              department: departmentName || "-",
              status: emp.is_active ? "Active" : "Inactive",
              joinDate: emp.doj_date
                ? new Date(emp.doj_date).toLocaleDateString()
                : "-",
              ...emp,
            };
          });

          setEmployees(transformedData);
          setLoading(false);
        } catch (error) {
          showError("Error loading employee data. Please refresh the page.");
          setLoading(false);
        }
      },
      (error) => {
        if (error?.status === 401) {
          showError("Unauthorized. Please login again.");
          logout();
        } else if (error?.status === 403) {
          showError("You do not have permission to view employees.");
        } else if (error?.status === 404) {
          showError("Employee endpoint not found.");
        } else if (error?.status >= 500) {
          showError("Server error. Please try again later.");
        } else {
          showError(
            error?.message ||
              "Failed to load employees. Please check your connection."
          );
        }
        setEmployees([]);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEmployeeSubmit = () => {
    setTimeout(() => {
      fetchEmployees();
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingEmployee(null);
    }, 500);
  };

  const handleProbationToggle = (emp, currentIsProbationary) => {
    const actionText = currentIsProbationary
      ? "end probation"
      : "start probation";
    const confirmText = currentIsProbationary
      ? "Yes, End Probation"
      : "Yes, Start Probation";
    const confirmButtonColor = currentIsProbationary ? "#dc2626" : "#16a34a";

    Swal.fire({
      title: "Confirm Probationary Period Change",
      text: `Are you sure you want to ${actionText} for ${
        emp.user_name || "-"
      }?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: "#6b7280",
      confirmButtonText: confirmText,
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        updateEmployeeProbation(emp, !currentIsProbationary);
      }
    });
  };

  const updateEmployeeProbation = (emp, newProbationStatus) => {
    setProbationTogglingId(emp.id);
    const probationData = {
      id: emp.id,
      is_probationary: newProbationStatus,
    };
    employeeAPI.updateEmployeeProbationStatus &&
      employeeAPI.updateEmployeeProbationStatus(
        emp.id,
        probationData,
        (response) => {
          showSuccess(
            `Employee probationary period ${
              newProbationStatus ? "started" : "ended"
            }`
          );
          fetchEmployees();
          setProbationTogglingId(null);
        },
        (error) => {
          showError(error?.message || "Failed to update probationary period");
          setProbationTogglingId(null);
        }
      );
  };

  const handleViewDocuments = (employee) => {
    setSelectedEmployeeForDocs(employee);
    setDocumentModalOpen(true);
  };

  const handleViewDetails = (employee) => {
    const empId = employee.id || employee.employee_id;
    setLoadingDetails(true);
    setDetailModalOpen(true);
    setSelectedEmployeeForDetails(employee);

    employeeAPI.getEmployeeById(
      empId,
      (res) => {
        let freshData = res?.data || res;
        setSelectedEmployeeForDetails(freshData);
        setLoadingDetails(false);
      },
      (error) => {
        console.error("Failed to fetch employee details by ID", error);
        setLoadingDetails(false);
      }
    );
  };

  const getCleanDocNumber = (...candidates) => {
    for (let c of candidates) {
      if (c && typeof c === "string") {
        const trimmed = c.trim();
        if (
          trimmed !== "" &&
          !trimmed.startsWith("http://") &&
          !trimmed.startsWith("https://") &&
          !trimmed.startsWith("/media/")
        ) {
          return trimmed;
        }
      }
    }
    return "-";
  };

  const handleViewDocument = (fileUrl) => {
    if (!fileUrl) {
      showError("No document file URL found.");
      return;
    }
    let targetUrl = fileUrl;
    const apiDomain = API_BASE ? API_BASE.replace(/\/api\/?$/, "") : "";
    if (apiDomain.startsWith("https://") && targetUrl.startsWith("http://")) {
      targetUrl = targetUrl.replace(/^http:\/\//i, "https://");
    }
    if (
      !targetUrl.startsWith("http://") &&
      !targetUrl.startsWith("https://") &&
      !targetUrl.startsWith("data:") &&
      !targetUrl.startsWith("blob:")
    ) {
      targetUrl = `${apiDomain}${
        targetUrl.startsWith("/") ? "" : "/"
      }${targetUrl}`;
    }
    if (
      targetUrl.includes("ngrok") &&
      !targetUrl.includes("ngrok-skip-browser-warning")
    ) {
      targetUrl +=
        (targetUrl.includes("?") ? "&" : "?") +
        "ngrok-skip-browser-warning=69420";
    }
    window.open(targetUrl, "_blank");
  };

  const triggerBlobDownload = (blob, fileName) => {
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 20000);
    showSuccess(`Downloaded ${fileName} successfully!`);
  };

  // ──────────────────────────────────────────────────
  // Convert an image Blob into a single-page branded PDF (returns a jsPDF doc)
  // ──────────────────────────────────────────────────
  const imageBlobToPdf = async (blob, title) => {
    const logoBase64 = await loadImageAsBase64(logoImg);
    return new Promise((resolve, reject) => {
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 800;
          canvas.height = img.naturalHeight || img.height || 600;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL("image/png");
          URL.revokeObjectURL(blobUrl);

          const doc = new jsPDF({ unit: "pt", format: "a4" });
          const pageW = doc.internal.pageSize.getWidth();
          const pageH = doc.internal.pageSize.getHeight();

          // Header bar
          doc.setFillColor(31, 78, 120);
          doc.rect(0, 0, pageW, 55, "F");

          if (logoBase64) {
            doc.addImage(logoBase64, "PNG", 30, 14, 120, 24);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Employee Verified Document", pageW - 30, 34, {
              align: "right",
            });
          } else {
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("SPORTSTECH - Employee Verified Document", 30, 35);
          }

          // Document Title & Meta
          doc.setTextColor(34, 34, 34);
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text(`Document: ${title.replace(/_/g, " ")}`, 30, 85);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(102, 102, 102);
          doc.text(
            `Generated Date: ${new Date().toLocaleDateString()}`,
            30,
            100
          );
          doc.setDrawColor(220, 220, 220);
          doc.line(30, 110, pageW - 30, 110);

          // Scale & fit image nicely on A4 page
          const maxW = pageW - 60;
          const maxH = pageH - 160;
          let w = canvas.width;
          let h = canvas.height;
          const ratio = Math.min(maxW / w, maxH / h);
          w = w * ratio;
          h = h * ratio;

          const x = (pageW - w) / 2;
          const y = 130;

          doc.addImage(imgData, "PNG", x, y, w, h);
          resolve(doc);
        } catch (e) {
          URL.revokeObjectURL(blobUrl);
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        reject(new Error("Image failed to load"));
      };
      img.src = blobUrl;
    });
  };

  // ──────────────────────────────────────────────────
  // Download a single uploaded document (image → PDF, other files → raw download)
  // Fixed: no more target="_blank" on the async fallback (was silently blocked
  // by the browser's popup blocker since the click was no longer "user-initiated"
  // by the time the async chain reached it), and a retry without the custom
  // header in case the header itself triggers a CORS preflight the server
  // doesn't support.
  // ──────────────────────────────────────────────────
  const handleDownloadDocument = async (fileUrl, fileName) => {
    if (!fileUrl) {
      showError("No document file URL found.");
      return;
    }

    let targetUrl = fileUrl;
    const apiDomain = API_BASE ? API_BASE.replace(/\/api\/?$/, "") : "";

    // 1. SSL Protocol Alignment: Match targetUrl protocol to apiDomain (convert http:// to https://)
    if (apiDomain.startsWith("https://") && targetUrl.startsWith("http://")) {
      targetUrl = targetUrl.replace(/^http:\/\//i, "https://");
    }

    if (
      !targetUrl.startsWith("http://") &&
      !targetUrl.startsWith("https://") &&
      !targetUrl.startsWith("data:") &&
      !targetUrl.startsWith("blob:")
    ) {
      targetUrl = `${apiDomain}${
        targetUrl.startsWith("/") ? "" : "/"
      }${targetUrl}`;
    } else if (
      apiDomain &&
      (targetUrl.includes("127.0.0.1:8000") ||
        targetUrl.includes("localhost:8000"))
    ) {
      targetUrl = targetUrl.replace(/^https?:\/\/[^\/]+/, apiDomain);
    }

    if (
      targetUrl.includes("ngrok") &&
      !targetUrl.includes("ngrok-skip-browser-warning")
    ) {
      targetUrl +=
        (targetUrl.includes("?") ? "&" : "?") +
        "ngrok-skip-browser-warning=69420";
    }

    const urlWithoutQuery = fileUrl.split("?")[0];
    const urlExtMatch = urlWithoutQuery.match(
      /\.(pdf|png|jpe?g|webp|gif|doc|docx|svg)$/i
    );
    const fileExt = urlExtMatch ? urlExtMatch[0].toLowerCase() : "";

    let rawTitle = fileName || urlWithoutQuery.split("/").pop() || "Document";
    const cleanTitle = rawTitle.replace(
      /\.(pdf|png|jpe?g|webp|gif|doc|docx|svg)$/i,
      ""
    );

    const isImageFile = /\.(png|jpe?g|webp|gif|svg)$/i.test(urlWithoutQuery);
    const saveFileName = `${cleanTitle.replace(/\s+/g, "_")}${
      fileExt || (isImageFile ? ".png" : ".pdf")
    }`;

    // Try to actually fetch the bytes so we can force a real download
    // (and, for images, convert to PDF). Retry once without the custom
    // header in case the header itself is what's causing a CORS failure.
    let blob = null;
    try {
      const res = await fetch(targetUrl, {
        headers: { "ngrok-skip-browser-warning": "69420" },
      });
      if (res.ok) {
        blob = await res.blob();
      }
    } catch (err) {
      console.warn(
        "Fetch with custom header failed (likely CORS preflight), retrying plain fetch",
        err
      );
      try {
        const res2 = await fetch(targetUrl);
        if (res2.ok) {
          blob = await res2.blob();
        }
      } catch (err2) {
        console.warn("Plain fetch also failed", err2);
      }
    }

    if (blob) {
      if (isImageFile) {
        try {
          const pdfDoc = await imageBlobToPdf(blob, cleanTitle);
          const pdfName = `${cleanTitle.replace(/\s+/g, "_")}.pdf`;
          pdfDoc.save(pdfName);
          showSuccess(`Downloaded ${pdfName} successfully!`);
          return;
        } catch (e) {
          console.warn("Image-to-PDF conversion failed, saving raw image", e);
          triggerBlobDownload(blob, saveFileName); 
          return;
        }
      } else {
        // Already a PDF/doc/etc — just save the bytes directly.
        triggerBlobDownload(blob, saveFileName);
        return;
      }
    }

    // Couldn't fetch the bytes at all (server has no CORS headers, etc).
    // Don't pretend a download happened — open it in a new tab instead so
    // the user can save it manually from there.
    showError(
      "Couldn't download the file directly (server restriction). Opening it in a new tab instead."
    );
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  // ──────────────────────────────────────────────────
  // Download ALL uploaded documents for an employee as a single ZIP file
  // ──────────────────────────────────────────────────
  const handleDownloadAllDocuments = async (emp) => {
    const empData = emp || selectedEmployeeForDetails;
    if (!empData) {
      showError("No employee selected.");
      return;
    }

    const docsList = [
      { key: "passport_size_photo", label: "Passport_Size_Photo" },
      { key: "sslcCertificate", label: "SSLC_Certificate" },
      { key: "doc_12th_diploma_certificate", label: "12th_Diploma_Certificate" },
      { key: "doc_degree_certificate", label: "Degree_Certificate" },
      { key: "doc_postgraduate_certificate", label: "Postgraduate_Certificate" },
      { key: "certificate_upload", label: "Additional_Qualification" },
      { key: "aadhaar_card", label: "Aadhaar_Card" },
      { key: "pan_card", label: "PAN_Card" },
      { key: "bank_passbook", label: "Bank_Passbook" },
      { key: "salary_slips", label: "Salary_Slips" },
      { key: "offer_letter", label: "Offer_Letter" },
      { key: "relieving_letter", label: "Relieving_Letter" },
    ];

    const fileItems = [];
    const addedUrls = new Set();

    docsList.forEach((doc) => {
      const rawUrl = getDocFileUrl(empData, doc.key);
      if (rawUrl) {
        fileItems.push({ label: doc.label, rawUrl });
        addedUrls.add(rawUrl);
      }
    });

    const ignoredDynamicKeys = new Set([
      "passport_size_photo",
      "doc_passport_size_photo",
      "passport_photo",
      "passportphoto",
      "profile_picture",
      "profile_picture_url",
      "photo",
      "avatar",
      "image",
      "user_photo",
      "userphoto",
    ]);

    // Dynamic fallback scanner: scan empData for any other file fields
    Object.keys(empData).forEach((k) => {
      if (ignoredDynamicKeys.has(k.toLowerCase())) return;
      const val = empData[k];
      if (val && typeof val === "string" && val.trim() !== "") {
        const trimmed = val.trim();
        if (
          !addedUrls.has(trimmed) &&
          !/^\d+$/.test(trimmed) &&
          (trimmed.startsWith("/media/") ||
            trimmed.startsWith("media/") ||
            trimmed.startsWith("/uploads/") ||
            trimmed.startsWith("uploads/") ||
            trimmed.startsWith("http://") ||
            trimmed.startsWith("https://")) &&
          /\.(pdf|png|jpe?g|webp|gif|doc|docx|svg)$/i.test(trimmed.split("?")[0])
        ) {
          const cleanKeyLabel = k
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())
            .replace(/[\/\\]/g, "_")
            .replace(/\s+/g, "_");
          fileItems.push({ label: cleanKeyLabel, rawUrl: trimmed });
          addedUrls.add(trimmed);
        }
      }
    });

    if (fileItems.length === 0) {
      showError("No documents have been uploaded for this employee.");
      return;
    }

    try {
      setDownloadingZip(true);
      showSuccess(`Preparing ${fileItems.length} documents for ZIP download...`);

      const zip = new JSZip();
      const empName = (empData.first_name || empData.name || "Employee").replace(/\s+/g, "_");
      const empCode = empData.emp_code || empData.id || "Record";
      const folderName = `${empName}_${empCode}_Documents`;
      const zipFolder = zip.folder(folderName);

      let fetchedCount = 0;

      for (const item of fileItems) {
        const targetUrl = getResolvedUrl(item.rawUrl) || item.rawUrl;

        try {
          let blob = null;

          // Attempt 1: Fetch with custom header
          try {
            const res = await fetch(targetUrl, {
              headers: { "ngrok-skip-browser-warning": "69420" },
            });
            if (res.ok) blob = await res.blob();
          } catch (e1) {}

          // Attempt 2: Plain fetch
          if (!blob) {
            try {
              const res2 = await fetch(targetUrl);
              if (res2.ok) blob = await res2.blob();
            } catch (e2) {}
          }

          // Attempt 3: Canvas image converter fallback for image files
          if (!blob && /\.(png|jpe?g|webp|gif|svg)$/i.test(item.rawUrl.split("?")[0])) {
            try {
              const base64 = await loadImageAsBase64(targetUrl);
              if (base64) {
                const res3 = await fetch(base64);
                if (res3.ok) blob = await res3.blob();
              }
            } catch (e3) {}
          }

          if (blob) {
            const urlWithoutQuery = item.rawUrl.split("?")[0];
            const extMatch = urlWithoutQuery.match(
              /\.(pdf|png|jpe?g|webp|gif|doc|docx|svg)$/i
            );
            const ext = extMatch ? extMatch[0].toLowerCase() : ".pdf";
            const cleanLabel = item.label.replace(/[\/\\]/g, "_").replace(/\s+/g, "_");
            const fileName = `${cleanLabel}${ext}`;
            zipFolder.file(fileName, blob);
            fetchedCount++;
          } else {
            console.warn(`Could not download file bytes for ${item.label} (${targetUrl})`);
          }
        } catch (err) {
          console.warn(`Failed to process ${item.label}`, err);
        }
      }

      if (fetchedCount === 0) {
        showError("Could not retrieve file data for uploaded documents.");
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFileName = `${folderName}.zip`;
      triggerBlobDownload(zipBlob, zipFileName);
    } catch (err) {
      console.error("Failed to generate ZIP archive", err);
      showError("Failed to create ZIP package of documents.");
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleOpenProfileInNewTab = (emp) => {
    const empData = emp || selectedEmployeeForDetails;
    if (!empData) return;

    const newWin = window.open("", "_blank");
    if (!newWin) {
      showError("Please allow popups to view employee profile in a new tab.");
      return;
    }

    const docName = `${empData.first_name || empData.name || "Employee"}_${
      empData.emp_code || empData.id || ""
    }`.replace(/\s+/g, "_");

    const profilePicSrc =
      empData.profile_picture && empData.profile_picture.trim() !== ""
        ? empData.profile_picture
        : empData.gender?.trim().toLowerCase() === "female"
        ? femaleProfile
        : maleProfile;

    const docsList = [
      { key: "passport_size_photo", label: "Passport Size Photo" },
      { key: "sslcCertificate", label: "SSLC Certificate" },
      {
        key: "doc_12th_diploma_certificate",
        label: "12th / Diploma Certificate",
      },
      { key: "doc_degree_certificate", label: "Degree Certificate" },
      {
        key: "doc_postgraduate_certificate",
        label: "Postgraduate Certificate",
      },
      { key: "certificate_upload", label: "Additional Qualification" },
      { key: "aadhaar_card", label: "Aadhaar Card" },
      { key: "pan_card", label: "PAN Card" },
      { key: "bank_passbook", label: "Bank Passbook" },
      { key: "salary_slips", label: "Salary Slips" },
      { key: "offer_letter", label: "Offer Letter" },
      { key: "relieving_letter", label: "Relieving Letter" },
    ];

    const docsHtml = docsList
      .map((doc) => {
        const url = getDocFileUrl(empData, doc.key);
        const hasUrl = !!url;
        return `
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background-color: #f9fafb; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <p style="font-weight: 700; font-size: 12px; margin: 0; color: #111827;">${
                doc.label
              }</p>
              <span style="font-size: 10px; font-weight: 700; color: ${
                hasUrl ? "#047857" : "#9ca3af"
              };">${hasUrl ? "✓ Uploaded" : "✕ Not Uploaded"}</span>
            </div>
            ${
              hasUrl
                ? `<div style="display: flex; gap: 6px;">
                    <a href="${url}" target="_blank" style="background-color: #eff6ff; color: #2563eb; font-weight: 700; font-size: 11px; padding: 4px 8px; border-radius: 6px; text-decoration: none;">View</a>
                    <a href="${url}" download="${doc.label.replace(
                    /\s+/g,
                    "_"
                  )}_${docName}" style="background-color: #ecfdf5; color: #059669; font-weight: 700; font-size: 11px; padding: 4px 8px; border-radius: 6px; text-decoration: none;">Download</a>
                   </div>`
                : `<span style="font-size: 11px; color: #9ca3af; font-style: italic;">No file</span>`
            }
          </div>
        `;
      })
      .join("");

    newWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docName}_Profile_Record</title>
          <meta charset="utf-8" />
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page { size: A4; margin: 10mm; }
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; padding: 0 !important; }
              .a4-card { shadow: none !important; border: none !important; width: 100% !important; max-width: none !important; }
            }
          </style>
        </head>
        <body class="bg-gray-100 p-4 sm:p-8 font-sans">
          <div class="no-print max-w-[210mm] mx-auto mb-4 flex justify-between items-center bg-white p-4 rounded-xl shadow-md">
            <div>
              <h2 class="text-sm font-bold text-gray-800">Employee Profile Document - ${
                empData.first_name || empData.name || "Record"
              }</h2>
              <p class="text-xs text-gray-500">Official A4 Sheet Record View</p>
            </div>
            <div class="flex gap-2">
              <button onclick="window.print()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                <span>Download PDF / Print</span>
              </button>
              <button onclick="window.close()" class="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg transition">
                Close Tab
              </button>
            </div>
          </div>

          <div class="a4-card max-w-[210mm] mx-auto bg-white p-8 rounded-xl shadow-xl border border-gray-200 text-sm space-y-6">
            <!-- HEADER BANNER -->
            <div class="flex justify-between items-center border-b-2 border-blue-600 pb-4">
              <div>
                <img src="${processedBlackLogo || logoImg}" alt="SPORTSTECH" class="h-7 w-auto object-contain" />
                <p class="text-[10px] font-bold tracking-wider text-gray-500 uppercase mt-1">Official Employee Profile Record</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500">Record Date: ${new Date().toLocaleDateString()}</p>
                <p class="text-xs font-bold ${
                  empData.is_active ? "text-green-600" : "text-red-600"
                }">
                  ${empData.is_active ? "ACTIVE EMPLOYEE" : "INACTIVE EMPLOYEE"}
                </p>
              </div>
            </div>

            <!-- PROFILE SUMMARY ROW -->
            <div class="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div class="flex items-center gap-4">
                <div class="h-20 w-20 shrink-0 flex items-center justify-center rounded-2xl border-2 border-blue-500 bg-white p-1 shadow">
                  <img src="${profilePicSrc}" alt="Profile" class="h-full w-full rounded-xl object-contain object-center" />
                </div>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">${
                    empData.first_name || empData.name || "Employee"
                  } ${empData.last_name || ""}</h2>
                  <p class="text-xs font-bold text-blue-600">${
                    empData.designation || "Employee"
                  } (${empData.emp_code || empData.id || "-"})</p>
                  <p class="text-xs text-gray-500">${empData.email || "-"}</p>
                </div>
              </div>
              <div class="text-right text-xs font-semibold space-y-1">
                <p><span class="text-gray-500">Department:</span> ${
                  empData.department_name || empData.department || "-"
                }</p>
                <p><span class="text-gray-500">Role:</span> ${
                  empData.role_name || empData.role || "-"
                }</p>
                <p><span class="text-gray-500">Joining Date:</span> ${
                  empData.doj_date || "-"
                }</p>
              </div>
            </div>

            <!-- 1. EMPLOYMENT & WORK -->
            <div class="border border-gray-200 p-4 rounded-xl">
              <h3 class="text-xs font-black uppercase tracking-wider text-blue-600 border-b pb-1 mb-3">1. Employment & Organization Record</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span class="text-gray-500">Employee Code:</span><p class="font-bold text-gray-900">${
                  empData.emp_code || "-"
                }</p></div>
                <div><span class="text-gray-500">Username:</span><p class="font-bold text-gray-900">${
                  empData.user_name || "-"
                }</p></div>
                <div><span class="text-gray-500">Official Email:</span><p class="font-bold text-gray-900 truncate">${
                  empData.email || "-"
                }</p></div>
                <div><span class="text-gray-500">Department:</span><p class="font-bold text-gray-900">${
                  empData.department_name || empData.department || "-"
                }</p></div>
                <div><span class="text-gray-500">Role:</span><p class="font-bold text-gray-900">${
                  empData.role_name || empData.role || "-"
                }</p></div>
                <div><span class="text-gray-500">Designation:</span><p class="font-bold text-gray-900">${
                  empData.designation || "-"
                }</p></div>
                <div><span class="text-gray-500">Employment Type:</span><p class="font-bold text-gray-900">${
                  empData.employment_type || "-"
                }</p></div>
                <div><span class="text-gray-500">Work Location:</span><p class="font-bold text-gray-900">${
                  empData.work_location || "-"
                }</p></div>
                <div><span class="text-gray-500">Reporting Manager:</span><p class="font-bold text-gray-900">${
                  empData.reporting_manager_name ||
                  empData.reporting_manager ||
                  "-"
                }</p></div>
                <div><span class="text-gray-500">Joining Date:</span><p class="font-bold text-gray-900">${
                  empData.doj_date || "-"
                }</p></div>
                <div><span class="text-gray-500">Probation Period:</span><p class="font-bold text-gray-900">${
                  empData.probation_period || "-"
                }</p></div>
                <div><span class="text-gray-500">Work From Home:</span><p class="font-bold text-gray-900">${
                  empData.is_wfh_enabled ? "Enabled" : "Disabled"
                }</p></div>
                <div><span class="text-gray-500">Deactivation Reason:</span><p class="font-bold text-gray-900">${
                  empData.deactivate_reason ||
                  empData.deactivation_reason ||
                  "-"
                }</p></div>
              </div>
            </div>

            <!-- 2. PERSONAL & ADDRESS -->
            <div class="border border-gray-200 p-4 rounded-xl">
              <h3 class="text-xs font-black uppercase tracking-wider text-blue-600 border-b pb-1 mb-3">2. Personal & Contact Information</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span class="text-gray-500">Gender:</span><p class="font-bold text-gray-900">${
                  empData.gender || "-"
                }</p></div>
                <div><span class="text-gray-500">Date of Birth:</span><p class="font-bold text-gray-900">${
                  empData.dob_date || "-"
                }</p></div>
                <div><span class="text-gray-500">Marital Status:</span><p class="font-bold text-gray-900">${
                  empData.marital_status || "-"
                }</p></div>
                <div><span class="text-gray-500">Nationality:</span><p class="font-bold text-gray-900">${
                  empData.nationality || "-"
                }</p></div>
                <div><span class="text-gray-500">Blood Group:</span><p class="font-bold text-gray-900">${
                  empData.blood_group || "-"
                }</p></div>
                <div><span class="text-gray-500">Primary Mobile:</span><p class="font-bold text-gray-900">${
                  empData.mobile || "-"
                }</p></div>
                <div><span class="text-gray-500">Alternate Mobile:</span><p class="font-bold text-gray-900">${
                  empData.alternate_mobile || "-"
                }</p></div>
                <div><span class="text-gray-500">Personal Email:</span><p class="font-bold text-gray-900 truncate">${
                  empData.personal_email || "-"
                }</p></div>
                <div><span class="text-gray-500">Aadhaar Card Number:</span><p class="font-bold text-gray-900">${getCleanDocNumber(
                  empData.aadhaar_number,
                  empData.aadhaar_card_number,
                  empData.aadhaar_no
                )}</p></div>
                <div><span class="text-gray-500">PAN Card Number:</span><p class="font-bold text-gray-900">${getCleanDocNumber(
                  empData.pan_number,
                  empData.pan_card_number,
                  empData.pan_no
                )}</p></div>
              </div>

              <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span class="font-bold text-blue-600 uppercase">Current Address</span>
                  <p class="mt-1 font-semibold text-gray-900">${
                    [
                      empData.current_address_line1,
                      empData.current_address_line2,
                      empData.current_city,
                      empData.current_state,
                      empData.current_country,
                      empData.current_pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "-"
                  }</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <span class="font-bold text-blue-600 uppercase">Permanent Address</span>
                  <p class="mt-1 font-semibold text-gray-900">${
                    empData.same_as_current
                      ? "Same as Current Address"
                      : [
                          empData.permanent_address_line1,
                          empData.permanent_address_line2,
                          empData.permanent_city,
                          empData.permanent_state,
                          empData.permanent_country,
                          empData.permanent_pincode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"
                  }</p>
                </div>
              </div>
            </div>

            <!-- 3. EDUCATION & EXPERIENCE -->
            <div class="border border-gray-200 p-4 rounded-xl">
              <h3 class="text-xs font-black uppercase tracking-wider text-blue-600 border-b pb-1 mb-3">3. Educational Qualification & Experience</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span class="text-gray-500">Qualification:</span><p class="font-bold text-gray-900">${
                  empData.qualification || "-"
                }</p></div>
                <div><span class="text-gray-500">Course / Degree:</span><p class="font-bold text-gray-900">${
                  empData.course_degree || "-"
                }</p></div>
                <div><span class="text-gray-500">Specialization:</span><p class="font-bold text-gray-900">${
                  empData.specialization || "-"
                }</p></div>
                <div><span class="text-gray-500">Institution:</span><p class="font-bold text-gray-900">${
                  empData.institution_university || "-"
                }</p></div>
                <div><span class="text-gray-500">Year of Passing:</span><p class="font-bold text-gray-900">${
                  empData.year_of_passing || "-"
                }</p></div>
                <div><span class="text-gray-500">Percentage / CGPA:</span><p class="font-bold text-gray-900">${
                  empData.percentage_cgpa || "-"
                }</p></div>
                <div><span class="text-gray-500">Fresher Status:</span><p class="font-bold text-gray-900">${
                  empData.is_fresher ? "Fresher" : "Experienced"
                }</p></div>
              </div>
            </div>

            <!-- 4. BANK & FINANCIAL -->
            <div class="border border-gray-200 p-4 rounded-xl">
              <h3 class="text-xs font-black uppercase tracking-wider text-blue-600 border-b pb-1 mb-3">4. Bank Account & Payroll Record</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span class="text-gray-500">Account Holder:</span><p class="font-bold text-gray-900">${
                  empData.account_holder_name || "-"
                }</p></div>
                <div><span class="text-gray-500">Bank Name:</span><p class="font-bold text-gray-900">${
                  empData.bank_name || "-"
                }</p></div>
                <div><span class="text-gray-500">Account Number:</span><p class="font-bold text-gray-900">${
                  empData.bank_account || "-"
                }</p></div>
                <div><span class="text-gray-500">IFSC Code:</span><p class="font-bold text-gray-900">${
                  empData.ifsc_code || "-"
                }</p></div>
                <div><span class="text-gray-500">Branch Name:</span><p class="font-bold text-gray-900">${
                  empData.branch_name || "-"
                }</p></div>
                <div><span class="text-gray-500">Bank Type:</span><p class="font-bold text-gray-900">${
                  empData.bank_type || "-"
                }</p></div>
                <div><span class="text-gray-500">PAN Number:</span><p class="font-bold text-gray-900">${
                  empData.pan_number || "-"
                }</p></div>
                <div><span class="text-gray-500">PF Member ID:</span><p class="font-bold text-gray-900">${
                  empData.pf_member_id || "-"
                }</p></div>
                <div><span class="text-gray-500">UAN Number:</span><p class="font-bold text-gray-900">${
                  empData.uan_number || "-"
                }</p></div>
                <div><span class="text-gray-500">ESIC Number:</span><p class="font-bold text-gray-900">${
                  empData.esic_number || "-"
                }</p></div>
              </div>
            </div>

            <!-- 5. EMERGENCY CONTACT -->
            <div class="border border-gray-200 p-4 rounded-xl">
              <h3 class="text-xs font-black uppercase tracking-wider text-blue-600 border-b pb-1 mb-3">5. Emergency Contact Record</h3>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span class="text-gray-500">Contact Name:</span><p class="font-bold text-gray-900">${
                  empData.emergency_contact_name || "-"
                }</p></div>
                <div><span class="text-gray-500">Relationship:</span><p class="font-bold text-gray-900">${
                  empData.emergency_contact_relationship || "-"
                }</p></div>
                <div><span class="text-gray-500">Primary Mobile:</span><p class="font-bold text-gray-900">${
                  empData.emergency_contact_mobile || "-"
                }</p></div>
                <div><span class="text-gray-500">Alternate Mobile:</span><p class="font-bold text-gray-900">${
                  empData.emergency_contact_alternate_mobile || "-"
                }</p></div>
              </div>
            </div>

            <!-- 6. DOCUMENTS CHECKLIST -->
            <div class="border border-gray-200 p-4 rounded-xl">
              <h3 class="text-xs font-black uppercase tracking-wider text-blue-600 border-b pb-1 mb-3">6. Uploaded Documents Verification Checklist</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                ${docsHtml}
              </div>
            </div>

            <!-- FOOTER SIGNATURE -->
         
        </body>
      </html>
    `);
    newWin.document.close();
  };

  // ──────────────────────────────────────────────────
  // Generate the whole employee profile as a REAL, multi-page PDF using
  // jsPDF directly (replaces the old .html-file export).
  // ──────────────────────────────────────────────────
  const loadImageAsBase64 = (src) => {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      if (typeof src === "string" && src.startsWith("data:")) return resolve(src);

      fetch(src, { headers: { "ngrok-skip-browser-warning": "69420" } })
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.naturalWidth || img.width || 100;
              canvas.height = img.naturalHeight || img.height || 100;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL("image/png"));
            } catch (e) {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = src;
        });
    });
  };

  const loadBlackLogoAsBase64 = (src) => {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const w = img.naturalWidth || img.width || 300;
          const h = img.naturalHeight || img.height || 60;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a > 20) {
              const isRedEmblem = r > 140 && g < 110 && b < 110;
              if (!isRedEmblem) {
                // Convert white/light logo text to solid black (17, 24, 39)
                data[i] = 17;
                data[i + 1] = 24;
                data[i + 2] = 39;
              }
            }
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          console.warn("Logo recolor failed", e);
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  };

  const getResolvedUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    let targetUrl = url.trim();
    if (!targetUrl) return "";

    const apiDomain = API_BASE ? API_BASE.replace(/\/api\/?$/, "") : "";

    if (apiDomain.startsWith("https://") && targetUrl.startsWith("http://")) {
      targetUrl = targetUrl.replace(/^http:\/\//i, "https://");
    }

    if (
      !targetUrl.startsWith("http://") &&
      !targetUrl.startsWith("https://") &&
      !targetUrl.startsWith("data:") &&
      !targetUrl.startsWith("blob:")
    ) {
      targetUrl = `${apiDomain}${
        targetUrl.startsWith("/") ? "" : "/"
      }${targetUrl}`;
    } else if (
      apiDomain &&
      (targetUrl.includes("127.0.0.1:8000") ||
        targetUrl.includes("localhost:8000"))
    ) {
      targetUrl = targetUrl.replace(/^https?:\/\/[^\/]+/, apiDomain);
    }

    if (
      targetUrl.includes("ngrok") &&
      !targetUrl.includes("ngrok-skip-browser-warning")
    ) {
      targetUrl +=
        (targetUrl.includes("?") ? "&" : "?") +
        "ngrok-skip-browser-warning=69420";
    }

    return targetUrl;
  };

  const getDocFileUrl = (emp, docKey) => {
    if (!emp) return null;
    const candidates = [];

    if (docKey === "passport_size_photo") {
      candidates.push(
        emp.passport_size_photo,
        emp.profile_picture,
        emp.photo,
        emp.avatar,
        emp.image,
        emp.user_photo
      );
    } else if (docKey === "sslcCertificate") {
      candidates.push(
        emp.sslcCertificate,
        emp.sslc_certificate,
        emp.sslc,
        emp.sslc_doc,
        emp.sslc_file
      );
    } else if (docKey === "doc_12th_diploma_certificate") {
      candidates.push(
        emp.doc_12th_diploma_certificate,
        emp.hscCertificate,
        emp.hsccertificate,
        emp.hsc_certificate,
        emp.diploma_certificate,
        emp.doc_12th,
        emp.hsc_doc
      );
    } else if (docKey === "doc_degree_certificate") {
      candidates.push(
        emp.doc_degree_certificate,
        emp.degreeCertificate,
        emp.degreecertificate,
        emp.degree_certificate,
        emp.doc_degree,
        emp.degree_doc
      );
    } else if (docKey === "doc_postgraduate_certificate") {
      candidates.push(
        emp.doc_postgraduate_certificate,
        emp.pgCertificate,
        emp.pgcertificate,
        emp.postgraduate_certificate,
        emp.doc_pg,
        emp.pg_doc
      );
    } else if (docKey === "certificate_upload") {
      candidates.push(
        emp.certificate_upload,
        emp.additional_qualification,
        emp.certificate,
        emp.qualification_certificate,
        emp.cert_upload
      );
    } else if (docKey === "aadhaar_card") {
      candidates.push(
        emp.aadhaar_card,
        emp.aadhaar,
        emp.aadhaar_doc,
        emp.aadhaar_file,
        emp.aadhaar_card_doc
      );
    } else if (docKey === "pan_card") {
      candidates.push(
        emp.pan_card,
        emp.pan,
        emp.pan_doc,
        emp.pan_file,
        emp.pan_card_doc
      );
    } else if (docKey === "bank_passbook") {
      candidates.push(
        emp.bank_passbook,
        emp.passbook,
        emp.bank_proof,
        emp.passbook_file,
        emp.bank_passbook_doc
      );
    } else if (docKey === "salary_slips") {
      candidates.push(
        emp.salary_slips,
        emp.salary_slip,
        emp.pay_slips,
        emp.payslips,
        emp.salary_slips_doc
      );
    } else if (docKey === "offer_letter") {
      candidates.push(
        emp.offer_letter,
        emp.offerletter,
        emp.offer_doc,
        emp.offer_letter_doc
      );
    } else if (docKey === "relieving_letter") {
      candidates.push(
        emp.relieving_letter,
        emp.relievingletter,
        emp.relieving_doc,
        emp.experience_letter,
        emp.relieving_letter_doc
      );
    } else {
      candidates.push(emp[docKey]);
    }

    for (let c of candidates) {
      if (c && typeof c === "string" && c.trim() !== "") {
        const trimmed = c.trim();
        if (
          !/^\d+$/.test(trimmed) &&
          (trimmed.includes("/") || trimmed.includes("."))
        ) {
          return trimmed;
        }
      }
    }
    return null;
  };

  const generateEmployeeProfilePDF = async (emp) => {
    if (!emp) {
      showError("No employee data to generate a PDF from.");
      return;
    }

    try {
      setDownloadingProfilePdf(true);

      // Load black SPORTSTECH logo Base64
      let logoBase64 = await loadBlackLogoAsBase64(logoImg);
      if (!logoBase64) {
        logoBase64 = await loadImageAsBase64(logoImg);
      }

      const rawUserPic =
        emp.profile_picture ||
        emp.passport_size_photo ||
        emp.photo ||
        emp.avatar ||
        emp.image;

      let photoBase64 = null;

      // 1. Try reading directly from rendered DOM image if available
      const domImg = document.getElementById("modal-employee-profile-pic");
      if (domImg && domImg.complete && domImg.naturalWidth > 0) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = domImg.naturalWidth;
          canvas.height = domImg.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(domImg, 0, 0);
          photoBase64 = canvas.toDataURL("image/png");
        } catch (e) {
          console.warn("DOM image canvas conversion fallback", e);
        }
      }

      // 2. If DOM image canvas failed or wasn't present, fetch via URL
      if (!photoBase64 && rawUserPic && typeof rawUserPic === "string" && rawUserPic.trim() !== "") {
        const resolvedPicUrl = getResolvedUrl(rawUserPic) || rawUserPic;
        photoBase64 = await loadImageAsBase64(resolvedPicUrl);
      }

      // 3. Fallback to default gender profile avatar if no uploaded photo
      if (!photoBase64) {
        const fallbackAsset =
          emp.gender?.trim().toLowerCase() === "female"
            ? femaleProfile
            : maleProfile;
        photoBase64 = await loadImageAsBase64(fallbackAsset);
      }

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const marginX = 36;
      const contentW = pageW - marginX * 2;
      let y = 30;

      const ensureSpace = (needed) => {
        if (y + needed > pageH - 36) {
          doc.addPage();
          y = 36;
        }
      };

      // Header Banner
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", marginX, y, 140, 28);
      } else {
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39);
        doc.text("SPORTSTECH", marginX, y + 20);
      }

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(107, 114, 128);
      doc.text("OFFICIAL EMPLOYEE PROFILE RECORD", marginX, y + 40);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(
        `Record Date: ${new Date().toLocaleDateString()}`,
        pageW - marginX,
        y + 15,
        { align: "right" }
      );

      const isActive = emp.is_active !== false && emp.status !== "Inactive";
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      if (isActive) {
        doc.setTextColor(4, 120, 87);
        doc.text("ACTIVE EMPLOYEE", pageW - marginX, y + 30, {
          align: "right",
        });
      } else {
        doc.setTextColor(220, 38, 38);
        doc.text("INACTIVE EMPLOYEE", pageW - marginX, y + 30, {
          align: "right",
        });
      }

      y += 48;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(1.5);
      doc.line(marginX, y, pageW - marginX, y);
      y += 15;

      // Summary Box
      const boxHeight = 70;
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(1);
      doc.roundedRect(marginX, y, contentW, boxHeight, 8, 8, "FD");

      const photoBoxSize = 52;
      const photoX = marginX + 10;
      const photoY = y + 9;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(59, 130, 246);
      doc.roundedRect(photoX, photoY, photoBoxSize, photoBoxSize, 6, 6, "FD");

      if (photoBase64) {
        doc.addImage(
          photoBase64,
          "PNG",
          photoX + 2,
          photoY + 2,
          photoBoxSize - 4,
          photoBoxSize - 4
        );
      }

      const textX = photoX + photoBoxSize + 12;
      const fullName = `${emp.first_name || emp.name || "Employee"} ${
        emp.last_name || ""
      }`.trim();
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(fullName, textX, y + 26);

      const codeTitle = `${emp.designation || "Employee"} (${
        emp.emp_code || emp.id || "-"
      })`;
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(codeTitle, textX, y + 41);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      doc.text(emp.email || "-", textX, y + 54);

      const rightX = pageW - marginX - 12;
      doc.setFontSize(8.5);

      const deptVal = emp.department_name || emp.department || "-";
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      let rText = "Department: ";
      doc.text(rText, rightX - doc.getTextWidth(rText) - doc.getTextWidth(deptVal), y + 25);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(deptVal, rightX, y + 25, { align: "right" });

      const roleVal = emp.role_name || emp.role || "-";
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      rText = "Role: ";
      doc.text(rText, rightX - doc.getTextWidth(rText) - doc.getTextWidth(roleVal), y + 40);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(roleVal, rightX, y + 40, { align: "right" });

      const joinVal = emp.doj_date || "-";
      doc.setFont("helvetica", "normal");
      doc.setTextColor(107, 114, 128);
      rText = "Joining Date: ";
      doc.text(rText, rightX - doc.getTextWidth(rText) - doc.getTextWidth(joinVal), y + 55);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(joinVal, rightX, y + 55, { align: "right" });

      y += boxHeight + 12;

      const drawSectionCard = (title, fields, columns = 4) => {
        const rows = Math.ceil(fields.length / columns);
        const cardHeaderH = 22;
        const rowH = 26;
        const totalCardH = cardHeaderH + rows * rowH + 6;

        ensureSpace(totalCardH);

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(marginX, y, contentW, totalCardH, 6, 6, "FD");

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(29, 78, 216);
        doc.text(title, marginX + 10, y + 15);

        doc.setDrawColor(243, 244, 246);
        doc.line(marginX + 10, y + 20, marginX + contentW - 10, y + 20);

        const colWidth = (contentW - 20) / columns;
        fields.forEach(([label, val], idx) => {
          const col = idx % columns;
          const row = Math.floor(idx / columns);
          const cellX = marginX + 10 + col * colWidth;
          const cellY = y + cardHeaderH + 11 + row * rowH;

          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(107, 114, 128);
          doc.text(label, cellX, cellY);

          doc.setFontSize(8.5);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(17, 24, 39);
          const rawVal = String(val || "-");
          const safeVal = doc.splitTextToSize(rawVal, colWidth - 8)[0];
          doc.text(safeVal, cellX, cellY + 11);
        });

        y += totalCardH + 10;
      };

      drawSectionCard(
        "1. EMPLOYMENT & ORGANIZATION RECORD",
        [
          ["Employee Code:", emp.emp_code],
          ["Username:", emp.user_name],
          ["Official Email:", emp.email],
          ["Department:", emp.department_name || emp.department],
          ["Role:", emp.role_name || emp.role],
          ["Designation:", emp.designation],
          ["Employment Type:", emp.employment_type],
          ["Work Location:", emp.work_location],
          [
            "Reporting Manager:",
            emp.reporting_manager_name || emp.reporting_manager,
          ],
          ["Joining Date:", emp.doj_date],
          ["Probation Period:", emp.probation_period],
          ["Work From Home:", emp.is_wfh_enabled ? "Enabled" : "Disabled"],
          [
            "Deactivation Reason:",
            emp.deactivate_reason || emp.deactivation_reason,
          ],
        ],
        4
      );

      const personalFields = [
        ["Gender:", emp.gender],
        ["Date of Birth:", emp.dob_date],
        ["Marital Status:", emp.marital_status],
        ["Nationality:", emp.nationality],
        ["Blood Group:", emp.blood_group],
        ["Primary Mobile:", emp.mobile],
        ["Alternate Mobile:", emp.alternate_mobile],
        ["Personal Email:", emp.personal_email],
        [
          "Aadhaar Card Number:",
          getCleanDocNumber(
            emp.aadhaar_number,
            emp.aadhaar_card_number,
            emp.aadhaar_no
          ),
        ],
        [
          "PAN Card Number:",
          getCleanDocNumber(emp.pan_number, emp.pan_card_number, emp.pan_no),
        ],
      ];

      const currentAddr =
        [
          emp.current_address_line1,
          emp.current_address_line2,
          emp.current_city,
          emp.current_state,
          emp.current_country,
          emp.current_pincode,
        ]
          .filter(Boolean)
          .join(", ") || "-";

      const permAddr = emp.same_as_current
        ? "Same as Current Address"
        : [
            emp.permanent_address_line1,
            emp.permanent_address_line2,
            emp.permanent_city,
            emp.permanent_state,
            emp.permanent_country,
            emp.permanent_pincode,
          ]
            .filter(Boolean)
            .join(", ") || "-";

      const pRows = Math.ceil(personalFields.length / 4);
      const halfW = (contentW - 26) / 2;
      const cLines = doc.splitTextToSize(currentAddr, halfW - 10);
      const pLines = doc.splitTextToSize(permAddr, halfW - 10);
      const maxAddrLines = Math.max(cLines.length, pLines.length, 1);
      const addrBoxH = 22 + maxAddrLines * 11;

      const sec2H = 22 + pRows * 26 + addrBoxH + 12;
      ensureSpace(sec2H);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(marginX, y, contentW, sec2H, 6, 6, "FD");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(29, 78, 216);
      doc.text("2. PERSONAL & CONTACT INFORMATION", marginX + 10, y + 15);
      doc.setDrawColor(243, 244, 246);
      doc.line(marginX + 10, y + 20, marginX + contentW - 10, y + 20);

      const colW4 = (contentW - 20) / 4;
      personalFields.forEach(([label, val], idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const cellX = marginX + 10 + col * colW4;
        const cellY = y + 33 + row * 26;

        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128);
        doc.text(label, cellX, cellY);

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39);
        const rawVal = String(val || "-");
        const safeVal = doc.splitTextToSize(rawVal, colW4 - 8)[0];
        doc.text(safeVal, cellX, cellY + 11);
      });

      const addrY = y + 33 + pRows * 26 + 2;

      // Current Address Sub-card
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(marginX + 10, addrY, halfW, addrBoxH, 4, 4, "FD");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("CURRENT ADDRESS", marginX + 15, addrY + 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(cLines, marginX + 15, addrY + 23);

      // Permanent Address Sub-card
      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(marginX + 16 + halfW, addrY, halfW, addrBoxH, 4, 4, "FD");
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("PERMANENT ADDRESS", marginX + 21 + halfW, addrY + 12);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(pLines, marginX + 21 + halfW, addrY + 23);

      y += sec2H + 10;

      drawSectionCard(
        "3. EDUCATIONAL QUALIFICATION & EXPERIENCE",
        [
          ["Qualification:", emp.qualification],
          ["Course / Degree:", emp.course_degree],
          ["Specialization:", emp.specialization],
          ["Institution:", emp.institution_university],
          ["Year of Passing:", emp.year_of_passing],
          ["Percentage / CGPA:", emp.percentage_cgpa],
          ["Fresher Status:", emp.is_fresher ? "Fresher" : "Experienced"],
        ],
        4
      );

      drawSectionCard(
        "4. BANK ACCOUNT & PAYROLL RECORD",
        [
          ["Account Holder:", emp.account_holder_name],
          ["Bank Name:", emp.bank_name],
          ["Account Number:", emp.bank_account],
          ["IFSC Code:", emp.ifsc_code],
          ["Branch Name:", emp.branch_name],
          ["Bank Type:", emp.bank_type],
          ["PAN Number:", emp.pan_number],
          ["PF Member ID:", emp.pf_member_id],
          ["UAN Number:", emp.uan_number],
          ["ESIC Number:", emp.esic_number],
        ],
        4
      );

      drawSectionCard(
        "5. EMERGENCY CONTACT RECORD",
        [
          ["Contact Name:", emp.emergency_contact_name],
          ["Relationship:", emp.emergency_contact_relationship],
          ["Primary Mobile:", emp.emergency_contact_mobile],
          ["Alternate Mobile:", emp.emergency_contact_alternate_mobile],
        ],
        4
      );

      // ── SECTION 6: UPLOADED DOCUMENTS VERIFICATION CHECKLIST (2 COLUMNS) ──
      const docsChecklist = [
        { key: "passport_size_photo", label: "Passport Size Photo" },
        { key: "sslcCertificate", label: "SSLC Certificate" },
        { key: "doc_12th_diploma_certificate", label: "12th / Diploma Certificate" },
        { key: "doc_degree_certificate", label: "Degree Certificate" },
        { key: "doc_postgraduate_certificate", label: "Postgraduate Certificate" },
        { key: "certificate_upload", label: "Additional Qualification" },
        { key: "aadhaar_card", label: "Aadhaar Card" },
        { key: "pan_card", label: "PAN Card" },
        { key: "bank_passbook", label: "Bank Passbook" },
        { key: "salary_slips", label: "Salary Slips" },
        { key: "offer_letter", label: "Offer Letter" },
        { key: "relieving_letter", label: "Relieving Letter" },
      ];

      const docColumns = 2;
      const docRows = Math.ceil(docsChecklist.length / docColumns);
      const docCardH = 22 + docRows * 22 + 6;
      ensureSpace(docCardH);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(marginX, y, contentW, docCardH, 6, 6, "FD");

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(29, 78, 216);
      doc.text(
        "6. UPLOADED DOCUMENTS VERIFICATION CHECKLIST",
        marginX + 10,
        y + 15
      );
      doc.setDrawColor(243, 244, 246);
      doc.line(marginX + 10, y + 20, marginX + contentW - 10, y + 20);

      const colW2 = (contentW - 20) / docColumns;
      docsChecklist.forEach((docItem, idx) => {
        const col = idx % docColumns;
        const row = Math.floor(idx / docColumns);
        const cellX = marginX + 10 + col * colW2;
        const cellY = y + 33 + row * 22;
        const statusX = cellX + colW2 - 15;
        const fileUrl = getDocFileUrl(emp, docItem.key);
        const hasFile = !!fileUrl;

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39);
        doc.text(docItem.label, cellX, cellY);

        doc.setFontSize(8);
        if (hasFile) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(4, 120, 87);
          doc.text("Uploaded", statusX, cellY, { align: "right" });
        } else {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(156, 163, 175);
          doc.text("Not Uploaded", statusX, cellY, { align: "right" });
        }
      });

      y += docCardH + 12;

      ensureSpace(20);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.75);
      doc.line(marginX, y, pageW - marginX, y);
      y += 12;
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Official System Generated Employee Profile Record • Generated Date: ${new Date().toLocaleString()}`,
        marginX,
        y
      );

      const pdfBaseName = `${
        emp.first_name || emp.name || "Employee"
      }_${emp.emp_code || emp.id || ""}`.replace(/\s+/g, "_");
      const pdfFileName = `${pdfBaseName}_Profile_Record.pdf`;

      // Check uploaded documents to package alongside the PDF (excluding profile pictures)
      // Check uploaded documents to package alongside the PDF (including Passport Size Photo)
      const fileItems = [];
      const addedUrls = new Set();

      const ignoredPdfZipKeys = new Set([
        "passport_size_photo",
        "doc_passport_size_photo",
        "passport_photo",
        "passportphoto",
        "profile_picture",
        "profile_picture_url",
        "photo",
        "avatar",
        "image",
        "user_photo",
        "userphoto",
      ]);

      docsChecklist.forEach((dItem) => {
        if (ignoredPdfZipKeys.has(dItem.key.toLowerCase())) return;
        const rawUrl = getDocFileUrl(emp, dItem.key);
        if (rawUrl) {
          const cleanLabel = dItem.label
            .replace(/[\/\\]/g, "_")
            .replace(/\s+/g, "_");
          fileItems.push({ label: cleanLabel, rawUrl });
          addedUrls.add(rawUrl);
        }
      });

      Object.keys(emp).forEach((k) => {
        if (ignoredPdfZipKeys.has(k.toLowerCase())) return;
        const val = emp[k];
        if (val && typeof val === "string" && val.trim() !== "") {
          const trimmed = val.trim();
          if (
            !addedUrls.has(trimmed) &&
            !/^\d+$/.test(trimmed) &&
            (trimmed.startsWith("/media/") ||
              trimmed.startsWith("media/") ||
              trimmed.startsWith("/uploads/") ||
              trimmed.startsWith("uploads/") ||
              trimmed.startsWith("http://") ||
              trimmed.startsWith("https://")) &&
            /\.(pdf|png|jpe?g|webp|gif|doc|docx|svg)$/i.test(trimmed.split("?")[0])
          ) {
            const cleanKeyLabel = k
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())
              .replace(/[\/\\]/g, "_")
              .replace(/\s+/g, "_");
            fileItems.push({ label: cleanKeyLabel, rawUrl: trimmed });
            addedUrls.add(trimmed);
          }
        }
      });

      if (fileItems.length > 0) {
        // Employee has uploaded files -> Create ZIP containing Profile PDF + Uploaded Documents
        const zip = new JSZip();
        const folderName = `${pdfBaseName}_Full_Profile_Package`;
        const zipFolder = zip.folder(folderName);

        // 1. Add the generated Employee Profile PDF
        const pdfBlob = doc.output("blob");
        zipFolder.file(pdfFileName, pdfBlob);

        // 2. Add uploaded document files as flat files inside ZIP
        for (const item of fileItems) {
          const targetUrl = getResolvedUrl(item.rawUrl) || item.rawUrl;
          try {
            let blob = null;
            try {
              const res = await fetch(targetUrl, {
                headers: { "ngrok-skip-browser-warning": "69420" },
              });
              if (res.ok) blob = await res.blob();
            } catch (e1) {}

            if (!blob) {
              try {
                const res2 = await fetch(targetUrl);
                if (res2.ok) blob = await res2.blob();
              } catch (e2) {}
            }

            if (
              !blob &&
              /\.(png|jpe?g|webp|gif|svg)$/i.test(item.rawUrl.split("?")[0])
            ) {
              try {
                const base64 = await loadImageAsBase64(targetUrl);
                if (base64) {
                  const res3 = await fetch(base64);
                  if (res3.ok) blob = await res3.blob();
                }
              } catch (e3) {}
            }

            if (blob) {
              const urlWithoutQuery = item.rawUrl.split("?")[0];
              const extMatch = urlWithoutQuery.match(
                /\.(pdf|png|jpe?g|webp|gif|doc|docx|svg)$/i
              );
              const ext = extMatch ? extMatch[0].toLowerCase() : ".pdf";
              const cleanFileName = item.label
                .replace(/[\/\\]/g, "_")
                .replace(/\s+/g, "_");
              zipFolder.file(`${cleanFileName}${ext}`, blob);
            }
          } catch (errFile) {
            console.warn(`Failed to package ${item.label} in ZIP`, errFile);
          }
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFileName = `${folderName}.zip`;
        triggerBlobDownload(zipBlob, zipFileName);
      } else {
        // No uploaded docs -> Save PDF directly
        doc.save(pdfFileName);
        showSuccess(`Downloaded ${pdfFileName} successfully!`);
      }
    } catch (err) {
      console.error("Failed to generate employee profile PDF", err);
      showError("Failed to generate the profile PDF.");
    } finally {
      setDownloadingProfilePdf(false);
    }
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!location.state?.openProfileEdit || employees.length === 0) {
      return;
    }

    const userIds = [
      localStorage.getItem("user_id"),
      localStorage.getItem("employee_id"),
      localStorage.getItem("emp_id"),
    ]
      .filter((value) => value !== null && value !== undefined && value !== "")
      .map((value) => String(value));

    const currentEmployee = employees.find((employee) => {
      const candidateIds = [
        employee.id,
        employee.user_id,
        employee.employee_id,
        employee.emp_id,
      ]
        .filter(
          (value) => value !== null && value !== undefined && value !== ""
        )
        .map((value) => String(value));

      return candidateIds.some((candidateId) => userIds.includes(candidateId));
    });

    if (currentEmployee) {
      handleEditEmployee(currentEmployee);
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [employees, location.pathname, location.state, navigate]);

  const handleStatusToggle = (emp, currentIsActive) => {
    const confirmButtonColor = currentIsActive ? "#dc2626" : "#16a34a";
    const confirmText = currentIsActive ? "Yes, Deactivate" : "Yes, Activate";

    if (currentIsActive) {
      Swal.fire({
        title: "Confirm Status Change",
        text: `Are you sure you want to deactivate ${emp.first_name}?`,
        icon: "warning",
        input: "text",
        inputLabel: "Deactivation Reason",
        inputPlaceholder: "Enter reason for deactivation",
        inputValidator: (value) => {
          if (!value) return "Deactivation reason is required!";
        },
        showCancelButton: true,
        confirmButtonColor: confirmButtonColor,
        cancelButtonColor: "#6b7280",
        confirmButtonText: confirmText,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          updateEmployeeStatus(emp, false, result.value);
        }
      });
    } else {
      Swal.fire({
        title: "Confirm Status Change",
        text: `Are you sure you want to activate ${emp.first_name}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: confirmButtonColor,
        cancelButtonColor: "#6b7280",
        confirmButtonText: confirmText,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          updateEmployeeStatus(emp, true);
        }
      });
    }
  };

  const updateEmployeeStatus = (emp, newStatus, deactivationReason = "") => {
    setTogglingId(emp.id);
    const statusData = { id: emp.id, is_active: newStatus };
    if (!newStatus && deactivationReason) {
      statusData.deactivation_reason = deactivationReason;
    }
    employeeAPI.updateEmployeeStatus(
      emp.id,
      statusData,
      (response) => {
        showSuccess(
          `Employee status updated to ${newStatus ? "Active" : "Inactive"}`
        );
        fetchEmployees();
        setTogglingId(null);
      },
      (error) => {
        showError(error?.message || "Failed to update employee status");
        setTogglingId(null);
      }
    );
  };

  const getEmployeeAuthIdentifiers = (emp) => {
    const userId = emp.user_id || emp.user?.id || emp.user || null;
    const empId = emp.employee_id || emp.id || emp.emp_id || null;
    return { userId, empId };
  };

  const updateEmployeeAuthStatus = (emp, newAuthStatus) => {
    const { empId } = getEmployeeAuthIdentifiers(emp);
    const userId = 1;

    setAuthTogglingId(emp.id);
    employeeAPI.updateEmployeeAuthStatus(
      userId,
      empId,
      newAuthStatus,
      () => {
        showSuccess(
          `Employee authorization ${newAuthStatus ? "enabled" : "disabled"}`
        );
        fetchEmployees();
        setAuthTogglingId(null);
      },
      (error) => {
        showError(error?.message || "Failed to update employee authorization");
        setAuthTogglingId(null);
      }
    );
  };

  // Key used to share the Work From Home status with the Dashboard view.
  const WFH_STORAGE_KEY = "wfh_status_map";

  const handleWorkFromHomeToggle = (emp, currentIsWfh) => {
    const actionText = currentIsWfh
      ? "turn off work from home"
      : "mark as work from home";
    const confirmText = currentIsWfh ? "Yes, Turn Off" : "Yes, Mark WFH";
    const confirmButtonColor = currentIsWfh ? "#dc2626" : "#16a34a";

    Swal.fire({
      title: "Confirm Work From Home Change",
      text: `Are you sure you want to ${actionText} for ${
        emp.user_name || emp.name || "-"
      }?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: "#6b7280",
      confirmButtonText: confirmText,
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        updateEmployeeWorkFromHome(emp, !currentIsWfh);
      }
    });
  };

  const updateEmployeeWorkFromHome = (emp, newWfhStatus) => {
    const { empId } = getEmployeeAuthIdentifiers(emp);
    const requesterId = Number(localStorage.getItem("user_id")) || 1;

    setWfhTogglingId(emp.id);
    wfhAPI.updateEmployeeWorkFromHome(
      requesterId,
      empId,
      newWfhStatus,
      () => {
        showSuccess(
          `Work from home ${newWfhStatus ? "enabled" : "disabled"} for ${
            emp.user_name || emp.name || "employee"
          }`
        );
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === emp.id ? { ...e, is_wfh_enabled: newWfhStatus } : e
          )
        );
        // Persist so the Dashboard can show a Work From Home / check-in banner.
        // Keyed by emp.id since that's what matches localStorage "user_id"
        // for the logged-in employee (see the currentEmployee lookup above).
        try {
          const raw = localStorage.getItem(WFH_STORAGE_KEY);
          const map = raw ? JSON.parse(raw) : {};
          map[emp.id] = newWfhStatus;
          localStorage.setItem(WFH_STORAGE_KEY, JSON.stringify(map));
        } catch (e) {
          // ignore storage errors
        }
        setWfhTogglingId(null);
      },
      (error) => {
        showError(error?.message || "Failed to update work from home status");
        setWfhTogglingId(null);
      }
    );
  };

  const handleDeleteEmployee = (id, name) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        employeeAPI.deleteEmployee(
          id,
          (response) => {
            showSuccess(response?.message || `${name} deleted successfully`);
            setTimeout(() => fetchEmployees(), 500);
          },
          (error) => {
            showError(error?.message || "Failed to delete employee");
          }
        );
      }
    });
  };

  const columns = useMemo(() => {
    const loggedInUserId = Number(localStorage.getItem("user_id"));
    const currentEmployee = employees.find(
      (emp) => Number(emp.id) === loggedInUserId
    );
    const showEmployeeProbationColumn =
      !isAdmin && currentEmployee?.is_probationary === true;

    return [
      // S.NO
      columnHelper.display({
        id: "sno",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white">
            S.NO
          </p>
        ),
        cell: (info) => (
          <p className="text-xs font-bold text-navy-700 dark:text-white">
            {(currentPage - 1) * ITEMS_PER_PAGE + info.row.index + 1}
          </p>
        ),
      }),

      // NAME
      columnHelper.accessor("name", {
        id: "name",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white">
            NAME
          </p>
        ),
        cell: (info) => {
          const emp = info.row.original;
          const profileSrc =
            emp.profile_picture && emp.profile_picture.trim() !== ""
              ? emp.profile_picture
              : emp.gender?.trim().toLowerCase() === "female"
              ? femaleProfile
              : maleProfile;
          return (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900">
                <img
                  className="h-full w-full rounded-full object-cover"
                  src={profileSrc}
                  alt="Profile"
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <p className="max-w-[170px] truncate text-xs font-bold text-navy-700 dark:text-white">
                  {info.getValue() || "-"}
                </p>
                <p className="max-w-[170px] truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  {emp.emp_code || "-"}
                </p>
              </div>
            </div>
          );
        },
      }),

      // JOIN DATE
      columnHelper.accessor("joinDate", {
        id: "joinDate",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white">
            JOIN DATE
          </p>
        ),
        cell: (info) => (
          <p className="text-violet-700 dark:text-violet-300 whitespace-nowrap text-xs font-semibold">
            {info.getValue() || "-"}
          </p>
        ),
      }),

      // EMAIL
      columnHelper.accessor("email", {
        id: "email",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white">
            EMAIL
          </p>
        ),
        cell: (info) => (
          <p className="text-sky-700 dark:text-sky-300 max-w-[280px] break-all text-xs font-semibold xl:max-w-[360px]">
            {info.getValue() || "-"}
          </p>
        ),
      }),

      // ROLE
      columnHelper.accessor("role_name", {
        id: "role_name",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white">
            ROLE
          </p>
        ),
        cell: (info) => (
          <p className="max-w-[120px] truncate text-xs text-navy-700 dark:text-white">
            {info.getValue() || "-"}
          </p>
        ),
      }),

      // DEPARTMENT
      columnHelper.accessor("department_name", {
        id: "department_name",
        header: () => (
          <p className="text-xs font-bold text-gray-600 dark:text-white">
            DEPARTMENT
          </p>
        ),
        cell: (info) => (
          <p className="max-w-[120px] truncate text-xs text-navy-700 dark:text-white">
            {info.getValue() || "-"}
          </p>
        ),
      }),
      ...(showEmployeeProbationColumn
        ? [
            columnHelper.accessor("is_probationary", {
              id: "employee_probation_status",
              header: () => (
                <p className="text-xs font-bold text-gray-600 dark:text-white">
                  PROBATION PERIOD
                </p>
              ),
              cell: () => (
                <p className="whitespace-nowrap text-xs font-semibold text-green-600 dark:text-green-400">
                  Active
                </p>
              ),
            }),
          ]
        : []),
      ...(isAdmin
        ? [
            // PROBATIONARY
            columnHelper.accessor("is_probationary", {
              id: "is_probationary",
              header: () => (
                <div className="flex justify-center">
                  <p className="text-xs font-bold text-gray-600 dark:text-white">
                    PROBATION PERIOD
                  </p>
                </div>
              ),
              cell: (info) => {
                const emp = info.row.original;
                const isProbationary = emp.is_probationary;
                const isToggling = probationTogglingId === emp.id;
                return (
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleProbationToggle(emp, isProbationary)}
                      disabled={isToggling}
                      className="relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-all hover:opacity-80 disabled:opacity-50"
                    >
                      <div
                        className={`h-6 w-11 rounded-full transition-all duration-300 ${
                          isProbationary
                            ? "bg-green-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
                          isProbationary ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              },
            }),

            // STATUS
            columnHelper.accessor("status", {
              id: "status",
              header: () => (
                <p className="text-xs font-bold text-gray-600 dark:text-white">
                  STATUS
                </p>
              ),
              cell: (info) => {
                const emp = info.row.original;
                const isActive = emp.is_active || info.getValue() === "Active";
                const isToggling = togglingId === emp.id;
                return (
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleStatusToggle(emp, isActive)}
                      disabled={isToggling}
                      className="relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-all hover:opacity-80 disabled:opacity-50"
                    >
                      <div
                        className={`h-6 w-11 rounded-full transition-all duration-300 ${
                          isActive
                            ? "bg-green-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
                          isActive ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              },
            }),

            columnHelper.accessor("is_authorized", {
              id: "is_authorized",
              header: () => (
                <p className="text-xs font-bold text-gray-600 dark:text-white">
                  AUTHORIZED
                </p>
              ),
              cell: (info) => {
                const emp = info.row.original;
                const isAuthorized = emp.is_authorized === true;
                const isToggling = authTogglingId === emp.id;

                return (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateEmployeeAuthStatus(emp, !isAuthorized)
                      }
                      disabled={isToggling}
                      className="relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-all hover:opacity-80 disabled:opacity-50"
                    >
                      <div
                        className={`h-6 w-11 rounded-full transition-all duration-300 ${
                          isAuthorized
                            ? "bg-green-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
                          isAuthorized ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              },
            }),

            // WORK FROM HOME
            columnHelper.accessor("is_wfh_enabled", {
              id: "is_wfh_enabled",
              header: () => (
                <div className="flex justify-center">
                  <p className="text-xs font-bold text-gray-600 dark:text-white">
                    WORK FROM HOME
                  </p>
                </div>
              ),
              cell: (info) => {
                const emp = info.row.original;
                const isWfh = emp.is_wfh_enabled === true;
                const isToggling = wfhTogglingId === emp.id;
                return (
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleWorkFromHomeToggle(emp, isWfh)}
                      disabled={isToggling}
                      className="relative inline-flex h-6 w-11 cursor-pointer rounded-full transition-all hover:opacity-80 disabled:opacity-50"
                    >
                      <div
                        className={`h-6 w-11 rounded-full transition-all duration-300 ${
                          isWfh
                            ? "bg-green-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                      <div
                        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
                          isWfh ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                );
              },
            }),
          ]
        : []),

      // ACTIONS
      columnHelper.display({
        id: "actions",
        header: () => (
          <div className="flex justify-center">
            <p className="text-xs font-bold text-gray-600 dark:text-white">
              ACTIONS
            </p>
          </div>
        ),
        cell: (info) => {
          const emp = info.row.original;
          return (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleViewDetails(emp)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                title="View Full Profile & Documents"
              >
                <IoDocumentText size={18} />
                <span>View</span>
              </button>

              <button
                onClick={() => handleEditEmployee(emp)}
                className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
                title="Edit Employee"
              >
                <MdEdit size={18} />
              </button>
            </div>
          );
        },
      }),
    ];
  }, [
    employees,
    isAdmin,
    togglingId,
    authTogglingId,
    probationTogglingId,
    wfhTogglingId,
    currentPage,
  ]);

  // ── UPDATED: filteredEmployees now includes probation filter ──
  const filteredEmployees = useMemo(() => {
    const loggedInUserId = Number(localStorage.getItem("user_id"));
    const isSuperAdmin =
      localStorage.getItem("is_super_admin") === "true" ||
      localStorage.getItem("is_super_admin") === true;

    let filtered = employees;

    if (!isSuperAdmin) {
      filtered = employees.filter((emp) => Number(emp.id) === loggedInUserId);
    }

    // ── Probation filter ──
    if (probationFilter === "on") {
      filtered = filtered.filter((emp) => emp.is_probationary === true);
    } else if (probationFilter === "off") {
      filtered = filtered.filter((emp) => emp.is_probationary !== true);
    }

    // ── Authorized filter ──
    if (authorizedFilter === "authorized") {
      filtered = filtered.filter((emp) => emp.is_authorized === true);
    } else if (authorizedFilter === "not_authorized") {
      filtered = filtered.filter((emp) => emp.is_authorized !== true);
    }

    // ── Work From Home filter ──
    if (wfhFilter === "wfh") {
      filtered = filtered.filter((emp) => emp.is_wfh_enabled === true);
    } else if (wfhFilter === "not_wfh") {
      filtered = filtered.filter((emp) => emp.is_wfh_enabled !== true);
    }

    if (!searchTerm.trim()) return filtered;

    const searchLower = searchTerm.toLowerCase();
    return filtered.filter(
      (emp) =>
        (emp.name && emp.name.toLowerCase().includes(searchLower)) ||
        (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
        (emp.emp_code && emp.emp_code.toLowerCase().includes(searchLower)) ||
        (emp.role_name && emp.role_name.toLowerCase().includes(searchLower)) ||
        (emp.department_name &&
          emp.department_name.toLowerCase().includes(searchLower)) ||
        (emp.status && emp.status.toLowerCase().startsWith(searchLower)) ||
        (emp.is_authorized === true ? "authorized" : "not authorized").includes(
          searchLower
        )
    );
  }, [
    employees,
    searchTerm,
    probationFilter,
    authorizedFilter,
    wfhFilter,
    isAdmin,
  ]);

  // ── UPDATED: reset page on search OR filter change ──
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, probationFilter, authorizedFilter, wfhFilter]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  const table = useReactTable({
    data: paginatedEmployees,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const probationaryCount = filteredEmployees.filter(
    (emp) => emp.is_probationary === true
  ).length;
  const activeCount = filteredEmployees.filter(
    (emp) => emp.is_active || emp.status === "Active"
  ).length;
  const isSelfViewOnlyMode = !isSuperAdmin;
  const selfEmployee = filteredEmployees[0] || null;
  const selfProfileSrc =
    selfEmployee?.profile_picture && selfEmployee.profile_picture.trim() !== ""
      ? selfEmployee.profile_picture
      : selfEmployee?.gender?.trim().toLowerCase() === "female"
      ? femaleProfile
      : maleProfile;
  const selfDobRaw =
    selfEmployee?.dob ||
    selfEmployee?.date_of_birth ||
    selfEmployee?.dob_date ||
    selfEmployee?.birth_date ||
    "";
  const selfDobLabel = selfDobRaw
    ? new Date(selfDobRaw).toString() !== "Invalid Date"
      ? new Date(selfDobRaw).toLocaleDateString()
      : selfDobRaw
    : "-";
  const selfMobileLabel =
    selfEmployee?.mobile_number ||
    selfEmployee?.mobile ||
    selfEmployee?.phone_number ||
    selfEmployee?.phone ||
    selfEmployee?.contact_number ||
    "-";
  const selfAuthorizedLabel =
    selfEmployee?.is_authorized === true ? "Authorized" : "Not Authorized";

  return (
    <div className="mt-3 grid h-full grid-cols-1 gap-5">
      <Card extra={"w-full h-full px-4 pb-4 sm:px-6 sm:pb-6 overflow-visible"}>
        {/* HEADER */}
        <div className="flex flex-col gap-3 pt-4 sm:gap-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy-700 dark:text-white sm:text-xl">
                {isSuperAdmin ? "Employees List" : "Employee Details"}
                <span className="text-black-500 ml-2 dark:text-gray-400">
                  {isSuperAdmin ? `(${filteredEmployees.length})` : ""}
                </span>
              </h2>

              {isSuperAdmin && (
                <span className="ml-3 text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                  On Probation: {probationaryCount}
                </span>
              )}
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setIsEditMode(false);
                  setEditingEmployee(null);
                  setIsModalOpen(true);
                }}
                className="linear w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white transition duration-200 hover:bg-blue-600 active:bg-brand-700 dark:bg-brand-400 dark:text-white dark:hover:bg-blue-500 dark:active:bg-brand-600 sm:w-auto sm:text-base"
              >
                + Add Employee
              </button>
            )}
          </div>

          {/* SEARCH + PROBATION FILTER */}
          {isSuperAdmin && (
            <div className="flex flex-col items-stretch gap-3">
              {/* Search input */}
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Search by name, email, employee code, role, department, status, authorized..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:placeholder-gray-500"
                />
              </div>

              {/* Filters row (below search bar) */}
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <div className="mx-auto flex w-full max-w-xs overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-navy-700">
                  {[
                    { label: "All", value: "all" },
                    { label: "On Probation", value: "on" },
                    { label: "Non Probation", value: "off" },
                  ].map((opt, idx, arr) => (
                    <button
                      key={opt.value}
                      onClick={() => setProbationFilter(opt.value)}
                      className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all
          ${
            probationFilter === opt.value
              ? "bg-blue-500 text-white shadow"
              : "bg-transparent text-gray-600 dark:text-gray-300"
          }
          ${idx === 0 ? "rounded-l-full" : ""}
          ${idx === arr.length - 1 ? "rounded-r-full" : ""}
          `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="mx-auto flex w-full max-w-xs overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-navy-700">
                  {[
                    { label: "All Auth", value: "all" },
                    { label: "Authorized", value: "authorized" },
                    { label: "Not Auth", value: "not_authorized" },
                  ].map((opt, idx, arr) => (
                    <button
                      key={opt.value}
                      onClick={() => setAuthorizedFilter(opt.value)}
                      className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all
          ${
            authorizedFilter === opt.value
              ? "bg-blue-500 text-white shadow"
              : "bg-transparent text-gray-600 dark:text-gray-300"
          }
          ${idx === 0 ? "rounded-l-full" : ""}
          ${idx === arr.length - 1 ? "rounded-r-full" : ""}
          `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="mx-auto flex w-full max-w-xs overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-navy-700">
                  {[
                    { label: "All WFH", value: "all" },
                    { label: "WFH", value: "wfh" },
                    { label: "In Office", value: "not_wfh" },
                  ].map((opt, idx, arr) => (
                    <button
                      key={opt.value}
                      onClick={() => setWfhFilter(opt.value)}
                      className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all
          ${
            wfhFilter === opt.value
              ? "bg-blue-500 text-white shadow"
              : "bg-transparent text-gray-600 dark:text-gray-300"
          }
          ${idx === 0 ? "rounded-l-full" : ""}
          ${idx === arr.length - 1 ? "rounded-r-full" : ""}
          `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Clear search button */}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TABLE SECTION */}
        <div className="mt-6 sm:mt-8">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading employees...
              </p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                No employees found
              </p>
              <button
                onClick={fetchEmployees}
                className="text-sm font-semibold text-[#0EA5E9] hover:text-[#0EA5E9]"
              >
                ↻ Refresh
              </button>
            </div>
          ) : isSelfViewOnlyMode ? (
            !selfEmployee ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No employee details found.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-navy-800 sm:p-6 lg:p-7">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full ring-4 ring-blue-100 dark:ring-blue-400/20 sm:h-20 sm:w-20">
                      <img
                        className="h-full w-full rounded-full object-cover"
                        src={selfProfileSrc}
                        alt="Profile"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-navy-700 dark:text-white sm:text-xl">
                        {selfEmployee.name || "-"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {selfEmployee.emp_code || "-"} ·{" "}
                        {selfEmployee.department_name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleViewDocuments(selfEmployee)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-2 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-indigo-600"
                      title="View Documents"
                    >
                      <FaEye size={16} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleEditEmployee(selfEmployee)}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-2 text-sm font-semibold text-white transition hover:from-blue-600 hover:to-indigo-600"
                      title="Edit Employee"
                    >
                      <MdEdit size={16} />
                      Edit
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div
                    className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 dark:border-indigo-400/20 dark:bg-indigo-400/10"
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#0284c7" }}
                    >
                      Email
                    </p>
                    <p className="mt-1 break-all text-sm font-bold">
                      {selfEmployee.email || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 dark:border-indigo-400/20 dark:bg-indigo-400/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                      Role
                    </p>
                    <p className="mt-1 text-sm font-bold text-navy-700 dark:text-white">
                      {selfEmployee.role_name || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 dark:border-cyan-400/20 dark:bg-cyan-400/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
                      Department
                    </p>
                    <p className="mt-1 text-sm font-bold text-navy-700 dark:text-white">
                      {selfEmployee.department_name || "-"}
                    </p>
                  </div>
                  <div
                    className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 dark:border-indigo-400/20 dark:bg-indigo-400/10"
                    style={{
                      backgroundColor: "rgba(139, 92, 246, 0.12)",
                    }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#7c3aed" }}
                    >
                      Join Date
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {selfEmployee.joinDate || "-"}
                    </p>
                  </div>
                  <div
                    className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 dark:border-indigo-400/20 dark:bg-indigo-400/10"
                    style={{
                      backgroundColor: "rgba(34, 197, 94, 0.12)",
                    }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "#16a34a" }}
                    >
                      Status
                    </p>
                    <p
                      className="mt-1 inline-flex w-fit rounded-full px-2.5 py-0.5 text-sm font-bold"
                      style={{
                        backgroundColor:
                          selfEmployee.status === "Active"
                            ? "rgba(34, 197, 94, 0.16)"
                            : "rgba(239, 68, 68, 0.16)",
                        color:
                          selfEmployee.status === "Active"
                            ? "#15803d"
                            : "#b91c1c",
                      }}
                    >
                      {selfEmployee.status || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-400/20 dark:bg-blue-400/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
                      Authorized
                    </p>
                    <p className="mt-1 text-sm font-bold text-navy-700 dark:text-white">
                      {selfAuthorizedLabel}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 dark:border-amber-400/20 dark:bg-amber-400/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                      Probation
                    </p>
                    <p
                      className="mt-1 inline-flex w-fit rounded-full px-2.5 py-0.5 text-sm font-bold"
                      style={{
                        backgroundColor: selfEmployee.is_probationary
                          ? "rgba(34, 197, 94, 0.16)"
                          : "rgba(239, 68, 68, 0.16)",
                        color: selfEmployee.is_probationary
                          ? "#15803d"
                          : "#b91c1c",
                      }}
                    >
                      {selfEmployee.is_probationary ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-pink-100 bg-pink-50/70 p-3 dark:border-pink-400/20 dark:bg-pink-400/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-pink-600 dark:text-pink-300">
                      DOB
                    </p>
                    <p className="mt-1 text-sm font-bold text-navy-700 dark:text-white">
                      {selfDobLabel}
                    </p>
                  </div>
                  <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-3 dark:border-teal-400/20 dark:bg-teal-400/10">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-300">
                      Mobile Number
                    </p>
                    <p className="mt-1 text-sm font-bold text-navy-700 dark:text-white">
                      {selfMobileLabel}
                    </p>
                  </div>
                </div>
              </div>
            )
          ) : (
            <>
              {/* ========== MOBILE CARD VIEW ========== */}
              <div className="block lg:hidden">
                {paginatedEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No employees match the selected filter.
                    </p>
                  </div>
                ) : (
                  paginatedEmployees.map((emp, idx) => {
                    const profileSrc =
                      emp.profile_picture && emp.profile_picture.trim() !== ""
                        ? emp.profile_picture
                        : emp.gender?.trim().toLowerCase() === "female"
                        ? femaleProfile
                        : maleProfile;
                    const isSelf =
                      Number(localStorage.getItem("user_id")) === emp.id;
                    const serialNumber =
                      (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;

                    return (
                      <div
                        key={emp.id || idx}
                        className="mb-4 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-md dark:bg-navy-800/90 dark:text-white"
                      >
                        {/* Card Header */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700">
                            {serialNumber}
                          </div>
                          <div className="h-10 w-10 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900">
                            <img
                              className="h-full w-full rounded-full object-cover"
                              src={profileSrc}
                              alt="Profile"
                            />
                          </div>
                          <div>
                            <div className="font-extrabold text-navy-900 dark:text-white">
                              {emp.name || "-"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-300">
                              {emp.department_name || "-"}
                            </div>
                          </div>
                        </div>

                        <hr className="border-gray-200 dark:border-gray-600" />

                        {/* Card Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                              Role
                            </p>
                            <p className="font-bold text-navy-900 dark:text-white">
                              {emp.role_name || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                              Join Date
                            </p>
                            <p className="text-violet-700 dark:text-violet-300 font-bold">
                              {emp.joinDate || "-"}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                              Email
                            </p>
                            <p className="text-sky-700 dark:text-sky-300 break-all font-bold">
                              {emp.email || "-"}
                            </p>
                          </div>

                          {/* Status */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                              Status
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusToggle(
                                      emp,
                                      emp.status === "Active"
                                    )
                                  }
                                  className="relative inline-flex h-6 w-11 rounded-full transition-all"
                                >
                                  <div
                                    className={`h-6 w-11 rounded-full ${
                                      emp.status === "Active"
                                        ? "bg-green-500"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <div
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
                                      emp.status === "Active"
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              )}
                              <span
                                className={`rounded-full px-2 py-0.5 text-sm font-bold ${
                                  emp.status === "Active"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                }`}
                              >
                                {emp.status}
                              </span>
                            </div>
                          </div>

                          {/* Probationary */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                              Probationary
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleProbationToggle(
                                      emp,
                                      emp.is_probationary
                                    )
                                  }
                                  className="relative inline-flex h-6 w-11 rounded-full transition-all"
                                >
                                  <div
                                    className={`h-6 w-11 rounded-full ${
                                      emp.is_probationary
                                        ? "bg-green-500"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <div
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
                                      emp.is_probationary
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              )}
                              <span
                                className={`text-sm font-bold ${
                                  emp.is_probationary
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {emp.is_probationary ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                              Authorized
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateEmployeeAuthStatus(
                                      emp,
                                      !(emp.is_authorized === true)
                                    )
                                  }
                                  disabled={authTogglingId === emp.id}
                                  className="relative inline-flex h-6 w-11 rounded-full transition-all disabled:opacity-50"
                                >
                                  <div
                                    className={`h-6 w-11 rounded-full ${
                                      emp.is_authorized === true
                                        ? "bg-green-500"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <div
                                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
                                      emp.is_authorized === true
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        <hr className="border-gray-200 dark:border-gray-600" />

                        {/* Card Actions */}
                        <div className="flex items-center justify-center gap-4">
                          <button
                            onClick={() => handleViewDetails(emp)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300"
                            title="View Full Profile & Documents"
                          >
                            <IoDocumentText size={18} />
                            <span>View</span>
                          </button>
                          {(isAdmin || isSelf) && (
                            <button
                              onClick={() => handleEditEmployee(emp)}
                              className="text-blue-600 dark:text-blue-400"
                              title="Edit Employee"
                            >
                              <MdEdit size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ========== DESKTOP TABLE VIEW ========== */}
              <div className="hidden lg:block">
                {paginatedEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No employees match the selected filter.
                    </p>
                  </div>
                ) : (
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr
                          key={headerGroup.id}
                          className="border-b border-gray-200 dark:border-gray-700"
                        >
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              className="px-3 py-3 text-left align-middle"
                              onClick={header.column.getToggleSortingHandler()}
                              style={{ cursor: "pointer" }}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="px-3 py-4 text-left align-middle"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>

        {/* PAGINATION */}
        {isSuperAdmin && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredEmployees.length}
            onPageChange={setCurrentPage}
            className="mt-6 pb-4 sm:mt-8"
          />
        )}
      </Card>

      {/* ADD / EDIT MODAL */}
      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setIsEditMode(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleEmployeeSubmit}
        isEditMode={isEditMode}
        editingEmployee={editingEmployee}
      />

      {/* FULL DETAILS & DOCUMENTS MODAL - A4 SHEET FORMAT */}
      {detailModalOpen && selectedEmployeeForDetails && (
        <div className="bg-black/70 fixed inset-0 z-50 flex justify-center overflow-y-auto p-2 backdrop-blur-sm sm:p-6 print:static print:inset-auto print:bg-white print:p-0">
          {/* Print Scope Style Injector */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #employee-a4-document, #employee-a4-document * {
                visibility: visible !important;
              }
              #employee-a4-document {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 15mm !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                color: black !important;
              }
              .print\\:hidden {
                display: none !important;
              }
            }
          `}</style>

          <div
            id="employee-a4-document"
            className="print:text-black relative my-auto w-full max-w-[210mm] rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-800 sm:p-10 print:w-full print:max-w-none print:border-none print:p-4 print:shadow-none"
          >
            {/* Top Action Bar (Hidden when Printing) */}
            <div className="sticky top-0 z-30 mb-6 flex items-center justify-between border-b border-gray-200 bg-white/95 pb-4 backdrop-blur dark:border-gray-700 dark:bg-navy-800/95 print:hidden">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                  A4 Profile Document
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ID:{" "}
                  {selectedEmployeeForDetails.emp_code ||
                    selectedEmployeeForDetails.id}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleOpenProfileInNewTab(selectedEmployeeForDetails)
                  }
                  className="flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-600 shadow-sm transition-all hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60"
                  title="Open Full Profile Document in New Tab"
                >
                  <FaExternalLinkAlt size={12} />
                  <span>Open in New Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    generateEmployeeProfilePDF(selectedEmployeeForDetails)
                  }
                  disabled={downloadingProfilePdf}
                  className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-600 hover:shadow-lg disabled:opacity-60 dark:bg-brand-400 dark:hover:bg-brand-500"
                  title="Download Employee Profile as PDF"
                >
                  <FaDownload size={13} />
                  <span>
                    {downloadingProfilePdf
                      ? "Generating PDF..."
                      : "Download Profile Document"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 dark:bg-navy-700 dark:text-gray-300 dark:hover:bg-navy-600"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex h-96 w-full flex-col items-center justify-center gap-3">
                <div className="border-t-transparent h-10 w-10 animate-spin rounded-full border-4 border-brand-500"></div>
                <p className="text-sm font-semibold text-navy-700 dark:text-white">
                  Generating A4 Profile Document...
                </p>
              </div>
            ) : (
              /* A4 PAPER CONTAINER SHEET */
              <div className="mx-auto space-y-6 text-sm">
                {/* ── A4 LETTERHEAD / HEADER BANNER ── */}
                <div className="flex flex-col justify-between border-b-2 border-brand-500 pb-5 sm:flex-row sm:items-center">
                  <div>
                    <img
                      src={processedBlackLogo || logoImg}
                      alt="SPORTSTECH"
                      className="h-7 w-auto object-contain sm:h-8"
                    />
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 sm:text-xs print:text-gray-700">
                      Official Employee Profile Record
                    </p>
                  </div>
                  <div className="mt-2 text-right sm:mt-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Record Date: {new Date().toLocaleDateString()}
                    </p>
                    <p className="print:text-black text-xs font-bold text-navy-700 dark:text-white">
                      Status:{" "}
                      <span
                        className={
                          selectedEmployeeForDetails.is_active
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {selectedEmployeeForDetails.is_active
                          ? "ACTIVE EMPLOYEE"
                          : "INACTIVE EMPLOYEE"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* ── EMPLOYEE SUMMARY CARD ── */}
                <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-navy-700/50 sm:flex-row sm:items-center sm:justify-between print:border-gray-300 print:bg-white">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-brand-500 bg-white p-1 shadow-md dark:bg-navy-800">
                      <img
                        id="modal-employee-profile-pic"
                        src={
                          selectedEmployeeForDetails.profile_picture &&
                          selectedEmployeeForDetails.profile_picture.trim() !==
                            ""
                            ? selectedEmployeeForDetails.profile_picture
                            : selectedEmployeeForDetails.gender
                                ?.trim()
                                .toLowerCase() === "female"
                            ? femaleProfile
                            : maleProfile
                        }
                        alt="Profile"
                        className="h-full w-full rounded-xl object-contain object-center"
                      />
                    </div>
                    <div>
                      <h2 className="print:text-black text-xl font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.first_name ||
                          selectedEmployeeForDetails.name ||
                          "Employee"}{" "}
                        {selectedEmployeeForDetails.last_name || ""}
                      </h2>
                      <p className="text-xs font-bold text-brand-600 dark:text-brand-400 print:text-gray-800">
                        {selectedEmployeeForDetails.designation || "Employee"} (
                        {selectedEmployeeForDetails.emp_code ||
                          selectedEmployeeForDetails.employee_id ||
                          "-"}
                        )
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-700">
                        {selectedEmployeeForDetails.email || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-right text-xs font-semibold sm:flex sm:flex-col sm:gap-1">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Department:{" "}
                      </span>
                      <span className="print:text-black text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.department_name ||
                          selectedEmployeeForDetails.department ||
                          "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Role:{" "}
                      </span>
                      <span className="print:text-black text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.role_name ||
                          selectedEmployeeForDetails.role ||
                          "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Join Date:{" "}
                      </span>
                      <span className="print:text-black text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.doj_date || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── 1. EMPLOYMENT & WORK DETAILS TABLE ── */}
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 print:border-gray-300">
                  <h3 className="print:text-black mb-3 border-b border-gray-200 pb-1.5 text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    1. Employment & Organization Record
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Employee Code:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.emp_code || "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Username:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.user_name || "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Official Email:
                      </span>
                      <p className="print:text-black truncate font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.email || "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Department:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.department_name ||
                          selectedEmployeeForDetails.department ||
                          "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Role:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.role_name ||
                          selectedEmployeeForDetails.role ||
                          "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Designation:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.designation || "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Employment Type:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.employment_type || "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Work Location:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.work_location || "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Reporting Manager:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.reporting_manager_name ||
                          selectedEmployeeForDetails.reporting_manager ||
                          "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Joining Date:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.doj_date || "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Probation Period:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.probation_period || "-"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Work From Home:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.is_wfh_enabled
                          ? "Enabled"
                          : "Disabled"}
                      </p>
                    </div>
                    <div className="border-b border-gray-100 pb-1.5 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400">
                        Deactivation Reason:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.deactivate_reason ||
                          selectedEmployeeForDetails.deactivation_reason ||
                          "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── 2. PERSONAL & ADDRESS RECORD ── */}
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 print:border-gray-300">
                  <h3 className="print:text-black mb-3 border-b border-gray-200 pb-1.5 text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    2. Personal & Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Gender:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.gender || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Date of Birth:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.dob_date || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Marital Status:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.marital_status || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Nationality:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.nationality || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Blood Group:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.blood_group || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Primary Mobile:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.mobile || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Alternate Mobile:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.alternate_mobile || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Personal Email:
                      </span>
                      <p className="print:text-black truncate font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.personal_email || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Aadhaar Card Number:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {getCleanDocNumber(
                          selectedEmployeeForDetails.aadhaar_number,
                          selectedEmployeeForDetails.aadhaar_card_number,
                          selectedEmployeeForDetails.aadhaar_no
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        PAN Card Number:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {getCleanDocNumber(
                          selectedEmployeeForDetails.pan_number,
                          selectedEmployeeForDetails.pan_card_number,
                          selectedEmployeeForDetails.pan_no
                        )}
                      </p>
                    </div>
                  </div>

                  {/* ADDRESS CARDS */}
                  <div className="mt-4 grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-600 dark:bg-navy-700/50 print:bg-white">
                      <span className="print:text-black font-black uppercase text-brand-600 dark:text-brand-400">
                        Current Address
                      </span>
                      <p className="print:text-black mt-1 font-semibold text-navy-700 dark:text-white">
                        {[
                          selectedEmployeeForDetails.current_address_line1,
                          selectedEmployeeForDetails.current_address_line2,
                          selectedEmployeeForDetails.current_city,
                          selectedEmployeeForDetails.current_state,
                          selectedEmployeeForDetails.current_country,
                          selectedEmployeeForDetails.current_pincode,
                        ]
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-600 dark:bg-navy-700/50 print:bg-white">
                      <span className="print:text-black font-black uppercase text-brand-600 dark:text-brand-400">
                        Permanent Address
                      </span>
                      <p className="print:text-black mt-1 font-semibold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.same_as_current
                          ? "Same as Current Address"
                          : [
                              selectedEmployeeForDetails.permanent_address_line1,
                              selectedEmployeeForDetails.permanent_address_line2,
                              selectedEmployeeForDetails.permanent_city,
                              selectedEmployeeForDetails.permanent_state,
                              selectedEmployeeForDetails.permanent_country,
                              selectedEmployeeForDetails.permanent_pincode,
                            ]
                              .filter(Boolean)
                              .join(", ") || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── 3. EDUCATION & EXPERIENCE RECORD ── */}
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 print:border-gray-300">
                  <h3 className="print:text-black mb-3 border-b border-gray-200 pb-1.5 text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    3. Educational Qualification & Experience
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 md:grid-cols-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Qualification:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.qualification || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Course / Degree:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.course_degree || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Specialization:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.specialization || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Institution:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.institution_university ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Year of Passing:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.year_of_passing || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Percentage / CGPA:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.percentage_cgpa || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Fresher Status:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.is_fresher
                          ? "Fresher"
                          : "Experienced"}
                      </p>
                    </div>
                  </div>

                  {!selectedEmployeeForDetails.is_fresher &&
                    selectedEmployeeForDetails.previous_employer && (
                      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3 text-xs dark:border-gray-600 dark:bg-navy-700/50 print:bg-white">
                        <span className="print:text-black font-black uppercase text-brand-600 dark:text-brand-400">
                          Previous Work History
                        </span>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div>
                            <span className="text-gray-500">Employer:</span>
                            <p className="print:text-black font-bold text-navy-700 dark:text-white">
                              {selectedEmployeeForDetails.previous_employer ||
                                "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Job Title:</span>
                            <p className="print:text-black font-bold text-navy-700 dark:text-white">
                              {selectedEmployeeForDetails.previous_job_title ||
                                "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <p className="print:text-black font-bold text-navy-700 dark:text-white">
                              {selectedEmployeeForDetails.previous_employment_start_date ||
                                "-"}{" "}
                              to{" "}
                              {selectedEmployeeForDetails.previous_employment_end_date ||
                                "-"}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">
                              Last CTC / Reason:
                            </span>
                            <p className="print:text-black font-bold text-navy-700 dark:text-white">
                              {selectedEmployeeForDetails.last_drawn_ctc || "-"}{" "}
                              (
                              {selectedEmployeeForDetails.reason_for_leaving ||
                                "-"}
                              )
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* ── 4. BANK & FINANCIAL DETAILS ── */}
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 print:border-gray-300">
                  <h3 className="print:text-black mb-3 border-b border-gray-200 pb-1.5 text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    4. Bank Account & Payroll Record
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Account Holder:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.account_holder_name || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Bank Name:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.bank_name || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Account Number:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.bank_account || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        IFSC Code:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.ifsc_code || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Branch Name:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.branch_name || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Bank Type:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.bank_type || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        PAN Number:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.pan_number || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        PF Member ID:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.pf_member_id || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        UAN Number:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.uan_number || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        ESIC Number:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.esic_number || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── 5. EMERGENCY CONTACT ── */}
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 print:border-gray-300">
                  <h3 className="print:text-black mb-3 border-b border-gray-200 pb-1.5 text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                    5. Emergency Contact Record
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Contact Name:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.emergency_contact_name ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Relationship:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.emergency_contact_relationship ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Primary Mobile:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.emergency_contact_mobile ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Alternate Mobile:
                      </span>
                      <p className="print:text-black font-bold text-navy-700 dark:text-white">
                        {selectedEmployeeForDetails.emergency_contact_alternate_mobile ||
                          "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── 6. ATTACHED DOCUMENTS CHECKLIST ── */}
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 print:border-gray-300">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-1.5 dark:border-gray-700">
                    <h3 className="print:text-black text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      6. Uploaded Documents Verification Checklist
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadAllDocuments(selectedEmployeeForDetails)
                      }
                      disabled={downloadingZip}
                      className="no-print flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg disabled:opacity-60"
                      title="Download all uploaded documents into a single ZIP file"
                    >
                      <FaDownload size={12} />
                      <span>
                        {downloadingZip
                          ? "Zipping Files..."
                          : "Download All (.zip)"}
                      </span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2 md:grid-cols-3">
                    {[
                      {
                        key: "passport_size_photo",
                        label: "Passport Size Photo",
                      },
                      { key: "sslcCertificate", label: "SSLC Certificate" },
                      {
                        key: "doc_12th_diploma_certificate",
                        label: "12th / Diploma Certificate",
                      },
                      {
                        key: "doc_degree_certificate",
                        label: "Degree Certificate",
                      },
                      {
                        key: "doc_postgraduate_certificate",
                        label: "Postgraduate Certificate",
                      },
                      {
                        key: "certificate_upload",
                        label: "Additional Qualification",
                      },
                      { key: "aadhaar_card", label: "Aadhaar Card" },
                      { key: "pan_card", label: "PAN Card" },
                      { key: "bank_passbook", label: "Bank Passbook" },
                      { key: "salary_slips", label: "Salary Slips" },
                      { key: "offer_letter", label: "Offer Letter" },
                      { key: "relieving_letter", label: "Relieving Letter" },
                    ].map((doc) => {
                      const fileUrl = getDocFileUrl(selectedEmployeeForDetails, doc.key);
                      const hasFile = !!fileUrl;
                      return (
                        <div
                          key={doc.key}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 dark:border-gray-600 dark:bg-navy-700/50 print:border-gray-300 print:bg-white"
                        >
                          <div className="flex-1 pr-2">
                            <p className="print:text-black font-bold text-navy-700 dark:text-white">
                              {doc.label}
                            </p>
                            <span
                              className={`py-0.2 mt-0.5 inline-block rounded px-1.5 text-[10px] font-bold ${
                                hasFile
                                  ? "print:text-black bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 print:bg-gray-200"
                                  : "bg-gray-100 text-gray-400 dark:bg-navy-800 dark:text-gray-400"
                              }`}
                            >
                              {hasFile ? "✓ Uploaded" : "✕ Not Uploaded"}
                            </span>
                          </div>

                          {hasFile && (
                            <div className="flex items-center gap-1 print:hidden">
                              <button
                                type="button"
                                onClick={() => handleViewDocument(fileUrl)}
                                className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-navy-600"
                                title="View document in new tab"
                              >
                                <FaEye size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadDocument(
                                    fileUrl,
                                    `${doc.label.replace(/\s+/g, "_")}_${
                                      selectedEmployeeForDetails.user_name ||
                                      "employee"
                                    }`
                                  )
                                }
                                className="rounded p-1 text-green-600 hover:bg-green-100 dark:text-green-300 dark:hover:bg-navy-600"
                                title="Download document file"
                              >
                                <FaDownload size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* DOCUMENT MODAL */}
      {documentModalOpen && selectedEmployeeForDocs && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-sm sm:p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-navy-800 sm:rounded-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-navy-800 sm:px-6 sm:py-4">
              <div>
                <h2 className="text-lg font-bold text-navy-700 dark:text-white sm:text-2xl">
                  Documents
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                  {selectedEmployeeForDocs.name}
                </p>
              </div>
              <button
                onClick={() => setDocumentModalOpen(false)}
                className="text-2xl font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Documents List */}
            <div className="space-y-3 p-4 sm:p-6">
              {[
                {
                  key: "passport_size_photo",
                  label: "Passport Size Photo",
                  bgColor: "bg-blue-100 dark:bg-blue-900",
                  iconColor: "text-blue-600 dark:text-blue-300",
                },
                {
                  key: "sslcCertificate",
                  label: "SSLC Certificate",
                  bgColor: "bg-purple-100 dark:bg-purple-900",
                  iconColor: "text-purple-600 dark:text-purple-300",
                },
                {
                  key: "doc_10th_certificate",
                  label: "10th Certificate",
                  bgColor: "bg-purple-100 dark:bg-purple-900",
                  iconColor: "text-purple-600 dark:text-purple-300",
                },
                {
                  key: "doc_12th_diploma_certificate",
                  label: "12th / Diploma Certificate",
                  bgColor: "bg-blue-100 dark:bg-blue-900",
                  iconColor: "text-blue-600 dark:text-blue-300",
                },
                {
                  key: "doc_degree_certificate",
                  label: "Degree Certificate",
                  bgColor: "bg-indigo-100 dark:bg-indigo-900",
                  iconColor: "text-indigo-600 dark:text-indigo-300",
                },
                {
                  key: "doc_postgraduate_certificate",
                  label: "Postgraduate Certificate",
                  bgColor: "bg-indigo-100 dark:bg-indigo-900",
                  iconColor: "text-indigo-600 dark:text-indigo-300",
                },
                {
                  key: "doc_other_professional_certifications",
                  label: "Other Professional Certifications",
                  bgColor: "bg-cyan-100 dark:bg-cyan-900",
                  iconColor: "text-cyan-600 dark:text-cyan-300",
                },
                {
                  key: "doc_experience_certificate",
                  label: "Experience Certificate",
                  bgColor: "bg-amber-100 dark:bg-amber-900",
                  iconColor: "text-amber-600 dark:text-amber-300",
                },
                {
                  key: "doc_previous_employment_payslips",
                  label: "Previous Employment Payslips",
                  bgColor: "bg-yellow-100 dark:bg-yellow-900",
                  iconColor: "text-yellow-600 dark:text-yellow-300",
                },
                {
                  key: "certificate_upload",
                  label: "Qualification Certificate",
                  bgColor: "bg-teal-100 dark:bg-teal-900",
                  iconColor: "text-teal-600 dark:text-teal-300",
                },
                {
                  key: "relieving_letter",
                  label: "Relieving Letter",
                  bgColor: "bg-orange-100 dark:bg-orange-900",
                  iconColor: "text-orange-600 dark:text-orange-300",
                },
                {
                  key: "experience_relieving_letter",
                  label: "Experience Relieving Letter",
                  bgColor: "bg-amber-100 dark:bg-amber-900",
                  iconColor: "text-amber-600 dark:text-amber-300",
                },
                {
                  key: "bank_passbook",
                  label: "Bank Passbook",
                  bgColor: "bg-indigo-100 dark:bg-indigo-900",
                  iconColor: "text-indigo-600 dark:text-indigo-300",
                },
                {
                  key: "salary_slips",
                  label: "Payslips",
                  bgColor: "bg-yellow-100 dark:bg-yellow-900",
                  iconColor: "text-yellow-600 dark:text-yellow-300",
                },
                {
                  key: "aadhaar_card",
                  label: "Aadhaar",
                  bgColor: "bg-pink-100 dark:bg-pink-900",
                  iconColor: "text-pink-600 dark:text-pink-300",
                },
                {
                  key: "pan_card",
                  label: "PAN Card",
                  bgColor: "bg-blue-100 dark:bg-blue-900",
                  iconColor: "text-blue-600 dark:text-blue-300",
                },
                {
                  key: "offer_letter",
                  label: "Offer Letter",
                  bgColor: "bg-teal-100 dark:bg-teal-900",
                  iconColor: "text-teal-600 dark:text-teal-300",
                },
              ].map((doc) => {
                const fileUrl = selectedEmployeeForDocs[doc.key];
                const isUploaded = !!fileUrl;
                const fullUrl = fileUrl
                  ? fileUrl.startsWith("http")
                    ? fileUrl
                    : fileUrl
                  : "";
                const fileName = fileUrl ? fileUrl.split("/").pop() : null;

                return (
                  <div
                    key={doc.key}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-navy-700 sm:flex-row sm:items-center sm:justify-between sm:p-4"
                  >
                    <div className="flex flex-1 items-center gap-3 sm:gap-4">
                      <div className={`${doc.bgColor} rounded-lg p-2 sm:p-3`}>
                        <div className={`${doc.iconColor} text-xl sm:text-2xl`}>
                          <IoDocumentText />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy-700 dark:text-white sm:text-base">
                          {doc.label}
                        </p>
                        {isUploaded ? (
                          <div>
                            <p className="text-xs font-medium text-green-600 dark:text-green-400">
                              Uploaded
                            </p>
                            <p className="mt-0.5 break-all text-[10px] text-gray-500 dark:text-gray-400">
                              {fileName}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-red-500 dark:text-red-400">
                            Not uploaded
                          </p>
                        )}
                      </div>
                    </div>
                    {isUploaded && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(fullUrl, "_blank")}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300"
                        >
                          <FaEye size={13} />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadDocument(
                              fullUrl,
                              `${doc.label.replace(/\s+/g, "_")}_${
                                selectedEmployeeForDocs.name || "employee"
                              }`
                            )
                          }
                          className="flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-600 transition hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300"
                        >
                          <FaDownload size={12} />
                          <span>Download</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;