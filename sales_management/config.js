/**
 * Configuration file for Sales Management System
 * Contains API keys, endpoints, and system settings
 */

const CONFIG = {
    // API Settings
    api: {
        baseUrl: 'https://api.zeralda-erp.com',
        timeout: 30000,
        retryAttempts: 3
    },

    // Payment Gateway Settings
    payments: {
        stripe: {
            publishableKey: 'pk_test_YOUR_STRIPE_KEY', // Replace with actual key
            enabled: true
        },
        paypal: {
            clientId: 'YOUR_PAYPAL_CLIENT_ID', // Replace with actual client ID
            enabled: true,
            mode: 'sandbox' // 'sandbox' or 'live'
        }
    },

    // Email/Notification Settings
    notifications: {
        email: {
            enabled: true,
            provider: 'smtp',
            from: 'noreply@zeralda-erp.com'
        },
        whatsapp: {
            enabled: false,
            apiKey: 'YOUR_WHATSAPP_API_KEY'
        }
    },

    // Report Settings
    reports: {
        defaultCurrency: 'DZD',
        dateFormat: 'DD/MM/YYYY',
        pdfSettings: {
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        }
    },

    // Reminder Settings
    reminders: {
        daysBeforeDue: [7, 3, 1], // Send reminders 7, 3, and 1 days before due
        daysAfterDue: [1, 7, 14, 30], // Send reminders after due date
        autoSend: false // Enable automatic sending when true
    },

    // Search & Filter Settings
    search: {
        minSearchLength: 2,
        debounceTime: 300,
        resultsPerPage: 10
    },

    // Dashboard Settings
    dashboard: {
        refreshInterval: 60000, // Refresh every 60 seconds
        chartColors: [
            '#2563eb',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#06b6d4',
            '#f97316',
            '#ec4899'
        ]
    },

    // Storage Settings
    storage: {
        prefix: 'zeralda_sales_',
        version: '1.0.0',
        useLocalStorage: true,
        cloudSync: false
    },

    // Application Settings
    app: {
        name: 'نظام إدارة المبيعات - Zeralda ERP',
        version: '1.0.0',
        defaultLanguage: 'ar',
        supportedLanguages: ['ar', 'en', 'fr'],
        taxRate: 0.19 // 19% VAT
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
