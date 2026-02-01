/**
 * Reports Module - PDF Generation and Statistics
 * Handles report generation, PDF export, Excel/CSV export, and statistics
 */

class ReportsManager {
    constructor(app) {
        this.app = app;
    }

    /**
     * Generate invoice PDF
     * @param {string} invoiceId - Invoice ID
     */
    async generateInvoicePDF(invoiceId) {
        try {
            const invoice = this.app.getInvoice(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            const element = this.createInvoiceHTML(invoice);
            
            const opt = {
                margin: 10,
                filename: `invoice-${invoice.number}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
            
            this.app.showNotification('تم إنشاء الفاتورة بصيغة PDF بنجاح', 'success');
            
            // Clean up
            document.body.removeChild(element);
            
            return { success: true };
        } catch (error) {
            console.error('Error generating invoice PDF:', error);
            this.app.showNotification('خطأ في إنشاء الفاتورة', 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Create HTML for invoice
     * @param {Object} invoice - Invoice object
     * @returns {HTMLElement} Invoice HTML element
     */
    createInvoiceHTML(invoice) {
        const element = document.createElement('div');
        element.style.cssText = 'position: absolute; left: -9999px; width: 210mm; padding: 20mm; background: white; direction: rtl;';
        
        element.innerHTML = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
                    <h1 style="color: #2563eb; margin: 0;">فاتورة</h1>
                    <p style="margin: 5px 0; font-size: 14px;">نظام إدارة المبيعات - Zeralda ERP</p>
                </div>

                <!-- Invoice Info -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                    <div>
                        <h3 style="margin: 0 0 10px 0; color: #2563eb;">معلومات الفاتورة</h3>
                        <p style="margin: 5px 0;"><strong>رقم الفاتورة:</strong> ${invoice.number}</p>
                        <p style="margin: 5px 0;"><strong>التاريخ:</strong> ${this.app.formatDate(invoice.date)}</p>
                        <p style="margin: 5px 0;"><strong>تاريخ الاستحقاق:</strong> ${this.app.formatDate(invoice.dueDate)}</p>
                        <p style="margin: 5px 0;"><strong>الحالة:</strong> ${this.getStatusLabel(invoice.paymentStatus)}</p>
                    </div>
                    <div style="text-align: right;">
                        <h3 style="margin: 0 0 10px 0; color: #2563eb;">معلومات العميل</h3>
                        <p style="margin: 5px 0;"><strong>${invoice.customer.name}</strong></p>
                        <p style="margin: 5px 0;">${invoice.customer.email || ''}</p>
                        <p style="margin: 5px 0;">${invoice.customer.phone || ''}</p>
                        <p style="margin: 5px 0;">${invoice.customer.address || ''}</p>
                    </div>
                </div>

                <!-- Items Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">#</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">الوصف</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">الكمية</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">سعر الوحدة</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map((item, index) => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${index + 1}</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${item.description}</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.quantity}</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${this.app.formatCurrency(item.price)}</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${this.app.formatCurrency(item.quantity * item.price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- Totals -->
                <div style="float: left; width: 300px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px; text-align: right; font-weight: bold;">المجموع الفرعي:</td>
                            <td style="padding: 8px; text-align: left;">${this.app.formatCurrency(invoice.subtotal)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; text-align: right; font-weight: bold;">الضريبة (19%):</td>
                            <td style="padding: 8px; text-align: left;">${this.app.formatCurrency(invoice.tax)}</td>
                        </tr>
                        <tr style="background: #f3f4f6; font-size: 18px; font-weight: bold; color: #2563eb;">
                            <td style="padding: 12px; text-align: right;">المجموع الإجمالي:</td>
                            <td style="padding: 12px; text-align: left;">${this.app.formatCurrency(invoice.total)}</td>
                        </tr>
                        ${invoice.paidAmount > 0 ? `
                        <tr>
                            <td style="padding: 8px; text-align: right; font-weight: bold; color: #10b981;">المبلغ المدفوع:</td>
                            <td style="padding: 8px; text-align: left; color: #10b981;">${this.app.formatCurrency(invoice.paidAmount)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; text-align: right; font-weight: bold; color: #ef4444;">المبلغ المتبقي:</td>
                            <td style="padding: 8px; text-align: left; color: #ef4444;">${this.app.formatCurrency(invoice.total - invoice.paidAmount)}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>

                <div style="clear: both;"></div>

                <!-- Notes -->
                ${invoice.notes ? `
                    <div style="margin-top: 30px; padding: 15px; background: #f9fafb; border-right: 4px solid #2563eb;">
                        <h4 style="margin: 0 0 10px 0;">ملاحظات:</h4>
                        <p style="margin: 0;">${invoice.notes}</p>
                    </div>
                ` : ''}

                <!-- Footer -->
                <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #ddd; padding-top: 20px;">
                    <p style="margin: 5px 0;">شكراً لتعاملكم معنا</p>
                    <p style="margin: 5px 0;">Zeralda ERP - نظام إدارة المبيعات</p>
                </div>
            </div>
        `;

        document.body.appendChild(element);
        return element;
    }

    /**
     * Generate monthly sales report
     * @param {number} year - Year
     * @param {number} month - Month (1-12)
     */
    async generateMonthlySalesReport(year, month) {
        try {
            const invoices = this.app.invoices.filter(inv => {
                const date = new Date(inv.date);
                return date.getFullYear() === year && date.getMonth() === month - 1;
            });

            const totalSales = invoices.filter(inv => inv.paymentStatus === 'paid')
                .reduce((sum, inv) => sum + inv.total, 0);
            const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
            const invoiceCount = invoices.length;

            const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                              'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

            const element = document.createElement('div');
            element.style.cssText = 'position: absolute; left: -9999px; width: 210mm; padding: 20mm; background: white; direction: rtl;';
            
            element.innerHTML = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb;">تقرير المبيعات الشهري</h1>
                        <h2 style="color: #666;">${monthNames[month - 1]} ${year}</h2>
                    </div>

                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                        <h3 style="color: #2563eb; margin-top: 0;">ملخص المبيعات</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>إجمالي المبيعات:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">${this.app.formatCurrency(totalSales)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>إجمالي الإيرادات:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">${this.app.formatCurrency(totalRevenue)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>عدد الفواتير:</strong></td>
                                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: left;">${invoiceCount}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px;"><strong>متوسط قيمة الفاتورة:</strong></td>
                                <td style="padding: 10px; text-align: left;">${this.app.formatCurrency(totalSales / invoiceCount || 0)}</td>
                            </tr>
                        </table>
                    </div>

                    <h3 style="color: #2563eb;">قائمة الفواتير</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #f3f4f6;">
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">رقم الفاتورة</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">العميل</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">التاريخ</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">المبلغ</th>
                                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoices.map(inv => `
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${inv.number}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${inv.customer.name}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${this.app.formatDate(inv.date)}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${this.app.formatCurrency(inv.total)}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${this.getStatusLabel(inv.paymentStatus)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #ddd; padding-top: 20px;">
                        <p>تم إنشاء التقرير بتاريخ: ${new Date().toLocaleDateString('ar-DZ')}</p>
                    </div>
                </div>
            `;

            document.body.appendChild(element);

            const opt = {
                margin: 10,
                filename: `monthly-report-${year}-${month}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
            
            document.body.removeChild(element);
            
            this.app.showNotification('تم إنشاء التقرير الشهري بنجاح', 'success');
            
            return { success: true };
        } catch (error) {
            console.error('Error generating monthly report:', error);
            this.app.showNotification('خطأ في إنشاء التقرير', 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Export invoices to Excel
     */
    exportToExcel() {
        try {
            const data = this.app.invoices.map(inv => ({
                'رقم الفاتورة': inv.number,
                'العميل': inv.customer.name,
                'التاريخ': this.app.formatDate(inv.date),
                'تاريخ الاستحقاق': this.app.formatDate(inv.dueDate),
                'المبلغ الفرعي': inv.subtotal,
                'الضريبة': inv.tax,
                'المجموع': inv.total,
                'المبلغ المدفوع': inv.paidAmount,
                'المتبقي': inv.total - inv.paidAmount,
                'حالة الدفع': this.getStatusLabel(inv.paymentStatus),
                'طريقة الدفع': this.getPaymentMethodLabel(inv.paymentMethod)
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
            
            XLSX.writeFile(wb, `invoices-${new Date().toISOString().split('T')[0]}.xlsx`);
            
            this.app.showNotification('تم تصدير البيانات إلى Excel بنجاح', 'success');
            
            return { success: true };
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            this.app.showNotification('خطأ في تصدير البيانات', 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Export invoices to CSV
     */
    exportToCSV() {
        try {
            const data = this.app.invoices.map(inv => ({
                'رقم الفاتورة': inv.number,
                'العميل': inv.customer.name,
                'التاريخ': this.app.formatDate(inv.date),
                'المبلغ': inv.total,
                'حالة الدفع': this.getStatusLabel(inv.paymentStatus)
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const csv = XLSX.utils.sheet_to_csv(ws);
            
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            this.app.showNotification('تم تصدير البيانات إلى CSV بنجاح', 'success');
            
            return { success: true };
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            this.app.showNotification('خطأ في تصدير البيانات', 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate aging report for overdue invoices
     */
    async generateAgingReport() {
        try {
            const overdueInvoices = this.app.invoices.filter(inv => inv.isOverdue());
            
            // Group by age ranges
            const aging = {
                '1-30': [],
                '31-60': [],
                '61-90': [],
                '90+': []
            };

            overdueInvoices.forEach(inv => {
                const days = inv.getDaysOverdue();
                if (days <= 30) aging['1-30'].push(inv);
                else if (days <= 60) aging['31-60'].push(inv);
                else if (days <= 90) aging['61-90'].push(inv);
                else aging['90+'].push(inv);
            });

            const element = document.createElement('div');
            element.style.cssText = 'position: absolute; left: -9999px; width: 210mm; padding: 20mm; background: white; direction: rtl;';
            
            element.innerHTML = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #ef4444;">تقرير الفواتير المستحقة</h1>
                        <p style="color: #666;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-DZ')}</p>
                    </div>

                    ${Object.keys(aging).map(range => {
                        const invs = aging[range];
                        const total = invs.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);
                        
                        return `
                            <div style="margin-bottom: 30px;">
                                <h3 style="background: #fee; padding: 10px; color: #ef4444;">${range} يوم (${invs.length} فاتورة - ${this.app.formatCurrency(total)})</h3>
                                ${invs.length > 0 ? `
                                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                        <thead>
                                            <tr style="background: #f3f4f6;">
                                                <th style="border: 1px solid #ddd; padding: 8px;">رقم الفاتورة</th>
                                                <th style="border: 1px solid #ddd; padding: 8px;">العميل</th>
                                                <th style="border: 1px solid #ddd; padding: 8px;">تاريخ الاستحقاق</th>
                                                <th style="border: 1px solid #ddd; padding: 8px;">الأيام المتأخرة</th>
                                                <th style="border: 1px solid #ddd; padding: 8px;">المبلغ المستحق</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${invs.map(inv => `
                                                <tr>
                                                    <td style="border: 1px solid #ddd; padding: 8px;">${inv.number}</td>
                                                    <td style="border: 1px solid #ddd; padding: 8px;">${inv.customer.name}</td>
                                                    <td style="border: 1px solid #ddd; padding: 8px;">${this.app.formatDate(inv.dueDate)}</td>
                                                    <td style="border: 1px solid #ddd; padding: 8px;">${inv.getDaysOverdue()}</td>
                                                    <td style="border: 1px solid #ddd; padding: 8px;">${this.app.formatCurrency(inv.total - inv.paidAmount)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                ` : '<p style="text-align: center; color: #10b981;">لا توجد فواتير في هذا النطاق</p>'}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            document.body.appendChild(element);

            const opt = {
                margin: 10,
                filename: `aging-report-${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
            
            document.body.removeChild(element);
            
            this.app.showNotification('تم إنشاء تقرير الفواتير المستحقة بنجاح', 'success');
            
            return { success: true };
        } catch (error) {
            console.error('Error generating aging report:', error);
            this.app.showNotification('خطأ في إنشاء التقرير', 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * Get status label in Arabic
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
     * Get payment method label in Arabic
     */
    getPaymentMethodLabel(method) {
        const labels = {
            'cash': 'نقداً',
            'bank_transfer': 'تحويل بنكي',
            'stripe': 'Stripe',
            'paypal': 'PayPal'
        };
        return labels[method] || method;
    }
}

// Make available globally
window.ReportsManager = ReportsManager;
