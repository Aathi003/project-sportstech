import React, { useEffect, useState } from "react";
import Card from "./index";
import employeeAPI from "services/employeeAPI";
import EmployeeProfileImage from "../navbar/EmployeeProfileImage";
import { FaEye } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import AddEmployeeModal from "../modal/AddEmployeeModal";

const ProfileCard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const userId =
    localStorage.getItem("employee_id") ||
    localStorage.getItem("user_id") ||
    localStorage.getItem("id") ||
    localStorage.getItem("emp_id");

  useEffect(() => {
    if (!userId) {
      setError("No employee ID found. Please log in again.");
      setLoading(false);
      return;
    }

    employeeAPI.getEmployeeById(
      userId,
      (data) => {
        const userData =
          data?.data || data?.results || data?.employee || data?.user || data;

        if (
          userData &&
          typeof userData === "object" &&
          !Array.isArray(userData)
        ) {
          setUser(userData);
        } else if (Array.isArray(userData) && userData.length > 0) {
          setUser(userData[0]);
        } else {
          setError("Profile data not found.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("ProfileCard API error:", err);
        setError("Failed to load profile.");
        setLoading(false);
      }
    );
  }, [userId]);

  if (loading) {
    return (
      <Card extra="w-full h-full p-4">
        <div className="py-8 text-center text-gray-500">Loading profile...</div>
      </Card>
    );
  }

  if (error || !user) {
    return (
      <Card extra="w-full h-full p-4">
        <div className="py-8 text-center text-red-500">
          {error || "Unable to load profile."}
        </div>
      </Card>
    );
  }

  const displayName =
    user.user_name ||
    user.employee_name ||
    user.full_name ||
    user.first_name ||
    "-";

  return (
    <Card extra="w-full h-full overflow-hidden">
      {/* Header Section - Gradient Background */}
      <div
        className="relative px-5 pb-5 pt-5"
        style={{
          background: "linear-gradient(135deg, #4318FF 0%, #868CFF 100%)",
        }}
      >
        {/* Action Buttons - Top Right */}
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            onClick={() => setShowDocumentModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/40"
            title="View Documents"
          >
            <FaEye size={14} />
            <span>View</span>
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/40"
            title="Edit Profile"
          >
            <MdEdit size={14} />
          </button>
        </div>

        {/* Profile Image & Name */}
        <div className="flex flex-col items-center pt-2">
          <div className="rounded-full border-[3px] border-white/40 p-[2px]">
            <EmployeeProfileImage
              employeeId={user.id || user.employee_id}
              className="h-20 w-20 rounded-full object-cover"
            />
          </div>
          <div className="mt-3 text-center">
            <h3 className="text-lg font-bold text-white">{displayName}</h3>
            {(user.role_name || user.designation) && (
              <p className="mt-0.5 text-sm text-white/80">
                {user.role_name || user.designation}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="space-y-3 px-5 py-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 dark:border-navy-600">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Phone Number
          </span>
          <span className="text-sm font-semibold text-navy-700 dark:text-white">
            {user.phone || user.mobile || user.phone_number || "-"}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 dark:border-navy-600">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Email Address
          </span>
          <span className="max-w-[60%] break-all text-right text-sm font-semibold text-navy-700 dark:text-white">
            {user.email || user.email_address || "-"}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 dark:border-navy-600">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Address
          </span>
          <span className="max-w-[60%] text-right text-sm font-semibold text-navy-700 dark:text-white">
            {user.address ||
              user.permanent_address ||
              user.current_address ||
              "-"}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 dark:border-navy-600">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Department
          </span>
          <span className="text-sm font-semibold text-navy-700 dark:text-white">
            {user.department_name || user.report_office || user.office || "-"}
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 dark:border-navy-600">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Role
          </span>
          <span className="text-sm font-semibold text-navy-700 dark:text-white">
            {user.role_name || user.designation || "-"}
          </span>
        </div>

        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Joined on
          </span>
          <span className="text-sm font-semibold text-navy-700 dark:text-white">
            {user.joined_date
              ? new Date(user.joined_date).toLocaleDateString()
              : user.date_of_joining
              ? new Date(user.date_of_joining).toLocaleDateString()
              : "-"}
          </span>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <AddEmployeeModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          isEditMode={true}
          editingEmployee={user}
        />
      )}

      {/* Documents Modal */}
      {showDocumentModal && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-sm backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
              <div>
                <h2 className="text-lg font-bold text-navy-700">Documents</h2>
                <p className="text-xs text-gray-600">{displayName}</p>
              </div>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-2xl font-bold text-gray-400 transition hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {/* Documents List */}
            <div className="space-y-2.5 p-4">
              {[
                {
                  key: "sslcCertificate",
                  label: "SSLC Certificate",
                  bgColor: "bg-purple-100",
                  iconColor: "text-purple-600",
                },
                {
                  key: "relieving_letter",
                  label: "Relieving Letter",
                  bgColor: "bg-orange-100",
                  iconColor: "text-orange-600",
                },
                {
                  key: "bank_passbook",
                  label: "Bank Passbook",
                  bgColor: "bg-indigo-100",
                  iconColor: "text-indigo-600",
                },
                {
                  key: "salary_slips",
                  label: "Salary Slips",
                  bgColor: "bg-yellow-100",
                  iconColor: "text-yellow-600",
                },
                {
                  key: "aadhaar_card",
                  label: "Aadhaar",
                  bgColor: "bg-pink-100",
                  iconColor: "text-pink-600",
                },
                {
                  key: "pan_card",
                  label: "PAN Card",
                  bgColor: "bg-blue-100",
                  iconColor: "text-blue-600",
                },
              ].map((doc) => {
                const fileUrl = user[doc.key];
                const isUploaded = fileUrl ? true : false;
                let fullUrl = "";
                if (fileUrl) {
                  fullUrl = fileUrl.startsWith("http") ? fileUrl : `${fileUrl}`;
                }
                const fileName = fileUrl ? fileUrl.split("/").pop() : null;
                return (
                  <div
                    key={doc.key}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
                  >
                    <div className="flex flex-1 items-center gap-3 sm:gap-4">
                      <div className={`${doc.bgColor} rounded-lg p-2 sm:p-3`}>
                        <div className={`${doc.iconColor} text-xl sm:text-2xl`}>
                          <FaEye />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy-700 sm:text-base">
                          {doc.label}
                        </p>
                        {isUploaded ? (
                          <div>
                            <p className="text-xs font-medium text-green-600 sm:text-sm">
                              Uploaded
                            </p>
                            <p className="mt-0.5 break-all text-[10px] text-gray-500 sm:mt-1 sm:text-xs">
                              {fileName}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-red-500 sm:text-sm">
                            Not uploaded
                          </p>
                        )}
                      </div>
                    </div>
                    {isUploaded && (
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full whitespace-nowrap rounded-lg bg-blue-500 px-3 py-1.5 text-center text-xs font-medium text-white transition hover:bg-blue-600 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
                      >
                        View/Download
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProfileCard;
