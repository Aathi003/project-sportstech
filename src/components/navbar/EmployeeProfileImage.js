import { useState, useEffect } from "react";
import avatarMale from "assets/img/avatars/male_profile.png";
import avatarFemale from "assets/img/avatars/female_profile.png";
import employeeAPI from "services/employeeAPI";
import { API_BASE } from "services/apiConfig";

export default function EmployeeProfileImage({ employeeId, gender, src, className, ...props }) {
  const [profileUrl, setProfileUrl] = useState(null);

  useEffect(() => {
    // If a direct src is passed, use it immediately
    if (src) {
      setProfileUrl(src);
      return;
    }

    // If no employeeId, fall back to gender-based avatar
    if (!employeeId) {
      setProfileUrl(gender?.toLowerCase() === "female" ? avatarFemale : avatarMale);
      return;
    }

    employeeAPI.getEmployeeById(
      employeeId,
      (data) => {
        // Normalize the response shape
        let emp = data?.data ?? data?.results ?? data;
        if (Array.isArray(emp)) emp = emp[0];

        if (emp?.profile_picture) {
          const pic = emp.profile_picture;
          if (pic.startsWith("http") || pic.startsWith("data:")) {
            setProfileUrl(pic);
          } else {
            // Ensure no double slashes between base and path
            const base = API_BASE?.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
            const path = pic.startsWith("/") ? pic : `/${pic}`;
            setProfileUrl(`${base}${path}`);
          }
        } else {
          const g = emp?.gender?.toLowerCase();
          setProfileUrl(g === "female" ? avatarFemale : avatarMale);
        }
      },
      () => {
        // On API error, fall back gracefully
        setProfileUrl(gender?.toLowerCase() === "female" ? avatarFemale : avatarMale);
      }
    );
  }, [employeeId, src, gender]);

  const fallback = gender?.toLowerCase() === "female" ? avatarFemale : avatarMale;

  return (
    <img
      className={`h-10 w-10 rounded-full object-cover ${className ?? ""}`}
      src={profileUrl ?? fallback}
      alt="Profile"
      onError={(e) => {
        // If the image URL fails to load, fall back to avatar
        e.currentTarget.onerror = null;
        e.currentTarget.src = fallback;
      }}
      {...props}
    />
  );
}