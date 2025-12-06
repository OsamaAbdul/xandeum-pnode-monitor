# Xandeum pNode Monitor

A comprehensive analytics platform for Xandeum pNodes, built for the Xandeum Superteam Bounty. This dashboard allows you to monitor the status, uptime, and version distribution of pNodes in the network via direct pRPC connection.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** (usually comes with Node.js)
- **Supabase CLI** (required for the backend and Edge Functions)
  - Install via npm: `npm install -g supabase`
  - Or via Homebrew: `brew install supabase/tap/supabase`

## 🚀 Quick Start Guide for Judges

Follow these steps to get the project running locally.

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/OsamaAbdul/xandeum-pnode-monitor.git
cd xandeum-pnode-monitor

# Install dependencies
npm install
```

### 2. Start the Backend (Supabase)

This project uses Supabase for the database and Edge Functions (which handle the pRPC calls). You need to start the local Supabase instance.

```bash
# Start Supabase services (Docker must be running)
supabase start
```

*Note: This will spin up a local Postgres database and the Edge Runtime. It may take a minute or two.*

### 3. Start the Frontend

```bash
npm run dev
```

Open your browser and navigate to the URL shown (usually `http://localhost:8080`).

---

## ⚙️ How to Configure the Bootstrap URL

Once the application is running, follow these steps to connect to a live Xandeum network:

1.  **Locate the "Configure" Button**:
    On the top right of the dashboard (next to the "Refresh" button), click the **"Configure"** button.

2.  **Enter the Bootstrap URL**:
    A dialog will appear asking for the **Bootstrap URL**. Enter the address of a valid Xandeum node that accepts pRPC calls.
    
    *Example Format*: `http://<IP_ADDRESS>:<PORT>/rpc`
    
    > **Note for Judges**: If you have been provided a specific IP for testing (e.g., from the Discord or bounty description), enter it here. 
    > Example: `http://167.235.0.123:6000/rpc` (This is a placeholder, please use a real active node IP).

3.  **Save & Fetch**:
    Click **"Save & Fetch"**.
    
    - The application will immediately trigger the `fetch-pnodes` Edge Function.
    - It will connect to the provided URL, fetch the list of pods (pNodes), and populate the dashboard.
    - You should see the **Network Overview**, **Charts**, and **pNodes Directory** update with live data.

## 🛠️ Features

-   **Real-time Monitoring**: Fetches live data from the network via pRPC.
-   **Network Health**: Calculates overall network health score.
-   **Version Analytics**: Visualizes the distribution of node versions.
-   **Uptime Tracking**: Categorizes nodes by uptime status (Online, Degraded, Offline).
-   **Responsive Design**: Fully functional on desktop and mobile.

## 🏗️ Tech Stack

-   **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn-ui
-   **Backend**: Supabase (PostgreSQL, Edge Functions)
-   **State Management**: TanStack Query
