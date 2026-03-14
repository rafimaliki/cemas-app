# CeMaS - Compliance Management System

CeMaS is a compliance management system where users can manage compliance-related tasks and documents in a centralized app repository.

![CeMaS Screenshot](img/screenshot.png)

## Tech Stack

| Component  | Technologies                            |
| ---------- | --------------------------------------- |
| Frontend   | React, TypeScript, TanStack Query, Vite |
| Backend    | Node.js, TypeScript, Drizzle ORM, Hono  |
| Database   | PostgreSQL                              |
| Deployment | Azure VM                                |

## Project Structure

- `backend/` - Backend API (Node.js/TypeScript)
- `frontend/` - Frontend (React/TypeScript)
- `docker/` - Docker configuration

## Getting Started

### Prerequisites

- Docker

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/rafimaliki/cemas-app
   cd cemas-app
   ```

2. **Run with Docker Compose:**
   ```bash
   cd docker
   docker-compose up --build
   ```

The application will be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
