# EasySchedule - Online Scheduling System MVP

A complete online scheduling system designed for micro-businesses like hairdressers, personal trainers, private tutors, and more. Built with modern web technologies for a seamless booking experience.

## Features

### For Professionals (Dashboard)
- **Authentication**: Secure registration and login with JWT tokens
- **Service Management**: Create, update, and manage your services with pricing and duration
- **Availability Configuration**: Set your working hours for each day of the week
- **Appointment Management**:
  - View appointments in a beautiful calendar interface
  - Accept or reject pending bookings
  - Track appointment statuses (pending, confirmed, cancelled)
  - View statistics (today's appointments, weekly count, pending approvals)

### For Customers (Public Booking)
- **Public Booking Page**: Personalized booking page at `/book/your-slug`
- **Service Selection**: Browse available services with pricing
- **Smart Scheduling**: Only see available time slots based on:
  - Professional's availability
  - Service duration
  - Existing appointments
- **Easy Booking**: Simple form to book appointments with email confirmation

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod
- **Security**: bcrypt, express-rate-limit

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form
- **Validation**: Zod
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Calendar**: React Big Calendar
- **Date Utilities**: date-fns

## Project Structure

```
easy-schedule/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Database Setup

1. Install PostgreSQL and create a database:
```bash
createdb easySchedule
```

2. Update the database connection string in `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/easySchedule?schema=public"
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/easySchedule?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3000
NODE_ENV="development"
```

5. Run Prisma migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

6. (Optional) Seed the database with test data:
```bash
npm run prisma:seed
```

This creates a test user:
- **Email**: john@barber.com
- **Password**: password123
- **Booking URL**: /book/john-barber

7. Start the development server:
```bash
npm run dev
```

The backend should now be running on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update environment variables in `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

5. Start the development server:
```bash
npm run dev
```

The frontend should now be running on `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create a new account
- `POST /api/auth/login` - Login and get JWT token

### Services (Protected)
- `GET /api/services` - List all user's services
- `POST /api/services` - Create a new service
- `PUT /api/services/:id` - Update a service
- `DELETE /api/services/:id` - Delete a service

### Availability (Protected)
- `GET /api/availability` - List availability slots
- `POST /api/availability` - Create availability slot
- `PUT /api/availability/:id` - Update availability slot
- `DELETE /api/availability/:id` - Delete availability slot

### Appointments (Protected)
- `GET /api/appointments` - List all appointments (supports query params: status, startDate, endDate)
- `GET /api/appointments/stats` - Get appointment statistics
- `PUT /api/appointments/:id/status` - Update appointment status

### Public Routes
- `GET /api/public/:slug` - Get professional's public profile
- `GET /api/public/:slug/services` - Get available services
- `GET /api/public/:slug/available-slots` - Get available time slots (requires: date, serviceId)
- `POST /api/public/:slug/book` - Create a booking

## Frontend Routes

- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Dashboard home (protected)
- `/dashboard/services` - Manage services (protected)
- `/dashboard/availability` - Configure availability (protected)
- `/dashboard/appointments` - View appointments (protected)
- `/book/:slug` - Public booking page
- `/booking-confirmed/:id` - Booking confirmation page

## Development

### Backend Development

Run in development mode with hot reload:
```bash
cd backend
npm run dev
```

Build for production:
```bash
npm run build
```

Run production build:
```bash
npm start
```

### Frontend Development

Run in development mode:
```bash
cd frontend
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Database Schema

### User
- id, email, password, name, businessName, slug
- Relations: services, appointments, availability

### Service
- id, name, durationMinutes, price, active
- Relations: user, appointments

### Availability
- id, dayOfWeek (0-6), startTime, endTime, active
- Relations: user

### Appointment
- id, date, time, status, customerName, customerEmail, customerPhone
- Relations: user, service

## Business Logic

### Available Time Slots Calculation
The system calculates available time slots by:
1. Checking the professional's availability for the requested day
2. Generating 30-minute time slots within working hours
3. Filtering slots that can accommodate the service duration
4. Excluding slots that conflict with existing appointments
5. Removing past time slots for today

### Appointment Conflicts
Two appointments conflict if:
- They overlap in time
- Both are not cancelled
- Time ranges intersect (start < other.end AND end > other.start)

## Security Features

- Passwords hashed with bcrypt
- JWT tokens with 7-day expiration
- Input validation on all endpoints (Zod)
- Protected routes with authentication middleware
- Rate limiting (100 requests per 15 minutes)
- CORS enabled

## Email Notifications

The system now includes **automated email notifications** powered by nodemailer:

- **Customer Confirmation**: Customers receive a beautifully formatted email when they book an appointment
- **Professional Notification**: Professionals receive email alerts for new appointment requests
- **Styled HTML Emails**: Professional-looking emails with your brand colors
- **Appointment Details**: All booking information included in the email

Email notifications are sent automatically when:
- A new appointment is created (customer receives confirmation)
- Professional receives notification of new booking request

## Future Enhancements

- Payment processing (Stripe integration)
- SMS reminders
- Multi-location support
- Recurring appointments
- Customer accounts
- Analytics dashboard
- Mobile app
- Appointment status update emails (confirmed/cancelled notifications)

## Testing

### Test the Application

1. Start both backend and frontend servers
2. Register a new account at `http://localhost:5173/register`
3. Create services in the dashboard
4. Set your availability
5. Visit your booking page at `/book/your-slug`
6. Make a test booking
7. Manage bookings in the appointments dashboard

### Using Seed Data

If you ran the seed command, you can:
1. Login with: john@barber.com / password123
2. Visit: http://localhost:5173/book/john-barber
3. View pre-configured services and availability

## Deployment

### Backend Deployment
1. Set up a PostgreSQL database
2. Set environment variables
3. Run migrations: `npm run prisma:migrate`
4. Build: `npm run build`
5. Start: `npm start`

### Frontend Deployment
1. Set `VITE_API_URL` to your production API URL
2. Build: `npm run build`
3. Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)

## Environment Variables

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `EMAIL_HOST` - Email server hostname (e.g., mail.mensuraanalytics.com)
- `EMAIL_PORT` - Email server port (default: 465 for SSL)
- `EMAIL_USER` - Email account username
- `EMAIL_PASSWORD` - Email account password
- `EMAIL_FROM` - From address for emails (e.g., "EasySchedule <calendar@mensuraanalytics.com>")

### Frontend
- `VITE_API_URL` - Backend API URL

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
