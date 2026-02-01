/**
 * Main Application Script for Sales Management System
 * Handles core functionality, data management, and UI interactions
 */

// ==================== Data Storage Management ====================

class StorageManager {
    constructor() {
        this.prefix = CONFIG.storage.prefix;
    }

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     */
    save(key, data) {
        try {
            const fullKey = this.prefix + key;
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @returns {any} Stored data or null
     */
    load(key) {
        try {
            const fullKey = this.prefix + key;
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    /**
     * Clear all sales management data
     */
    clearAll() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
}

// ==================== Data Models ====================

class Invoice {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.number = data.number || this.generateInvoiceNumber();
        this.date = data.date || new Date().toISOString();
        this.dueDate = data.dueDate || this.calculateDueDate(30);
        this.customer = data.customer || {};
        this.items = data.items || [];
        this.subtotal = data.subtotal || 0;
        this.tax = data.tax || 0;
        this.total = data.total || 0;
        this.status = data.status || 'draft'; // draft, sent, paid, overdue, cancelled
        this.paymentMethod = data.paymentMethod || 'cash';
        this.paymentStatus = data.paymentStatus || 'unpaid'; // unpaid, partial, paid
        this.paidAmount = data.paidAmount || 0;
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    generateId() {
        return 'INV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${year}${month}-${random}`;
    }

    calculateDueDate(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    calculateTotals() {
        this.subtotal = this.items.reduce((sum, item) => {
            return sum + (item.quantity * item.price);
        }, 0);
        this.tax = this.subtotal * CONFIG.app.taxRate;
        this.total = this.subtotal + this.tax;
        return {
            subtotal: this.subtotal,
            tax: this.tax,
            total: this.total
        };
    }

    isOverdue() {
        const dueDate = new Date(this.dueDate);
        const today = new Date();
        return today > dueDate && this.paymentStatus !== 'paid';
    }

    getDaysOverdue() {
        if (!this.isOverdue()) return 0;
        const dueDate = new Date(this.dueDate);
        const today = new Date();
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
}

class Customer {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.email = data.email || '';
        this.phone = data.phone || '';
        this.address = data.address || '';
        this.company = data.company || '';
        this.taxId = data.taxId || '';
        this.totalPurchases = data.totalPurchases || 0;
        this.invoiceCount = data.invoiceCount || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    generateId() {
        return 'CUST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
}

class Quote {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.number = data.number || this.generateQuoteNumber();
        this.date = data.date || new Date().toISOString();
        this.validUntil = data.validUntil || this.calculateValidUntil(30);
        this.customer = data.customer || {};
        this.items = data.items || [];
        this.subtotal = data.subtotal || 0;
        this.tax = data.tax || 0;
        this.total = data.total || 0;
        this.status = data.status || 'draft'; // draft, sent, accepted, rejected, expired
        this.notes = data.notes || '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    generateId() {
        return 'QUO-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    generateQuoteNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `QUO-${year}${month}-${random}`;
    }

    calculateValidUntil(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    convertToInvoice() {
        return new Invoice({
            customer: this.customer,
            items: this.items,
            subtotal: this.subtotal,
            tax: this.tax,
            total: this.total,
            notes: `Converted from Quote ${this.number}`
        });
    }
}

// ==================== Application Controller ====================

class SalesApp {
    constructor() {
        this.storage = new StorageManager();
        this.invoices = this.loadInvoices();
        this.customers = this.loadCustomers();
        this.quotes = this.loadQuotes();
        this.currentLanguage = localStorage.getItem('preferred-language') || CONFIG.app.defaultLanguage;
        this.init();
    }

    init() {
        this.initializeSampleData();
        this.setupEventListeners();
        this.updateUI();
    }

    // ==================== Data Loading ====================

    loadInvoices() {
        return this.storage.load('invoices') || [];
    }

    loadCustomers() {
        return this.storage.load('customers') || [];
    }

    loadQuotes() {
        return this.storage.load('quotes') || [];
    }

    saveInvoices() {
        return this.storage.save('invoices', this.invoices);
    }

    saveCustomers() {
        return this.storage.save('customers', this.customers);
    }

    saveQuotes() {
        return this.storage.save('quotes', this.quotes);
    }

    // ==================== Sample Data Generation ====================

    initializeSampleData() {
        if (this.invoices.length === 0) {
            this.generateSampleData();
        }
    }

    generateSampleData() {
        // Generate sample customers
        const sampleCustomers = [
            { name: 'أحمد محمد', email: 'ahmed@example.com', phone: '0555123456', company: 'شركة النور', address: 'الجزائر العاصمة' },
            { name: 'فاطمة علي', email: 'fatima@example.com', phone: '0666234567', company: 'مؤسسة الأمل', address: 'وهران' },
            { name: 'محمد حسن', email: 'mohamed@example.com', phone: '0777345678', company: 'شركة الفجر', address: 'قسنطينة' },
            { name: 'سارة أحمد', email: 'sara@example.com', phone: '0555456789', company: 'مكتب الريادة', address: 'عنابة' },
            { name: 'يوسف إبراهيم', email: 'youssef@example.com', phone: '0666567890', company: 'شركة التقدم', address: 'سطيف' }
        ];

        sampleCustomers.forEach(data => {
            const customer = new Customer(data);
            this.customers.push(customer);
        });

        // Generate sample invoices
        const statuses = ['paid', 'unpaid', 'overdue', 'partial'];
        const paymentMethods = ['cash', 'bank_transfer', 'stripe', 'paypal'];

        for (let i = 0; i < 15; i++) {
            const customer = this.customers[Math.floor(Math.random() * this.customers.length)];
            const itemCount = Math.floor(Math.random() * 5) + 1;
            const items = [];

            for (let j = 0; j < itemCount; j++) {
                items.push({
                    description: `منتج ${j + 1}`,
                    quantity: Math.floor(Math.random() * 10) + 1,
                    price: Math.floor(Math.random() * 10000) + 1000
                });
            }

            const invoice = new Invoice({
                customer: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    address: customer.address
                },
                items: items,
                status: 'sent',
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                paymentStatus: statuses[Math.floor(Math.random() * statuses.length)]
            });

            // Set date in the past
            const daysAgo = Math.floor(Math.random() * 90);
            const invoiceDate = new Date();
            invoiceDate.setDate(invoiceDate.getDate() - daysAgo);
            invoice.date = invoiceDate.toISOString();
            invoice.createdAt = invoiceDate.toISOString();

            invoice.calculateTotals();

            // Set payment amount
            if (invoice.paymentStatus === 'paid') {
                invoice.paidAmount = invoice.total;
            } else if (invoice.paymentStatus === 'partial') {
                invoice.paidAmount = invoice.total * (Math.random() * 0.5 + 0.2);
            }

            this.invoices.push(invoice);
        }

        // Save data
        this.saveCustomers();
        this.saveInvoices();
    }

    // ==================== Event Listeners ====================

    setupEventListeners() {
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    // ==================== UI Updates ====================

    updateUI() {
        // This will be called to refresh the UI after data changes
        if (typeof window.updateDashboard === 'function') {
            window.updateDashboard();
        }
    }

    // ==================== CRUD Operations ====================

    addInvoice(invoiceData) {
        try {
            const invoice = new Invoice(invoiceData);
            invoice.calculateTotals();
            this.invoices.push(invoice);
            this.saveInvoices();
            this.updateUI();
            return { success: true, invoice };
        } catch (error) {
            console.error('Error adding invoice:', error);
            return { success: false, error: error.message };
        }
    }

    updateInvoice(id, updates) {
        try {
            const index = this.invoices.findIndex(inv => inv.id === id);
            if (index === -1) {
                throw new Error('Invoice not found');
            }
            this.invoices[index] = { ...this.invoices[index], ...updates };
            this.invoices[index].updatedAt = new Date().toISOString();
            if (this.invoices[index].items) {
                const invoice = new Invoice(this.invoices[index]);
                invoice.calculateTotals();
                this.invoices[index] = invoice;
            }
            this.saveInvoices();
            this.updateUI();
            return { success: true, invoice: this.invoices[index] };
        } catch (error) {
            console.error('Error updating invoice:', error);
            return { success: false, error: error.message };
        }
    }

    deleteInvoice(id) {
        try {
            const index = this.invoices.findIndex(inv => inv.id === id);
            if (index === -1) {
                throw new Error('Invoice not found');
            }
            this.invoices.splice(index, 1);
            this.saveInvoices();
            this.updateUI();
            return { success: true };
        } catch (error) {
            console.error('Error deleting invoice:', error);
            return { success: false, error: error.message };
        }
    }

    getInvoice(id) {
        return this.invoices.find(inv => inv.id === id);
    }

    addCustomer(customerData) {
        try {
            const customer = new Customer(customerData);
            this.customers.push(customer);
            this.saveCustomers();
            return { success: true, customer };
        } catch (error) {
            console.error('Error adding customer:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== Utility Functions ====================

    formatCurrency(amount) {
        return new Intl.NumberFormat('ar-DZ', {
            style: 'currency',
            currency: CONFIG.reports.defaultCurrency
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-DZ');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// ==================== Initialize Application ====================

let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new SalesApp();
    window.salesApp = app; // Make available globally
});
