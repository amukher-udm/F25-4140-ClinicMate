import { useState, useEffect } from 'react';
import './AvailabilityCalendar.css';

/**
 * AvailabilityCalendar Component
 * 
 * A custom calendar that highlights dates with available appointment slots
 * 
 * Props:
 * - providerId: The provider to check availability for
 * - onDateSelect: Callback when user selects a date
 * - selectedDate: Currently selected date (YYYY-MM-DD)
 * - getToken: Function to get auth token
 * - minDate: Minimum selectable date (default: today)
 */
export default function AvailabilityCalendar({ 
  providerId, 
  onDateSelect, 
  selectedDate, 
  getToken,
  minDate = new Date()
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch available dates for the current month when provider changes
  useEffect(() => {
    if (!providerId) {
      setAvailableDates(new Set());
      return;
    }

    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const token = getToken();
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        // Get first and last day of current month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // Fetch availability for each day in the month
        const datePromises = [];
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          datePromises.push(
            fetch(`/api/provider_availability/${providerId}/slots?date=${dateStr}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            })
            .then(res => res.json())
            .then(slots => ({
              date: dateStr,
              hasSlots: slots && slots.length > 0 && slots.some(s => !s.is_booked)
            }))
            .catch(() => ({ date: dateStr, hasSlots: false }))
          );
        }

        const results = await Promise.all(datePromises);
        const available = new Set(
          results.filter(r => r.hasSlots).map(r => r.date)
        );
        
        setAvailableDates(available);
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [providerId, currentMonth, getToken]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(year, month, day);
    const dateStr = clickedDate.toISOString().split('T')[0];
    
    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (clickedDate < today) return;
    if (clickedDate < minDate) return;
    
    onDateSelect(dateStr);
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return dateStr === selectedDate;
  };

  const isAvailable = (day) => {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return availableDates.has(dateStr);
  };

  const isPast = (day) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date < minDate;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty" />);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const classes = ['calendar-day'];
    
    if (isPast(day)) classes.push('past');
    else if (isAvailable(day)) classes.push('available');
    else classes.push('unavailable');
    
    if (isSelected(day)) classes.push('selected');

    calendarDays.push(
      <div
        key={day}
        className={classes.join(' ')}
        onClick={() => !isPast(day) && handleDateClick(day)}
      >
        <span className="day-number">{day}</span>
        {isAvailable(day) && !isPast(day) && (
          <span className="availability-indicator">●</span>
        )}
      </div>
    );
  }

  return (
    <div className="availability-calendar">
      <div className="calendar-header">
        <button 
          type="button"
          className="calendar-nav-btn" 
          onClick={handlePrevMonth}
          disabled={loading}
        >
          ‹
        </button>
        <h3 className="calendar-title">
          {monthNames[month]} {year}
        </h3>
        <button 
          type="button"
          className="calendar-nav-btn" 
          onClick={handleNextMonth}
          disabled={loading}
        >
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {dayNames.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {loading ? (
          <div className="calendar-loading">Loading availability...</div>
        ) : (
          calendarDays
        )}
      </div>

      {!providerId && (
        <div className="calendar-notice">
          Please select a provider to see available dates
        </div>
      )}

      {providerId && availableDates.size === 0 && !loading && (
        <div className="calendar-notice">
          No available appointments this month
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot available">●</span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot unavailable">●</span>
          <span>Unavailable</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot past">●</span>
          <span>Past</span>
        </div>
      </div>
    </div>
  );
}
