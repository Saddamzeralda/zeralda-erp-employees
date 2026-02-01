/**
 * Payments Module - Payment Processing and Tracking
 * Handles multiple payment methods including Stripe and PayPal
 */

class PaymentsManager {
    constructor(app) {
        this.app = app;
        this.stripe = null;
        this.paypal = null;
        this.init();
    }

    /**
     * Initialize payment gateways
     */
    init() {
        this.initializeStripe();
        this.initializePayPal();
    }

    /**
     * Initialize Stripe
     */
    initializeStripe() {
        if (CONFIG.payments.stripe.enabled && typeof Stripe !== 'undefined') {
            try {
                this.stripe = Stripe(CONFIG.payments.stripe.publishableKey);
                console.log('Stripe initialized successfully');
            } catch (error) {
                console.error('Error initializing Stripe:', error);
            }
        }
    }

    /**
     * Initialize PayPal
     */
    initializePayPal() {
        if (CONFIG.payments.paypal.enabled && typeof paypal !== 'undefined') {
            try {
                // PayPal SDK initialization would go here
                console.log('PayPal initialized successfully');
            } catch (error) {
                console.error('Error initializing PayPal:', error);
            }
        }
    }

    /**
     * Process payment for an invoice
     * @param {string} invoiceId - Invoice ID
     * @param {string} method - Payment method
     * @param {number} amount - Amount to pay
     */
    async processPayment(invoiceId, method, amount) {
        try {
            const invoice = this.app.getInvoice(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            const remainingAmount = invoice.total - invoice.paidAmount;
            if (amount > remainingAmount) {
                throw new Error('Amount exceeds remaining balance');
            }

            let result;

            switch (method) {
                case 'cash':
                    result = await this.processCashPayment(invoice, amount);
                    break;
                case 'bank_transfer':
                    result = await this.processBankTransfer(invoice, amount);
                    break;
                case 'stripe':
                    result = await this.processStripePayment(invoice, amount);
                    break;
                case 'paypal':
                    result = await this.processPayPalPayment(invoice, amount);
                    break;
                default:
                    throw new Error('Invalid payment method');
            }

            if (result.success) {
                // Update invoice
                this.updateInvoicePayment(invoiceId, amount, method, result.transactionId);
                this.app.showNotification('تم تسجيل الدفع بنجاح', 'success');
            }

            return result;
        } catch (error) {
            console.error('Error processing payment:', error);
            this.app.showNotification(error.message || 'خطأ في معالجة الدفع', 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Process cash payment
     * @param {Object} invoice - Invoice object
     * @param {number} amount - Payment amount
     */
    async processCashPayment(invoice, amount) {
        // Simulate cash payment processing
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    method: 'cash',
                    transactionId: this.generateTransactionId('CASH'),
                    amount: amount,
                    timestamp: new Date().toISOString()
                });
            }, 500);
        });
    }

    /**
     * Process bank transfer payment
     * @param {Object} invoice - Invoice object
     * @param {number} amount - Payment amount
     */
    async processBankTransfer(invoice, amount) {
        // Simulate bank transfer processing
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    method: 'bank_transfer',
                    transactionId: this.generateTransactionId('BANK'),
                    amount: amount,
                    timestamp: new Date().toISOString()
                });
            }, 500);
        });
    }

    /**
     * Process Stripe payment
     * @param {Object} invoice - Invoice object
     * @param {number} amount - Payment amount
     */
    async processStripePayment(invoice, amount) {
        if (!this.stripe) {
            return {
                success: false,
                error: 'Stripe is not configured'
            };
        }

        try {
            // In a real implementation, this would:
            // 1. Create a payment intent on the server
            // 2. Confirm the payment with Stripe.js
            // 3. Handle 3D Secure if required
            
            // Simulated response for UI demo
            return {
                success: true,
                method: 'stripe',
                transactionId: this.generateTransactionId('STRIPE'),
                amount: amount,
                timestamp: new Date().toISOString(),
                note: 'This is a simulated Stripe payment. Integrate with your backend API for real processing.'
            };
        } catch (error) {
            console.error('Stripe payment error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process PayPal payment
     * @param {Object} invoice - Invoice object
     * @param {number} amount - Payment amount
     */
    async processPayPalPayment(invoice, amount) {
        if (!CONFIG.payments.paypal.enabled) {
            return {
                success: false,
                error: 'PayPal is not configured'
            };
        }

        try {
            // In a real implementation, this would:
            // 1. Create an order with PayPal SDK
            // 2. Show PayPal payment window
            // 3. Capture the payment after approval
            
            // Simulated response for UI demo
            return {
                success: true,
                method: 'paypal',
                transactionId: this.generateTransactionId('PAYPAL'),
                amount: amount,
                timestamp: new Date().toISOString(),
                note: 'This is a simulated PayPal payment. Integrate with PayPal SDK for real processing.'
            };
        } catch (error) {
            console.error('PayPal payment error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update invoice with payment information
     * @param {string} invoiceId - Invoice ID
     * @param {number} amount - Payment amount
     * @param {string} method - Payment method
     * @param {string} transactionId - Transaction ID
     */
    updateInvoicePayment(invoiceId, amount, method, transactionId) {
        const invoice = this.app.getInvoice(invoiceId);
        if (!invoice) return;

        // Update paid amount
        invoice.paidAmount += amount;
        invoice.paymentMethod = method;

        // Update payment status
        if (invoice.paidAmount >= invoice.total) {
            invoice.paymentStatus = 'paid';
        } else if (invoice.paidAmount > 0) {
            invoice.paymentStatus = 'partial';
        }

        // Add transaction to invoice
        if (!invoice.transactions) {
            invoice.transactions = [];
        }

        invoice.transactions.push({
            id: transactionId,
            amount: amount,
            method: method,
            timestamp: new Date().toISOString(),
            status: 'completed'
        });

        // Save updated invoice
        this.app.updateInvoice(invoiceId, invoice);

        // Record payment in payment history
        this.recordPayment({
            invoiceId: invoiceId,
            invoiceNumber: invoice.number,
            customerId: invoice.customer.id,
            customerName: invoice.customer.name,
            amount: amount,
            method: method,
            transactionId: transactionId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Record payment in history
     * @param {Object} payment - Payment data
     */
    recordPayment(payment) {
        const payments = this.app.storage.load('payments') || [];
        payments.push(payment);
        this.app.storage.save('payments', payments);
    }

    /**
     * Get payment history
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered payments
     */
    getPaymentHistory(filters = {}) {
        let payments = this.app.storage.load('payments') || [];

        if (filters.startDate) {
            payments = payments.filter(p => new Date(p.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            payments = payments.filter(p => new Date(p.timestamp) <= new Date(filters.endDate));
        }

        if (filters.method && filters.method !== 'all') {
            payments = payments.filter(p => p.method === filters.method);
        }

        if (filters.customerId) {
            payments = payments.filter(p => p.customerId === filters.customerId);
        }

        return payments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Get payment statistics
     * @returns {Object} Payment statistics
     */
    getPaymentStatistics() {
        const payments = this.app.storage.load('payments') || [];
        
        const stats = {
            total: payments.length,
            totalAmount: 0,
            byMethod: {
                cash: { count: 0, amount: 0 },
                bank_transfer: { count: 0, amount: 0 },
                stripe: { count: 0, amount: 0 },
                paypal: { count: 0, amount: 0 }
            },
            thisMonth: 0,
            thisMonthAmount: 0
        };

        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        payments.forEach(payment => {
            stats.totalAmount += payment.amount;

            if (stats.byMethod[payment.method]) {
                stats.byMethod[payment.method].count++;
                stats.byMethod[payment.method].amount += payment.amount;
            }

            if (new Date(payment.timestamp) >= thisMonth) {
                stats.thisMonth++;
                stats.thisMonthAmount += payment.amount;
            }
        });

        return stats;
    }

    /**
     * Generate transaction ID
     * @param {string} prefix - Prefix for transaction ID
     * @returns {string} Transaction ID
     */
    generateTransactionId(prefix = 'TXN') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Render payment form
     * @param {string} invoiceId - Invoice ID
     * @param {HTMLElement} container - Container element
     */
    renderPaymentForm(invoiceId, container) {
        const invoice = this.app.getInvoice(invoiceId);
        if (!invoice) return;

        const remainingAmount = invoice.total - invoice.paidAmount;

        container.innerHTML = `
            <div class="payment-form">
                <h3>تسجيل دفعة جديدة</h3>
                
                <div class="invoice-summary">
                    <div class="summary-row">
                        <span>الفاتورة:</span>
                        <strong>${invoice.number}</strong>
                    </div>
                    <div class="summary-row">
                        <span>العميل:</span>
                        <strong>${invoice.customer.name}</strong>
                    </div>
                    <div class="summary-row">
                        <span>المبلغ الإجمالي:</span>
                        <strong>${this.app.formatCurrency(invoice.total)}</strong>
                    </div>
                    <div class="summary-row">
                        <span>المبلغ المدفوع:</span>
                        <strong>${this.app.formatCurrency(invoice.paidAmount)}</strong>
                    </div>
                    <div class="summary-row highlight">
                        <span>المبلغ المتبقي:</span>
                        <strong>${this.app.formatCurrency(remainingAmount)}</strong>
                    </div>
                </div>

                <div class="form-group">
                    <label>طريقة الدفع</label>
                    <select id="paymentMethod" class="form-control">
                        <option value="cash">نقداً</option>
                        <option value="bank_transfer">تحويل بنكي</option>
                        <option value="stripe">Stripe</option>
                        <option value="paypal">PayPal</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>المبلغ</label>
                    <input type="number" id="paymentAmount" class="form-control" 
                           min="0" max="${remainingAmount}" value="${remainingAmount}"
                           step="0.01">
                </div>

                <div class="form-group">
                    <label>ملاحظات (اختياري)</label>
                    <textarea id="paymentNotes" class="form-control" rows="3"></textarea>
                </div>

                <div class="form-actions">
                    <button class="btn btn-primary" onclick="window.paymentsManager.submitPayment('${invoiceId}')">
                        <i class="fas fa-check"></i> تأكيد الدفع
                    </button>
                    <button class="btn btn-secondary" onclick="closePaymentModal()">
                        إلغاء
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Submit payment from form
     * @param {string} invoiceId - Invoice ID
     */
    async submitPayment(invoiceId) {
        const method = document.getElementById('paymentMethod')?.value;
        const amount = parseFloat(document.getElementById('paymentAmount')?.value);
        const notes = document.getElementById('paymentNotes')?.value;

        if (!method || !amount || amount <= 0) {
            this.app.showNotification('يرجى إدخال بيانات الدفع', 'error');
            return;
        }

        const result = await this.processPayment(invoiceId, method, amount);

        if (result.success) {
            // Close modal and refresh
            if (typeof closePaymentModal === 'function') {
                closePaymentModal();
            }
            if (window.dashboard) {
                window.dashboard.refresh();
            }
        }
    }

    /**
     * Render payment history table
     * @param {HTMLElement} container - Container element
     * @param {Object} filters - Filter options
     */
    renderPaymentHistory(container, filters = {}) {
        const payments = this.getPaymentHistory(filters);

        if (payments.length === 0) {
            container.innerHTML = '<div class="no-data"><i class="fas fa-inbox"></i><p>لا توجد مدفوعات</p></div>';
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>رقم المعاملة</th>
                        <th>الفاتورة</th>
                        <th>العميل</th>
                        <th>المبلغ</th>
                        <th>الطريقة</th>
                        <th>التاريخ</th>
                    </tr>
                </thead>
                <tbody>
                    ${payments.map(payment => `
                        <tr>
                            <td><code>${payment.transactionId}</code></td>
                            <td>${payment.invoiceNumber}</td>
                            <td>${payment.customerName}</td>
                            <td class="amount">${this.app.formatCurrency(payment.amount)}</td>
                            <td>
                                <span class="payment-method-badge ${payment.method}">
                                    <i class="fas fa-${this.getMethodIcon(payment.method)}"></i>
                                    ${this.getMethodLabel(payment.method)}
                                </span>
                            </td>
                            <td>${this.app.formatDate(payment.timestamp)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Get payment method icon
     */
    getMethodIcon(method) {
        const icons = {
            'cash': 'money-bill',
            'bank_transfer': 'university',
            'stripe': 'credit-card',
            'paypal': 'paypal'
        };
        return icons[method] || 'money-bill';
    }

    /**
     * Get payment method label
     */
    getMethodLabel(method) {
        const labels = {
            'cash': 'نقداً',
            'bank_transfer': 'تحويل بنكي',
            'stripe': 'Stripe',
            'paypal': 'PayPal'
        };
        return labels[method] || method;
    }

    /**
     * Generate payment report
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     */
    async generatePaymentReport(startDate, endDate) {
        const payments = this.getPaymentHistory({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);

        const element = document.createElement('div');
        element.style.cssText = 'position: absolute; left: -9999px; width: 210mm; padding: 20mm; background: white; direction: rtl;';
        
        element.innerHTML = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb;">تقرير المدفوعات</h1>
                    <p>${this.app.formatDate(startDate.toISOString())} - ${this.app.formatDate(endDate.toISOString())}</p>
                </div>

                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>الملخص</h3>
                    <p><strong>إجمالي المدفوعات:</strong> ${payments.length}</p>
                    <p><strong>إجمالي المبلغ:</strong> ${this.app.formatCurrency(totalAmount)}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="border: 1px solid #ddd; padding: 8px;">المعاملة</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">الفاتورة</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">العميل</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">المبلغ</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">الطريقة</th>
                            <th style="border: 1px solid #ddd; padding: 8px;">التاريخ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.map(p => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px;">${p.transactionId}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${p.invoiceNumber}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${p.customerName}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${this.app.formatCurrency(p.amount)}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${this.getMethodLabel(p.method)}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${this.app.formatDate(p.timestamp)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        document.body.appendChild(element);

        const opt = {
            margin: 10,
            filename: `payment-report-${startDate.toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(element).save();
        
        document.body.removeChild(element);
        
        this.app.showNotification('تم إنشاء تقرير المدفوعات بنجاح', 'success');
    }
}

// Make available globally
window.PaymentsManager = PaymentsManager;
