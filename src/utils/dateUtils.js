/**
 * Date & Time Utility Functions
 */

/**
 * Get current ISO timestamp
 */
export const now = () => new Date().toISOString();

/**
 * Convert a Date or ISO string to IST Date object (+5:30)
 */
export const getISTDate = (inputDate = new Date()) => {
  const d = new Date(inputDate);
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 5.5));
};

/**
 * Get dynamic greeting based on IST hour
 */
export const getISTGreeting = () => {
  const hour = getISTDate().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

/**
 * Format time strictly to IST 12hr AM/PM format
 */
export const formatTimeIST = (isoString) => {
  if (!isoString) return '--:--';
  const ist = getISTDate(isoString);
  let hours = ist.getHours();
  const minutes = String(ist.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Get today's date as YYYY-MM-DD
 */
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Format ISO string to readable time (HH:MM AM/PM)
 */
export const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Format ISO string to readable date (DD MMM YYYY)
 */
export const formatDate = (isoString) => {
  if (!isoString) return '--';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(isoString);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Format date as YYYY-MM-DD
 */
export const formatDateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Calculate duration between two ISO timestamps in hours and minutes
 */
export const calculateDuration = (startISO, endISO) => {
  if (!startISO || !endISO) return { hours: 0, minutes: 0, formatted: '0h 0m' };
  const start = new Date(startISO);
  const end = new Date(endISO);
  const diffMs = end - start;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
    formatted: `${hours}h ${minutes}m`,
  };
};

/**
 * Calculate duration from start to now (live timer)
 */
export const calculateLiveDuration = (startISO) => {
  if (!startISO) return { hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' };
  const start = new Date(startISO);
  const now = new Date();
  const diffMs = now - start;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  return {
    hours,
    minutes,
    seconds,
    formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
};

/**
 * Get start of the week (Monday) as YYYY-MM-DD
 */
export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatDateKey(d);
};

/**
 * Get start of the month as YYYY-MM-DD
 */
export const getMonthStart = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  return formatDateKey(d);
};

/**
 * Get array of dates for current week
 */
export const getWeekDates = (date = new Date()) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);

  const dates = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push({
      date: formatDateKey(d),
      dayName: dayNames[i],
      dayNumber: d.getDate(),
      isToday: formatDateKey(d) === today(),
    });
  }
  return dates;
};

/**
 * Get number of working days in a month (Mon-Fri)
 */
export const getWorkingDaysInMonth = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
};

/**
 * Check if a date string is today
 */
export const isToday = (dateStr) => dateStr === today();

/**
 * Get relative day label (Today, Yesterday, or date)
 */
export const getRelativeDay = (dateStr) => {
  if (dateStr === today()) return 'Today';
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === formatDateKey(yesterday)) return 'Yesterday';
  return formatDate(dateStr);
};
