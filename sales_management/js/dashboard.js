/**
 * Dashboard Module - Dynamic Dashboard with KPIs and Charts
 * Displays real-time metrics, statistics, and interactive visualizations
 */

class Dashboard {
    constructor(app) {
        this.app = app;
        this.charts = {};
        this.refreshInterval = null;
    }

    /**
     * Initialize dashboard
     */
    init() {
        this.renderKPIs();
        this.renderCharts();
        this.setupAutoRefresh();
    }

    /**
     * Calculate Key Performance Indicators
     * @returns {Object} KPI data
     */
    calculateKPIs() {
        const invoices = this.app.invoices;
        const customers = this.app.customers;

        // Total sales
        const totalSales = invoices
            .filter(inv => inv.paymentStatus === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);

        // Total revenue (including partial payments)
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

        // Outstanding amount
        const outstandingAmount = invoices
            .filter(inv => inv.paymentStatus !== 'paid')
            .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

        // Overdue invoices
        const overdueInvoices = invoices.filter(inv => inv.isOverdue());
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

        // This month data
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const thisMonthInvoices = invoices.filter(inv => new Date(inv.date) >= thisMonth);
        const thisMonthSales = thisMonthInvoices
            .filter(inv => inv.paymentStatus === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);

        // Last month comparison
        const lastMonth = new Date(thisMonth);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const lastMonthInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            return invDate >= lastMonth && invDate < thisMonth;
        });
        const lastMonthSales = lastMonthInvoices
            .filter(inv => inv.paymentStatus === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);

        const salesGrowth = lastMonthSales > 0 
            ? ((thisMonthSales - lastMonthSales) / lastMonthSales * 100).toFixed(1)
            : 0;

        // New customers this month
        const newCustomers = customers.filter(cust => new Date(cust.createdAt) >= thisMonth).length;

        // Average invoice value
        const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid');
        const avgInvoiceValue = paidInvoices.length > 0
            ? totalSales / paidInvoices.length
            : 0;

        // Payment method distribution
        const paymentMethods = {};
        invoices.forEach(inv => {
            paymentMethods[inv.paymentMethod] = (paymentMethods[inv.paymentMethod] || 0) + 1;
        });

        return {
            totalSales,
            totalRevenue,
            outstandingAmount,
            overdueAmount,
            totalInvoices: invoices.length,
            paidInvoices: paidInvoices.length,
            unpaidInvoices: invoices.filter(inv => inv.paymentStatus === 'unpaid').length,
            overdueCount: overdueInvoices.length,
            totalCustomers: customers.length,
            newCustomers,
            thisMonthSales,
            lastMonthSales,
            salesGrowth,
            avgInvoiceValue,
            paymentMethods
        };
    }

    /**
     * Render KPI cards
     */
    renderKPIs() {
        const kpis = this.calculateKPIs();
        const container = document.getElementById('kpi-container');
        
        if (!container) return;

        container.innerHTML = `
            <!-- Total Sales -->
            <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="kpi-content">
                    <h3 class="kpi-title" data-ar="إجمالي المبيعات" data-en="Total Sales" data-fr="Ventes Totales">إجمالي المبيعات</h3>
                    <div class="kpi-value">${this.app.formatCurrency(kpis.totalSales)}</div>
                    <div class="kpi-change ${kpis.salesGrowth >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-arrow-${kpis.salesGrowth >= 0 ? 'up' : 'down'}"></i>
                        <span>${Math.abs(kpis.salesGrowth)}%</span>
                        <span class="kpi-period" data-ar="هذا الشهر" data-en="this month" data-fr="ce mois">هذا الشهر</span>
                    </div>
                </div>
            </div>

            <!-- Total Invoices -->
            <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <i class="fas fa-file-invoice"></i>
                </div>
                <div class="kpi-content">
                    <h3 class="kpi-title" data-ar="عدد الفواتير" data-en="Total Invoices" data-fr="Total Factures">عدد الفواتير</h3>
                    <div class="kpi-value">${kpis.totalInvoices}</div>
                    <div class="kpi-stats">
                        <span class="kpi-stat-item">
                            <i class="fas fa-check-circle" style="color: #10b981;"></i>
                            ${kpis.paidInvoices} <span data-ar="مدفوعة" data-en="Paid" data-fr="Payées">مدفوعة</span>
                        </span>
                        <span class="kpi-stat-item">
                            <i class="fas fa-clock" style="color: #f59e0b;"></i>
                            ${kpis.unpaidInvoices} <span data-ar="غير مدفوعة" data-en="Unpaid" data-fr="Impayées">غير مدفوعة</span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Outstanding Amount -->
            <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%);">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="kpi-content">
                    <h3 class="kpi-title" data-ar="المبالغ المستحقة" data-en="Outstanding Amount" data-fr="Montant Dû">المبالغ المستحقة</h3>
                    <div class="kpi-value">${this.app.formatCurrency(kpis.outstandingAmount)}</div>
                    <div class="kpi-detail">
                        <span data-ar="من" data-en="from" data-fr="de">من</span> ${kpis.unpaidInvoices} <span data-ar="فاتورة" data-en="invoices" data-fr="factures">فاتورة</span>
                    </div>
                </div>
            </div>

            <!-- Overdue Invoices -->
            <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                    <i class="fas fa-calendar-times"></i>
                </div>
                <div class="kpi-content">
                    <h3 class="kpi-title" data-ar="الفواتير المتأخرة" data-en="Overdue Invoices" data-fr="Factures En Retard">الفواتير المتأخرة</h3>
                    <div class="kpi-value">${kpis.overdueCount}</div>
                    <div class="kpi-amount" style="color: #ef4444;">
                        ${this.app.formatCurrency(kpis.overdueAmount)}
                    </div>
                </div>
            </div>

            <!-- Total Customers -->
            <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <i class="fas fa-users"></i>
                </div>
                <div class="kpi-content">
                    <h3 class="kpi-title" data-ar="إجمالي العملاء" data-en="Total Customers" data-fr="Total Clients">إجمالي العملاء</h3>
                    <div class="kpi-value">${kpis.totalCustomers}</div>
                    <div class="kpi-detail">
                        <i class="fas fa-plus-circle" style="color: #10b981;"></i>
                        ${kpis.newCustomers} <span data-ar="جديد هذا الشهر" data-en="new this month" data-fr="nouveaux ce mois">جديد هذا الشهر</span>
                    </div>
                </div>
            </div>

            <!-- Average Invoice Value -->
            <div class="kpi-card">
                <div class="kpi-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="kpi-content">
                    <h3 class="kpi-title" data-ar="متوسط قيمة الفاتورة" data-en="Average Invoice" data-fr="Facture Moyenne">متوسط قيمة الفاتورة</h3>
                    <div class="kpi-value">${this.app.formatCurrency(kpis.avgInvoiceValue)}</div>
                    <div class="kpi-detail">
                        <span data-ar="من" data-en="from" data-fr="de">من</span> ${kpis.paidInvoices} <span data-ar="فاتورة مدفوعة" data-en="paid invoices" data-fr="factures payées">فاتورة مدفوعة</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render all charts
     */
    renderCharts() {
        this.renderSalesChart();
        this.renderPaymentMethodsChart();
        this.renderMonthlyRevenueChart();
        this.renderInvoiceStatusChart();
    }

    /**
     * Render sales growth chart
     */
    renderSalesChart() {
        const canvas = document.getElementById('salesChart');
        if (!canvas) return;

        // Get last 6 months data
        const monthsData = this.getMonthlyData(6);

        // Destroy existing chart
        if (this.charts.sales) {
            this.charts.sales.destroy();
        }

        this.charts.sales = new Chart(canvas, {
            type: 'line',
            data: {
                labels: monthsData.labels,
                datasets: [{
                    label: 'المبيعات',
                    data: monthsData.sales,
                    borderColor: CONFIG.dashboard.chartColors[0],
                    backgroundColor: CONFIG.dashboard.chartColors[0] + '20',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return this.app.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return this.app.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render payment methods distribution chart
     */
    renderPaymentMethodsChart() {
        const canvas = document.getElementById('paymentMethodsChart');
        if (!canvas) return;

        const kpis = this.calculateKPIs();
        const methods = kpis.paymentMethods;

        const labels = {
            cash: 'نقداً',
            bank_transfer: 'تحويل بنكي',
            stripe: 'Stripe',
            paypal: 'PayPal'
        };

        // Destroy existing chart
        if (this.charts.paymentMethods) {
            this.charts.paymentMethods.destroy();
        }

        this.charts.paymentMethods = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(methods).map(key => labels[key] || key),
                datasets: [{
                    data: Object.values(methods),
                    backgroundColor: CONFIG.dashboard.chartColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Render monthly revenue chart
     */
    renderMonthlyRevenueChart() {
        const canvas = document.getElementById('monthlyRevenueChart');
        if (!canvas) return;

        const monthsData = this.getMonthlyData(12);

        // Destroy existing chart
        if (this.charts.monthlyRevenue) {
            this.charts.monthlyRevenue.destroy();
        }

        this.charts.monthlyRevenue = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: monthsData.labels,
                datasets: [{
                    label: 'الإيرادات الشهرية',
                    data: monthsData.revenue,
                    backgroundColor: CONFIG.dashboard.chartColors[1]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return this.app.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return this.app.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Render invoice status distribution chart
     */
    renderInvoiceStatusChart() {
        const canvas = document.getElementById('invoiceStatusChart');
        if (!canvas) return;

        const kpis = this.calculateKPIs();
        const statusData = {
            'مدفوعة': kpis.paidInvoices,
            'غير مدفوعة': kpis.unpaidInvoices,
            'متأخرة': kpis.overdueCount
        };

        // Destroy existing chart
        if (this.charts.invoiceStatus) {
            this.charts.invoiceStatus.destroy();
        }

        this.charts.invoiceStatus = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: Object.keys(statusData),
                datasets: [{
                    data: Object.values(statusData),
                    backgroundColor: [
                        CONFIG.dashboard.chartColors[1], // Green for paid
                        CONFIG.dashboard.chartColors[2], // Orange for unpaid
                        CONFIG.dashboard.chartColors[3]  // Red for overdue
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * Get monthly data for charts
     * @param {number} months - Number of months to retrieve
     * @returns {Object} Monthly data with labels, sales, and revenue
     */
    getMonthlyData(months) {
        const data = {
            labels: [],
            sales: [],
            revenue: []
        };

        const monthNames = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth();
            const year = date.getFullYear();

            data.labels.push(`${monthNames[month]} ${year}`);

            // Calculate sales and revenue for this month
            const monthInvoices = this.app.invoices.filter(inv => {
                const invDate = new Date(inv.date);
                return invDate.getMonth() === month && invDate.getFullYear() === year;
            });

            const monthSales = monthInvoices
                .filter(inv => inv.paymentStatus === 'paid')
                .reduce((sum, inv) => sum + inv.total, 0);

            const monthRevenue = monthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

            data.sales.push(monthSales);
            data.revenue.push(monthRevenue);
        }

        return data;
    }

    /**
     * Setup auto-refresh for dashboard
     */
    setupAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, CONFIG.dashboard.refreshInterval);
    }

    /**
     * Refresh dashboard data
     */
    refresh() {
        this.renderKPIs();
        this.renderCharts();
    }

    /**
     * Destroy dashboard and cleanup
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });

        this.charts = {};
    }
}

// Make updateDashboard available globally
window.updateDashboard = function() {
    if (window.dashboard) {
        window.dashboard.refresh();
    }
};

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.salesApp) {
        window.dashboard = new Dashboard(window.salesApp);
        window.dashboard.init();
    }
});
