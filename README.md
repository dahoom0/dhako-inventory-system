# Dhako Inventory Management System

A professional inventory and sales management system with role-based access control.

## Project Structure

```
├── frontend/          # React + TypeScript frontend
│   ├── src/          # Source code
│   ├── index.html    # Entry point
│   └── package.json
│
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── utils/
│   └── package.json
│
└── .git/            # Version control
```

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

- User authentication with JWT
- Role-based access control
- Multi-location support
- Inventory management
- Sales tracking
- Dashboard analytics

## Roles

- **Admin**: Full system access
- **Inventory Manager**: Warehouse management
- **Branch Manager**: Branch operations
