import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [nextUserId, setNextUserId] = useState(1);
  const [nextPaymentId, setNextPaymentId] = useState(1);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Food', 'Stay', 'Entertainment', 'Shopping', 'Settlement', 'Travel', 'General'];

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('fairshareData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setUsers(data.users || []);
      setPayments(data.payments || []);
      setNextUserId(data.nextUserId || 1);
      setNextPaymentId(data.nextPaymentId || 1);
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const data = {
      users,
      payments,
      nextUserId,
      nextPaymentId
    };
    localStorage.setItem('fairshareData', JSON.stringify(data));
  }, [users, payments, nextUserId, nextPaymentId]);

  const addUser = (name) => {
    const newUser = {
      id: nextUserId,
      name: name.trim()
    };
    setUsers([...users, newUser]);
    setNextUserId(nextUserId + 1);
    return newUser;
  };

  const deleteUser = (userId) => {
    const balances = calculateBalances();
    const userBalance = balances[userId];
    
    if (userBalance && Math.abs(userBalance) >= 0.01) {
      alert(`Cannot delete user with outstanding balance. User ${userBalance > 0 ? 'should receive' : 'owes'} Rs.${Math.abs(userBalance).toFixed(2)}.`);
      return false;
    }
    
    setUsers(users.filter(user => user.id !== userId));
    return true;
  };

  const addPayment = (payerId, amount, involvedIds, purpose, category = 'General') => {
    // Format date consistently for better CSV export
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    // Fix floating point precision issues
    const parsedAmount = parseFloat(amount);
    const roundedAmount = Math.round(parsedAmount * 100) / 100; // Round to 2 decimal places
    
    // Store user names to preserve them even if users are deleted later
    const payer = getUserById(payerId);
    const payerName = payer ? payer.name : 'Unknown';
    
    const involvedNames = involvedIds.map(id => {
      const user = getUserById(id);
      return user ? user.name : 'Unknown';
    });
    
    const newPayment = {
      id: nextPaymentId,
      payerId,
      payerName,         // store payer name here
      amount: roundedAmount,
      involvedIds,
      involvedNames,     // store involved user names here
      purpose,
      category,
      date: formattedDate
    };
    setPayments([...payments, newPayment]);
    setNextPaymentId(nextPaymentId + 1);
    return newPayment;
  };

  const deletePayment = (paymentId) => {
    // Find the payment to be deleted
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    // Check if the payer still exists in the current users list
    const payerExists = users.some(user => user.id === payment.payerId);
    if (!payerExists) {
      alert('Cannot delete payment: The payer has been deleted from the system.');
      return;
    }
    
    // Check if all involved users still exist in the current users list
    const missingUsers = payment.involvedIds.filter(involvedId => 
      !users.some(user => user.id === involvedId)
    );
    
    if (missingUsers.length > 0) {
      alert('Cannot delete payment: One or more involved users have been deleted from the system.');
      return;
    }
    
    // If all users still exist, proceed with deletion
    setPayments(payments.filter(payment => payment.id !== paymentId));
  };

  const calculateBalances = () => {
    const balances = {};
    
    // Initialize balances for all users
    users.forEach(user => {
      balances[user.id] = 0;
    });

    // Calculate net amounts from payments
    payments.forEach(payment => {
      if (payment.involvedIds.length === 0) return;
      
      const share = Math.round((payment.amount / payment.involvedIds.length) * 100) / 100;
      balances[payment.payerId] = Math.round((balances[payment.payerId] + payment.amount) * 100) / 100;
      
      payment.involvedIds.forEach(userId => {
        if (balances[userId] !== undefined) {
          balances[userId] = Math.round((balances[userId] - share) * 100) / 100;
        }
      });
    });

    // Filter out balances close to zero
    const filteredBalances = {};
    Object.keys(balances).forEach(userId => {
      if (Math.abs(balances[userId]) >= 0.01) {
        filteredBalances[userId] = balances[userId];
      }
    });

    return filteredBalances;
  };

  const calculateSettlements = () => {
    const balances = calculateBalances();
    const creditors = [];
    const debtors = [];
    
    Object.keys(balances).forEach(userId => {
      const balance = balances[userId];
      if (balance > 0.01) {
        creditors.push({ userId: parseInt(userId), amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ userId: parseInt(userId), amount: -balance });
      }
    });

    const settlements = [];
    let i = 0, j = 0;
    
    while (i < debtors.length && j < creditors.length) {
      const debt = debtors[i].amount;
      const credit = creditors[j].amount;
      const settleAmount = Math.min(debt, credit);
      
      settlements.push({
        from: debtors[i].userId,
        to: creditors[j].userId,
        amount: settleAmount
      });
      
      debtors[i].amount -= settleAmount;
      creditors[j].amount -= settleAmount;
      
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }
    
    return settlements;
  };

  const getUserById = (id) => {
    return users.find(user => user.id === id);
  };

  const getExpenseSummary = () => {
    const categoryTotals = {};
    const userTotals = {};
    let grandTotal = 0;

    payments.forEach(payment => {
      categoryTotals[payment.category] = (categoryTotals[payment.category] || 0) + payment.amount;
      
      // Use stored payer name instead of ID to handle deleted users
      const payerName = payment.payerName || getUserById(payment.payerId)?.name || 'Unknown';
      userTotals[payerName] = (userTotals[payerName] || 0) + payment.amount;
      
      grandTotal += payment.amount;
    });

    return { categoryTotals, userTotals, grandTotal };
  };

  const searchPayments = (term) => {
    if (!term.trim()) return payments;
    const lowerTerm = term.toLowerCase();
    return payments.filter(payment => 
      payment.purpose.toLowerCase().includes(lowerTerm) || 
      payment.category.toLowerCase().includes(lowerTerm)
    );
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.removeItem('fairshareData');
      setUsers([]);
      setPayments([]);
      setNextUserId(1);
      setNextPaymentId(1);
      alert('All data has been cleared.');
    }
  };

  const exportToCSV = () => {
    // Helper function to escape CSV fields
    const escapeCSVField = (field) => {
      if (field === null || field === undefined) return '';
      const stringField = String(field);
      // If field contains comma, quote, or newline, wrap in quotes and escape quotes
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
        return '"' + stringField.replace(/"/g, '""') + '"';
      }
      return stringField;
    };

    const csvContent = [
      ['Payment ID', 'Date', 'Payer', 'Amount', 'Purpose', 'Category', 'Involved Users'],
      ...payments.map(payment => [
        payment.id,
        payment.date,
        payment.payerName || getUserById(payment.payerId)?.name || 'Unknown',
        payment.amount.toFixed(2),
        payment.purpose,
        payment.category,
        payment.involvedNames ? payment.involvedNames.join('; ') : payment.involvedIds.map(id => getUserById(id)?.name || 'Unknown').join('; ')
      ])
    ].map(row => row.map(field => escapeCSVField(field)).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairshare_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>💰 FairShare</h1>
            <p>Split expenses fairly among friends</p>
          </div>
          <button 
            className="clear-data-btn"
            onClick={clearAllData}
            title="Clear all data"
          >
            🗑️ Clear Data
          </button>
        </div>
      </header>

      <nav className="nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'friends' ? 'active' : ''}
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </button>
        <button 
          className={activeTab === 'payments' ? 'active' : ''}
          onClick={() => setActiveTab('payments')}
        >
          Payments
        </button>
        <button 
          className={activeTab === 'settlements' ? 'active' : ''}
          onClick={() => setActiveTab('settlements')}
        >
          Settlements
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </nav>

      <main className="main">
        {activeTab === 'dashboard' && (
          <DashboardTab 
            users={users} 
            payments={payments} 
            calculateBalances={calculateBalances}
            getExpenseSummary={getExpenseSummary}
            getUserById={getUserById}
          />
        )}

        {activeTab === 'friends' && (
          <FriendsTab 
            users={users} 
            addUser={addUser} 
            deleteUser={deleteUser}
            getUserById={getUserById}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab 
            users={users}
            payments={payments}
            addPayment={addPayment}
            deletePayment={deletePayment}
            categories={categories}
            getUserById={getUserById}
            searchPayments={searchPayments}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}

        {activeTab === 'settlements' && (
          <SettlementsTab 
            users={users}
            calculateBalances={calculateBalances}
            calculateSettlements={calculateSettlements}
            getUserById={getUserById}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab 
            users={users}
            payments={payments}
            getExpenseSummary={getExpenseSummary}
            getUserById={getUserById}
            exportToCSV={exportToCSV}
          />
        )}
      </main>
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ users, payments, calculateBalances, getExpenseSummary, getUserById }) => {
  const balances = calculateBalances();
  const { grandTotal } = getExpenseSummary();

  return (
    <div className="dashboard">
      <div className="dashboard-cards">
        <div className="card">
          <h3>Total Friends</h3>
          <div className="card-value">{users.length}</div>
        </div>
        <div className="card">
          <h3>Total Payments</h3>
          <div className="card-value">{payments.length}</div>
        </div>
        <div className="card">
          <h3>Total Expenses</h3>
          <div className="card-value">Rs.{grandTotal.toFixed(2)}</div>
        </div>
        <div className="card">
          <h3>Outstanding Balances</h3>
          <div className="card-value">{Object.keys(balances).length}</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-activity">
          <h3>Recent Payments</h3>
          {payments.length === 0 ? (
            <p>No payments recorded yet.</p>
          ) : (
            <div className="activity-list">
              {payments.slice(-5).reverse().map(payment => (
                <div key={payment.id} className="activity-item">
                  <div className="activity-details">
                    <strong>{payment.payerName || getUserById(payment.payerId)?.name || 'Unknown'}</strong> paid Rs.{payment.amount.toFixed(2)}
                    <br />
                    <small>{payment.purpose} • {payment.category}</small>
                  </div>
                  <div className="activity-date">{payment.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quick-balances">
          <h3>Current Balances</h3>
          {Object.keys(balances).length === 0 ? (
            <p>All debts settled! 🎉</p>
          ) : (
            <div className="balance-list">
              {Object.entries(balances).map(([userId, balance]) => (
                <div key={userId} className={`balance-item ${balance > 0 ? 'positive' : 'negative'}`}>
                  <span className="user-name">{getUserById(parseInt(userId))?.name}</span>
                  <span className="balance-amount">
                    {balance > 0 ? '+' : ''}Rs.{balance.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Friends Tab Component
const FriendsTab = ({ users, addUser, deleteUser, getUserById }) => {
  const [newUserName, setNewUserName] = useState('');

  const handleAddUser = (e) => {
    e.preventDefault();
    if (newUserName.trim()) {
      addUser(newUserName);
      setNewUserName('');
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this friend?')) {
      deleteUser(userId);
    }
  };

  return (
    <div className="friends-tab">
      <div className="add-friend-form">
        <h3>Add New Friend</h3>
        <form onSubmit={handleAddUser}>
          <input
            type="text"
            placeholder="Enter friend's name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            required
          />
          <button type="submit">Add Friend</button>
        </form>
      </div>

      <div className="friends-list">
        <h3>Friends List</h3>
        {users.length === 0 ? (
          <p>No friends added yet. Add some friends to start splitting expenses!</p>
        ) : (
          <div className="friends-grid">
            {users.map(user => (
              <div key={user.id} className="friend-card">
                <div className="friend-info">
                  <h4>{user.name}</h4>
                  <p>ID: {user.id}</p>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Payments Tab Component
const PaymentsTab = ({ users, payments, addPayment, deletePayment, categories, getUserById, searchPayments, searchTerm, setSearchTerm }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    payerId: '',
    amount: '',
    purpose: '',
    category: 'General',
    involvedIds: []
  });

  const handleAddPayment = (e) => {
    e.preventDefault();
    if (formData.payerId && formData.amount && formData.involvedIds.length > 0) {
      // Validate amount
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid positive amount.');
        return;
      }
      
      addPayment(
        parseInt(formData.payerId),
        amount,
        formData.involvedIds,
        formData.purpose || 'No description',
        formData.category
      );
      setFormData({
        payerId: '',
        amount: '',
        purpose: '',
        category: 'General',
        involvedIds: []
      });
      setShowAddForm(false);
    } else {
      alert('Please fill in all required fields (payer, amount, and at least one person to split with).');
    }
  };

  const handleInvolvedChange = (userId, checked) => {
    if (checked) {
      setFormData({
        ...formData,
        involvedIds: [...formData.involvedIds, parseInt(userId)]
      });
    } else {
      setFormData({
        ...formData,
        involvedIds: formData.involvedIds.filter(id => id !== parseInt(userId))
      });
    }
  };

  const filteredPayments = searchPayments(searchTerm);

  return (
    <div className="payments-tab">
      <div className="payments-header">
        <button 
          className="add-payment-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add Payment'}
        </button>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {showAddForm && (
        <div className="add-payment-form">
          <h3>Add New Payment</h3>
          <form onSubmit={handleAddPayment}>
            <div className="form-group">
              <label>Who paid?</label>
              <select
                value={formData.payerId}
                onChange={(e) => setFormData({...formData, payerId: e.target.value})}
                required
              >
                <option value="">Select payer</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers and decimal points
                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                    setFormData({...formData, amount: value});
                  }
                }}
                onBlur={(e) => {
                  // Format the number when user leaves the field
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    setFormData({...formData, amount: value.toFixed(2)});
                  }
                }}
                required
              />
            </div>

            <div className="form-group">
              <label>Purpose</label>
              <input
                type="text"
                placeholder="What was this payment for?"
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Split among:</label>
              <div className="involved-users">
                {users.map(user => (
                  <label key={user.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.involvedIds.includes(user.id)}
                      onChange={(e) => handleInvolvedChange(user.id, e.target.checked)}
                    />
                    {user.name}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit">Add Payment</button>
          </form>
        </div>
      )}

      <div className="payments-list">
        <h3>Payment History</h3>
        {filteredPayments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          <div className="payments-grid">
            {filteredPayments.map(payment => (
              <div key={payment.id} className="payment-card">
                <div className="payment-header">
                  <h4>{payment.purpose}</h4>
                  <span className="payment-amount">Rs.{payment.amount.toFixed(2)}</span>
                </div>
                <div className="payment-details">
                  <p><strong>Paid by:</strong> {payment.payerName || getUserById(payment.payerId)?.name || 'Unknown'}</p>
                  <p><strong>Category:</strong> {payment.category}</p>
                  <p><strong>Date:</strong> {payment.date}</p>
                  <p><strong>Split among:</strong> {payment.involvedNames ? payment.involvedNames.join(', ') : payment.involvedIds.map(id => getUserById(id)?.name || 'Unknown').join(', ')}</p>
                  <p><strong>Per person:</strong> Rs.{(payment.amount / payment.involvedIds.length).toFixed(2)}</p>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this payment?')) {
                      deletePayment(payment.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Settlements Tab Component
const SettlementsTab = ({ users, calculateBalances, calculateSettlements, getUserById }) => {
  const balances = calculateBalances();
  const settlements = calculateSettlements();

  return (
    <div className="settlements-tab">
      <div className="balances-section">
        <h3>Current Balances</h3>
        {Object.keys(balances).length === 0 ? (
          <div className="no-balances">
            <h4>🎉 All debts settled!</h4>
            <p>No outstanding balances between friends.</p>
          </div>
        ) : (
          <div className="balances-grid">
            {Object.entries(balances).map(([userId, balance]) => (
              <div key={userId} className={`balance-card ${balance > 0 ? 'positive' : 'negative'}`}>
                <div className="user-name">{getUserById(parseInt(userId))?.name}</div>
                <div className="balance-amount">
                  {balance > 0 ? (
                    <span className="positive">Should receive Rs.{balance.toFixed(2)}</span>
                  ) : (
                    <span className="negative">Owes Rs.{Math.abs(balance).toFixed(2)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="settlements-section">
        <h3>Suggested Settlements</h3>
        {settlements.length === 0 ? (
          <p>No settlements needed.</p>
        ) : (
          <div className="settlements-list">
            {settlements.map((settlement, index) => (
              <div key={index} className="settlement-item">
                <div className="settlement-text">
                  <strong>{getUserById(settlement.from)?.name}</strong> should pay{' '}
                  <strong>{getUserById(settlement.to)?.name}</strong>{' '}
                  <span className="amount">Rs.{settlement.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Reports Tab Component
const ReportsTab = ({ users, payments, getExpenseSummary, getUserById, exportToCSV }) => {
  const { categoryTotals, userTotals, grandTotal } = getExpenseSummary();

  return (
    <div className="reports-tab">
      <div className="reports-header">
        <h3>Expense Reports</h3>
        <button onClick={exportToCSV} className="export-btn">
          Export to CSV
        </button>
      </div>

      <div className="summary-cards">
        <div className="card">
          <h4>Total Expenses</h4>
          <div className="card-value">Rs.{grandTotal.toFixed(2)}</div>
        </div>
        <div className="card">
          <h4>Average per Person</h4>
          <div className="card-value">
            Rs.{users.length > 0 ? (grandTotal / users.length).toFixed(2) : '0.00'}
          </div>
        </div>
        <div className="card">
          <h4>Total Payments</h4>
          <div className="card-value">{payments.length}</div>
        </div>
      </div>

      <div className="reports-content">
        <div className="category-report">
          <h4>Expenses by Category</h4>
          {Object.keys(categoryTotals).length === 0 ? (
            <p>No expenses recorded.</p>
          ) : (
            <div className="category-list">
              {Object.entries(categoryTotals).map(([category, total]) => (
                <div key={category} className="category-item">
                  <span className="category-name">{category}</span>
                  <span className="category-amount">Rs.{total.toFixed(2)}</span>
                  <span className="category-percentage">
                    ({((total / grandTotal) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="user-report">
          <h4>Expenses by User</h4>
          {Object.keys(userTotals).length === 0 ? (
            <p>No expenses recorded.</p>
          ) : (
            <div className="user-list">
              {Object.entries(userTotals).map(([payerName, total]) => (
                <div key={payerName} className="user-item">
                  <span className="user-name">{payerName}</span>
                  <span className="user-amount">Rs.{total.toFixed(2)}</span>
                  <span className="user-percentage">
                    ({((total / grandTotal) * 100).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
