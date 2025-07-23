# TaxFlow AI

## Overview

TaxFlow AI is a modern web application designed to help small business owners and freelancers automate their bookkeeping and tax categorization. The application leverages AI to automatically categorize expenses and analyze tax deductibility, providing intelligent insights for business expense management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, modern UI
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions
- **Development**: Hot reload with Vite middleware integration

### Component Design
The UI follows a component-based architecture using shadcn/ui components with:
- Responsive design patterns
- Consistent spacing and typography
- Accessible form controls and interactive elements
- Modern card-based layouts with subtle shadows and rounded corners

## Key Components

### Data Models
- **Expenses**: Core entity with fields for date, vendor, amount, description, category, and deductibility status
- **Validation**: Zod schemas ensure type safety between frontend and backend
- **Categories**: Predefined expense categories (Marketing, Office Supplies, Travel, etc.)
- **Deductibility**: Three-tier system (Fully Deductible, Partially Deductible, Not Deductible)

### AI Integration
- **OpenAI Integration**: GPT-4o model for expense categorization and deductibility analysis
- **Smart Categorization**: Automatic expense classification based on vendor, description, and amount
- **Deductibility Analysis**: AI-powered assessment of tax deductibility with reasoning
- **Insights Generation**: Summary analytics and recommendations for business owners

### User Interface Components
- **Dashboard**: Overview with stats cards showing total expenses, deductible amounts, and AI accuracy
- **Expense Form**: User-friendly form for manual expense entry with real-time AI processing
- **Expense Table**: Sortable, filterable table with inline editing capabilities
- **Google Sheets Integration**: Panel for syncing data between the app and Google Sheets
- **Tax Summary**: Visual breakdown of deductible vs non-deductible expenses

## Data Flow

1. **Expense Creation**: Users input expense data through forms or import from Google Sheets
2. **AI Processing**: New expenses are automatically sent to OpenAI for categorization and deductibility analysis
3. **Data Storage**: Processed expenses are stored in PostgreSQL with full audit trail
4. **Real-time Updates**: TanStack Query provides optimistic updates and cache invalidation
5. **Export Options**: Users can export categorized data as CSV or sync back to Google Sheets

## External Dependencies

### APIs and Services
- **OpenAI API**: For AI-powered expense categorization and analysis
- **Google Sheets API**: For bidirectional data synchronization
- **Neon Database**: PostgreSQL hosting service for production data storage

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **Replit Integration**: Development environment optimizations and runtime error handling
- **Vite Plugins**: Enhanced development experience with hot reload and error overlays

### UI Libraries
- **Radix UI**: Accessible, unstyled component primitives
- **Lucide React**: Consistent icon library
- **TailwindCSS**: Utility-first CSS framework
- **React Hook Form**: Performant form library with validation

## Deployment Strategy

### Development Setup
- **Environment**: Configured for Replit development with specialized plugins
- **Hot Reload**: Vite development server with Express middleware integration
- **Database**: PostgreSQL with Drizzle ORM for schema management
- **API Keys**: Environment variable configuration for OpenAI and Google APIs

### Production Build
- **Frontend**: Vite builds optimized React bundle to `dist/public`
- **Backend**: esbuild compiles TypeScript server code to `dist/index.js`
- **Static Assets**: Express serves built frontend from production directory
- **Database**: Drizzle migrations handle schema updates in production

### Storage Strategy
The application uses a hybrid storage approach:
- **Development**: In-memory storage for rapid prototyping
- **Production**: PostgreSQL with Drizzle ORM for persistence
- **External Sync**: Google Sheets integration for user data portability

The architecture emphasizes modern web development practices with strong typing, component reusability, and AI-first functionality to deliver an intuitive business expense management experience.