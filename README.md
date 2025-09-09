# FairShare - Web Expense Splitter

A modern web application for splitting expenses fairly among friends, built with React and JavaScript.

## Features

### Dashboard
- Overview of friends, payments, and balances
- Recent activity feed
- Quick balance summary
- Key statistics at a glance

### Friends Management
- Add and remove friends
- View all friends with unique IDs
- Prevent deletion of friends with outstanding balances

### Payment Tracking
- Add payments with multiple people involved
- Categorize expenses (Food, Stay, Entertainment, Shopping, Settlement, Travel, General)
- Search payments by purpose or category
- View detailed payment history
- Calculate per-person share automatically

### Smart Settlements
- Automatic balance calculation
- Optimized settlement suggestions
- Clear visualization of who owes whom
- Minimized number of transactions needed

### Reports & Analytics
- Expense breakdown by category
- Spending analysis by person
- Percentage distributions
- Export data to CSV format

### Data Persistence
- Automatic saving to browser's local storage
- No need for external database
- Data persists between sessions

## Installation

1. **Install Node.js** (if not already installed)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version` and `npm --version`

2. **Navigate to the project directory**
   ```bash
   cd "C:\Users\cocro\Desktop\FairShare-Web"
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   - The application will automatically open at `http://localhost:3000`
   - If it doesn't open automatically, navigate to that URL manually

## Usage Guide

### Getting Started

1. **Add Friends**
   - Go to the "Friends" tab
   - Enter friend names and click "Add Friend"
   - Each friend gets a unique ID

2. **Record Payments**
   - Go to the "Payments" tab
   - Click "Add Payment"
   - Select who paid, enter amount, and choose involved friends
   - Add a description and select a category

3. **View Balances**
   - Check the "Settlements" tab to see who owes what
   - Get optimized settlement suggestions

4. **Generate Reports**
   - Use the "Reports" tab for detailed analytics
   - Export data to CSV for external analysis

### Key Features Explained

#### Smart Balance Calculation
The app automatically calculates:
- How much each person has paid
- How much each person should pay (their share)
- Net balances (who owes money vs. who should receive money)

#### Optimized Settlements
Instead of everyone paying everyone else, the app suggests the minimum number of transactions needed to settle all debts.

#### Categories
Organize expenses into categories:
- **Food**: Restaurants, groceries, takeout
- **Stay**: Hotels, Airbnb, accommodation
- **Entertainment**: Movies, games, activities
- **Shopping**: Shared purchases
- **Settlement**: Direct money transfers
- **Travel**: Transport, flights, gas
- **General**: Everything else

## Technical Details

### Built With
- **React 18** - Modern JavaScript framework
- **CSS3** - Custom styling with gradients and animations
- **Local Storage** - Browser-based data persistence
- **Responsive Design** - Works on desktop and mobile

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with JavaScript enabled

### Data Storage
- All data is stored locally in your browser
- No external servers or databases required
- Data persists between browser sessions
- Clear browser data will reset the application

## Comparison with Original C++ Version

This web application provides the same functionality as the original C++ console application but with additional benefits:

### Enhanced Features
- **Modern UI**: Beautiful, responsive web interface
- **Real-time Updates**: Instant visual feedback
- **Better UX**: Intuitive navigation and form handling
- **Mobile Friendly**: Works on phones and tablets
- **Visual Analytics**: Charts and graphs for better insights

### Core Features Maintained
- User management (add/delete friends)
- Payment tracking with categories
- Balance calculation
- Settlement optimization
- Data persistence (save/load)
- CSV export
- Search functionality
- Expense summaries


Enjoy splitting expenses fairly with FairShare!
