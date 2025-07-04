/* src/app/react-calendar.css */

.react-calendar {
  width: 100%;
  background-color: transparent;
  border: none;
  font-family: inherit;
}

.react-calendar__navigation {
  display: none; /* Hide default navigation */
}

.react-calendar__month-view__weekdays {
  text-align: center;
  text-transform: uppercase;
  font-weight: 600; /* semibold */
  font-size: 0.75rem; /* text-xs */
  color: hsl(var(--muted-foreground));
  padding-bottom: 0.5rem;
}

.react-calendar__month-view__weekdays__weekday {
  padding: 0.5em;
}

.react-calendar__month-view__days__day {
  color: hsl(var(--foreground));
}

.react-calendar__month-view__days__day--weekend:not(.national-holiday):not(.joint-leave) {
  color: hsl(var(--destructive));
}

.react-calendar__month-view__days__day--neighboringMonth {
  color: hsl(var(--muted-foreground));
  opacity: 0.5;
}

.react-calendar__tile {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem; /* h-9 */
  max-width: 100%;
  padding: 0;
  background: none;
  border: none;
  border-radius: 9999px; /* rounded-full */
  font-size: 0.75rem; /* text-xs */
  line-height: 1rem;
  transition: background-color 0.2s, color 0.2s, transform 0.2s;
}

.react-calendar__tile:disabled {
  background-color: transparent;
}

.react-calendar__tile:enabled:hover,
.react-calendar__tile:enabled:focus {
  background-color: hsl(var(--accent));
}

/* Custom classes for holidays */
.national-holiday, .joint-leave {
  font-weight: 600; /* semibold */
  cursor: pointer;
}

.national-holiday:hover, .joint-leave:hover {
    transform: scale(1.1);
}

.national-holiday {
  background-color: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
}
.national-holiday:hover {
  background-color: hsl(var(--destructive) / 0.9);
}

.joint-leave {
  background-color: hsl(var(--warning));
  color: hsl(var(--warning-foreground));
}
.joint-leave:hover {
    background-color: hsl(var(--warning) / 0.9);
}

.today {
    background-color: hsl(var(--primary) / 0.2);
    font-weight: 700; /* bold */
    color: hsl(var(--primary));
}

.today.national-holiday, .today.joint-leave {
    background-color: hsl(var(--primary) / 0.2) !important;
    border: 2px solid;
}

.today.national-holiday {
    border-color: hsl(var(--destructive));
    color: hsl(var(--destructive));
}

.today.joint-leave {
    border-color: hsl(var(--warning));
    color: hsl(var(--warning));
}