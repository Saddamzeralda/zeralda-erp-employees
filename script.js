// بيانات التطبيق
const departments = {
    'it': 'تكنولوجيا المعلومات',
    'hr': 'الموارد البشرية',
    'finance': 'المالية',
    'marketing': 'التسويق',
    'sales': 'المبيعات',
    'operations': 'العمليات',
    'support': 'الدعم الفني'
};

const cities = ['الجزائر العاصمة', 'وهران', 'قسنطينة', 'عنابة', 'بجاية', 'باتنة', 'سيدي بلعباس', 'تلمسان', 'الشلف', 'البليدة'];

const positions = [
    'مدير تقنية المعلومات', 'محاسب', 'مدير تسويق', 'مطور برامج', 'مهندس شبكات',
    'أخصائي موارد بشرية', 'مدير مبيعات', 'دعم فني', 'مدير مشاريع', 'محلل بيانات',
    'مصمم جرافيك', 'كاتب محتوى', 'مدير العمليات', 'مدير الجودة', 'مراجع داخلي'
];

// توليد بيانات موظفين عشوائية
const generateEmployees = () => {
    const employees = [];
    const firstNames = ['أحمد', 'محمد', 'علي', 'سارة', 'فاطمة', 'خالد', 'أمين', 'نور', 'يوسف', 'مريم'];
    const lastNames = ['الزهراني', 'القحطاني', 'الغامدي', 'الحربي', 'الشهري', 'العتيبي', 'العمري', 'القرشي', 'النجار', 'السعيد'];
    
    for (let i = 0; i < 142; i++) {
        const id = i + 1;
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${firstName} ${lastName}`;
        const deptKeys = Object.keys(departments);
        const dept = deptKeys[Math.floor(Math.random() * deptKeys.length)];
        const status = ['active', 'active', 'active', 'active', 'vacation', 'training', 'remote', 'inactive'][Math.floor(Math.random() * 8)];
        
        employees.push({
            id: id,
            name: name,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
            phone: `+213 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000 + 1000)}`,
            department: dept,
            departmentName: departments[dept],
            position: positions[Math.floor(Math.random() * positions.length)],
            hireDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString('ar-EG'),
            salary: Math.floor(Math.random() * 70000 + 30000),
            address: cities[Math.floor(Math.random() * cities.length)],
            status: status,
            avatarInitials: firstName.charAt(0) + lastName.charAt(0)
        });
    }

    // إضافة الموظفين الثلاثة المحددة
    employees[0] = {
        id: 101,
        name: "أحمد محمد علي",
        email: "ahmed.mohamed@company.com",
        phone: "+213 555 123 456",
        department: "it",
        departmentName: "تكنولوجيا المعلومات",
        position: "مدير تقنية المعلومات",
        hireDate: "15/10/2023",
        salary: 85000,
        address: "الجزائر العاصمة",
        status: "active",
        avatarInitials: "أح"
    };

    employees[1] = {
        id: 102,
        name: "سارة خالد أحمد",
        email: "sara.khaled@company.com",
        phone: "+213 555 987 654",
        department: "finance",
        departmentName: "المالية",
        position: "محاسبة",
        hireDate: "01/11/2023",
        salary: 65000,
        address: "وهران",
        status: "active",
        avatarInitials: "سخ"
    };

    employees[2] = {
        id: 103,
        name: "محمد أمين عبدالقادر",
        email: "mohamed.amine@company.com",
        phone: "+213 555 456 789",
        department: "marketing",
        departmentName: "التسويق",
        position: "مدير تسويق",
        hireDate: "10/09/2023",
        salary: 75000,
        address: "قسنطينة",
        status: "vacation",
        avatarInitials: "مح"
    };

    return employees;
};

// المتغيرات العامة
const allEmployees = generateEmployees();
let currentView = 'list';
let currentPage = 1;
const itemsPerPage = 10;
let filteredEmployees = [...allEmployees];
let currentFilters = {};

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    renderEmployees();
    updatePagination();
    updateLastUpdateTime();
    
    // إضافة حدث البحث أثناء الكتابة
    document.getElementById('searchInput').addEventListener('input', function(e) {
        if (e.target.value.length === 0 || e.target.value.length >= 3) {
            currentFilters.search = e.target.value;
            applyFilters();
        }
    });
    
    // إضافة أحداث التغيير للفلاتر
    ['departmentFilter', 'statusFilter', 'positionFilter', 'sortBy'].forEach(id => {
        document.getElementById(id).addEventListener('change', function() {
            applyFilters();
        });
    });
    
    showNotification("تم تحميل نظام إدارة الموظفين بنجاح", "success");
});

// دالة عرض الموظفين
function renderEmployees() {
    const container = document.getElementById('employeesList');
    const emptyState = document.getElementById('emptyState');
    const loading = document.getElementById('loadingIndicator');
    
    loading.style.display = 'block';
    container.innerHTML = '';
    
    setTimeout(() => {
        loading.style.display = 'none';
        
        if (filteredEmployees.length === 0) {
            emptyState.style.display = 'block';
            container.style.display = 'none';
            return;
        }
        
        emptyState.style.display = 'none';
        container.style.display = currentView === 'grid' ? 'grid' : 'block';
        container.className = currentView === 'grid' ? 'employees-grid' : 'employees-list';
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageEmployees = filteredEmployees.slice(startIndex, endIndex);
        
        pageEmployees.forEach(emp => {
            container.innerHTML += createEmployeeCard(emp);
        });
        
        // تحديث العدادات
        document.getElementById('displayCount').textContent = pageEmployees.length;
        document.getElementById('totalCount').textContent = filteredEmployees.length;
        document.getElementById('resultsCount').textContent = `عرض ${filteredEmployees.length} نتيجة`;
    }, 300);
}

// دالة إنشاء بطاقة موظف
function createEmployeeCard(employee) {
    const statusText = {
        'active': 'نشط',
        'inactive': 'غير نشط',
        'vacation': 'في إجازة',
        'training': 'تحت التدريب',
        'remote': 'عمل عن بعد'
    }[employee.status];
    
    const statusClass = {
        'active': 'status-active',
        'inactive': 'status-inactive',
        'vacation': 'status-vacation',
        'training': 'status-training',
        'remote': 'status-remote'
    }[employee.status];
    
    const avatarColors = [
        'linear-gradient(135deg, #3498db, #2980b9)',
        'linear-gradient(135deg, #2ecc71, #27ae60)',
        'linear-gradient(135deg, #9b59b6, #8e44ad)',
        'linear-gradient(135deg, #e74c3c, #c0392b)',
        'linear-gradient(135deg, #f39c12, #d35400)'
    ];
    const avatarColor = avatarColors[employee.id % avatarColors.length];
    
    return `
        <div class="employee-card" data-id="${employee.id}">
            <div class="employee-header">
                <div class="employee-info-container">
                    <div class="employee-avatar" style="background: ${avatarColor}">
                        ${employee.avatarInitials}
                    </div>
                    <div class="employee-info">
                        <h4 class="employee-name">${employee.name}</h4>
                        <div class="employee-meta">
                            <span><i class="fas fa-id-badge"></i> رقم: ${employee.id}</span>
                            <span><i class="fas fa-briefcase"></i> ${employee.position}</span>
                            <span class="status-badge ${statusClass}">${statusText}</span>
                        </div>
                    </div>
                </div>
                <div class="employee-actions">
                    <button class="action-btn view" onclick="viewEmployee(${employee.id})" title="عرض التفاصيل">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editEmployee(${employee.id})" title="تعديل">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteEmployee(${employee.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="action-btn more" onclick="toggleDetails(${employee.id})" title="المزيد">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
            </div>
            ${currentView === 'list' ? `
                <div class="employee-details" id="details-${employee.id}">
                    <div class="detail-item">
                        <label><i class="fas fa-envelope"></i> البريد الإلكتروني</label>
                        <span>${employee.email}</span>
                    </div>
                    <div class="detail-item">
                        <label><i class="fas fa-phone"></i> الهاتف</label>
                        <span>${employee.phone}</span>
                    </div>
                    <div class="detail-item">
                        <label><i class="fas fa-building"></i> القسم</label>
                        <span>${employee.departmentName}</span>
                    </div>
                    <div class="detail-item">
                        <label><i class="fas fa-calendar-alt"></i> تاريخ التعيين</label>
                        <span>${employee.hireDate}</span>
                    </div>
                    <div class="detail-item">
                        <label><i class="fas fa-money-bill-wave"></i> الراتب</label>
                        <span>${employee.salary.toLocaleString()} دج</span>
                    </div>
                    <div class="detail-item">
                        <label><i class="fas fa-map-marker-alt"></i> العنوان</label>
                        <span>${employee.address}</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// دالة تطبيق الفلاتر
function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const department = document.getElementById('departmentFilter').value;
    const status = document.getElementById('statusFilter').value;
    const position = document.getElementById('positionFilter').value.toLowerCase();
    const salaryMin = parseInt(document.getElementById('salaryMin')?.value) || 0;
    const salaryMax = parseInt(document.getElementById('salaryMax')?.value) || Infinity;
    const city = document.getElementById('cityFilter')?.value.toLowerCase() || '';
    const sortBy = document.getElementById('sortBy').value;
    
    currentFilters = { search, department, status, position, salaryMin, salaryMax, city, sortBy };
    
    filteredEmployees = allEmployees.filter(emp => {
        if (search && !emp.name.toLowerCase().includes(search) && 
            !emp.email.toLowerCase().includes(search) && 
            !emp.id.toString().includes(search)) {
            return false;
        }
        
        if (department && emp.department !== department) return false;
        if (status && emp.status !== status) return false;
        if (position && !emp.position.toLowerCase().includes(position)) return false;
        if (emp.salary < salaryMin || emp.salary > salaryMax) return false;
        if (city && !emp.address.toLowerCase().includes(city)) return false;
        
        return true;
    });
    
    sortEmployees(sortBy);
    currentPage = 1;
    renderEmployees();
    updatePagination();
    updateStats();
    
    showNotification(`تم تطبيق الفلاتر على ${filteredEmployees.length} موظف`, "info");
}

// دالة ترتيب الموظفين
function sortEmployees(sortBy) {
    switch(sortBy) {
        case 'name':
            filteredEmployees.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name_desc':
            filteredEmployees.sort((a, b) => b.name.localeCompare(a.name));
            break;
        case 'salary':
            filteredEmployees.sort((a, b) => a.salary - b.salary);
            break;
        case 'salary_desc':
            filteredEmployees.sort((a, b) => b.salary - a.salary);
            break;
        case 'hireDate':
            filteredEmployees.sort((a, b) => new Date(a.hireDate) - new Date(b.hireDate));
            break;
        case 'hireDate_desc':
            filteredEmployees.sort((a, b) => new Date(b.hireDate) - new Date(a.hireDate));
            break;
    }
}

// دالة إعادة تعيين الفلاتر
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('departmentFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('positionFilter').value = '';
    document.getElementById('salaryMin').value = '';
    document.getElementById('salaryMax').value = '';
    document.getElementById('cityFilter').value = '';
    document.getElementById('hireDateFrom').value = '';
    document.getElementById('hireDateTo').value = '';
    document.getElementById('sortBy').value = 'name';
    
    filteredEmployees = [...allEmployees];
    currentPage = 1;
    renderEmployees();
    updatePagination();
    updateStats();
    
    showNotification("تم إعادة تعيين جميع الفلاتر", "success");
}

// دالة تغيير طريقة العرض
function changeView(view) {
    currentView = view;
    const buttons = document.querySelectorAll('.view-toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderEmployees();
}

// دالة التبديل بين الفلاتر المتقدمة
function toggleAdvancedFilters() {
    const filters = document.getElementById('advancedFilters');
    filters.classList.toggle('show');
}

// دالة عرض/إخفاء التفاصيل
function toggleDetails(id) {
    const details = document.getElementById(`details-${id}`);
    if (details) {
        details.classList.toggle('expanded');
    }
}

// دالة تحديث الترقيم
function updatePagination() {
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const container = document.getElementById('paginationContainer');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    html += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    container.innerHTML = html;
}

// دالة تغيير الصفحة
function changePage(page) {
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderEmployees();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// دالة تحديث الإحصائيات
function updateStats() {
    const total = allEmployees.length;
    const active = allEmployees.filter(e => e.status === 'active').length;
    const vacation = allEmployees.filter(e => e.status === 'vacation').length;
    const departmentsCount = new Set(allEmployees.map(e => e.department)).size;
    
    document.getElementById('totalEmployees').textContent = total;
    document.getElementById('activeEmployees').textContent = active;
    document.getElementById('vacationEmployees').textContent = vacation;
    document.getElementById('totalDepartments').textContent = departmentsCount;
}

// دالة الفلترة بالحالة
function filterByStatus(status) {
    document.getElementById('statusFilter').value = status;
    applyFilters();
}

// دالة الفلترة بالقسم
function filterByDepartment(dept) {
    document.getElementById('departmentFilter').value = dept;
    applyFilters();
}

// دالة تحديث وقت التحديث الأخير
function updateLastUpdateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('lastUpdate').textContent = now.toLocaleDateString('ar-EG', options);
}

// دوال إدارة الموظفين
function openAddEmployeeModal() {
    showNotification("سيتم فتح نموذج إضافة موظف جديد قريباً", "info");
}

function openImportModal() {
    showNotification("سيتم فتح نافذة استيراد البيانات", "info");
}

function openBulkActionsModal() {
    showNotification("سيتم فتح نافذة الإجراءات الجماعية", "info");
}

function viewEmployee(id) {
    const employee = allEmployees.find(emp => emp.id === id);
    if (employee) {
        alert(`
            تفاصيل الموظف:\n\n
            الاسم: ${employee.name}\n
            رقم الموظف: ${employee.id}\n
            البريد: ${employee.email}\n
            الهاتف: ${employee.phone}\n
            القسم: ${employee.departmentName}\n
            الوظيفة: ${employee.position}\n
            تاريخ التعيين: ${employee.hireDate}\n
            الراتب: ${employee.salary.toLocaleString()} دج\n
            العنوان: ${employee.address}
        `);
    }
}

function editEmployee(id) {
    const employee = allEmployees.find(emp => emp.id === id);
    if (employee) {
        const newName = prompt("أدخل الاسم الجديد:", employee.name);
        if (newName && newName !== employee.name) {
            showNotification(`تم تعديل بيانات الموظف ${employee.name} إلى ${newName}`, "success");
        }
    }
}

function deleteEmployee(id) {
    const employee = allEmployees.find(emp => emp.id === id);
    if (employee && confirm(`هل أنت متأكد من حذف الموظف ${employee.name}؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
        const index = allEmployees.findIndex(emp => emp.id === id);
        if (index > -1) {
            allEmployees.splice(index, 1);
            applyFilters();
            showNotification(`تم حذف الموظف ${employee.name}`, "success");
        }
    }
}

function exportEmployees() {
    const dataStr = JSON.stringify(filteredEmployees, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `employees-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showNotification(`تم تصدير بيانات ${filteredEmployees.length} موظف بنجاح`, "success");
}

// دالة مساعدة لعرض الإشعارات
function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button style="margin-right: auto; background: none; border: none; color: inherit; cursor: pointer;" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}
