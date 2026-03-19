import {useState, useEffect  } from "react";
import avatarMale from "assets/img/avatars/male_profile.png";
import avatarFemale from "assets/img/avatars/female_profile.png";
import employeeAPI from "services/employeeAPI";

const API_BASE = "https://hrm.sportstech.team/api/";

export default function EmployeeProfileImage({ employeeId, ...props }) {
  const [profileUrl, setProfileUrl] = useState(avatarMale);

  useEffect(() => {
    if (!employeeId) return;
    employeeAPI.getEmployeeById(
      employeeId,
      (data) => {
        let emp = data?.data || data?.results || data;
        if (Array.isArray(emp)) emp = emp[0];
        if (emp && emp.profile_picture) {
          if (
            emp.profile_picture.startsWith("http") ||
            emp.profile_picture.startsWith("data:")
          ) {
            setProfileUrl(emp.profile_picture);
          } else {
            setProfileUrl(`${API_BASE}${emp.profile_picture}`);
          }
        } else if (emp && emp.gender) {
          if (emp.gender.toLowerCase() === "female") {
            setProfileUrl(avatarFemale);
          } else {
            setProfileUrl(avatarMale);
          }
        } else {
          setProfileUrl(avatarMale);
        }
      },
      () => setProfileUrl(avatarMale)
    );
  }, [employeeId]);

  return (
    <img
      className="h-10 w-10 rounded-full"
      src={profileUrl}
      alt="Profile"
      {...props}
    />
  );
}
