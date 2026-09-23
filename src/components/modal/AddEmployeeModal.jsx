import React, { useState, useEffect, useMemo } from "react";
import Cropper from "react-easy-crop";
import Swal from "sweetalert2";
import getCroppedImg from "../../utils/cropImageHelper";
import {
  MdCloudUpload,
  MdEdit,
  MdAccountBox,
  MdSchool,
  MdClose,
} from "react-icons/md";
import {
  FaEye,
  FaEyeSlash,
  FaCamera,
  FaMoneyBillWave,
  FaUserTie,
  FaPhoneAlt,
} from "react-icons/fa";
import { IoDocumentAttach } from "react-icons/io5";
import employeeAPI from "services/employeeAPI";
import { showSuccess, showError } from "utils/toastHelper";

const initialFormState = {
  // Account & Basic
  email: "",
  user_name: "",
  first_name: "",
  last_name: "",
  emp_code: "",
  dob_date: "",
  doj_date: "",
  address: "",
  mobile: "",
  gender: "",
  profile_picture: null,
  department: "",
  role: "",
  password: "",
  confirm_password: "",
  is_active: true,
  is_probationary: true,
  is_wfh_enabled: false,
  is_authorized: false,
  deactivation_reason: "",

  // Work & Employment
  designation: "",
  employment_type: "Full Time",
  work_location: "",
  reporting_manager: "",
  team_business_unit: "",
  probation_period: "3 Months",
  deactivate_reason: "",

  // Personal Info
  marital_status: "",
  nationality: "Indian",
  blood_group: "",
  personal_email: "",
  alternate_mobile: "",
  aadhaar_number: "",

  // Current Address
  current_address_line1: "",
  current_address_line2: "",
  current_city: "",
  current_state: "",
  current_country: "India",
  current_pincode: "",

  // Permanent Address
  same_as_current: false,
  permanent_address_line1: "",
  permanent_address_line2: "",
  permanent_city: "",
  permanent_state: "",
  permanent_country: "India",
  permanent_pincode: "",

  // Financial & Payroll
  basic_salary: "",
  provisional_tax: "",
  uan_number: "",
  esic_number: "",
  pf_member_id: "",
  pan_number: "",
  account_holder_name: "",
  bank_name: "",
  bank_account: "",
  ifsc_code: "",
  branch_name: "",
  bank_type: "",

  // Educational Qualification
  qualification: "",
  course_degree: "",
  specialization: "",
  institution_university: "",
  year_of_passing: "",
  percentage_cgpa: "",
  certificate_upload: null,

  // Previous Work Experience
  is_fresher: false,
  previous_employer: "",
  previous_job_title: "",
  previous_employment_start_date: "",
  previous_employment_end_date: "",
  last_drawn_ctc: "",
  reason_for_leaving: "",
  experience_relieving_letter: null,

  // Emergency Contact
  emergency_contact_name: "",
  emergency_contact_relationship: "",
  emergency_contact_mobile: "",
  emergency_contact_alternate_mobile: "",

  // Required & Optional Documents
  sslcCertificate: null,
  relieving_letter: null,
  bank_passbook: null,
  salary_slips: null,
  aadhaar_card: null,
  pan_card: null,
  offer_letter: null,
  // doc_10th_certificate: null,
  doc_12th_diploma_certificate: null,
  doc_degree_certificate: null,
  doc_postgraduate_certificate: null,
  // doc_other_professional_certifications: null,
  // doc_experience_certificate: null,
  // doc_previous_employment_payslips: null,
  passport_size_photo: null,
};

