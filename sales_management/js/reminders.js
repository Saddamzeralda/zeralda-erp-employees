/**
 * Reminders Module - Invoice Reminder System
 * Handles overdue invoice tracking, automatic reminders, and notifications
 */

class RemindersManager {
    constructor(app) {
        this.app = app;
        this.reminders = this.loadReminders();
        this.checkInterval = null;
    }

    /**
     * Initialize reminders system
     */
    init() {
        this.startAutoCheck();
        this.renderOverdueInvoices();
    }

    /**
     * Load saved reminders
     */
    loadReminders() {
        return this.app.storage.load('reminders') || [];
    }

    /**
     * Save reminders
     */
    saveReminders() {
        return this.app.storage.save('reminders', this.reminders);
    }

    /**
     * Start automatic checking for reminders
     */
    startAutoCheck() {
        // Check every hour
        this.checkInterval = setInterval(() => {
            this.checkAndSendReminders();
        }, 3600000);

        // Initial check
        this.checkAndSendReminders();
    }

    /**
     * Stop automatic checking
     */
    stopAutoCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    /**
     * Check and send automatic reminders
     */
    checkAndSendReminders() {
        if (!CONFIG.reminders.autoSend) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        this.app.invoices.forEach(invoice => {
            if (invoice.paymentStatus === 'paid') return;

            const dueDate = new Date(invoice.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Check if reminder should be sent
            let shouldSend = false;

            // Before due date reminders
            if (diffDays > 0 && CONFIG.reminders.daysBeforeDue.includes(diffDays)) {
                shouldSend = true;
            }

            // After due date reminders
            if (diffDays < 0) {
                const daysOverdue = Math.abs(diffDays);
                if (CONFIG.reminders.daysAfterDue.includes(daysOverdue)) {
                    shouldSend = true;
                }
            }

            if (shouldSend) {
                // Check if reminder was already sent today
                const lastReminder = this.getLastReminder(invoice.id);
                if (!lastReminder || !this.isSameDay(new Date(lastReminder.sentAt), today)) {
                    this.sendReminder(invoice.id, 'auto');
                }
            }
        });
    }

    /**
     * Send reminder for an invoice
     * @param {string} invoiceId - Invoice ID
     * @param {string} type - 'auto' or 'manual'
     */
    async sendReminder(invoiceId, type = 'manual') {
        try {
            const invoice = this.app.getInvoice(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            if (invoice.paymentStatus === 'paid') {
                throw new Error('Invoice is already paid');
            }

            // Create reminder record
            const reminder = {
                id: this.generateReminderId(),
                invoiceId: invoice.id,
                invoiceNumber: invoice.number,
                customerName: invoice.customer.name,
                customerEmail: invoice.customer.email,
                customerPhone: invoice.customer.phone,
                amount: invoice.total - invoice.paidAmount,
                dueDate: invoice.dueDate,
                type: type,
                method: this.determineReminderMethod(invoice),
                status: 'sent',
                sentAt: new Date().toISOString(),
                message: this.generateReminderMessage(invoice)
            };

            // Save reminder
            this.reminders.push(reminder);
            this.saveReminders();

            // Send notification (simulation)
            await this.deliverReminder(reminder);

            this.app.showNotification('تم إرسال التذكير بنجاح', 'success');
            this.renderReminders();

            return { success: true, reminder };
        } catch (error) {
            console.error('Error sending reminder:', error);
            this.app.showNotification(error.message || 'خطأ في إرسال التذكير', 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Deliver reminder via selected method
     * @param {Object} reminder - Reminder object
     */
    async deliverReminder(reminder) {
        // Simulate sending reminder
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Reminder delivered:', reminder);
                resolve();
            }, 500);
        });

        // In a real application, this would integrate with email/WhatsApp APIs
    }

    /**
     * Determine best reminder method for invoice
     * @param {Object} invoice - Invoice object
     * @returns {string} Reminder method
     */
    determineReminderMethod(invoice) {
        if (CONFIG.notifications.email.enabled && invoice.customer.email) {
            return 'email';
        } else if (CONFIG.notifications.whatsapp.enabled && invoice.customer.phone) {
            return 'whatsapp';
        } else {
            return 'system';
        }
    }

    /**
     * Generate reminder message
     * @param {Object} invoice - Invoice object
     * @returns {string} Reminder message
     */
    generateReminderMessage(invoice) {
        const dueDate = new Date(invoice.dueDate);
        const today = new Date();
        const isOverdue = today > dueDate;
        const amount = this.app.formatCurrency(invoice.total - invoice.paidAmount);

        if (isOverdue) {
            const daysOverdue = invoice.getDaysOverdue();
            return `عزيزي ${invoice.customer.name}،\n\nنود تذكيرك بأن الفاتورة رقم ${invoice.number} متأخرة منذ ${daysOverdue} يوم.\n\nالمبلغ المستحق: ${amount}\nتاريخ الاستحقاق: ${this.app.formatDate(invoice.dueDate)}\n\nنأمل منك سرعة التسديد.\n\nشكراً لتعاونك.`;
        } else {
            const diffTime = dueDate - today;
            const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return `عزيزي ${invoice.customer.name}،\n\nهذا تذكير بأن الفاتورة رقم ${invoice.number} مستحقة خلال ${daysUntilDue} يوم.\n\nالمبلغ المستحق: ${amount}\nتاريخ الاستحقاق: ${this.app.formatDate(invoice.dueDate)}\n\nشكراً لتعاونك.`;
        }
    }

    /**
     * Get last reminder for an invoice
     * @param {string} invoiceId - Invoice ID
     * @returns {Object|null} Last reminder or null
     */
    getLastReminder(invoiceId) {
        const invoiceReminders = this.reminders
            .filter(r => r.invoiceId === invoiceId)
            .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        
        return invoiceReminders.length > 0 ? invoiceReminders[0] : null;
    }

    /**
     * Check if two dates are the same day
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {boolean} True if same day
     */
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    /**
     * Generate unique reminder ID
     * @returns {string} Reminder ID
     */
    generateReminderId() {
        return 'REM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get overdue invoices
     * @returns {Array} Overdue invoices
     */
    getOverdueInvoices() {
        return this.app.invoices.filter(inv => inv.isOverdue());
    }

    /**
     * Get upcoming due invoices (next 7 days)
     * @returns {Array} Upcoming due invoices
     */
    getUpcomingDueInvoices() {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        return this.app.invoices.filter(inv => {
            if (inv.paymentStatus === 'paid') return false;
            const dueDate = new Date(inv.dueDate);
            return dueDate > today && dueDate <= nextWeek;
        });
    }

    /**
     * Render overdue invoices list
     */
    renderOverdueInvoices() {
        const container = document.getElementById('overdueInvoicesList');
        if (!container) return;

        const overdueInvoices = this.getOverdueInvoices();
        const upcomingInvoices = this.getUpcomingDueInvoices();

        let html = '<h3 class="section-title">الفواتير المتأخرة</h3>';

        if (overdueInvoices.length === 0) {
            html += '<div class="no-data"><i class="fas fa-check-circle"></i><p>لا توجد فواتير متأخرة</p></div>';
        } else {
            html += '<div class="overdue-list">';
            overdueInvoices.forEach(inv => {
                const daysOverdue = inv.getDaysOverdue();
                const lastReminder = this.getLastReminder(inv.id);
                
                html += `
                    <div class="overdue-card ${daysOverdue > 30 ? 'critical' : ''}">
                        <div class="overdue-header">
                            <div class="overdue-info">
                                <h4>${inv.customer.name}</h4>
                                <p class="invoice-number">${inv.number}</p>
                            </div>
                            <div class="overdue-badge">
                                ${daysOverdue} يوم
                            </div>
                        </div>
                        <div class="overdue-body">
                            <div class="overdue-amount">
                                <span>المبلغ المستحق:</span>
                                <strong>${this.app.formatCurrency(inv.total - inv.paidAmount)}</strong>
                            </div>
                            <div class="overdue-date">
                                <i class="fas fa-calendar"></i>
                                تاريخ الاستحقاق: ${this.app.formatDate(inv.dueDate)}
                            </div>
                            ${lastReminder ? `
                                <div class="last-reminder">
                                    <i class="fas fa-bell"></i>
                                    آخر تذكير: ${this.app.formatDate(lastReminder.sentAt)}
                                </div>
                            ` : ''}
                        </div>
                        <div class="overdue-actions">
                            <button class="btn-sm btn-warning" onclick="window.remindersManager.sendReminder('${inv.id}')">
                                <i class="fas fa-paper-plane"></i> إرسال تذكير
                            </button>
                            <button class="btn-sm btn-primary" onclick="viewInvoice('${inv.id}')">
                                <i class="fas fa-eye"></i> عرض
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        html += '<h3 class="section-title" style="margin-top: 30px;">الفواتير القادمة (خلال 7 أيام)</h3>';

        if (upcomingInvoices.length === 0) {
            html += '<div class="no-data"><p>لا توجد فواتير قادمة</p></div>';
        } else {
            html += '<div class="upcoming-list">';
            upcomingInvoices.forEach(inv => {
                const dueDate = new Date(inv.dueDate);
                const today = new Date();
                const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                
                html += `
                    <div class="upcoming-card">
                        <div class="upcoming-info">
                            <h4>${inv.customer.name}</h4>
                            <p class="invoice-number">${inv.number}</p>
                            <p class="invoice-amount">${this.app.formatCurrency(inv.total)}</p>
                        </div>
                        <div class="upcoming-due">
                            <div class="due-badge">
                                ${daysUntil} يوم
                            </div>
                            <p>${this.app.formatDate(inv.dueDate)}</p>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        container.innerHTML = html;
    }

    /**
     * Render reminders history
     */
    renderReminders() {
        const container = document.getElementById('remindersHistory');
        if (!container) return;

        const sortedReminders = [...this.reminders].sort((a, b) => 
            new Date(b.sentAt) - new Date(a.sentAt)
        );

        if (sortedReminders.length === 0) {
            container.innerHTML = '<div class="no-data"><p>لا توجد تذكيرات مرسلة</p></div>';
            return;
        }

        container.innerHTML = sortedReminders.map(reminder => `
            <div class="reminder-card">
                <div class="reminder-header">
                    <div class="reminder-type ${reminder.type}">
                        <i class="fas fa-${reminder.type === 'auto' ? 'robot' : 'user'}"></i>
                        ${reminder.type === 'auto' ? 'تلقائي' : 'يدوي'}
                    </div>
                    <div class="reminder-method">
                        <i class="fas fa-${this.getMethodIcon(reminder.method)}"></i>
                        ${this.getMethodLabel(reminder.method)}
                    </div>
                </div>
                <div class="reminder-body">
                    <h4>${reminder.customerName}</h4>
                    <p class="reminder-invoice">فاتورة: ${reminder.invoiceNumber}</p>
                    <p class="reminder-amount">المبلغ: ${this.app.formatCurrency(reminder.amount)}</p>
                    <p class="reminder-date">
                        <i class="fas fa-clock"></i>
                        ${this.app.formatDate(reminder.sentAt)}
                    </p>
                </div>
                <div class="reminder-message">
                    ${reminder.message}
                </div>
            </div>
        `).join('');
    }

    /**
     * Get method icon
     */
    getMethodIcon(method) {
        const icons = {
            'email': 'envelope',
            'whatsapp': 'whatsapp',
            'system': 'bell'
        };
        return icons[method] || 'bell';
    }

    /**
     * Get method label
     */
    getMethodLabel(method) {
        const labels = {
            'email': 'بريد إلكتروني',
            'whatsapp': 'واتساب',
            'system': 'نظام'
        };
        return labels[method] || method;
    }

    /**
     * Get reminders statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        const overdueCount = this.getOverdueInvoices().length;
        const overdueAmount = this.getOverdueInvoices()
            .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);
        
        const upcomingCount = this.getUpcomingDueInvoices().length;
        const totalReminders = this.reminders.length;
        const autoReminders = this.reminders.filter(r => r.type === 'auto').length;
        const manualReminders = this.reminders.filter(r => r.type === 'manual').length;

        return {
            overdueCount,
            overdueAmount,
            upcomingCount,
            totalReminders,
            autoReminders,
            manualReminders
        };
    }

    /**
     * Schedule reminder for specific date
     * @param {string} invoiceId - Invoice ID
     * @param {Date} scheduleDate - Date to send reminder
     */
    scheduleReminder(invoiceId, scheduleDate) {
        // This would implement scheduled reminders
        // For now, we'll just store the schedule
        const schedule = {
            invoiceId,
            scheduleDate: scheduleDate.toISOString(),
            createdAt: new Date().toISOString()
        };

        const schedules = this.app.storage.load('reminder_schedules') || [];
        schedules.push(schedule);
        this.app.storage.save('reminder_schedules', schedules);

        this.app.showNotification('تم جدولة التذكير بنجاح', 'success');
    }

    /**
     * Cleanup - stop auto check
     */
    destroy() {
        this.stopAutoCheck();
    }
}

// Make available globally
window.RemindersManager = RemindersManager;
