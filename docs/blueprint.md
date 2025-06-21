# **App Name**: Liburku

## Core Features:

- Calendar Display: Display an interactive calendar using react-calendar or @fullcalendar/react.
- National Holiday Highlighting: Highlight national holidays (is_national_holiday: true) in red or with a badge.
- Joint Leave Highlighting: Highlight joint leave days (is_joint_leave: true) in yellow or with a label.
- Holiday Name Display: Display holiday name on hover or click on a date.
- Dynamic Filtering: Provide dropdowns to filter holidays by year (2018-2030) and month (January-December).
- API Data Fetching: Fetch holiday data from the public API (https://dayoffapi.vercel.app/api) based on selected filters.
- Loading State: Display a loading animation while fetching data from the API.
- Theme Switching: Implement light and dark theme options for a modern and clear user interface.

## Style Guidelines:

- Primary color: Subtle muted blue (#94A3B4) to give a calm and reliable impression.
- Background color: Very light gray (#F9FAFA), almost white, creating a clean backdrop for light theme.
- Background color: Dark gray (#333333) for dark theme.
- Accent color: A pale green (#A7F3D0) for highlighting the selected dates and interactive elements.
- Body and headline font: 'Inter', a sans-serif for a modern and clean look.
- Utilize a responsive layout to ensure the calendar is accessible and visually appealing on various devices.
- Implement subtle fade-in animations when new holiday data is loaded.