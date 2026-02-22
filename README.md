# Holidays Master

This project is a React application for booking holidays, including hotels and flights.

## Project Structure

```
src/
├── api/             # API integration modules
│   └── ratehawk.js  # RateHawk API service
├── assets/          # Static assets (images, icons, fonts)
├── components/      # Reusable UI components
│   ├── Navbar.js    # Main navigation
│   ├── HotelCard.js # Hotel display card
│   └── BookingForm.js # Search/Booking form
├── pages/           # Page components
│   ├── Home.js      # Landing page
│   └── Hotels.js    # Hotel listing page
├── App.js           # Main application component with routing
└── index.js         # Entry point
```

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Start the development server:
    ```bash
    npm start
    ```

3.  Build for production:
    ```bash
    npm run build
    ```

## Features

-   **Routing**: Uses `react-router-dom` for navigation.
-   **Styling**: Modern, responsive CSS variables and utility classes in `index.css`.
-   **Icons**: uses `lucide-react` for beautiful SVG icons.
