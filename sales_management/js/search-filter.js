/**
 * Search and Filter Module
 * Advanced search, filtering, and sorting functionality
 */

class SearchFilter {
    constructor(app) {
        this.app = app;
        this.currentFilters = {};
        this.savedSearches = this.loadSavedSearches();
        this.debounceTimer = null;
    }

    /**
     * Initialize search and filter functionality
     */
    init() {
        this.setupSearchHandlers();
        this.setupFilterHandlers();
        this.loadSavedSearches();
    }

    /**
     * Setup search input handlers with debouncing
     */
    setupSearchHandlers() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.debounceSearch(e.target.value);
            });
        }
    }

    /**
     * Debounce search to avoid excessive filtering
     * @param {string} query - Search query
     */
    debounceSearch(query) {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.performSearch(query);
        }, CONFIG.search.debounceTime);
    }

    /**
     * Perform search on invoices and customers
     * @param {string} query - Search query
     */
    performSearch(query) {
        if (query.length < CONFIG.search.minSearchLength && query.length > 0) {
            return;
        }

        const results = {
            invoices: [],
            customers: []
        };

        if (query.length === 0) {
            results.invoices = this.app.invoices;
            results.customers = this.app.customers;
        } else {
            const lowerQuery = query.toLowerCase();

            // Search invoices
            results.invoices = this.app.invoices.filter(inv => {
                return inv.number.toLowerCase().includes(lowerQuery) ||
                       inv.customer.name.toLowerCase().includes(lowerQuery) ||
                       inv.customer.email.toLowerCase().includes(lowerQuery) ||
                       inv.customer.phone.includes(query);
            });

            // Search customers
            results.customers = this.app.customers.filter(cust => {
                return cust.name.toLowerCase().includes(lowerQuery) ||
                       cust.email.toLowerCase().includes(lowerQuery) ||
                       cust.phone.includes(query) ||
                       (cust.company && cust.company.toLowerCase().includes(lowerQuery));
            });
        }

        this.displaySearchResults(results);
    }

    /**
     * Setup filter handlers
     */
    setupFilterHandlers() {
        // Date range filter
        const startDate = document.getElementById('filterStartDate');
        const endDate = document.getElementById('filterEndDate');
        
        if (startDate) {
            startDate.addEventListener('change', () => this.applyFilters());
        }
        if (endDate) {
            endDate.addEventListener('change', () => this.applyFilters());
        }

        // Status filter
        const statusFilter = document.getElementById('filterStatus');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        // Payment method filter
        const paymentFilter = document.getElementById('filterPaymentMethod');
        if (paymentFilter) {
            paymentFilter.addEventListener('change', () => this.applyFilters());
        }

        // Price range filter
        const minPrice = document.getElementById('filterMinPrice');
        const maxPrice = document.getElementById('filterMaxPrice');
        
        if (minPrice) {
            minPrice.addEventListener('change', () => this.applyFilters());
        }
        if (maxPrice) {
            maxPrice.addEventListener('change', () => this.applyFilters());
        }

        // Customer filter
        const customerFilter = document.getElementById('filterCustomer');
        if (customerFilter) {
            customerFilter.addEventListener('change', () => this.applyFilters());
        }
    }

    /**
     * Apply all active filters
     */
    applyFilters() {
        let filtered = [...this.app.invoices];

        // Get filter values
        const startDate = document.getElementById('filterStartDate')?.value;
        const endDate = document.getElementById('filterEndDate')?.value;
        const status = document.getElementById('filterStatus')?.value;
        const paymentMethod = document.getElementById('filterPaymentMethod')?.value;
        const minPrice = parseFloat(document.getElementById('filterMinPrice')?.value) || 0;
        const maxPrice = parseFloat(document.getElementById('filterMaxPrice')?.value) || Infinity;
        const customer = document.getElementById('filterCustomer')?.value;

        // Apply date filter
        if (startDate) {
            filtered = filtered.filter(inv => new Date(inv.date) >= new Date(startDate));
        }
        if (endDate) {
            filtered = filtered.filter(inv => new Date(inv.date) <= new Date(endDate));
        }

        // Apply status filter
        if (status && status !== 'all') {
            filtered = filtered.filter(inv => inv.paymentStatus === status);
        }

        // Apply payment method filter
        if (paymentMethod && paymentMethod !== 'all') {
            filtered = filtered.filter(inv => inv.paymentMethod === paymentMethod);
        }

        // Apply price range filter
        filtered = filtered.filter(inv => inv.total >= minPrice && inv.total <= maxPrice);

        // Apply customer filter
        if (customer && customer !== 'all') {
            filtered = filtered.filter(inv => inv.customer.id === customer);
        }

        // Store current filters
        this.currentFilters = {
            startDate,
            endDate,
            status,
            paymentMethod,
            minPrice,
            maxPrice,
            customer
        };

        this.displayFilteredResults(filtered);
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        // Reset filter inputs
        const filterInputs = [
            'filterStartDate',
            'filterEndDate',
            'filterStatus',
            'filterPaymentMethod',
            'filterMinPrice',
            'filterMaxPrice',
            'filterCustomer'
        ];

        filterInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.tagName === 'SELECT') {
                    element.value = 'all';
                } else {
                    element.value = '';
                }
            }
        });

        this.currentFilters = {};
        this.displayFilteredResults(this.app.invoices);
    }

    /**
     * Save current search criteria
     * @param {string} name - Name for the saved search
     */
    saveSearch(name) {
        try {
            const searchCriteria = {
                name,
                filters: { ...this.currentFilters },
                createdAt: new Date().toISOString()
            };

            this.savedSearches.push(searchCriteria);
            this.app.storage.save('saved_searches', this.savedSearches);
            
            this.app.showNotification('تم حفظ معايير البحث بنجاح', 'success');
            this.renderSavedSearches();
            
            return { success: true };
        } catch (error) {
            console.error('Error saving search:', error);
            this.app.showNotification('خطأ في حفظ معايير البحث', 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Load saved searches
     */
    loadSavedSearches() {
        return this.app.storage.load('saved_searches') || [];
    }

    /**
     * Apply a saved search
     * @param {number} index - Index of saved search
     */
    applySavedSearch(index) {
        const search = this.savedSearches[index];
        if (!search) return;

        const filters = search.filters;

        // Apply saved filters to inputs
        if (filters.startDate) document.getElementById('filterStartDate').value = filters.startDate;
        if (filters.endDate) document.getElementById('filterEndDate').value = filters.endDate;
        if (filters.status) document.getElementById('filterStatus').value = filters.status;
        if (filters.paymentMethod) document.getElementById('filterPaymentMethod').value = filters.paymentMethod;
        if (filters.minPrice) document.getElementById('filterMinPrice').value = filters.minPrice;
        if (filters.maxPrice) document.getElementById('filterMaxPrice').value = filters.maxPrice;
        if (filters.customer) document.getElementById('filterCustomer').value = filters.customer;

        this.applyFilters();
        this.app.showNotification(`تم تطبيق البحث: ${search.name}`, 'success');
    }

    /**
     * Delete a saved search
     * @param {number} index - Index of saved search
     */
    deleteSavedSearch(index) {
        try {
            this.savedSearches.splice(index, 1);
            this.app.storage.save('saved_searches', this.savedSearches);
            this.renderSavedSearches();
            this.app.showNotification('تم حذف البحث المحفوظ', 'success');
            return { success: true };
        } catch (error) {
            console.error('Error deleting saved search:', error);
            this.app.showNotification('خطأ في حذف البحث', 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Render saved searches list
     */
    renderSavedSearches() {
        const container = document.getElementById('savedSearchesList');
        if (!container) return;

        if (this.savedSearches.length === 0) {
            container.innerHTML = '<p class="no-data">لا توجد عمليات بحث محفوظة</p>';
            return;
        }

        container.innerHTML = this.savedSearches.map((search, index) => `
            <div class="saved-search-item">
                <div class="saved-search-info">
                    <h4>${search.name}</h4>
                    <p class="saved-search-date">${this.app.formatDate(search.createdAt)}</p>
                </div>
                <div class="saved-search-actions">
                    <button class="btn-icon" onclick="window.searchFilter.applySavedSearch(${index})" title="تطبيق">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="window.searchFilter.deleteSavedSearch(${index})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Sort invoices
     * @param {string} field - Field to sort by
     * @param {string} direction - 'asc' or 'desc'
     */
    sortInvoices(field, direction = 'asc') {
        const sorted = [...this.app.invoices].sort((a, b) => {
            let aVal, bVal;

            switch (field) {
                case 'number':
                    aVal = a.number;
                    bVal = b.number;
                    break;
                case 'date':
                    aVal = new Date(a.date);
                    bVal = new Date(b.date);
                    break;
                case 'customer':
                    aVal = a.customer.name.toLowerCase();
                    bVal = b.customer.name.toLowerCase();
                    break;
                case 'total':
                    aVal = a.total;
                    bVal = b.total;
                    break;
                case 'status':
                    aVal = a.paymentStatus;
                    bVal = b.paymentStatus;
                    break;
                default:
                    return 0;
            }

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.displayFilteredResults(sorted);
    }

    /**
     * Display search results
     * @param {Object} results - Search results
     */
    displaySearchResults(results) {
        // Update invoices list
        this.displayFilteredResults(results.invoices);
        
        // Update search results count
        const countElement = document.getElementById('searchResultsCount');
        if (countElement) {
            countElement.textContent = `تم العثور على ${results.invoices.length} فاتورة`;
        }
    }

    /**
     * Display filtered results
     * @param {Array} invoices - Filtered invoices
     */
    displayFilteredResults(invoices) {
        const container = document.getElementById('invoicesListContainer');
        if (!container) return;

        if (invoices.length === 0) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-inbox"></i><p>لا توجد فواتير</p></div>';
            return;
        }

        container.innerHTML = invoices.map(inv => `
            <div class="invoice-card">
                <div class="invoice-header">
                    <div class="invoice-number">
                        <i class="fas fa-file-invoice"></i>
                        ${inv.number}
                    </div>
                    <div class="invoice-status status-${inv.paymentStatus}">
                        ${this.getStatusLabel(inv.paymentStatus)}
                    </div>
                </div>
                <div class="invoice-body">
                    <div class="invoice-info">
                        <div class="info-row">
                            <i class="fas fa-user"></i>
                            <span>${inv.customer.name}</span>
                        </div>
                        <div class="info-row">
                            <i class="fas fa-calendar"></i>
                            <span>${this.app.formatDate(inv.date)}</span>
                        </div>
                        <div class="info-row">
                            <i class="fas fa-money-bill"></i>
                            <span class="invoice-total">${this.app.formatCurrency(inv.total)}</span>
                        </div>
                    </div>
                </div>
                <div class="invoice-actions">
                    <button class="btn-sm btn-primary" onclick="viewInvoice('${inv.id}')">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                    <button class="btn-sm btn-success" onclick="window.reportsManager.generateInvoicePDF('${inv.id}')">
                        <i class="fas fa-file-pdf"></i> PDF
                    </button>
                    ${inv.isOverdue() ? `
                        <button class="btn-sm btn-warning" onclick="sendReminder('${inv.id}')">
                            <i class="fas fa-bell"></i> تذكير
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Update results count
        const countElement = document.getElementById('filterResultsCount');
        if (countElement) {
            countElement.textContent = `عرض ${invoices.length} من ${this.app.invoices.length} فاتورة`;
        }
    }

    /**
     * Get status label
     */
    getStatusLabel(status) {
        const labels = {
            'paid': 'مدفوعة',
            'unpaid': 'غير مدفوعة',
            'partial': 'مدفوعة جزئياً',
            'overdue': 'متأخرة'
        };
        return labels[status] || status;
    }

    /**
     * Export filtered results
     * @param {string} format - 'excel' or 'csv'
     */
    exportFiltered(format) {
        // This would use the currently filtered invoices
        const filtered = this.getFilteredInvoices();
        
        if (format === 'excel') {
            this.exportToExcel(filtered);
        } else if (format === 'csv') {
            this.exportToCSV(filtered);
        }
    }

    /**
     * Get currently filtered invoices
     */
    getFilteredInvoices() {
        // Return currently displayed invoices
        // This is a simplified version
        return this.app.invoices;
    }
}

// Make available globally
window.SearchFilter = SearchFilter;