const AddEmployeeModal = ({
  isOpen,
  onClose,
  onSubmit,
  isEditMode = false,
  editingEmployee = null,
}) => {
  // Active Tab
  const [activeTab, setActiveTab] = useState("account");

  // Cropper states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImage, setRawImage] = useState(null);

  // Form State
  const [formData, setFormData] = useState(initialFormState);

  // Previews & Errors
  const [imagePreview, setImagePreview] = useState(null);
  const [documentPreviews, setDocumentPreviews] = useState({});
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [managers, setManagers] = useState([]);

  const isSuperAdmin =
    localStorage.getItem("is_super_admin") === "true" ||
    localStorage.getItem("is_super_admin") === true;

  const documentFieldsList = {
    passport_size_photo: { label: "Passport Size Photo", required: true },
    sslcCertificate: { label: "SSLC Certificate", required: true },
    doc_12th_diploma_certificate: {
      label: "HSLC Certificate",
      required: true,
    },
    doc_degree_certificate: {
      label: "Undergraduate Certificate",
      required: true,
    },
    doc_postgraduate_certificate: {
      label: "Postgraduate Certificate",
      required: false,
    },
    certificate_upload: {
      label: "Additional Qualification Certificate",
      required: false,
    },
    aadhaar_card: { label: "Aadhaar Card", required: true },
    pan_card: { label: "PAN Card", required: true },
    bank_passbook: { label: "Bank Passbook", required: true },
    salary_slips: { label: "Pay Slips (Last 3 months)", required: false },
    offer_letter: { label: "Offer Letter", required: false },
    relieving_letter: { label: "Relieving Letter", required: false },
  };

  // Load dropdown data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Departments
      employeeAPI.getAllDepartments(
        (data) => {
          let list = Array.isArray(data)
            ? data
            : data?.results || data?.data || data?.department || [];
          setDepartments(list);
        },
        () => setDepartments([])
      );

      // Roles
      employeeAPI.getAllRoles(
        (data) => {
          let list = Array.isArray(data)
            ? data
            : data?.results || data?.data || data?.role || [];
          setRoles(list);
        },
        () => setRoles([])
      );

      // Managers list
      employeeAPI.getAllEmployees(
        (data) => {
          let list = Array.isArray(data)
            ? data
            : data?.results || data?.data || data?.employee || [];
          setManagers(list);
        },
        () => setManagers([])
      );

      // Hydrate form on edit
      if (isEditMode && editingEmployee) {
        let deptValue = "";
        if (editingEmployee.department) {
          deptValue =
            typeof editingEmployee.department === "object"
              ? editingEmployee.department.id || ""
              : editingEmployee.department;
        }

        let roleValue = "";
        if (editingEmployee.role) {
          roleValue =
            typeof editingEmployee.role === "object"
              ? editingEmployee.role.id || ""
              : editingEmployee.role;
        }

        let managerValue = "";
        if (editingEmployee.reporting_manager) {
          managerValue =
            typeof editingEmployee.reporting_manager === "object"
              ? editingEmployee.reporting_manager.id || ""
              : editingEmployee.reporting_manager;
        }

        let genderValue = "";
        if (editingEmployee.gender) {
          const g = String(editingEmployee.gender).trim().toLowerCase();
          if (g.startsWith("m")) genderValue = "Male";
          else if (g.startsWith("f")) genderValue = "Female";
          else if (g.startsWith("o")) genderValue = "Other";
          else genderValue = editingEmployee.gender;
        }

        let isActive =
          editingEmployee.is_active !== undefined
            ? Boolean(editingEmployee.is_active)
            : true;
        let isProbationary =
          editingEmployee.is_probationary !== undefined
            ? Boolean(editingEmployee.is_probationary)
            : true;

        let isSameAsCurrent = false;
        if (
          editingEmployee.same_as_current !== undefined &&
          editingEmployee.same_as_current !== null
        ) {
          isSameAsCurrent = Boolean(editingEmployee.same_as_current);
        } else if (editingEmployee.permanent_address_line1) {
          const currAddr = (editingEmployee.current_address_line1 || "").trim();
          const permAddr = (
            editingEmployee.permanent_address_line1 || ""
          ).trim();
          isSameAsCurrent = currAddr !== "" && currAddr === permAddr;
        }

        setFormData({
          ...initialFormState,
          ...editingEmployee,
          gender: genderValue,
          department: deptValue,
          role: roleValue,
          reporting_manager: managerValue,
          is_active: isActive,
          is_probationary: isProbationary,
          is_wfh_enabled: Boolean(editingEmployee.is_wfh_enabled),
          is_authorized: Boolean(editingEmployee.is_authorized),
          is_fresher: Boolean(editingEmployee.is_fresher),
          same_as_current: isSameAsCurrent,
          password: "",
          confirm_password: "",
        });

        if (editingEmployee.profile_picture) {
          setImagePreview(editingEmployee.profile_picture);
        }

        // Hydrate document previews
        const docPreviews = {};
        Object.keys(documentFieldsList).forEach((docKey) => {
          const val = editingEmployee[docKey];
          if (val && typeof val === "string") {
            if (val.match(/\.(jpg|jpeg|png|webp)$/i)) {
              docPreviews[docKey] = {
                type: "image",
                src: val.startsWith("http") ? val : `${val}`,
              };
            } else if (val.match(/\.pdf$/i)) {
              docPreviews[docKey] = { type: "pdf", name: val.split("/").pop() };
            } else {
              docPreviews[docKey] = {
                type: "file",
                name: val.split("/").pop(),
              };
            }
          }
        });
        setDocumentPreviews(docPreviews);
      } else {
        setFormData(initialFormState);
        setImagePreview(null);
        setDocumentPreviews({});
      }
    }
  }, [isOpen, isEditMode, editingEmployee]);

  // Filter Reporting Managers to only include active employees (in Management department if available)
  const managementManagers = useMemo(() => {
    // 1. Only include active employees (exclude inactive / deactivated employees)
    const activeEmployees = managers.filter((m) => {
      if (
        m.is_active === false ||
        m.is_active === "false" ||
        (m.status && String(m.status).toLowerCase() === "inactive")
      ) {
        return false;
      }
      return true;
    });

    const filtered = activeEmployees.filter((m) => {
      const deptName = (
        m.department_name ||
        (typeof m.department === "object"
          ? m.department?.department_name
          : "") ||
        ""
      ).toLowerCase();
      return deptName.includes("management");
    });

    if (filtered.length > 0) {
      if (formData.reporting_manager) {
        const currentId = Number(formData.reporting_manager);
        const exists = filtered.some((m) => m.id === currentId);
        if (!exists) {
          const currentMgr = activeEmployees.find((m) => m.id === currentId);
          if (currentMgr) filtered.push(currentMgr);
        }
      }
      return filtered;
    }
    return activeEmployees;
  }, [managers, formData.reporting_manager]);

  // Handle profile image crop
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showError("Image should be below 10 MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImage(reader.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(rawImage, croppedAreaPixels);
      const arr = croppedImage.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const extension = mime === "image/png" ? "png" : "jpg";
      const fileName = `profile_picture.${extension}`;
      const file = new File([u8arr], fileName, { type: mime });
      setFormData((prev) => ({ ...prev, profile_picture: file }));
      setImagePreview(croppedImage);
      setShowCropModal(false);
      setRawImage(null);
    } catch (e) {
      showError("Failed to crop image");
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setRawImage(null);
  };

  const handleDeleteProfilePicture = () => {
    Swal.fire({
      title: "Delete Profile Picture?",
      text: "Are you sure you want to delete this profile picture?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        if (isEditMode && editingEmployee?.id) {
          employeeAPI.deleteProfilePicture(
            editingEmployee.id,
            () => {
              setImagePreview(null);
              setFormData((prev) => ({
                ...prev,
                profile_picture: null,
              }));
              showSuccess("Profile picture deleted successfully");
            },
            (err) => {
              showError(err?.message || "Failed to delete profile picture");
            }
          );
        } else {
          setImagePreview(null);
          setFormData((prev) => ({ ...prev, profile_picture: null }));
          showSuccess("Profile picture removed");
        }
      }
    });
  };

  // Handle Document upload
  const handleDocumentChange = (e, docKey) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        showError("Only PDF and image files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showError("File should be below 10 MB");
        return;
      }
      setFormData((prev) => ({ ...prev, [docKey]: file }));
      setErrors((prev) => ({ ...prev, [docKey]: "" }));
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentPreviews((prev) => ({
            ...prev,
            [docKey]: { type: "image", src: reader.result },
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setDocumentPreviews((prev) => ({
          ...prev,
          [docKey]: { type: "pdf", name: file.name },
        }));
      }
    }
  };

  // Generic input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };

      // Same as current address logic
      if (name === "same_as_current") {
        if (checked) {
          updated.permanent_address_line1 = prev.current_address_line1;
          updated.permanent_address_line2 = prev.current_address_line2;
          updated.permanent_city = prev.current_city;
          updated.permanent_state = prev.current_state;
          updated.permanent_country = prev.current_country;
          updated.permanent_pincode = prev.current_pincode;
        }
      } else if (prev.same_as_current && name.startsWith("current_")) {
        const permKey = name.replace("current_", "permanent_");
        updated[permKey] = val;
      }

      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const isValidPassword = (password) => {
    return /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-\\/[\]+=`~;''])/.test(
      password
    );
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // 1. Account & Basic Credentials (REQUIRED FOR EVERYONE)
    if (!formData.first_name || !String(formData.first_name).trim())
      newErrors.first_name = "First Name is required";
    if (!formData.email || !String(formData.email).trim())
      newErrors.email = "Email is required";
    if (!formData.user_name || !String(formData.user_name).trim())
      newErrors.user_name = "Username is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.emp_code || !String(formData.emp_code).trim())
      newErrors.emp_code = "Employee Code is required";

    if (!isEditMode) {
      if (!formData.password) newErrors.password = "Password is required";
      else if (!isValidPassword(formData.password)) {
        newErrors.password =
          "Password must contain at least 1 number and special character";
      }
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = "Passwords do not match";
      }
    } else if (formData.password) {
      if (!isValidPassword(formData.password)) {
        newErrors.password =
          "Password must contain at least 1 number and special character";
      }
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = "Passwords do not match";
      }
    }

    // Tab 2 to Tab 6 details are ONLY required for Regular Employees (!isSuperAdmin)
    if (!isSuperAdmin) {
      // 2. Personal Info & Address
      if (!formData.dob_date) newErrors.dob_date = "Date of Birth is required";
      if (!formData.marital_status)
        newErrors.marital_status = "Marital Status is required";
      if (!formData.nationality || !String(formData.nationality).trim())
        newErrors.nationality = "Nationality is required";
      if (!formData.blood_group)
        newErrors.blood_group = "Blood Group is required";
      if (!formData.personal_email || !String(formData.personal_email).trim())
        newErrors.personal_email = "Personal Email is required";
      if (!formData.mobile || !String(formData.mobile).trim())
        newErrors.mobile = "Mobile Number is required";
      if (
        !formData.alternate_mobile ||
        !String(formData.alternate_mobile).trim()
      )
        newErrors.alternate_mobile = "Alternate Mobile Number is required";

      // Current Address
      if (
        !formData.current_address_line1 ||
        !String(formData.current_address_line1).trim()
      )
        newErrors.current_address_line1 = "Current Address Line 1 is required";
      if (!formData.current_city || !String(formData.current_city).trim())
        newErrors.current_city = "City is required";
      if (!formData.current_state || !String(formData.current_state).trim())
        newErrors.current_state = "State is required";
      if (!formData.current_country || !String(formData.current_country).trim())
        newErrors.current_country = "Country is required";
      if (!formData.current_pincode || !String(formData.current_pincode).trim())
        newErrors.current_pincode = "Pincode is required";

      // Permanent Address (Only required if NOT same_as_current)
      if (!formData.same_as_current) {
        if (
          !formData.permanent_address_line1 ||
          !String(formData.permanent_address_line1).trim()
        )
          newErrors.permanent_address_line1 =
            "Permanent Address Line 1 is required";
        if (!formData.permanent_city || !String(formData.permanent_city).trim())
          newErrors.permanent_city = "City is required";
        if (
          !formData.permanent_state ||
          !String(formData.permanent_state).trim()
        )
          newErrors.permanent_state = "State is required";
        if (
          !formData.permanent_country ||
          !String(formData.permanent_country).trim()
        )
          newErrors.permanent_country = "Country is required";
        if (
          !formData.permanent_pincode ||
          !String(formData.permanent_pincode).trim()
        )
          newErrors.permanent_pincode = "Pincode is required";
      }

      // 3. Education & Experience
      if (!formData.qualification || !String(formData.qualification).trim())
        newErrors.qualification = "Qualification is required";
      if (!formData.course_degree || !String(formData.course_degree).trim())
        newErrors.course_degree = "Course / Degree is required";
      if (!formData.specialization || !String(formData.specialization).trim())
        newErrors.specialization = "Specialization is required";
      if (
        !formData.institution_university ||
        !String(formData.institution_university).trim()
      )
        newErrors.institution_university =
          "Institution / University is required";
      if (!formData.year_of_passing)
        newErrors.year_of_passing = "Year of Passing is required";
      if (!formData.percentage_cgpa)
        newErrors.percentage_cgpa = "Percentage / CGPA is required";

      // Previous Experience (Only required if NOT fresher)
      if (!formData.is_fresher) {
        if (
          !formData.previous_employer ||
          !String(formData.previous_employer).trim()
        )
          newErrors.previous_employer = "Previous Employer is required";
        if (
          !formData.previous_job_title ||
          !String(formData.previous_job_title).trim()
        )
          newErrors.previous_job_title = "Previous Job Title is required";
        if (!formData.previous_employment_start_date)
          newErrors.previous_employment_start_date = "Start Date is required";
        if (!formData.previous_employment_end_date)
          newErrors.previous_employment_end_date = "End Date is required";
        if (!formData.last_drawn_ctc)
          newErrors.last_drawn_ctc = "Last Drawn CTC is required";
        if (
          !formData.reason_for_leaving ||
          !String(formData.reason_for_leaving).trim()
        )
          newErrors.reason_for_leaving = "Reason for Leaving is required";
      }

      // 4. Bank Account Details
      if (
        !formData.account_holder_name ||
        !String(formData.account_holder_name).trim()
      )
        newErrors.account_holder_name = "Account Holder Name is required";
      if (!formData.bank_name || !String(formData.bank_name).trim())
        newErrors.bank_name = "Bank Name is required";
      if (!formData.bank_account || !String(formData.bank_account).trim())
        newErrors.bank_account = "Bank Account Number is required";
      if (!formData.ifsc_code || !String(formData.ifsc_code).trim())
        newErrors.ifsc_code = "IFSC Code is required";
      if (!formData.branch_name || !String(formData.branch_name).trim())
        newErrors.branch_name = "Branch Name is required";
      if (!formData.bank_type) newErrors.bank_type = "Bank Type is required";

      // 5. Emergency Contact
      if (
        !formData.emergency_contact_name ||
        !String(formData.emergency_contact_name).trim()
      )
        newErrors.emergency_contact_name = "Emergency Contact Name is required";
      if (
        !formData.emergency_contact_relationship ||
        !String(formData.emergency_contact_relationship).trim()
      )
        newErrors.emergency_contact_relationship = "Relationship is required";
      if (
        !formData.emergency_contact_mobile ||
        !String(formData.emergency_contact_mobile).trim()
      )
        newErrors.emergency_contact_mobile =
          "Emergency Contact Mobile is required";

      // 6. Documents
      Object.entries(documentFieldsList).forEach(([docKey, docInfo]) => {
        if (docInfo.required && !formData[docKey]) {
          newErrors[docKey] = `${docInfo.label} is required`;
        }
      });
    }

    setErrors(newErrors);

    // Auto-switch to the first tab that contains an error
    if (Object.keys(newErrors).length > 0) {
      const firstErrKey = Object.keys(newErrors)[0];
      const tab1Fields = [
        "first_name",
        "email",
        "user_name",
        "gender",
        "password",
        "confirm_password",
      ];
      const tab2Fields = [
        "dob_date",
        "marital_status",
        "nationality",
        "blood_group",
        "personal_email",
        "mobile",
        "alternate_mobile",
        "current_address_line1",
        "current_city",
        "current_state",
        "current_country",
        "current_pincode",
        "permanent_address_line1",
        "permanent_city",
        "permanent_state",
        "permanent_country",
        "permanent_pincode",
      ];
      const tab3Fields = [
        "qualification",
        "course_degree",
        "specialization",
        "institution_university",
        "year_of_passing",
        "percentage_cgpa",
        "previous_employer",
        "previous_job_title",
        "previous_employment_start_date",
        "previous_employment_end_date",
        "last_drawn_ctc",
        "reason_for_leaving",
      ];
      const tab4Fields = [
        "account_holder_name",
        "bank_name",
        "bank_account",
        "ifsc_code",
        "branch_name",
        "bank_type",
      ];
      const tab5Fields = [
        "emergency_contact_name",
        "emergency_contact_relationship",
        "emergency_contact_mobile",
      ];

      if (tab1Fields.includes(firstErrKey)) setActiveTab("account");
      else if (tab2Fields.includes(firstErrKey)) setActiveTab("personal");
      else if (tab3Fields.includes(firstErrKey)) setActiveTab("education");
      else if (tab4Fields.includes(firstErrKey)) setActiveTab("financial");
      else if (tab5Fields.includes(firstErrKey)) setActiveTab("emergency");
      else setActiveTab("documents");
    }

    return Object.keys(newErrors).length === 0;
  };

  // Handle Form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Please fill all required fields correctly.");
      return;
    }

    const submitData = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key === "confirm_password") return;
      const val = formData[key];

      const isDocumentKey =
        key in documentFieldsList || key === "profile_picture";

      // Send empty string for cleared/removed document fields so backend deletes the file
      if (isDocumentKey && (val === null || val === "" || val === undefined)) {
        submitData.append(key, "");
        return;
      }

      // File objects
      if (val instanceof File) {
        submitData.append(key, val);
        return;
      }

      // Skip remote URL strings for existing unchanged files in edit mode
      if (
        typeof val === "string" &&
        (val.startsWith("http://") ||
          val.startsWith("https://") ||
          val.startsWith("/media/"))
      ) {
        return;
      }

      if (key === "profile_picture") {
        if (val instanceof File) {
          submitData.append(key, val);
        }
        return;
      }

      // Department, Role, Reporting Manager (IDs)
      if (["department", "role", "reporting_manager"].includes(key)) {
        if (val !== "" && val !== null && val !== undefined) {
          const intVal = parseInt(val, 10);
          if (!isNaN(intVal)) {
            submitData.append(key, intVal);
          }
        }
        return;
      }

      // Booleans
      if (
        [
          "is_active",
          "is_probationary",
          "is_wfh_enabled",
          "is_authorized",
          "is_fresher",
          "same_as_current",
        ].includes(key)
      ) {
        submitData.append(key, Boolean(val));
        return;
      }

      // Values
      if (val !== null && val !== undefined && val !== "") {
        submitData.append(key, val);
      }
    });

    const submitFunction = isEditMode
      ? () =>
          employeeAPI.updateEmployee(
            editingEmployee.id,
            submitData,
            handleSubmitSuccess,
            handleSubmitError
          )
      : () =>
          employeeAPI.postEmployee(
            submitData,
            handleSubmitSuccess,
            handleSubmitError
          );

    submitFunction();
  };

  const handleSubmitSuccess = (response) => {
    const message = isEditMode
      ? "Employee updated successfully! ✏️"
      : "Employee added successfully! 🎉";
    showSuccess(response?.message || message);
    resetForm();
    if (onSubmit) onSubmit();
    setTimeout(() => onClose(), 400);
  };

  const handleSubmitError = (error) => {
    let fieldErrors = {};
    const pushError = (field, value) => {
      if (Array.isArray(value)) {
        if (value[0]) fieldErrors[field] = value[0];
      } else if (typeof value === "string") {
        fieldErrors[field] = value;
      } else if (typeof value === "object" && value !== null) {
        Object.entries(value).forEach(([k, v]) => pushError(k, v));
      }
    };

    if (error?.message && typeof error.message === "object") {
      Object.entries(error.message).forEach(([field, value]) =>
        pushError(field, value)
      );
    } else if (error?.data && typeof error.data === "object") {
      Object.entries(error.data).forEach(([field, value]) =>
        pushError(field, value)
      );
    } else if (typeof error?.message === "string") {
      showError(error.message);
      return;
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
    }
    showError("Save Employee Failed. Please check input data.");
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setImagePreview(null);
    setDocumentPreviews({});
    setErrors({});
    setActiveTab("account");
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "account", label: "Account & Work", icon: <FaUserTie /> },
    { id: "personal", label: "Personal & Address", icon: <MdAccountBox /> },
    { id: "education", label: "Education & Exp", icon: <MdSchool /> },
    { id: "financial", label: "Bank & Payroll", icon: <FaMoneyBillWave /> },
    { id: "emergency", label: "Emergency Contact", icon: <FaPhoneAlt /> },
    { id: "documents", label: "Documents", icon: <IoDocumentAttach /> },
  ];

  return (
    <>
      {/* Crop Modal */}
      {showCropModal && (
        <div className="bg-black/60 fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-navy-800">
            <h3 className="mb-4 text-lg font-bold text-navy-700 dark:text-white">
              Crop Profile Picture
            </h3>
            <div className="relative h-64 w-full bg-gray-100 dark:bg-navy-700">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-navy-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal Overlay */}
      <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-2 backdrop-blur-sm sm:p-4">
        <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-navy-800 xl:max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-navy-800">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <MdEdit className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy-700 dark:text-white sm:text-xl">
                  {isEditMode
                    ? `Edit Employee - ${formData.first_name} ${formData.last_name}`
                    : "Add New Employee"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isEditMode
                    ? "Update employee records and attached documentation"
                    : "Fill out all required details to create a new employee profile"}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xl font-bold text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-navy-700 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden overflow-x-auto border-b border-gray-200 bg-gray-50/80 px-4 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] dark:border-gray-700 dark:bg-navy-700/50 md:flex [&::-webkit-scrollbar]:hidden">
            <div className="flex w-full items-center justify-between gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-2.5 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
                    activeTab === tab.id
                      ? "shadow-xs border-blue-600 bg-white text-blue-600 dark:border-blue-400 dark:bg-navy-800 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:bg-gray-100/70 hover:text-navy-700 dark:text-gray-400 dark:hover:bg-navy-700 dark:hover:text-white"
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Navigation Tabs (Dropdown + Step Badges) */}
          <div className="block border-b border-gray-200 bg-gray-50/90 p-2.5 dark:border-gray-700 dark:bg-navy-700 md:hidden">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                Step {tabs.findIndex((t) => t.id === activeTab) + 1} of{" "}
                {tabs.length}
              </span>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="rounded-lg border border-blue-500 bg-white px-2.5 py-1 text-xs font-bold text-blue-600 focus:outline-none dark:bg-navy-800 dark:text-blue-400"
              >
                {tabs.map((tab, idx) => (
                  <option key={tab.id} value={tab.id}>
                    {idx + 1}. {tab.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-1 flex-col items-center justify-center rounded-lg px-1 py-1.5 text-[10px] font-bold transition-all ${
                    activeTab === tab.id
                      ? "shadow-xs bg-blue-600 text-white"
                      : "border border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-navy-800 dark:text-gray-300"
                  }`}
                  title={tab.label}
                >
                  <span className="text-xs">{tab.icon}</span>
                  <span className="max-w-[42px] truncate">
                    {tab.label.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-navy-600 flex-1 space-y-6 overflow-y-auto p-6">
              {/* TAB 1: ACCOUNT & WORK */}
              {activeTab === "account" && (
                <div className="space-y-6">
                  {/* Profile Picture */}
                  <div className="rounded-xl bg-gray-50 p-4 dark:bg-navy-700">
                    <div className="mb-3 flex items-center space-x-2">
                      <FaCamera className="text-blue-600 dark:text-blue-400" />
                      <h3 className="text-base font-bold text-navy-700 dark:text-white">
                        Profile Photo
                      </h3>
                    </div>
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                      <label className="flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-white transition hover:border-blue-500 dark:border-gray-600 dark:bg-navy-800">
                        {imagePreview ? (
                          <img
                            src={
                              imagePreview.startsWith("http") ||
                              imagePreview.startsWith("data:")
                                ? imagePreview
                                : `${imagePreview}`
                            }
                            alt="Profile"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <MdCloudUpload className="text-3xl text-gray-400" />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          hidden
                        />
                      </label>
                      <div className="flex flex-col items-center sm:items-start">
                        <div className="flex items-center gap-2">
                          <label className="inline-block cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700">
                            Choose Photo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              hidden
                            />
                          </label>

                          {imagePreview && (
                            <button
                              type="button"
                              onClick={handleDeleteProfilePicture}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                            >
                              Delete Picture
                            </button>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                          Max size 10MB (JPG, PNG)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Basic Credentials */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        placeholder="First Name"
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                          errors.first_name
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      />
                      {errors.first_name && (
                        <span className="text-xs text-red-500">
                          {errors.first_name}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        placeholder="Last Name"
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 dark:border-gray-700 dark:bg-navy-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="user_name"
                        value={formData.user_name}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        placeholder="Username"
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400 ${
                          errors.user_name
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      />
                      {errors.user_name && (
                        <span className="text-xs text-red-500">
                          {errors.user_name}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Official Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        placeholder="test@sportstech.com"
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400 ${
                          errors.email
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      />
                      {errors.email && (
                        <span className="text-xs text-red-500">
                          {errors.email}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Employee Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="emp_code"
                        value={formData.emp_code}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        placeholder="EMP1001"
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400 ${
                          errors.emp_code
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      />
                      {errors.emp_code && (
                        <span className="text-xs text-red-500">
                          {errors.emp_code}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="gender"
                        value={formData.gender || ""}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400 ${
                          errors.gender
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && (
                        <span className="text-xs text-red-500">
                          {errors.gender}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Joining Date
                      </label>
                      <input
                        type="date"
                        name="doj_date"
                        value={formData.doj_date}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Work & Organization */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Department
                      </label>
                      <select
                        name="department"
                        value={String(formData.department)}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option
                            key={d.departid || d.id}
                            value={d.departid || d.id}
                          >
                            {d.department_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Role
                      </label>
                      <select
                        name="role"
                        value={String(formData.role)}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                      >
                        <option value="">Select Role</option>
                        {roles.map((r) => (
                          <option
                            key={r.roleid || r.id}
                            value={r.roleid || r.id}
                          >
                            {r.role_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Reporting Manager
                      </label>
                      <select
                        name="reporting_manager"
                        value={String(formData.reporting_manager)}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                      >
                        <option value="">Select Reporting Manager</option>
                        {managementManagers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.first_name
                              ? `${m.first_name} ${m.last_name || ""}`
                              : m.user_name || `ID: ${m.id}`}
                            {m.department_name ? ` (${m.department_name})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Designation
                      </label>
                      <input
                        type="text"
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        placeholder="Software Developer"
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Employment Type
                      </label>
                      <select
                        name="employment_type"
                        value={formData.employment_type}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                      >
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Work Location
                      </label>
                      <input
                        type="text"
                        name="work_location"
                        value={formData.work_location}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        placeholder="Madurai"
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Team / Business Unit
                      </label>
                      <input
                        type="text"
                        name="team_business_unit"
                        value={formData.team_business_unit}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        placeholder="Development"
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Probation Period
                      </label>
                      <input
                        type="text"
                        name="probation_period"
                        value={formData.probation_period}
                        onChange={handleInputChange}
                        disabled={!isSuperAdmin}
                        placeholder="6 Months"
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Password section */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        {isEditMode ? "New Password" : "Password"}{" "}
                        {!isEditMode && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder={isEditMode ? "Password" : "Password"}
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.password
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-gray-500"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.password && (
                        <span className="text-xs text-red-500">
                          {errors.password}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirm_password"
                          value={formData.confirm_password}
                          onChange={handleInputChange}
                          placeholder="Confirm Password"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.confirm_password
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-3 text-gray-500"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.confirm_password && (
                        <span className="text-xs text-red-500">
                          {errors.confirm_password}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PERSONAL & ADDRESS */}
              {activeTab === "personal" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dob_date"
                        value={formData.dob_date}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                          errors.dob_date
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      />
                      {errors.dob_date && (
                        <span className="text-xs text-red-500">
                          {errors.dob_date}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Marital Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="marital_status"
                        value={formData.marital_status}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                          errors.marital_status
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                      {errors.marital_status && (
                        <span className="text-xs text-red-500">
                          {errors.marital_status}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Nationality <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        placeholder="Indian"
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                          errors.nationality
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      />
                      {errors.nationality && (
                        <span className="text-xs text-red-500">
                          {errors.nationality}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Blood Group <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="blood_group"
                        value={formData.blood_group}
                        onChange={handleInputChange}
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                          errors.blood_group
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                      {errors.blood_group && (
                        <span className="text-xs text-red-500">
                          {errors.blood_group}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Personal Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="personal_email"
                        value={formData.personal_email}
                        onChange={handleInputChange}
                        placeholder="testpersonal@gmail.com"
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                          errors.personal_email
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      />
                      {errors.personal_email && (
                        <span className="text-xs text-red-500">
                          {errors.personal_email}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        placeholder="9876543210"
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                          errors.mobile
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      />
                      {errors.mobile && (
                        <span className="text-xs text-red-500">
                          {errors.mobile}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Alternate Mobile <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="alternate_mobile"
                        value={formData.alternate_mobile}
                        onChange={handleInputChange}
                        placeholder="9876500000"
                        className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                          errors.alternate_mobile
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      />
                      {errors.alternate_mobile && (
                        <span className="text-xs text-red-500">
                          {errors.alternate_mobile}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        Aadhaar Card Number
                      </label>
                      <input
                        type="text"
                        name="aadhaar_number"
                        value={
                          formData.aadhaar_number ||
                          formData.aadhaar_card_number ||
                          ""
                        }
                        onChange={(e) => {
                          handleInputChange(e);
                          setFormData((prev) => ({
                            ...prev,
                            aadhaar_number: e.target.value,
                            aadhaar_card_number: e.target.value,
                          }));
                        }}
                        placeholder="1234 5678 9012"
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 dark:border-gray-700 dark:bg-navy-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-navy-700 dark:text-white">
                        PAN Card Number
                      </label>
                      <input
                        type="text"
                        name="pan_number"
                        value={
                          formData.pan_number || formData.pan_card_number || ""
                        }
                        onChange={(e) => {
                          handleInputChange(e);
                          setFormData((prev) => ({
                            ...prev,
                            pan_number: e.target.value,
                            pan_card_number: e.target.value,
                          }));
                        }}
                        placeholder="ABCDE1234F"
                        className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 dark:border-gray-700 dark:bg-navy-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Current Address */}
                  {/* Current Address */}
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-base font-bold text-navy-700 dark:text-white">
                        Current Address <span className="text-red-500">*</span>
                      </h4>
                      <label className="flex cursor-pointer items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <input
                          type="checkbox"
                          name="same_as_current"
                          checked={formData.same_as_current}
                          onChange={handleInputChange}
                          className="rounded text-blue-600"
                        />
                        <span>Same as Permanent Address</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <input
                          type="text"
                          name="current_address_line1"
                          value={formData.current_address_line1}
                          onChange={handleInputChange}
                          placeholder="Address Line 1 *"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.current_address_line1
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.current_address_line1 && (
                          <span className="text-xs text-red-500">
                            {errors.current_address_line1}
                          </span>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          name="current_address_line2"
                          value={formData.current_address_line2}
                          onChange={handleInputChange}
                          placeholder="Address Line 2"
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 dark:border-gray-700 dark:bg-navy-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          name="current_city"
                          value={formData.current_city}
                          onChange={handleInputChange}
                          placeholder="City *"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.current_city
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.current_city && (
                          <span className="text-xs text-red-500">
                            {errors.current_city}
                          </span>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          name="current_state"
                          value={formData.current_state}
                          onChange={handleInputChange}
                          placeholder="State *"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.current_state
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.current_state && (
                          <span className="text-xs text-red-500">
                            {errors.current_state}
                          </span>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          name="current_country"
                          value={formData.current_country}
                          onChange={handleInputChange}
                          placeholder="Country *"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.current_country
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.current_country && (
                          <span className="text-xs text-red-500">
                            {errors.current_country}
                          </span>
                        )}
                      </div>
                      <div>
                        <input
                          type="text"
                          name="current_pincode"
                          value={formData.current_pincode}
                          onChange={handleInputChange}
                          placeholder="Pincode *"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.current_pincode
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.current_pincode && (
                          <span className="text-xs text-red-500">
                            {errors.current_pincode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Permanent Address */}
                  {!formData.same_as_current && (
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <h4 className="mb-3 text-base font-bold text-navy-700 dark:text-white">
                        Permanent Address{" "}
                        <span className="text-red-500">*</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <input
                            type="text"
                            name="permanent_address_line1"
                            value={formData.permanent_address_line1}
                            onChange={handleInputChange}
                            placeholder="Address Line 1 *"
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.permanent_address_line1
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.permanent_address_line1 && (
                            <span className="text-xs text-red-500">
                              {errors.permanent_address_line1}
                            </span>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            name="permanent_address_line2"
                            value={formData.permanent_address_line2}
                            onChange={handleInputChange}
                            placeholder="Address Line 2"
                            className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 dark:border-gray-700 dark:bg-navy-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            name="permanent_city"
                            value={formData.permanent_city}
                            onChange={handleInputChange}
                            placeholder="City *"
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.permanent_city
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.permanent_city && (
                            <span className="text-xs text-red-500">
                              {errors.permanent_city}
                            </span>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            name="permanent_state"
                            value={formData.permanent_state}
                            onChange={handleInputChange}
                            placeholder="State *"
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.permanent_state
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.permanent_state && (
                            <span className="text-xs text-red-500">
                              {errors.permanent_state}
                            </span>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            name="permanent_country"
                            value={formData.permanent_country}
                            onChange={handleInputChange}
                            placeholder="Country *"
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.permanent_country
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.permanent_country && (
                            <span className="text-xs text-red-500">
                              {errors.permanent_country}
                            </span>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            name="permanent_pincode"
                            value={formData.permanent_pincode}
                            onChange={handleInputChange}
                            placeholder="Pincode *"
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.permanent_pincode
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.permanent_pincode && (
                            <span className="text-xs text-red-500">
                              {errors.permanent_pincode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: EDUCATION & EXPERIENCE */}
              {activeTab === "education" && (
                <div className="space-y-6">
                  {/* Educational Details */}
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <h4 className="mb-3 text-base font-bold text-navy-700 dark:text-white">
                      Educational Qualifications
                    </h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Highest Qualification{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="qualification"
                          value={formData.qualification}
                          onChange={handleInputChange}
                          placeholder="B.E / B.Tech / M.Sc"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.qualification
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.qualification && (
                          <span className="text-xs text-red-500">
                            {errors.qualification}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Course / Degree{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="course_degree"
                          value={formData.course_degree}
                          onChange={handleInputChange}
                          placeholder="Computer Science"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.course_degree
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.course_degree && (
                          <span className="text-xs text-red-500">
                            {errors.course_degree}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Specialization <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleInputChange}
                          placeholder="Computer Science"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.specialization
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.specialization && (
                          <span className="text-xs text-red-500">
                            {errors.specialization}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          University / Institution{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="institution_university"
                          value={formData.institution_university}
                          onChange={handleInputChange}
                          placeholder="Anna University"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.institution_university
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.institution_university && (
                          <span className="text-xs text-red-500">
                            {errors.institution_university}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Year of Passing{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="year_of_passing"
                          value={formData.year_of_passing}
                          onChange={handleInputChange}
                          placeholder="2020"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.year_of_passing
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.year_of_passing && (
                          <span className="text-xs text-red-500">
                            {errors.year_of_passing}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Percentage / CGPA{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="percentage_cgpa"
                          value={formData.percentage_cgpa}
                          onChange={handleInputChange}
                          placeholder="8.50"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.percentage_cgpa
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.percentage_cgpa && (
                          <span className="text-xs text-red-500">
                            {errors.percentage_cgpa}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-base font-bold text-navy-700 dark:text-white">
                        Previous Work Experience
                      </h4>
                      <label className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                        <input
                          type="checkbox"
                          name="is_fresher"
                          checked={formData.is_fresher}
                          onChange={handleInputChange}
                          className="rounded text-blue-600"
                        />
                        <span>Fresher (No Prior Experience)</span>
                      </label>
                    </div>

                    {!formData.is_fresher && (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                            Previous Employer{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="previous_employer"
                            value={formData.previous_employer}
                            onChange={handleInputChange}
                            placeholder="ABC Technologies"
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.previous_employer
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.previous_employer && (
                            <span className="text-xs text-red-500">
                              {errors.previous_employer}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                            Previous Job Title{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="previous_job_title"
                            value={formData.previous_job_title}
                            onChange={handleInputChange}
                            placeholder="Junior Developer"
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.previous_job_title
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.previous_job_title && (
                            <span className="text-xs text-red-500">
                              {errors.previous_job_title}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="previous_employment_start_date"
                            value={formData.previous_employment_start_date}
                            onChange={handleInputChange}
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.previous_employment_start_date
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.previous_employment_start_date && (
                            <span className="text-xs text-red-500">
                              {errors.previous_employment_start_date}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                            End Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="previous_employment_end_date"
                            value={formData.previous_employment_end_date}
                            onChange={handleInputChange}
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.previous_employment_end_date
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.previous_employment_end_date && (
                            <span className="text-xs text-red-500">
                              {errors.previous_employment_end_date}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                            Last Drawn CTC{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="last_drawn_ctc"
                            value={formData.last_drawn_ctc}
                            onChange={handleInputChange}
                            placeholder="500000.00"
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.last_drawn_ctc
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.last_drawn_ctc && (
                            <span className="text-xs text-red-500">
                              {errors.last_drawn_ctc}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                            Reason for Leaving{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="reason_for_leaving"
                            value={formData.reason_for_leaving}
                            onChange={handleInputChange}
                            placeholder="Career Growth"
                            className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                              errors.reason_for_leaving
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {errors.reason_for_leaving && (
                            <span className="text-xs text-red-500">
                              {errors.reason_for_leaving}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: BANK & PAYROLL */}
              {activeTab === "financial" && (
                <div className="space-y-6">
                  {/* Salary & Tax */}
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-base font-bold text-navy-700 dark:text-white">
                        Salary & Tax Information
                      </h4>
                      {!isSuperAdmin && (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                          View Only
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Basic Salary
                        </label>
                        <input
                          type="number"
                          name="basic_salary"
                          value={formData.basic_salary}
                          onChange={handleInputChange}
                          disabled={!isSuperAdmin}
                          placeholder="Basic Salary"
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Provisional Tax
                        </label>
                        <input
                          type="number"
                          name="provisional_tax"
                          value={formData.provisional_tax}
                          onChange={handleInputChange}
                          disabled={!isSuperAdmin}
                          placeholder="Provisional Tax"
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          UAN Number
                        </label>
                        <input
                          type="text"
                          name="uan_number"
                          value={formData.uan_number}
                          onChange={handleInputChange}
                          disabled={!isSuperAdmin}
                          placeholder="UAN Number"
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          ESIC Number
                        </label>
                        <input
                          type="text"
                          name="esic_number"
                          value={formData.esic_number}
                          onChange={handleInputChange}
                          disabled={!isSuperAdmin}
                          placeholder="ESIC Number"
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          PF Member ID
                        </label>
                        <input
                          type="text"
                          name="pf_member_id"
                          value={formData.pf_member_id}
                          onChange={handleInputChange}
                          disabled={!isSuperAdmin}
                          placeholder="PF123456"
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                        />
                      </div>
                      {/* <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          PAN Number
                        </label>
                        <input
                          type="text"
                          name="pan_number"
                          value={formData.pan_number}
                          onChange={handleInputChange}
                          disabled={!isSuperAdmin}
                          placeholder="ABCDE1234F"
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:disabled:bg-navy-800 dark:disabled:text-gray-400"
                        />
                      </div> */}
                    </div>
                  </div>

                  {/* Bank Account Details */}
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <h4 className="mb-3 text-base font-bold text-navy-700 dark:text-white">
                      Bank Account Details
                    </h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Account Holder Name{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="account_holder_name"
                          value={formData.account_holder_name}
                          onChange={handleInputChange}
                          placeholder="Test Employee"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.account_holder_name
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.account_holder_name && (
                          <span className="text-xs text-red-500">
                            {errors.account_holder_name}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Bank Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="bank_name"
                          value={formData.bank_name}
                          onChange={handleInputChange}
                          placeholder="HDFC Bank"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.bank_name
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.bank_name && (
                          <span className="text-xs text-red-500">
                            {errors.bank_name}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Bank Account Number{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="bank_account"
                          value={formData.bank_account}
                          onChange={handleInputChange}
                          placeholder="Account Number"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.bank_account
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.bank_account && (
                          <span className="text-xs text-red-500">
                            {errors.bank_account}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          IFSC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="ifsc_code"
                          value={formData.ifsc_code}
                          onChange={handleInputChange}
                          placeholder="HDFC0001234"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.ifsc_code
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.ifsc_code && (
                          <span className="text-xs text-red-500">
                            {errors.ifsc_code}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Branch Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="branch_name"
                          value={formData.branch_name}
                          onChange={handleInputChange}
                          placeholder="Branch Location"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.branch_name
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.branch_name && (
                          <span className="text-xs text-red-500">
                            {errors.branch_name}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Bank Type / Account Type{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="bank_type"
                          value={formData.bank_type}
                          onChange={handleInputChange}
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.bank_type
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <option value="">Select Account Type</option>
                          <option value="Savings">Savings Account</option>
                          <option value="Current">Current Account</option>
                          <option value="Salary">Salary Account</option>
                        </select>
                        {errors.bank_type && (
                          <span className="text-xs text-red-500">
                            {errors.bank_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: EMERGENCY CONTACT */}
              {activeTab === "emergency" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                    <h4 className="mb-3 text-base font-bold text-navy-700 dark:text-white">
                      Emergency Contact Information
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Contact Person Name{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="emergency_contact_name"
                          value={formData.emergency_contact_name}
                          onChange={handleInputChange}
                          placeholder="Test Parent"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.emergency_contact_name
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.emergency_contact_name && (
                          <span className="text-xs text-red-500">
                            {errors.emergency_contact_name}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Relationship <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="emergency_contact_relationship"
                          value={formData.emergency_contact_relationship}
                          onChange={handleInputChange}
                          placeholder="Father / Mother / Spouse"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.emergency_contact_relationship
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.emergency_contact_relationship && (
                          <span className="text-xs text-red-500">
                            {errors.emergency_contact_relationship}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Primary Emergency Mobile{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="emergency_contact_mobile"
                          value={formData.emergency_contact_mobile}
                          onChange={handleInputChange}
                          placeholder="9876511111"
                          className={`w-full rounded-lg border-2 bg-white px-3 py-2 text-sm text-navy-700 dark:bg-navy-700 dark:text-white ${
                            errors.emergency_contact_mobile
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.emergency_contact_mobile && (
                          <span className="text-xs text-red-500">
                            {errors.emergency_contact_mobile}
                          </span>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-navy-700 dark:text-white">
                          Alternate Emergency Mobile
                        </label>
                        <input
                          type="tel"
                          name="emergency_contact_alternate_mobile"
                          value={formData.emergency_contact_alternate_mobile}
                          onChange={handleInputChange}
                          placeholder="9876522222"
                          className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm text-navy-700 dark:border-gray-700 dark:bg-navy-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: DOCUMENTS */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Upload employee certificates and identification files (PDF
                    or Images, max 10MB each).
                  </p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {Object.entries(documentFieldsList).map(
                      ([docKey, docInfo]) => (
                        <div
                          key={docKey}
                          className={`shadow-2xs flex h-44 flex-col justify-between rounded-xl border bg-white p-3 transition-all dark:bg-navy-800 ${
                            errors[docKey]
                              ? "border-red-500 ring-1 ring-red-500/50 dark:border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-1">
                            <label className="truncate text-xs font-bold text-navy-700 dark:text-white">
                              {docInfo.label}{" "}
                              {docInfo.required && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            {formData[docKey] && (
                              <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                Uploaded
                              </span>
                            )}
                          </div>

                          <div className="relative flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/80 p-2 text-center transition hover:border-blue-500 dark:border-gray-600 dark:bg-navy-700/60">
                            {formData[docKey] ? (
                              <div className="relative flex h-full w-full flex-col items-center justify-center gap-1.5 p-1">
                                {/* Red Into Mark / Close Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData((prev) => ({
                                      ...prev,
                                      [docKey]: null,
                                    }));
                                    setDocumentPreviews((prev) => ({
                                      ...prev,
                                      [docKey]: null,
                                    }));
                                  }}
                                  className="absolute right-0 top-0 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-all hover:scale-110 hover:bg-red-600"
                                  title="Remove document"
                                >
                                  <MdClose size={14} />
                                </button>

                                {documentPreviews[docKey]?.type === "image" ? (
                                  <div className="flex w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-600 dark:bg-navy-800">
                                    <img
                                      src={documentPreviews[docKey].src}
                                      alt={docInfo.label}
                                      className="h-9 w-9 shrink-0 rounded border border-gray-200 object-cover dark:border-gray-700"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = "none";
                                      }}
                                    />
                                    <span className="flex-1 truncate text-left text-xs font-semibold text-navy-700 dark:text-white">
                                      {formData[docKey].name ||
                                        String(formData[docKey])
                                          .split("/")
                                          .pop()}
                                    </span>
                                    {(documentPreviews[docKey]?.src ||
                                      typeof formData[docKey] === "string") && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const targetUrl =
                                            documentPreviews[docKey]?.src ||
                                            (typeof formData[docKey] ===
                                            "string"
                                              ? formData[docKey]
                                              : null);
                                          if (targetUrl)
                                            window.open(targetUrl, "_blank");
                                        }}
                                        className="rounded bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300"
                                        title="View Document"
                                      >
                                        <FaEye size={14} />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 dark:border-gray-600 dark:bg-navy-800">
                                    <span className="text-xl">📄</span>
                                    <span className="flex-1 truncate text-left text-xs font-semibold text-navy-700 dark:text-white">
                                      {formData[docKey].name ||
                                        String(formData[docKey])
                                          .split("/")
                                          .pop()}
                                    </span>
                                    {(documentPreviews[docKey]?.src ||
                                      typeof formData[docKey] === "string") && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const targetUrl =
                                            documentPreviews[docKey]?.src ||
                                            (typeof formData[docKey] ===
                                            "string"
                                              ? formData[docKey]
                                              : null);
                                          if (targetUrl)
                                            window.open(targetUrl, "_blank");
                                        }}
                                        className="rounded bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300"
                                        title="View Document"
                                      >
                                        <FaEye size={14} />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center py-2">
                                <MdCloudUpload className="mb-1 text-2xl text-blue-500" />
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                  Click to upload
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  PDF or Image (Max 10MB)
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  onChange={(e) =>
                                    handleDocumentChange(e, docKey)
                                  }
                                  hidden
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-navy-800 sm:px-6">
              <div className="flex items-center gap-1.5">
                {activeTab !== "account" && (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = tabs.findIndex((t) => t.id === activeTab);
                      if (idx > 0) setActiveTab(tabs[idx - 1].id);
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-navy-700 transition-all hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-navy-700"
                  >
                    ← Prev
                  </button>
                )}
                {activeTab !== "documents" && (
                  <button
                    type="button"
                    onClick={() => {
                      const idx = tabs.findIndex((t) => t.id === activeTab);
                      if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                    }}
                    className="rounded-lg bg-gray-200 px-3 py-2 text-xs font-bold text-navy-700 transition-all hover:bg-gray-300 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600"
                  >
                    Next →
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-navy-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  {isEditMode ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddEmployeeModal;
