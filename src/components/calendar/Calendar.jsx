import React, { useState, useEffect, useMemo } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaUserClock,
} from "react-icons/fa";
import { MdClose, MdEdit } from "react-icons/md";
import Swal from "sweetalert2";
import calendarAPI from "../../services/calendarAPI";
import { MdDelete } from "react-icons/md";
import { useAuth } from "../../contexts/AuthContext";

export default function Calendar() {
  const { isSuperAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [viewMode, setViewMode] = useState("month");
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    holiday_date: "",
    holiday_name: "",
    description: "",
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [eventForm, setEventForm] = useState({
    date: "",
    name: "",
    time: "",
    category: "work",
    description: "",
  });

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInPrevMonth = getDaysInMonth(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );

    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          daysInPrevMonth - i
        ),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          i
        ),
      });
    }

    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const calendarDays = useMemo(() => generateCalendarDays(), [currentDate]);

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  // Week navigation
  const handlePrevWeek = () => {
    const prevWeek = new Date(currentDate);
    prevWeek.setDate(currentDate.getDate() - 7);
    setCurrentDate(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(currentDate.getDate() + 7);
    setCurrentDate(nextWeek);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleAddHoliday = () => {
    if (!holidayForm.holiday_date || !holidayForm.holiday_name) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill in both date and holiday name",
      });
      return;
    }

    // Prevent duplicate holiday on the same date (only when adding, not editing)
    if (!isEditMode) {
      const duplicateHoliday = holidays.find(
        (h) => h.holiday_date === holidayForm.holiday_date
      );
      if (duplicateHoliday) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Date",
          text: `A holiday "${duplicateHoliday.holiday_name}" already exists on ${holidayForm.holiday_date}. Please choose a different date.`,
        });
        return;
      }
    }

    // When editing, prevent changing to a date that already has another holiday
    if (isEditMode && editingHoliday) {
      const duplicateHoliday = holidays.find(
        (h) =>
          h.holiday_date === holidayForm.holiday_date &&
          h.holidayid !== editingHoliday.holidayid
      );
      if (duplicateHoliday) {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Date",
          text: `A holiday "${duplicateHoliday.holiday_name}" already exists on ${holidayForm.holiday_date}. Please choose a different date.`,
        });
        return;
      }
    }

    // Prevent editing if not superadmin
    if (isEditMode && !isSuperAdmin) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You don't have permission to edit holidays",
      });
      return;
    }

    const holidayData = {
      holiday_date: holidayForm.holiday_date,
      holiday_name: holidayForm.holiday_name,
      description: holidayForm.description,
    };

    if (isEditMode && editingHoliday) {
      // Update existing holiday
      calendarAPI.updateHoliday(
        editingHoliday.holidayid,
        holidayData,
        (response) => {
          setHolidayForm({
            holiday_date: "",
            holiday_name: "",
            description: "",
          });
          setShowHolidayModal(false);
          setIsEditMode(false);
          setEditingHoliday(null);
          loadHolidays();

          Swal.fire({
            icon: "success",
            title: "Holiday Updated",
            text: `${holidayForm.holiday_name} has been updated`,
            timer: 2000,
          });
        },
        (error) => {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to update holiday",
          });
        }
      );
    } else {
      // Create new holiday
      calendarAPI.createHoliday(
        holidayData,
        (response) => {
          setHolidayForm({
            holiday_date: "",
            holiday_name: "",
            description: "",
          });
          setShowHolidayModal(false);
          loadHolidays();

          Swal.fire({
            icon: "success",
            title: "Holiday Added",
            text: `${holidayForm.holiday_name} has been added to ${holidayForm.holiday_date}`,
            timer: 2000,
          });
        },
        (error) => {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to add holiday",
          });
        }
      );
    }
  };

  const handleDeleteHoliday = (id) => {
    Swal.fire({
      title: "Delete Holiday?",
      text: "This action cannot be undone",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Delete",
    }).then((result) => {
      if (result.isConfirmed) {
        calendarAPI.deleteHoliday(
          id,
          (response) => {
            loadHolidays();
            Swal.fire({
              icon: "success",
              title: "Deleted",
              text: "Holiday removed successfully",
              timer: 1500,
            });
          },
          (error) => {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to delete holiday",
            });
          }
        );
      }
    });
  };

  const handleEditHoliday = (holiday) => {
    setIsEditMode(true);
    setEditingHoliday(holiday);
    setHolidayForm({
      holiday_date: holiday.holiday_date,
      holiday_name: holiday.holiday_name,
      description: holiday.description || "",
    });
    setShowHolidayModal(true);
  };

  const handleAddEvent = () => {
    // Format selected date properly (YYYY-MM-DD)
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const defaultDateStr = `${year}-${month}-${day}`;

    const dateStr = eventForm.date || defaultDateStr;

    if (!dateStr || !eventForm.name) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Form",
        text: "Please fill in both date and event name",
      });
      return;
    }

    const eventData = {
      date: dateStr,
      name: eventForm.name,
      time: eventForm.time || "",
      category: eventForm.category || "work",
      description: eventForm.description || "",
    };

    calendarAPI.createEvent(
      eventData,
      (response) => {
        setShowHolidayModal(false);
        loadEvents();

        Swal.fire({
          icon: "success",
          title: "Event Added",
          text: `${eventForm.name} has been added to ${dateStr}`,
          timer: 2000,
        });
      },
      (error) => {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to add event",
        });
      }
    );
  };

  const isHolidayDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return holidays.find((h) => h.holiday_date === dateStr);
  };

  const isLeaveDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return leaves.find((l) => l.from_date <= dateStr && l.to_date >= dateStr);
  };

  const isEventDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return events.find((e) => e.date === dateStr);
  };

  const getWeekDays = () => {
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const weekDays = getWeekDays();

  // Load holidays and events from API on component mount
  useEffect(() => {
    loadHolidays();
    loadLeaves();
    loadEvents();
  }, []);

  // Set event form date when modal opens
  useEffect(() => {
    if (showHolidayModal && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      setEventForm((prev) => ({ ...prev, date: dateStr }));
    }
  }, [showHolidayModal]);

  const loadHolidays = () => {
    calendarAPI.getAllHolidays(
      (response) => {
        if (response?.data) {
          const holidaysData = Array.isArray(response.data)
            ? response.data
            : response.data.results || [];
          setHolidays(holidaysData);
        }
      },
      (error) => {}
    );
  };

  const loadLeaves = () => {
    calendarAPI.getAllLeaves(
      (response) => {
        if (response?.data) {
          const leavesData = Array.isArray(response.data)
            ? response.data
            : response.data.results || [];
          setLeaves(leavesData);
        }
      },
      (error) => {}
    );
  };

  const loadEvents = () => {
    calendarAPI.getAllEvents(
      (response) => {
        if (response?.data) {
          const eventsData = Array.isArray(response.data)
            ? response.data
            : response.data.results || [];
          setEvents(eventsData);
        }
      },
      (error) => {}
    );
  };

  // Separate function for '+ Holiday' button - Always opens in ADD mode with no default date
  const handleAddHolidayButton = () => {
    setHolidayForm({ holiday_date: "", holiday_name: "", description: "" });
    setIsEditMode(false);
    setEditingHoliday(null);
    setShowHolidayModal(true);
  };

  // Separate function for calendar day click
  const handleCalendarDayClick = (dayObj) => {
    if (dayObj.isCurrentMonth && isSuperAdmin) {
      setSelectedDate(dayObj.date);
      const year = dayObj.date.getFullYear();
      const month = String(dayObj.date.getMonth() + 1).padStart(2, "0");
      const day = String(dayObj.date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Check if there's already a holiday on this date
      const existingHoliday = holidays.find((h) => h.holiday_date === dateStr);

      if (existingHoliday) {
        // Edit existing holiday
        setHolidayForm({
          holiday_date: existingHoliday.holiday_date,
          holiday_name: existingHoliday.holiday_name,
          description: existingHoliday.description || "",
        });
        setIsEditMode(true);
        setEditingHoliday(existingHoliday);
      } else {
        // Add new holiday
        setHolidayForm({
          holiday_date: dateStr,
          holiday_name: "",
          description: "",
        });
        setIsEditMode(false);
        setEditingHoliday(null);
      }

      setShowHolidayModal(true);
    }
  };

  // Pagination for holidays table
  const holidaysPerPage = 5;
  const [holidayPage, setHolidayPage] = useState({}); // { '2026-01': 1, ... }

  const handleHolidayPageChange = (monthKey, newPage) => {
    setHolidayPage((prev) => ({ ...prev, [monthKey]: newPage }));
  };

  return (
    <div className="bg-slate-100 w-full rounded-xl p-2 dark:bg-navy-900/40 sm:p-3">
      {/* Calendar Container */}
      <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-navy-800">
        {/* Calendar Header - Responsive */}
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-xl font-bold text-navy-700 dark:text-white sm:text-2xl">
            {monthName}
          </h2>
          {/* Navigation Buttons - Responsive */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-navy-700">
              <button
                onClick={() => setViewMode("month")}
                className={`rounded px-2 py-1 text-xs font-semibold transition sm:px-3 sm:text-sm ${
                  viewMode === "month"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-navy-600"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`rounded px-2 py-1 text-xs font-semibold transition sm:px-3 sm:text-sm ${
                  viewMode === "week"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-navy-600"
                }`}
              >
                Week
              </button>
            </div>
            {/* Month or Week navigation */}
            {viewMode === "month" ? (
              <>
                <button
                  onClick={handlePrevMonth}
                  className="rounded-lg p-1 transition hover:bg-gray-100 dark:hover:bg-navy-700"
                  title="Previous month"
                >
                  <FaChevronLeft className="text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={handleToday}
                  className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 sm:px-4 sm:text-sm"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-navy-700"
                  title="Next month"
                >
                  <FaChevronRight className="text-gray-600 dark:text-gray-400" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlePrevWeek}
                  className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-navy-700"
                  title="Previous week"
                >
                  <FaChevronLeft className="text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={handleToday}
                  className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 sm:px-4 sm:text-sm"
                >
                  Today
                </button>
                <button
                  onClick={handleNextWeek}
                  className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-navy-700"
                  title="Next week"
                >
                  <FaChevronRight className="text-gray-600 dark:text-gray-400" />
                </button>
              </>
            )}
            {isSuperAdmin && (
              <button
                onClick={handleAddHolidayButton}
                className="rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 sm:ml-2 sm:px-4 sm:text-sm"
              >
                + Holiday
              </button>
            )}
          </div>
        </div>

        {/* Month View - Responsive */}
        {viewMode === "month" && (
          <>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
              {/* Weekday Headers - Responsive */}
              {weekdays.map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-600 dark:bg-navy-700 dark:text-gray-400 sm:p-4 sm:text-sm"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 1)}</span>
                </div>
              ))}

              {/* Calendar Days - Responsive */}
              {calendarDays.map((dayObj, index) => {
                const holiday = isHolidayDate(dayObj.date);
                const event = isEventDate(dayObj.date);
                const isTodayCell = isToday(dayObj.date);
                return (
                  <div
                    key={index}
                    onClick={() => handleCalendarDayClick(dayObj)}
                    className={`
            relative h-[64px] cursor-pointer overflow-hidden p-1 transition-all sm:h-20 sm:p-2 lg:h-24 
            ${
              dayObj.isCurrentMonth
                ? "bg-white hover:bg-gray-50 dark:bg-navy-800 dark:hover:bg-navy-700"
                : "bg-gray-50 dark:bg-navy-700"
            }
            ${
              holiday
                ? "border-2 border-red-500"
                : "border border-gray-200 dark:border-gray-700 "
            }
            ${
              isTodayCell
                ? "dark:!bg-blue-950/40 !border-blue-100 !bg-[#723EC3] text-white dark:!border-blue-800 dark:!bg-[#39B5E0]"
                : ""
            }
            ${
              isSelected(dayObj.date)
                ? "text-gray-900"
                : "text-gray-900 dark:text-white"
            }
          `}
                  >
                    <div
                      className={`
                        mb-1 text-xs font-semibold sm:text-right sm:text-sm
                        ${
                          !dayObj.isCurrentMonth
                            ? "text-gray-400 dark:text-gray-600"
                            : ""
                        }
                        ${
                          isTodayCell && !isSelected(dayObj.date)
                            ? "text-black dark:text-blue-400"
                            : ""
                        }
                        ${
                          isSelected(dayObj.date)
                            ? "text-gray-900"
                            : "text-gray-900 dark:text-white"
                        }
                      `}
                    >
                      {/* Mobile: Today gets special treatment too */}
                      {isTodayCell ? (
                        <div className="flex flex-col items-center">
                          <span className="dark:text-black text-base font-bold text-white sm:text-xl lg:text-2xl">
                            {dayObj.day}
                          </span>
                          <span className="mt-0.5 w-full border-t border-blue-200 sm:mt-1"></span>
                          <span className="dark:text-black mt-0.5 text-[8px] font-semibold text-white sm:mt-1 sm:text-xs">
                            Today
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">{dayObj.day}</div>
                      )}
                    </div>

                    {/* Holiday Badge - Responsive */}
                    {holiday && (
                      <div className="mt-0.5 flex items-start gap-0.5 rounded bg-red-500 px-1 py-0.5 text-[8px] leading-tight text-white sm:mt-1 sm:items-center sm:gap-1 sm:px-2 sm:py-1 sm:text-xs">
                        <FaCalendarAlt className="hidden sm:inline" size={10} />
                        <span className="line-clamp-2 break-words sm:line-clamp-1 sm:truncate">
                          {holiday.holiday_name}
                        </span>
                      </div>
                    )}

                    {/* Event Badge - Responsive */}
                    {event && !holiday && (
                      <div className="mt-0.5 rounded bg-blue-500 px-1 py-0.5 text-[8px] leading-tight text-white sm:mt-1 sm:px-2 sm:py-1 sm:text-xs">
                        <span className="line-clamp-2 break-words sm:line-clamp-1 sm:truncate">
                          {event.name}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Week View - Responsive */}
        {viewMode === "week" && (
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
            {weekDays.map((day, index) => {
              const holiday = isHolidayDate(day);
              const event = isEventDate(day);
              // mimic dayObj for handleCalendarDayClick
              const dayObj = {
                day: day.getDate(),
                isCurrentMonth: true,
                date: day,
              };
              return (
                <div
                  key={index}

                  
                  onClick={() => handleCalendarDayClick(dayObj)}
                  className="cursor-pointer bg-white p-2 dark:bg-navy-800 sm:p-4"
                >
                  <div className="mb-2 text-center sm:mb-3">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 sm:text-sm">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </p>
                    <p
                      className={`text-base font-bold sm:text-lg ${
                        isToday(day)
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {day.getDate()}
                    </p>
                  </div>

                  {holiday && (
                    <div className="flex items-center justify-center gap-1 rounded bg-red-100 p-1.5 text-center text-[10px] font-semibold text-red-800 dark:bg-red-900 dark:text-red-200 sm:gap-1 sm:p-2 sm:text-xs">
                      <FaCalendarAlt className="hidden sm:inline" size={12} />
                      <span className="truncate">{holiday.holiday_name}</span>
                    </div>
                  )}

                  {event && !holiday && (
                    <div className="rounded bg-blue-100 p-1.5 text-center text-[10px] font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200 sm:p-2 sm:text-xs">
                      <span className="truncate">{event.name}</span>
                    </div>
                  )}

                  {isToday(day) && (
                    <div className="mt-1.5 border-t border-blue-300 pt-1.5 dark:border-blue-700 sm:mt-2 sm:pt-2">
                      <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 sm:text-xs">
                        Today
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Holidays by Month - Inside the same card */}
        {holidays.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700 sm:p-6">
            {(() => {
              // Group holidays by month
              const monthMap = {};
              holidays.forEach((h) => {
                const [year, month] = h.holiday_date.split("-");
                const key = `${year}-${month}`;
                if (!monthMap[key]) monthMap[key] = [];
                monthMap[key].push(h);
              });
              // Sort months chronologically
              const sortedMonths = Object.keys(monthMap).sort();
              return (
                <div>
                  {sortedMonths.map((monthKey) => {
                    const [year, month] = monthKey.split("-");
                    const monthName = new Date(
                      year,
                      parseInt(month, 10) - 1
                    ).toLocaleString("en-US", { month: "long" });
                    const page = holidayPage[monthKey] || 1;
                    const monthHolidays = monthMap[monthKey];
                    const totalPages = Math.ceil(
                      monthHolidays.length / holidaysPerPage
                    );
                    const startIdx = (page - 1) * holidaysPerPage;
                    const paginatedHolidays = monthHolidays.slice(
                      startIdx,
                      startIdx + holidaysPerPage
                    );
                    return (
                      <div key={monthKey} className="mb-4 sm:mb-6">
                        <h4 className="mb-2 text-sm font-bold text-navy-700 dark:text-white sm:text-base">
                          {monthName} {year}
                        </h4>
                        <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-navy-800 sm:rounded-xl">
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                              <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-navy-700">
                                  <th className="px-3 py-3 text-left text-xs font-bold text-navy-700 dark:text-white sm:px-6 sm:py-4 sm:text-sm">
                                    S.No
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-bold text-navy-700 dark:text-white sm:px-6 sm:py-4 sm:text-sm">
                                    Holiday Name
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-bold text-navy-700 dark:text-white sm:px-6 sm:py-4 sm:text-sm">
                                    Date
                                  </th>
                                  <th className="px-3 py-3 text-left text-xs font-bold text-navy-700 dark:text-white sm:px-6 sm:py-4 sm:text-sm">
                                    Description
                                  </th>
                                  {isSuperAdmin && (
                                    <th className="px-3 py-3 text-center text-xs font-bold text-navy-700 dark:text-white sm:px-6 sm:py-4 sm:text-sm">
                                      Actions
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {paginatedHolidays.map((holiday, index) => (
                                  <tr
                                    key={holiday.holidayid}
                                    className="border-b border-gray-200 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-navy-700"
                                  >
                                    <td className="px-3 py-3 text-xs font-bold text-navy-700 dark:text-white sm:px-6 sm:py-4 sm:text-sm">
                                      {startIdx + index + 1}
                                    </td>
                                    <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white sm:px-6 sm:py-4 sm:text-sm">
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        <FaCalendarAlt
                                          className="flex-shrink-0 text-red-500"
                                          size={14}
                                        />
                                        <span className="whitespace-nowrap">
                                          {holiday.holiday_name}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-gray-700 dark:text-gray-300 sm:px-6 sm:py-4 sm:text-sm">
                                      <span className="whitespace-nowrap">
                                        {holiday.holiday_date}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-gray-700 dark:text-gray-300 sm:px-6 sm:py-4 sm:text-sm">
                                      <span className="block max-w-xs">
                                        {holiday.description ||
                                          "No description"}
                                      </span>
                                    </td>
                                    {isSuperAdmin && (
                                      <td className="px-3 py-3 text-center sm:px-6 sm:py-4">
                                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                                          <button
                                            onClick={() =>
                                              handleEditHoliday(holiday)
                                            }
                                            className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900 sm:p-2"
                                            title="Edit Holiday"
                                          >
                                            <MdEdit
                                              size={16}
                                              className="sm:h-[18px] sm:w-[18px]"
                                            />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeleteHoliday(
                                                holiday.holidayid
                                              )
                                            }
                                            className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900 sm:p-2"
                                            title="Delete Holiday"
                                          >
                                            <MdDelete
                                              size={16}
                                              className="sm:h-[18px] sm:w-[18px]"
                                            />
                                          </button>
                                        </div>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Pagination Controls - Responsive */}
                          {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-1.5 border-t border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-navy-700 sm:gap-2 sm:px-4 sm:py-3">
                              <button
                                onClick={() =>
                                  handleHolidayPageChange(
                                    monthKey,
                                    Math.max(1, page - 1)
                                  )
                                }
                                disabled={page === 1}
                                className="rounded-lg border-2 border-gray-200 bg-white px-2 py-1 text-[10px] font-bold text-navy-700 transition hover:bg-gray-100 disabled:opacity-30 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 sm:px-3 sm:text-xs"
                              >
                                Prev
                              </button>
                              {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                              ).map((p) => (
                                <button
                                  key={p}
                                  onClick={() =>
                                    handleHolidayPageChange(monthKey, p)
                                  }
                                  className={`rounded-lg px-1.5 py-1 text-[10px] font-bold transition sm:px-3 sm:text-xs ${
                                    page === p
                                      ? "bg-blue-500 text-white"
                                      : "border-2 border-gray-200 bg-white text-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:bg-navy-700 dark:text-gray-300 dark:hover:bg-navy-600"
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                              <button
                                onClick={() =>
                                  handleHolidayPageChange(
                                    monthKey,
                                    Math.min(totalPages, page + 1)
                                  )
                                }
                                disabled={page === totalPages}
                                className="rounded-lg border-2 border-gray-200 bg-white px-2 py-1 text-[10px] font-bold text-navy-700 transition hover:bg-gray-100 disabled:opacity-30 dark:border-gray-700 dark:bg-navy-700 dark:text-white dark:hover:bg-navy-600 sm:px-3 sm:text-xs"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Add Holiday Modal - Responsive */}
      {showHolidayModal && (
        <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl dark:bg-navy-800 sm:p-6">
            {/* Modal Header - Responsive */}
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h2 className="text-lg font-bold text-navy-700 dark:text-white sm:text-xl">
                {isEditMode ? "Edit Holiday" : "Add Holiday"}
              </h2>
              <button
                onClick={() => {
                  setShowHolidayModal(false);
                  setIsEditMode(false);
                  setEditingHoliday(null);
                  setHolidayForm({
                    holiday_date: "",
                    holiday_name: "",
                    description: "",
                  });
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose size={20} className="sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Form Fields - Responsive */}
            <div className="space-y-3 sm:space-y-4">
              {/* Date Input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300 sm:mb-2 sm:text-sm">
                  Date
                </label>
                <input
                  type="date"
                  value={holidayForm.holiday_date}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      holiday_date: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white sm:px-3 sm:text-sm"
                />
              </div>

              {/* Holiday Name Input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300 sm:mb-2 sm:text-sm">
                  Holiday Name
                </label>
                <input
                  type="text"
                  value={holidayForm.holiday_name}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      holiday_name: e.target.value,
                    })
                  }
                  placeholder="e.g., New Year"
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white sm:px-3 sm:text-sm"
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300 sm:mb-2 sm:text-sm">
                  Description
                </label>
                <input
                  type="text"
                  value={holidayForm.description}
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Optional details"
                  className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-navy-700 dark:text-white sm:px-3 sm:text-sm"
                />
              </div>

              {/* Action Buttons - Responsive */}
              <div className="flex gap-2 pt-2 sm:pt-4">
                <button
                  onClick={handleAddHoliday}
                  disabled={isEditMode && !isSuperAdmin}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                    isEditMode && !isSuperAdmin
                      ? "cursor-not-allowed bg-gray-400 text-gray-200"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  {isEditMode ? "Update" : "Add"}
                </button>
                <button
                  onClick={() => {
                    setShowHolidayModal(false);
                    setIsEditMode(false);
                    setEditingHoliday(null);
                    setHolidayForm({
                      holiday_date: "",
                      holiday_name: "",
                      description: "",
                    });
                  }}
                  className="flex-1 rounded-lg bg-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 transition hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-700 sm:px-4 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
