# Dee Wholesale Mart POS System

A modern, full-featured Point of Sale (POS) system built with React and Supabase.

## Features

### ✅ Completed Modules

#### 📊 Dashboard
- Real-time business metrics (Today's Sales, Orders, Low Stock, Customers)
- Color-coded summary widgets
- Quick insights at a glance

#### 🛒 Point of Sale (POS)
- Product grid with category filtering
- Real-time cart management
- Multiple payment methods support
- Quick checkout process

#### 📦 Inventory Management
- Product CRUD operations (Create, Read, Update, Delete)
- Category-based organization
- Low stock alerts
- Search and filter capabilities

#### 👥 Customer Management
- Customer profiles with contact details
- Credit limit tracking
- Outstanding balance monitoring
- Search functionality

#### 🚚 Supplier Management
- Supplier contact database
- Company and contact person details
- Easy add/edit/delete operations

#### 📈 Reports & Analytics
- Sales history with date filtering
- Transaction details (Payment method, Status, Amount)
- Exportable data views

#### 🔐 Authentication & Security
- User login with email/password
- Role-based access control (Admin, Manager, Cashier)
- Protected routes
- User management (Admin only)
- Session tracking

#### 🚀 Enhanced POS Features (NEW!)
- **Barcode Scanner**: Quick product lookup by scanning or typing
- **Receipt Printing**: Professional thermal printer-ready receipts
- **Payment Modal**: Clean payment processing interface
- **Split Payments**: Pay with multiple methods (Cash + Card, MoMo)
- **Credit Sales**: Sell on customer account with balance tracking

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Routing**: React Router v6
- **Styling**: Vanilla CSS with CSS Variables
- **Icons**: Lucide React
- **State Management**: React Context API

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   └── Layout/          # Sidebar, Header, Layout wrapper
│   ├── pages/
│   │   ├── Dashboard/       # Dashboard with widgets
│   │   ├── POS/            # Point of Sale checkout
│   │   ├── Inventory/      # Product management
│   │   ├── Customers/      # Customer management
│   │   ├── Suppliers/      # Supplier management
│   │   └── Reports/        # Sales reports
│   ├── services/           # API service layer
│   │   ├── productService.js
│   │   ├── salesService.js
│   │   ├── customerService.js
│   │   └── supplierService.js
│   ├── context/
│   │   └── CartContext.jsx # Global cart state
│   ├── lib/
│   │   └── supabaseClient.js
│   └── index.css           # Global styles & variables
└── .env                    # Environment variables

supabase_schema.sql         # Database schema
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- (Optional) Supabase account for database

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment (Optional)**
   
   Create or update `client/.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

### Demo Mode

The application works **without Supabase** using fallback dummy data. This allows you to:
- Test all features immediately
- Develop and demo without backend setup
- See the full UI/UX experience

### Database Setup (Optional)

To connect to a real database:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy the SQL from `supabase_schema.sql`
3. Run it in your Supabase SQL Editor
4. Update your `.env` file with credentials
5. Restart the dev server

## Usage

### Navigation
- **Dashboard** (`/dashboard`) - Default landing page with business metrics
- **POS** (`/pos`) - Point of sale checkout interface
- **Inventory** (`/inventory`) - Manage products and stock
- **Customers** (`/customers`) - Customer database
- **Suppliers** (`/suppliers`) - Supplier contacts
- **Reports** (`/reports`) - Sales history and analytics

### Key Features

#### Adding Products (Inventory)
1. Navigate to Inventory
2. Click "Add Product"
3. Fill in product details (Name, Category, Price, Stock)
4. Click "Save Product"

#### Making a Sale (POS)
1. Navigate to POS
2. Select products from the grid
3. Adjust quantities in the cart
4. Click "Pay" to complete the transaction

#### Viewing Reports
1. Navigate to Reports
2. Select date range (optional)
3. Click "Filter" to view sales for that period

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Adding New Features

1. Create component in `src/pages/[FeatureName]/`
2. Add service functions in `src/services/`
3. Update routing in `src/App.jsx`
4. Add navigation link in `src/components/Layout/Sidebar.jsx`

## Roadmap

### ✅ Completed Phases
- [x] **Phase 1**: Core POS UI & Design
- [x] **Phase 2**: Inventory Management System
- [x] **Phase 3**: Customer & Supplier Management
- [x] **Phase 4**: Reports & Analytics Dashboard
- [x] **Phase 5**: Authentication & Security
- [x] **Phase 6**: Enhanced POS Features (Barcode, Receipts, Payments)

### Phase 7 (Planned)
- [ ] Mobile Responsiveness
- [ ] Touch-friendly interface
- [ ] Tablet optimization
- [ ] Responsive layouts for all pages

### Phase 8 (Planned)
- [ ] Advanced Analytics with Charts
- [ ] Sales trends visualization
- [ ] Top-selling products
- [ ] Profit margin analysis
- [ ] Inventory turnover metrics

### Phase 9 (Planned)
- [ ] Notifications System
- [ ] Low stock alerts
- [ ] Daily sales summary
- [ ] Payment reminders

### Phase 10 (Planned)
- [ ] Data Export & Backup
- [ ] Excel/CSV export
- [ ] Automated backups
- [ ] Multi-branch support

## Contributing

This is a custom POS system for Dee Wholesale Mart. For feature requests or issues, please contact the development team.

## License

Proprietary - Dee Wholesale Mart

---

**Built with ❤️ for Dee Wholesale Mart**
