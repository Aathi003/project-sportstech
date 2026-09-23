import React from "react";
import LeaveRequestsList from "components/leave/LeaveRequestsList";

export default function LeaveRequestsView() {
  return (
    <div className="bg-slate-200 min-h-screen p-2 dark:bg-navy-900 sm:p-3">
      <div className="bg-white mx-auto w-full rounded-3xl border px-2 py-3 
       dark:border-white/10 dark:bg-navy-800/50 sm:px-3 sm:py-4">
        <LeaveRequestsList />
      </div>
    </div>
  );
}
