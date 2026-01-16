# 📈 Stock Competition Dashboard

A real-time stock portfolio competition tracker built with React and Vite. This dashboard visualizes a friendly stock-picking competition among participants, pulling live data from Google Sheets and displaying comprehensive performance metrics, rankings, and analytics.

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.19-06B6D4?logo=tailwindcss)

## 🎯 Overview

The **2026 Stock Competition** is a portfolio tracking application where participants start with a virtual $10,000 and compete to achieve the highest returns through stock picking. The dashboard provides:

- **Live Leaderboard** - Real-time rankings of all participants
- **Performance Charts** - Visual comparison of returns across participants
- **Stock Analytics** - Top 10 and Worst 10 performing stock picks
- **Individual Portfolios** - Detailed view of each participant's holdings
- **Key Statistics** - Total P&L, average returns, day movers, and more

## ✨ Features

### 📊 Dashboard Components

| Component | Description |
|-----------|-------------|
| **Stats Cards** | Quick view of leader, top stock, day's mover, and total P&L |
| **Performance Chart** | Horizontal bar chart showing all participants' returns |
| **Top 10 Stocks** | Best performing stocks across all portfolios |
| **Worst 10 Stocks** | Lowest performing stocks for awareness |
| **Leaderboard Table** | Sortable table with rankings, portfolio values, returns, and P&L |
| **Participant Modal** | Detailed breakdown of individual holdings with buy/current prices |

### 🔄 Data Integration

- **Google Sheets Sync** - Live data fetched from a published Google Spreadsheet
- **CSV Parsing** - Uses PapaParse for reliable CSV data processing
- **Auto-refresh** - Manual refresh capability with last updated timestamp

### 🎨 UI/UX

- **Dark Theme** - Modern slate-based dark gradient design
- **Responsive Layout** - Works on desktop, tablet, and mobile devices
- **Stock Logos** - Automatic ticker logos via Logo.dev API
- **Interactive Elements** - Hover effects, modals, and smooth transitions
- **Color-coded Returns** - Green for profits, red for losses

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI Framework |
| [Vite 7](https://vite.dev/) | Build Tool & Dev Server |
| [TailwindCSS 3](https://tailwindcss.com/) | Utility-first CSS |
| [Recharts](https://recharts.org/) | Data Visualization |
| [Lucide React](https://lucide.dev/) | Icon Library |
| [PapaParse](https://www.papaparse.com/) | CSV Parsing |
| [Logo.dev](https://logo.dev/) | Stock Ticker Logos |

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stock-dash
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |

## 📊 Data Structure

The application expects data from a Google Sheets spreadsheet with the following structure:

### Summary Section (Rows 1-14)
| Row | Content |
|-----|---------|
| 1 | Participant names (columns B onwards) |
| 2-11 | Stock symbols for each participant |
| 12 | Portfolio value |
| 13 | Day change percentage |
| 14 | Total return percentage |

### Individual Participant Sections
Each participant has a detailed section containing:
- Stock symbol
- Average buy price
- Current price
- Day change
- Total growth percentage
- Investment reasoning

## ⚙️ Configuration

### Google Sheets URL
Update the `SHEET_URL` constant in [src/App.jsx](src/App.jsx) to point to your own published Google Sheet:

```javascript
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID/pub?output=csv";
```

### Logo API
The app uses Logo.dev for stock ticker logos. Replace the API key if needed:

```javascript
const LOGO_API_KEY = "your_api_key_here";
```

## 🏗️ Project Structure

```
stock-dash/
├── public/              # Static assets
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Component styles
│   ├── main.jsx         # React entry point
│   ├── index.css        # Global styles & Tailwind imports
│   └── assets/          # Images and other assets
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── eslint.config.js     # ESLint configuration
```

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#6366f1` | Indigo - Main brand color |
| Success | `#10b981` | Emerald - Positive returns |
| Danger | `#ef4444` | Red - Negative returns |
| Warning | `#f59e0b` | Amber - Alerts |
| Purple | `#8b5cf6` | Purple - Accents |
| Cyan | `#06b6d4` | Cyan - Highlights |

## 📱 Responsive Design

- **Desktop** (1024px+): Full 4-column grid layout
- **Tablet** (768px-1023px): 2-column adaptations
- **Mobile** (<768px): Single column, stacked layout

## 🔒 Privacy & Security

- No user authentication required (read-only dashboard)
- All data fetched from publicly published Google Sheet
- No personal financial data stored locally

## 🚀 Deployment

Build for production:

```bash
npm run build
```

The `dist/` folder can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 📄 License

This project is private and intended for personal use in tracking a friendly stock competition.

---

**2026 Stock Competition** • Built with ❤️ using React + Vite
