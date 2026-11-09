# StudySpot PH

A study-space booking web app for the Philippines: browse spaces, check the hourly rate, and book a time slot. Built solo with React for my Web Development midterm (September 2025).

## Live demo

**https://midterm-project-three-gray.vercel.app**

Log in with any name and email to try booking. The login is simulated and all data stays in your browser.

| Home | Space details and booking form | My Bookings |
|---|---|---|
| ![Home page with the hero section](docs/screenshots/home.jpg) | ![Space detail page with the booking form and price summary](docs/screenshots/space-detail.jpg) | ![Dashboard showing one upcoming booking](docs/screenshots/dashboard.jpg) |

## Features

- Browse study spaces, with a featured selection on the home page
- Search by name or location (after login)
- Space details with amenities, operating hours and hourly rate
- Booking form with date, start and end time, number of guests, and quick time slots
- Live price summary that updates as you change the time or guests
- Form validation (React Hook Form + Yup)
- Overlap and zero-length checks, so the same space cannot be double-booked
- One booking per space per user
- Dashboard with upcoming and past bookings
- Cancel a booking with a confirmation dialog
- Protected route for the dashboard
- Bookings kept in the browser's `localStorage`
- Responsive layout for phone, tablet and desktop
- Page not found page for unknown addresses and unknown space ids

## Tech stack

| Part | Tools |
|---|---|
| UI | React 19 (JavaScript), Vite 7 |
| Routing | React Router 7 |
| Forms | React Hook Form + Yup |
| Styling | Bootstrap 5, react-icons, small per-component CSS files |
| State | Context API (`AuthContext`, `BookingContext`) + a `useLocalStorage` hook |
| Tests | Vitest (unit tests for the booking rules, quick time slots and home page stats) |
| Hosting | Vercel |

## Booking rules

The rules live as plain functions in [`src/utils/bookingTime.js`](src/utils/bookingTime.js), and the quick time slots are read by [`src/utils/timeSlots.js`](src/utils/timeSlots.js). Unit tests sit next to both.

- **Billing:** every started hour is billed. 1h 45m is billed as 2 hours. Total = billed hours × hourly rate × guests.
- **Start and end:** the start time and end time must be different.
- **Overlap:** a new booking is rejected if it overlaps any confirmed booking for the same space, by any user, on any date. Back-to-back bookings are allowed (one ends at 13:00, the next starts at 13:00).
- **Overnight:** an end time earlier than the start time means the booking runs into the next day. This is only allowed for spaces open 24/7, and overnight bookings are included in the overlap check.
- **Passes:** pass-style slots are billed the same way (hourly rate × hours × guests), so Full Day (24 hours) at ₱500/hour is ₱12,000 per guest.

## Run locally

Requires Node.js 20.19+ or 22.12+ (needed by Vite 7).

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm test         # run the unit tests
npm run build    # build for production into dist/
npm run lint     # run ESLint
```

## Deployment

The app is deployed on Vercel as a static site. [`vercel.json`](vercel.json) rewrites every path to `index.html`, so direct links such as `/space/1` work. Addresses the app does not know show its Page not found page.

## Known limitations

- The login is simulated: any valid name and email works, and there is no password.
- Data lives only in the browser's `localStorage`, so bookings are not shared between devices or users.
- The listings and photos are sample data.
- There is no backend.

## Future improvements

- Reschedule a booking (the missing "Update" in CRUD)
- A real backend and authentication
- More tests

## Credits

Photos and information come from online sources and belong to their respective owners.
