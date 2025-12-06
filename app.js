// Categories
const EXPENSE_CATEGORIES = [
    { value: 'food', label: 'Food & Dining', icon: '🍽️' },
    { value: 'transport', label: 'Transportation', icon: '🚗' },
    { value: 'utilities', label: 'Utilities', icon: '💡' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
    { value: 'shopping', label: 'Shopping', icon: '🛍️' },
    { value: 'health', label: 'Healthcare', icon: '🏥' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'other_expense', label: 'Other', icon: '📦' }
];

const INCOME_CATEGORIES = [
    { value: 'salary', label: 'Salary', icon: '💼' },
    { value: 'freelance', label: 'Freelance', icon: '💻' },
    { value: 'investments', label: 'Investments', icon: '📈' },
    { value: 'gifts', label: 'Gifts', icon: '🎁' },
    { value: 'other_income', label: 'Other', icon: '💰' }
];

const CATEGORY_COLORS = {
    food: '#f97316',
    transport: '#3b82f6',
    utilities: '#eab308',
    entertainment: '#a855f7',
    shopping: '#ec4899',
    health: '#ef4444',
    education: '#14b8a6',
    other_expense: '#6b7280',
    salary: '#22c55e',
    freelance: '#06b6d4',
    investments: '#8b5cf6',
    gifts: '#f43f5e',
    other_income: '#84cc16'
};

// State
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentType = 'expense';
let categoryChart = null;
let monthlyChart = null;

// DOM Elements
const form = document.getElementById('transactionForm');
const typeInput = document.getElementById('transactionType');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const filterCategorySelect = document.getElementById('filterCategory');
const exportBtn = document.getElementById('exportBtn');

// Initialize
function init() {
    dateInput.value = new Date().toISOString().split('T')[0];
    updateCategoryOptions();
    updateFilterOptions();
    render();
    
    // Event Listeners
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentType = btn.dataset.type;
            typeInput.value = currentType;
            updateCategoryOptions();
        });
    });
    
    form.addEventListener('submit', handleSubmit);
    filterCategorySelect.addEventListener('change', renderTransactions);
    exportBtn.addEventListener('click', exportToCSV);
}

// Update category dropdown based on type
function updateCategoryOptions() {
    const categories = currentType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    categorySelect.innerHTML = '<option value="">Select category</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = `${cat.icon} ${cat.label}`;
        categorySelect.appendChild(option);
    });
}

// Update filter dropdown
function updateFilterOptions() {
    const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
    filterCategorySelect.innerHTML = '<option value="">All Categories</option>';
    allCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = `${cat.icon} ${cat.label}`;
        filterCategorySelect.appendChild(option);
    });
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now().toString(),
        type: currentType,
        amount: parseFloat(amountInput.value),
        category: categorySelect.value,
        date: dateInput.value,
        description: descriptionInput.value || ''
    };
    
    transactions.unshift(transaction);
    saveTransactions();
    render();
    
    // Reset form
    amountInput.value = '';
    categorySelect.value = '';
    descriptionInput.value = '';
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    render();
}

// Save to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Calculate stats
function getStats() {
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    return {
        income,
        expenses,
        balance: income - expenses
    };
}

// Get category summary for expenses
function getCategorySummary() {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const summary = {};
    
    expenseTransactions.forEach(t => {
        if (!summary[t.category]) {
            summary[t.category] = 0;
        }
        summary[t.category] += t.amount;
    });
    
    return Object.entries(summary).map(([category, amount]) => ({
        category,
        amount,
        label: getCategoryLabel(category)
    }));
}

// Get monthly summary
function getMonthlySummary() {
    const monthlyData = {};
    
    transactions.forEach(t => {
        const month = t.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expenses: 0 };
        }
        if (t.type === 'income') {
            monthlyData[month].income += t.amount;
        } else {
            monthlyData[month].expenses += t.amount;
        }
    });
    
    return Object.entries(monthlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([month, data]) => ({
            month: formatMonth(month),
            ...data
        }));
}

// Helper functions
function getCategoryLabel(value) {
    const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
    const cat = all.find(c => c.value === value);
    return cat ? cat.label : value;
}

function getCategoryIcon(value) {
    const all = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
    const cat = all.find(c => c.value === value);
    return cat ? cat.icon : '📦';
}

function formatMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
}


function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount);
}


function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}


// Render functions
function render() {
    renderStats();
    renderTransactions();
    renderCategoryChart();
    renderMonthlyChart();
}

function renderStats() {
    const stats = getStats();
    document.getElementById('totalIncome').textContent = formatCurrency(stats.income);
    document.getElementById('totalExpenses').textContent = formatCurrency(stats.expenses);
    document.getElementById('currentBalance').textContent = formatCurrency(stats.balance);
}

function renderTransactions() {
    const filterValue = filterCategorySelect.value;
    let filtered = transactions;
    
    if (filterValue) {
        filtered = transactions.filter(t => t.category === filterValue);
    }
    
    const container = document.getElementById('transactionsList');
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">No transactions yet. Add your first transaction above!</p>';
        return;
    }
    
    container.innerHTML = filtered.map(t => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-icon ${t.type}">
                    ${getCategoryIcon(t.category)}
                </div>
                <div class="transaction-details">
                    <h4>${getCategoryLabel(t.category)}</h4>
                    <p>${formatDate(t.date)}${t.description ? ' • ' + t.description : ''}</p>
                </div>
            </div>
            <div class="transaction-amount ${t.type}">
                <span>${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</span>
                <button class="btn btn-delete" onclick="deleteTransaction('${t.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function renderCategoryChart() {
    const data = getCategorySummary();
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const legendContainer = document.getElementById('categoryLegend');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    if (data.length === 0) {
        ctx.canvas.style.display = 'none';
        legendContainer.innerHTML = '<p class="no-data">No expense data to display</p>';
        return;
    }
    
    ctx.canvas.style.display = 'block';
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                data: data.map(d => d.amount),
                backgroundColor: data.map(d => CATEGORY_COLORS[d.category] || '#6b7280'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            cutout: '65%'
        }
    });
    
    // Render custom legend
    legendContainer.innerHTML = data.map(d => `
        <div class="legend-item">
            <div class="legend-color" style="background: ${CATEGORY_COLORS[d.category] || '#6b7280'}"></div>
            <span>${d.label}: ${formatCurrency(d.amount)}</span>
        </div>
    `).join('');
}

function renderMonthlyChart() {
    const data = getMonthlySummary();
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    if (data.length === 0) {
        ctx.canvas.parentElement.innerHTML = '<p class="no-data" style="padding: 3rem;">No monthly data to display</p>';
        return;
    }
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.month),
            datasets: [
                {
                    label: 'Income',
                    data: data.map(d => d.income),
                    backgroundColor: 'hsl(152, 69%, 31%)',
                    borderRadius: 4
                },
                {
                    label: 'Expenses',
                    data: data.map(d => d.expenses),
                    backgroundColor: 'hsl(350, 89%, 60%)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'hsl(214, 32%, 91%)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Export to CSV
function exportToCSV() {
    if (transactions.length === 0) {
        alert('No transactions to export!');
        return;
    }
    
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
    const rows = transactions.map(t => [
        t.date,
        t.type,
        getCategoryLabel(t.category),
        t.amount.toFixed(2),
        t.description || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finance-tracker-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Initialize on load
init();