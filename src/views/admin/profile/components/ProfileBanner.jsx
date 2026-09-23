import React, { useEffect, useState } from "react";
import maleProfile from "assets/img/avatars/male_profile.png";
import femaleProfile from "assets/img/avatars/female_profile.png";
import banner from "assets/img/profile/banner.png";
import Card from "components/card";
import employeeAPI from "services/employeeAPI";
import { FaEye } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { IoDocumentText } from "react-icons/io5";
import AddEmployeeModal from "components/modal/AddEmployeeModal";

const ProfileBanner = () => {
  const [employee, setEmployee] = useState(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const userId =
    localStorage.getItem("employee_id") || localStorage.getItem("user_id");

  const fetchEmployeeData = () => {
    if (userId) {
      employeeAPI.getEmployeeById(
        userId,
        (data) => {
          // Try to handle different API response shapes
          let emp = data?.data || data?.results || data;
          // If array, take first
          if (Array.isArray(emp)) emp = emp[0];
          setEmployee(emp);
        },
        (err) => {
          setEmployee({ error: true });
        }
      );
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [userId]);

  // Handle view documents
  const handleViewDocuments = () => {
    setDocumentModalOpen(true);
  };

  // Handle edit employee
  const handleEditEmployee = () => {
    setIsEditModalOpen(true);
  };

  // Handle successful employee update
  const handleEmployeeSubmit = () => {
    setTimeout(() => {
      fetchEmployeeData();
      setIsEditModalOpen(false);
    }, 500);
  };

  if (!employee) {
    return (
      <Card extra={"items-center w-full h-full p-[16px] bg-cover"}>
        <div className="py-8 text-center text-gray-500">Loading profile...</div>
      </Card>
    );
  }
  if (employee.error) {
    return (
      <Card extra={"items-center w-full h-full p-[16px] bg-cover"}>
        <div className="py-8 text-center text-red-500">
          Unable to load employee details.
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card extra={"items-center w-full p-[16px] bg-cover"}>
        {/* Banner Background */}
        <div className="relative mt-1 flex h-32 w-full justify-center rounded-xl bg-cover">
          {/* Light mode background image */}
          <div
            className="absolute flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 dark:hidden"
            style={{
              backgroundImage: `url(https://www.sportstech.de/cdn/shop/files/logo__4_59d2ab76-f9f0-4f4f-804d-618913cd4325.svg?v=1775131600&width=212)`,
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          {/* Dark mode image */}
          <img
            src="/Frame4.png"
            alt="SportsTech Logo Dark"
            className="absolute hidden h-full w-full rounded-xl object-contain dark:block"
          />
        </div>

        {/* Profile Picture - Positioned absolute to overlap banner */}
        <div className="absolute top-24 flex flex-col items-center">
          <div className="relative flex h-[87px] w-[87px] items-center justify-center rounded-full border-[4px] border-white bg-brand-100 dark:border-navy-800 dark:bg-brand-900">
            <img
              className="h-full w-full rounded-full object-cover"
              src={
                employee?.profile_picture &&
                employee.profile_picture.trim() !== ""
                  ? employee.profile_picture.startsWith("data:")
                    ? employee.profile_picture
                    : `${employee.profile_picture}`
                  : employee?.gender?.trim().toLowerCase() === "male"
                  ? maleProfile
                  : employee?.gender?.trim().toLowerCase() === "female"
                  ? femaleProfile
                  : maleProfile
              }
              alt="Profile"
            />
          </div>

          {/* Action Buttons Row - Directly under profile picture */}
          <div className="mt-2 flex gap-2">
            {/* View Documents Button */}
            <button
              onClick={handleViewDocuments}
              className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 shadow-sm transition hover:bg-blue-100 dark:bg-navy-700 dark:text-blue-400 dark:hover:bg-navy-600"
              title="View Documents"
            >
              <FaEye size={16} />
              <span>View</span>
            </button>
            {/* Edit Profile Button */}
            <button
              onClick={handleEditEmployee}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-md transition hover:bg-blue-50 dark:bg-navy-700 dark:text-blue-400 dark:hover:bg-navy-600"
              title="Edit Profile"
            >
              <MdEdit size={16} />
            </button>
          </div>
        </div>

        {/* Profile Information - Increased top margin to accommodate buttons */}
        <div className="mt-[75px] flex w-full flex-col items-center">
          {/* Name */}
          <h4 className="text-xl font-bold text-navy-700 dark:text-white">
            {(employee && employee.user_name) || "Employee Name"}
          </h4>

          {/* Details Grid */}
          <div className="mt-6 flex w-full flex-col gap-3">
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-gray-500">
                Phone Number
              </p>
              <p className="text-base font-normal text-navy-700 dark:text-white">
                {(employee && employee.mobile) || "-"}
              </p>
            </div>

            <div className="flex flex-col">
              <p className="text-xs font-semibold text-gray-500">
                Email Address
              </p>
              <p className="text-base font-normal text-navy-700 dark:text-white">
                {(employee && employee.email) || "-"}
              </p>
            </div>

            <div className="flex flex-col">
              <p className="text-xs font-semibold text-gray-500">Address</p>
              <p className="text-base font-normal text-navy-700 dark:text-white">
                {(employee && employee.address) || "-"}
              </p>
            </div>

            <div className="flex flex-col">
              <p className="text-xs font-semibold text-gray-500">Joined on</p>
              <p className="text-base font-normal text-navy-700 dark:text-white">
                {(employee && employee.doj_date) || "-"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Employee Modal */}
      <AddEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEmployeeSubmit}
        isEditMode={true}
        editingEmployee={employee}
      />

      {/* Document Viewer Modal - Same as Employee component */}
      {documentModalOpen && employee && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-3 backdrop-blur-sm backdrop-blur-sm sm:p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-navy-800 sm:rounded-2xl">
            {/* Header - Responsive */}
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-navy-800 sm:px-6 sm:py-4">
              <div>
                <h2 className="text-lg font-bold text-navy-700 dark:text-white sm:text-2xl">
                  Documents
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                  {employee.user_name}
                </p>
              </div>
              <button
                onClick={() => setDocumentModalOpen(false)}
                className="text-2xl font-bold text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300 sm:text-3xl"
              >
                ✕
              </button>
            </div>

            {/* Documents List - Responsive */}
            <div className="space-y-2.5 p-4 sm:space-y-3 sm:p-6">
              {[
                {
                  key: "sslcCertificate",
                  label: "SSLC Certificate",
                  bgColor: "bg-purple-100 dark:bg-purple-900",
                  iconColor: "text-purple-600 dark:text-purple-300",
                },
                {
                  key: "relieving_letter",
                  label: "Relieving Letter",
                  bgColor: "bg-orange-100 dark:bg-orange-900",
                  iconColor: "text-orange-600 dark:text-orange-300",
                },
                {
                  key: "bank_passbook",
                  label: "Bank Passbook",
                  bgColor: "bg-indigo-100 dark:bg-indigo-900",
                  iconColor: "text-indigo-600 dark:text-indigo-300",
                },
                {
                  key: "salary_slips",
                  label: "Salary Slips",
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
              ].map((doc) => {
                const fileUrl = employee[doc.key];
                const isUploaded = fileUrl ? true : false;

                // Construct full URL - WITHOUT NGROK LINK
                let fullUrl = "";
                if (fileUrl) {
                  if (fileUrl.startsWith("http")) {
                    fullUrl = fileUrl;
                  } else {
                    fullUrl = `${fileUrl}`;
                  }
                }

                const fileName = fileUrl ? fileUrl.split("/").pop() : null;

                return (
                  <div
                    key={doc.key}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-navy-700 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
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
                            <p className="text-xs font-medium text-green-600 dark:text-green-400 sm:text-sm">
                              Uploaded
                            </p>
                            <p className="mt-0.5 break-all text-[10px] text-gray-500 dark:text-gray-400 sm:mt-1 sm:text-xs">
                              {fileName}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-red-500 dark:text-red-400 sm:text-sm">
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
    </>
  );
};

export default ProfileBanner;
