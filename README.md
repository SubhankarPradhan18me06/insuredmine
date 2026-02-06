# InsuredMine — Backend

**Node.js + Express + MongoDB** backend for the InsuredMine technical assessment.

Features implemented:
- Upload CSV / XLSX (worker threads) → populates separate MongoDB collections:
  `agents`, `users`, `accounts`, `lobs`, `carriers`, `policies`
- Search policies by username/email
- Aggregate policies by user
- CPU monitor: detects high CPU usage (configurable) and performs graceful restart
- Scheduled messages: `POST /api/schedule-message` schedules messages to run at given day/time (persists across restarts)
- Winston loggers with daily rotation

---

## Table of Contents

- [Prerequisites](#prerequisites)  
- [Quick start (local)](#quick-start-local)  
- [Environment variables](#environment-variables)  
- [Run with PM2 (recommended)](#run-with-pm2-recommended)  
- [Run with Docker (optional)](#run-with-docker-optional)  
- [API endpoints & examples](#api-endpoints--examples)  
  - Upload (worker thread)  
  - Search policies  
  - Aggregate policies  
  - Scheduled messages  
- [Testing Task 2 (CPU monitor & schedule)](#testing-task-2-cpu-monitor--schedule)  
- [Logs & uploads](#logs--uploads)  
- [Project structure](#project-structure)  
- [Troubleshooting](#troubleshooting)  
- [Notes & next steps](#notes--next-steps)

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm
- MongoDB (local or remote)
- Optional: `pm2` for production/dev supervision (recommended)
- Optional: Docker & Docker Compose (if using provided `docker-compose.yml`)

---

## Quick start (local)

1. Clone and open repo:
   ```bash
   git clone <repo-url>
   cd insuredmine_assessment
