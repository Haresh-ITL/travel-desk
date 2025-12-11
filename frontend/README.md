# Corporate Travel Desk Management System - Angular Frontend

A production-ready Angular 17+ application for managing corporate travel requests, approvals, and bookings.

## Features

### Role-Based Access Control
- **Org Admin**: User management, role assignment, manager mapping
- **Employee**: Travel request creation, profile management, document uploads
- **Manager**: Request approvals/rejections with comments
- **Travel Desk Admin**: Booking management, payment processing, itinerary creation

### Key Highlights
- ✅ Angular 17+ with standalone components
- ✅ Material Design UI with light/dark theme toggle
- ✅ TypeScript strict mode
- ✅ Role-based routing with guards
- ✅ HTTP interceptor for authentication
- ✅ Stripe payment integration (test mode)
- ✅ Premium, responsive design
- ✅ Comprehensive dashboard for each role

## Tech Stack

- **Framework**: Angular 17+
- **UI Library**: Angular Material
- **Styling**: SCSS
- **HTTP Client**: Angular HttpClient
- **Payment**: Stripe.js
- **State Management**: RxJS
- **Authentication**: JWT-based (localStorage)

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Auth and role guards
│   │   ├── interceptors/    # HTTP interceptors
│   │   ├── layout/          # Main layout component
│   │   └── services/        # Core services (auth, API services)
│   ├── shared/
│   │   ├── components/      # Shared components (itinerary viewer)
│   │   └── models/          # TypeScript interfaces
│   ├── features/
│   │   ├── auth/            # Login component
│   │   ├── dashboard/       # Role-aware dashboard
│   │   ├── org-admin/       # Org admin features
│   │   ├── employee/        # Employee features
│   │   ├── manager/         # Manager features
│   │   └── travel-desk/     # Travel desk features
│   ├── app.routes.ts        # Application routing
│   ├── app.config.ts        # App configuration
│   └── app.component.ts     # Root component
├── environments/            # Environment configs
└── styles.scss             # Global styles
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Stripe** (optional):
   - Update the Stripe publishable key in `src/app/core/services/payment.service.ts`
   - Replace `pk_test_51234567890` with your actual Stripe test key

3. **Configure API endpoint**:
   - Update `apiUrl` in `src/environments/environment.ts` if needed
   - Default is `/api` (assumes backend runs on same domain)

## Running the Application

### Development Server
```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`

### Build for Production
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Backend Integration

This frontend expects the following backend endpoints:

### Authentication
- `POST /api/auth/login` - User login

### Org Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:uuid` - Update user
- `PUT /api/admin/users/:uuid/managers` - Assign managers

### Employee
- `GET /api/employee/requests` - Get employee requests
- `POST /api/employee/requests` - Create travel request
- `GET /api/employee/profile` - Get profile
- `POST /api/employee/profile/documents` - Upload documents

### Manager
- `GET /api/manager/requests` - Get all requests
- `GET /api/manager/requests/pending` - Get pending requests
- `PUT /api/manager/requests/:uuid/decision` - Approve/reject request

### Travel Desk
- `GET /api/travel-desk/requests/approved` - Get approved requests
- `POST /api/travel-desk/bookings` - Create booking
- `GET /api/travel-desk/analytics` - Get analytics

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent

## User Roles

### Login Credentials (Backend-dependent)
The application supports four roles:
- `ORG_ADMIN` - Organization administrator
- `EMPLOYEE` - Regular employee
- `MANAGER` - Team manager
- `TRAVEL_DESK_ADMIN` - Travel desk administrator

## Features by Role

### Org Admin
- View user statistics dashboard
- Manage users (create, edit, view)
- Assign managers to employees
- Filter and search users

### Employee
- View travel statistics dashboard
- Create travel requests
- View request status with color-coded chips
- Upload documents (Aadhaar, PAN, Passport)
- View booked itineraries

### Manager
- View approval statistics dashboard
- Review employee travel requests
- Approve or reject requests with comments
- Filter requests by employee or status

### Travel Desk Admin
- View booking statistics dashboard
- Process approved requests
- Enter flight, hotel, and cab details
- Process payments via Stripe (test mode)
- Create and preview itineraries
- Upload booking confirmations

## Design Features

### Premium UI/UX
- Gradient backgrounds and color schemes
- Smooth animations and transitions
- Hover effects on interactive elements
- Color-coded status chips
- Material icons throughout
- Responsive grid layouts

### Dark Theme Support
- Toggle between light and dark themes
- Theme preference saved in localStorage
- Consistent styling across all components

### Accessibility
- Semantic HTML
- ARIA labels and roles
- Keyboard navigation support
- High contrast color schemes

## Development Notes

### Adding New Features
1. Create feature component in appropriate folder
2. Add route in `app.routes.ts`
3. Add role guard if needed
4. Update navigation in `layout.component.ts`

### Customizing Styles
- Global styles: `src/styles.scss`
- Theme colors: Update CSS variables in `styles.scss`
- Component styles: Each component has its own `.scss` file

### API Integration
- All API calls go through services in `core/services/`
- HTTP interceptor automatically adds `x-user-uuid` header
- Update `environment.ts` for different API endpoints

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - Corporate Travel Desk Management System

## Support

For issues or questions, contact the development team.
