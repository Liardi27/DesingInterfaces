
class UI {
    constructor() {
        this.app = document.getElementById('app-view');
        // Initialize formatter with store setting if available, otherwise default
        const currency = window.store?.settings?.currency || 'EUR';
        this.currencyFormatter = new Intl.NumberFormat(this.getLocaleForCurrency(currency), { style: 'currency', currency: currency });
        this.currentFilter = 'week'; // Default to 'Esta semana' as requested
        this.notifications = []; // Store history

        // Initialize Theme
        const theme = window.store?.settings?.theme || 'default';
        this.applyTheme(theme);
    }

    getLocaleForCurrency(currency) {
        const map = {
            'EUR': 'es-ES',
            'USD': 'en-US',
            'GBP': 'en-GB',
            'JPY': 'ja-JP',
            'PLN': 'pl-PL'
        };
        return map[currency] || 'es-ES';
    }

    updateCurrency(currency) {
        window.store.updateSetting('currency', currency);
        this.currencyFormatter = new Intl.NumberFormat(this.getLocaleForCurrency(currency), { style: 'currency', currency: currency });
        this.showNotification('Moneda actualizada a ' + currency);
        // Re-render current view to apply changes
        if (window.router.currentRoute === 'settings') this.renderSettings();
        else window.router.navigate('home'); // Fallback to home/refresh
    }

    updateDateRange(val) {
        this.currentFilter = val;
        // If we are on home, re-render home.
        if (window.router.currentRoute === 'home') {
            this.renderHome();
        } else if (window.router.currentRoute === 'stats') {
            this.renderStats(this.currentStatsType || 'expense');
        }
    }

    showNotificationsHistory() {
        const notifs = this.notifications.slice().reverse().slice(0, 5); // Last 5

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[99999] flex items-start justify-end p-4 sm:p-6';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        const content = `
            <div class="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-sm overflow-hidden animate-fade-in-down mt-12 mr-2">
                <div class="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-white/5">
                    <h3 class="font-bold text-brand-text dark:text-dark-text">Notificaciones Recientes</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="max-h-[300px] overflow-y-auto">
                    ${notifs.length === 0 ? `
                        <div class="p-8 text-center text-gray-400 dark:text-gray-600">
                             <i class="fa-regular fa-bell-slash text-2xl mb-2"></i>
                             <p class="text-sm">Sin notificaciones</p>
                        </div>
                    ` : notifs.map(n => `
                        <div class="p-4 border-b border-gray-50 dark:border-white/5 flex gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                             <div class="mt-1 w-2 h-2 rounded-full ${n.type === 'success' ? 'bg-green-500' : 'bg-red-500'} shrink-0"></div>
                             <div>
                                <p class="text-sm font-medium text-brand-text dark:text-dark-text">${n.message}</p>
                                <p class="text-xs text-brand-muted dark:text-dark-text/40 mt-1">${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                             </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        modal.innerHTML = content;
        document.body.appendChild(modal);
    }

    showNotification(message, type = 'success') {
        const id = 'notif-' + Date.now();
        const colorClass = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';

        // Add to history
        this.notifications.push({ message, type, timestamp: Date.now() });

        // Start hidden (opacity 0, translated up)
        const html = `
            <div id="${id}" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white ${colorClass} transition-all duration-500 ease-out opacity-0 -translate-y-8 pointer-events-none">
                <i class="fa-solid ${icon} text-xl"></i>
                <span class="font-bold text-base">${message}</span>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Trigger animation next frame
        requestAnimationFrame(() => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.remove('opacity-0', '-translate-y-8');
                el.classList.add('translate-y-0'); // Ensure explicit standard state
            }
        });

        // Remove after 3s
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('opacity-0', '-translate-y-8');
                setTimeout(() => el.remove(), 500);
            }
        }, 3000);
    }

    formatMoney(amount) {
        return this.currencyFormatter.format(amount);
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        // Capitalize first letter: "Lunes, 12 oct"
        const options = { weekday: 'long', day: 'numeric', month: 'short' };
        let s = date.toLocaleDateString('es-ES', options);
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    getCategory(id) {
        if (id === 'cat_piggy') return { name: 'Huchas', icon: 'fa-piggy-bank', color: 'bg-teal-100 text-teal-600' };
        return window.store.categories.find(c => c.id === id) || { name: 'General', icon: 'fa-tag', color: 'bg-gray-100 text-gray-600' };
    }

    renderHome() {
        const balance = window.store.getBalance(this.currentFilter);
        const income = window.store.getIncome(this.currentFilter);
        const expense = window.store.getExpense(this.currentFilter);
        const recent = window.store.getRecent(5, this.currentFilter);

        // Ensure dropdown matches state (since we re-render HTML, we lose DOM state unless we set value explicitly or this header is outside app-view)
        // Note: The Header is OUTSIDE app-view in index.html, so it persists! 
        // We just need to ensure we update the select value if it got out of sync, or trust the simple onchange.
        const dateSelect = document.querySelector('select[onchange*="updateDateRange"]');
        if (dateSelect) dateSelect.value = this.currentFilter;

        this.app.innerHTML = `
            <div class="space-y-6 animate-fade-in">
                <!-- Balance Card -->
                <div class="bg-gradient-to-br from-brand-primary to-brand-accent rounded-3xl p-6 text-white shadow-xl shadow-blue-200 dark:shadow-none relative overflow-hidden transition-all">
                    <div class="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>
                    <div class="relative z-10">
                        <p class="text-blue-100 text-sm font-medium mb-1">Balance Total</p>
                        <h1 class="text-4xl font-bold mb-6">${this.formatMoney(balance)}</h1>
                        
                        <div class="flex gap-4">
                            <div class="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <div class="flex items-center gap-2 mb-1">
                                    <div class="w-6 h-6 rounded-full bg-status-income/20 flex items-center justify-center text-status-income text-xs">
                                        <i class="fa-solid fa-arrow-down"></i>
                                    </div>
                                    <span class="text-xs text-blue-100">Ingresos</span>
                                </div>
                                <p class="font-semibold text-lg">${this.formatMoney(income)}</p>
                            </div>
                            <div class="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <div class="flex items-center gap-2 mb-1">
                                    <div class="w-6 h-6 rounded-full bg-status-expense/20 flex items-center justify-center text-status-expense text-xs">
                                        <i class="fa-solid fa-arrow-up"></i>
                                    </div>
                                    <span class="text-xs text-blue-100">Gastos</span>
                                </div>
                                <p class="font-semibold text-lg">${this.formatMoney(expense)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                 <!-- Mini Chart -->
                <div class="bg-white dark:bg-dark-surface rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/10 transition-colors mb-6">
                    <h3 class="font-bold text-brand-text dark:text-dark-text mb-4">
                        ${this.currentFilter === 'week' ? 'Resumen Semanal' : (this.currentFilter === 'month' ? 'Resumen Mensual' : (this.currentFilter === 'year' ? 'Resumen Anual' : 'Resumen'))}
                    </h3>
                    <div class="h-40 w-full relative">
                        <canvas id="miniChart"></canvas>
                    </div>
                </div>

                <!-- Recent Transactions -->
                <div>
                    <div class="flex items-center justify-between mb-4 px-1">
                        <h3 class="font-bold text-brand-text dark:text-dark-text">Recientes</h3>
                        <div class="relative group">
                            <button class="text-brand-primary dark:text-blue-400 text-sm font-medium flex items-center gap-1" onclick="window.router.navigate('account')">
                                <span>Ver todo</span> <i class="fa-solid fa-chevron-right text-xs"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        ${recent.length === 0 ? `
                        <div class="text-center py-10 opacity-50">
                            <i class="fa-solid fa-wind text-4xl mb-2 text-gray-300 dark:text-gray-600"></i>
                            <p class="text-sm text-slate-500 dark:text-dark-text/60">Todo limpio por aquí</p>
                        </div>` : recent.map(tx => this.renderTransactionItem(tx)).join('')}
                    </div>
                </div>
            </div>
        `;

        // Init chart after render
        setTimeout(() => this.initMiniChart(), 50);
    }

    renderTransactionItem(tx) {
        const cat = this.getCategory(tx.category);
        const isExpense = tx.type === 'expense';
        const amountClass = isExpense ? 'text-brand-text dark:text-dark-text' : 'text-status-incomeText dark:text-green-400';
        const sign = isExpense ? '-' : '+';
        const hasInvoice = !!tx.invoice;

        return `
            <div class="bg-white dark:bg-dark-surface rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-white/10 transition-all cursor-pointer group" onclick="window.ui.showTransactionDetail('${tx.id}')">
                <div class="w-12 h-12 rounded-full ${cat.color} flex items-center justify-center text-lg shadow-sm">
                    <i class="fa-solid ${cat.icon}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-brand-text dark:text-dark-text truncate">${tx.concept}</h4>
                    <p class="text-xs text-brand-muted dark:text-dark-text/60">${this.formatDate(tx.date)} • ${cat.name}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold ${amountClass}">${sign} ${this.formatMoney(tx.amount)}</p>
                    ${hasInvoice ? '<i class="fa-solid fa-paperclip text-xs text-brand-primary" title="Factura adjunta"></i>' : ''}
                    <p class="text-[10px] text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">Ver detalle</p>
                </div>
            </div>
        `;
    }

    showTransactionDetail(id) {
        // loose equality to match string vs number
        const tx = window.store.transactions.find(t => t.id == id);
        if (!tx) return;
        const cat = this.getCategory(tx.category);
        const isImage = tx.invoice && tx.invoice.startsWith('data:image');
        const isPdf = tx.invoice && tx.invoice.startsWith('data:application/pdf');

        const modalHtml = `
            <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onclick="this.remove()">
                <div class="bg-white dark:bg-dark-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar border border-gray-100 dark:border-white/10" onclick="event.stopPropagation()">
                    <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" onclick="this.closest('.fixed').remove()">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                    
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 rounded-full ${cat.color} flex items-center justify-center text-2xl mx-auto mb-3 shadow-sm">
                            <i class="fa-solid ${cat.icon}"></i>
                        </div>
                        <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${tx.type === 'expense' ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300'}">
                            ${tx.type === 'expense' ? 'Gasto' : 'Ingreso'}
                        </span>
                        <p class="text-sm font-bold text-brand-muted dark:text-dark-text/60 uppercase tracking-wider">${cat.name}</p>
                        <h2 class="text-2xl font-bold text-brand-text dark:text-dark-text mt-1">${tx.concept}</h2>
                        <p class="text-3xl font-bold mt-2 ${tx.type === 'expense' ? 'text-brand-text dark:text-dark-text' : 'text-status-incomeText dark:text-green-400'}">
                            ${tx.type === 'expense' ? '-' : '+'} ${this.formatMoney(tx.amount)}
                        </p>
                        <p class="text-xs text-brand-muted dark:text-dark-text/50 mt-2">${new Date(tx.date).toLocaleString()}</p>
                    </div>

                    <div class="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-4 text-sm text-slate-600 dark:text-dark-text/80">
                        <p class="text-xs font-bold text-gray-400 dark:text-dark-text/50 uppercase mb-1">Detalles</p>
                        ${tx.notes
                ? `<div class="flex gap-2"><i class="fa-solid fa-quote-left text-gray-300 mt-0.5"></i> <span>${tx.notes}</span></div>`
                : '<p class="text-gray-400 italic">Sin detalles extra</p>'}
                    </div>

                    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6">
                        <p class="text-xs font-bold text-blue-400 uppercase mb-2">Factura Adjunta</p>
                        ${tx.invoice
                ? (isImage
                    ? `<img src="${tx.invoice}" class="w-full rounded-lg shadow-sm border border-blue-100 dark:border-blue-800 max-h-40 object-cover" onclick="const w=window.open(); w.document.write('<img src=${tx.invoice}>')" style="cursor:zoom-in">`
                    : (isPdf
                        ? `<a href="${tx.invoice}" download="factura_${tx.id}.pdf" class="flex items-center gap-3 bg-white dark:bg-white/5 p-3 rounded-lg border border-blue-100 dark:border-white/10 text-blue-600 dark:text-blue-400 font-bold text-sm hover:shadow-md transition-all"><i class="fa-solid fa-file-pdf text-xl"></i> Descargar PDF</a>`
                        : `<p class="text-sm text-gray-500">Archivo adjunto</p>`))
                : '<div class="flex items-center gap-2 text-gray-400 italic"><i class="fa-solid fa-file-slash"></i> <span>Sin archivo adjunto</span></div>'}
                    </div>

                    <button onclick="if(confirm('¿Borrar este movimiento?')) { window.store.deleteTransaction(${id}); window.ui.showNotification('Movimiento eliminado', 'error'); this.closest('.fixed').remove(); window.router.navigate('home'); }" 
                        class="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-500 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2 rounded-xl">
                        <i class="fa-regular fa-trash-can"></i> Eliminar Movimiento
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    initMiniChart() {
        const ctx = document.getElementById('miniChart');
        if (!ctx) return;

        // Destroy existing chart if any to avoid overlay/memory leaks
        if (this.miniChartInstance) {
            this.miniChartInstance.destroy();
        }

        // Get Real Data
        const { labels, incomeData, expenseData } = window.store.getHistogramData(this.currentFilter);

        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
        const textColor = isDark ? '#94a3b8' : '#64748b';

        this.miniChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Gastos',
                    data: expenseData,
                    backgroundColor: '#FDA4AF', // status-expense
                    borderRadius: 4,
                    barThickness: 8
                }, {
                    label: 'Ingresos',
                    data: incomeData,
                    backgroundColor: '#86EFAC', // status-income
                    borderRadius: 4,
                    barThickness: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        titleColor: isDark ? '#f1f5f9' : '#1e293b',
                        bodyColor: isDark ? '#cbd5e1' : '#64748b',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true,
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { size: 10 } }
                    },
                    y: {
                        display: false,
                        grid: { color: gridColor }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    getChartTextColor() {
        return document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';
    }

    renderAddTransaction() {
        this.app.innerHTML = `
            <div class="max-w-md mx-auto bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/10 animate-fade-in mt-4 transition-colors">
                <h2 class="text-xl font-bold mb-6 text-center text-brand-text dark:text-dark-text">Añadir Movimiento</h2>
                
                <form id="addForm" onsubmit="event.preventDefault(); window.ui.handleSubmit(event);">
                    <!-- Toggle Type -->
                    <div class="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-6">
                        <button type="button" id="btn-expense" class="flex-1 py-2 rounded-lg font-bold text-sm transition-all bg-white dark:bg-slate-700 text-status-expenseText shadow-sm" onclick="window.ui.setTransactionType('expense')">Gasto</button>
                        <button type="button" id="btn-income" class="flex-1 py-2 rounded-lg font-bold text-sm transition-all text-gray-500 dark:text-dark-text/60 hover:text-gray-700 dark:hover:text-slate-200" onclick="window.ui.setTransactionType('income')">Ingreso</button>
                    </div>
                    <input type="hidden" name="type" id="input-type" value="expense">

                    <div class="mb-6 text-center">
                        <label class="block text-xs font-bold text-brand-muted dark:text-dark-text/60 uppercase tracking-wider mb-2">Importe</label>
                        <div class="relative w-full max-w-[350px] mx-auto flex items-center justify-center">
                            <div class="relative w-full">
                                <input type="number" name="amount" id="input-amount" step="0.01" min="0" 
                                    oninput="window.ui.validateDecimalInput(this)"
                                    onkeydown="window.ui.validateDecimalKeydown(event)"
                                    class="text-5xl font-bold text-brand-text dark:text-dark-text text-center w-full bg-transparent focus:outline-none placeholder-gray-300 px-8" placeholder="0.00" required autofocus>
                                <span class="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400">€</span>
                            </div>
                            
                            <div class="flex flex-col gap-1 ml-2">
                                <button type="button" onclick="window.ui.adjustAmount(1, 'input-amount')" class="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 text-brand-primary dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors active:scale-90">
                                    <i class="fa-solid fa-chevron-up text-sm"></i>
                                </button>
                                <button type="button" onclick="window.ui.adjustAmount(-1, 'input-amount')" class="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 text-brand-primary dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors active:scale-90">
                                    <i class="fa-solid fa-chevron-down text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Concept -->
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-brand-muted dark:text-dark-text/60 uppercase mb-1">Concepto</label>
                        <input type="text" name="concept" class="w-full bg-gray-50 dark:bg-white/5 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 border border-transparent dark:border-white/10" placeholder="Ej. Cena con amigos" required>
                    </div>

                    <!-- Category -->
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-brand-muted dark:text-dark-text/60 uppercase mb-1">Categoría (Opcional)</label>
                        <div class="grid grid-cols-3 gap-2" id="category-grid">
                            ${window.store.categories.filter(c => c.id !== 'cat_piggy').map(cat => `
                                <div class="category-item cursor-pointer rounded-xl p-2 border border-gray-100 dark:border-white/10 flex flex-col items-center gap-1 hover:bg-blue-50 dark:hover:bg-white/10 transition-colors" onclick="window.ui.selectCategory('${cat.id}', this)">
                                    <div class="w-8 h-8 rounded-full ${cat.color} flex items-center justify-center text-xs">
                                        <i class="fa-solid ${cat.icon}"></i>
                                    </div>
                                    <span class="text-[10px] font-medium text-center truncate w-full text-slate-600 dark:text-dark-text/80">${cat.name}</span>
                                </div>
                            `).join('')}
                        </div>
                        <input type="hidden" name="category" id="input-category">
                    </div>

                    <!-- Details -->
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-brand-muted dark:text-dark-text/60 uppercase mb-1">Detalles (Opcional)</label>
                        <textarea name="notes" class="w-full bg-gray-50 dark:bg-white/5 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 border border-transparent dark:border-white/10" rows="2" placeholder="Información adicional..."></textarea>
                    </div>

                    <!-- Invoice / File Attachment -->
                    <div class="mb-6">
                        <label class="block text-xs font-bold text-brand-muted dark:text-dark-text/60 uppercase mb-1">Factura / Ticket</label>
                        <div class="relative w-full">
                            <input type="file" name="invoice" id="input-invoice" accept="image/*,application/pdf" class="hidden" onchange="window.ui.handleFileSelect(this)">
                            <label for="input-invoice" id="label-invoice" class="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-brand-primary hover:bg-blue-50 dark:hover:bg-white/10 transition-all text-gray-500 dark:text-dark-text/60 font-medium">
                                <i class="fa-solid fa-cloud-arrow-up"></i>
                                <span>Añadir Imagen o PDF</span>
                            </label>
                        </div>
                    </div>

                    <!-- Submit -->
                    <button type="submit" class="w-full py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:scale-[1.02] transition-transform active:scale-95">
                        Guardar Movimiento
                    </button>
                    
                </form>
            </div>
        `;

        // Pre-select first category just in case
        this.currentType = 'expense';
    }

    handleFileSelect(input) {
        const label = document.getElementById('label-invoice');
        if (input.files && input.files[0]) {
            const file = input.files[0];
            label.className = 'flex items-center justify-center gap-2 w-full py-3 border-2 border-solid border-green-200 bg-green-50 rounded-xl cursor-pointer text-green-700 font-bold';
            label.innerHTML = `<i class="fa-solid fa-check"></i> <span>${file.name.substring(0, 20)}...</span>`;
        } else {
            label.className = 'flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-primary hover:bg-blue-50 transition-all text-gray-500 font-medium';
            label.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> <span>Añadir Imagen o PDF</span>`;
        }
    }

    adjustAmount(delta, inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        let current = parseFloat(input.value) || 0;
        let newValue = current + delta;

        if (newValue < 0) newValue = 0;

        input.value = newValue.toFixed(2);
        // Trigger validation just in case
        this.validateDecimalInput(input);
    }

    validateDecimalInput(input) {
        // Get value
        let val = input.value;

        // 1. Replace comma with dot for consistency (if browser allows typing it)
        val = val.replace(/,/g, '.');

        // 2. Remove any non-numeric and non-dot characters (prevent multiple dots too)
        // Keep only first dot
        if ((val.match(/\./g) || []).length > 1) {
            const parts = val.split('.');
            val = parts[0] + '.' + parts.slice(1).join('');
        }

        // 3. Limit to 2 decimal places
        if (val.includes('.')) {
            const parts = val.split('.');
            if (parts[1].length > 2) {
                val = parts[0] + '.' + parts[1].substring(0, 2);
            }
        }

        // Update input if different
        if (input.value !== val) {
            input.value = val;
        }
    }

    validateDecimalKeydown(event) {
        // Allow: backspace, delete, tab, escape, enter
        if ([46, 8, 9, 27, 13, 110].indexOf(event.keyCode) !== -1 ||
            // Allow: Ctrl+A, Command+A
            (event.keyCode === 65 && (event.ctrlKey === true || event.metaKey === true)) ||
            // Allow: home, end, left, right, down, up
            (event.keyCode >= 35 && event.keyCode <= 40)) {
            // let it happen, don't do anything
            return;
        }

        const key = event.key;

        // Allow ONLY numbers
        if (/^[0-9]$/.test(key)) {
            return;
        }

        // Allow ONE comma or dot if not present
        if ((key === '.' || key === ',') && !event.target.value.includes('.') && !event.target.value.includes(',')) {
            return;
        }

        // Block everything else
        event.preventDefault();
    }

    setTransactionType(type) {
        this.currentType = type;
        document.getElementById('input-type').value = type;

        const btnExpense = document.getElementById('btn-expense');
        const btnIncome = document.getElementById('btn-income');

        if (type === 'expense') {
            btnExpense.className = 'flex-1 py-2 rounded-lg font-bold text-sm transition-all bg-white text-status-expenseText shadow-sm';
            btnIncome.className = 'flex-1 py-2 rounded-lg font-bold text-sm transition-all text-gray-500 hover:text-gray-700';
        } else {
            btnIncome.className = 'flex-1 py-2 rounded-lg font-bold text-sm transition-all bg-white text-status-incomeText shadow-sm';
            btnExpense.className = 'flex-1 py-2 rounded-lg font-bold text-sm transition-all text-gray-500 hover:text-gray-700';
        }
    }

    selectCategory(id, element) {
        const input = document.getElementById('input-category');
        const currentId = input.value;

        // Clear previous selection UI
        document.querySelectorAll('.category-item').forEach(el => {
            el.classList.remove('bg-blue-50', 'border-brand-primary', 'ring-2', 'ring-blue-100');
            el.classList.add('border-gray-100');
        });

        // If clicking same category, deselect it
        if (currentId === id) {
            input.value = '';
            return;
        }

        // Set new selection UI
        element.classList.remove('border-gray-100');
        element.classList.add('bg-blue-50', 'border-brand-primary', 'ring-2', 'ring-blue-100');

        // Update hidden input
        input.value = id;
    }

    async handleSubmit(event) {
        const formData = new FormData(event.target);
        const fileInput = document.getElementById('input-invoice');

        let fileData = null;
        if (fileInput.files && fileInput.files[0]) {
            try {
                fileData = await this.readFileAsBase64(fileInput.files[0]);
            } catch (err) {
                alert('Error al leer el archivo');
                return;
            }
        }

        const data = {
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            concept: formData.get('concept'),
            category: formData.get('category'),
            notes: formData.get('notes'),
            invoice: fileData, // Save Base64 string
            date: new Date().toISOString()
        };

        window.store.addTransaction(data);
        this.showNotification('Movimiento añadido correctamente');
        window.router.navigate('home');
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    renderAccount(filterType = 'all') {
        // filterType: 'all' | 'income' | 'expense' | 'piggy' | 'other'

        // Helper to identify Piggy Bank transactions
        const isPiggy = (t) => t.notes && (
            t.notes.includes('Ahorro automático') ||
            t.notes.includes('Depósito inicial hucha') ||
            (t.concept && t.concept.startsWith('Añadido a')) ||
            (t.concept && t.concept.startsWith('Apertura'))
        );

        let txs = window.store.transactions;
        if (filterType === 'income') {
            txs = txs.filter(t => t.type === 'income');
        } else if (filterType === 'expense') {
            txs = txs.filter(t => t.type === 'expense' && !isPiggy(t));
        } else if (filterType === 'piggy') {
            txs = txs.filter(t => isPiggy(t));
        } else if (filterType === 'other') {
            txs = txs.filter(t => !t.category || t.category === 'other' || t.category === '');
        }

        const btnClassActive = "px-4 py-1.5 rounded-full bg-brand-primary text-white text-sm font-bold whitespace-nowrap shadow-lg shadow-blue-200 dark:shadow-none transition-all";
        const btnClassInactive = "px-4 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-dark-text/60 text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/10 whitespace-nowrap transition-colors";

        this.app.innerHTML = `
            <div class="space-y-4 animate-fade-in">
                <div class="bg-white dark:bg-dark-surface rounded-xl p-4 shadow-sm border border-gray-100 dark:border-white/10 flex gap-2 overflow-x-auto no-scrollbar transition-colors">
                    <button onclick="window.ui.renderAccount('all')" 
                        class="${filterType === 'all' ? btnClassActive : btnClassInactive}">
                        Todo
                    </button>
                    <button onclick="window.ui.renderAccount('income')" 
                        class="${filterType === 'income' ? btnClassActive : btnClassInactive}">
                        Ingresos
                    </button>
                    <button onclick="window.ui.renderAccount('expense')" 
                        class="${filterType === 'expense' ? btnClassActive : btnClassInactive}">
                        Gastos
                    </button>
                     <button onclick="window.ui.renderAccount('piggy')" 
                        class="${filterType === 'piggy' ? btnClassActive : btnClassInactive}">
                        Huchas
                    </button>
                    <button onclick="window.ui.renderAccount('other')" 
                        class="${filterType === 'other' ? btnClassActive : btnClassInactive}">
                        Otros
                    </button>
                </div>

                <div class="space-y-3">
                    ${txs.length === 0 ? `
                        <div class="text-center py-10 opacity-50">
                            <i class="fa-solid fa-filter text-4xl mb-2 text-gray-300 dark:text-gray-600"></i>
                            <p class="text-sm text-slate-500 dark:text-dark-text/60">No hay movimientos</p>
                        </div>
                    ` : txs.map(tx => this.renderTransactionItem(tx)).join('')}
                </div>
            </div>
         `;
    }

    renderStats(type = null, chartType = null, togglePiggy = null) {
        // Persist state
        if (type) this.currentStatsType = type;
        if (chartType) this.currentChartType = chartType;
        if (togglePiggy !== null) this.showPiggyBanks = togglePiggy;

        // Defaults
        const currentType = this.currentStatsType || 'expense';
        const currentChart = this.currentChartType || 'doughnut';
        const showPiggy = this.showPiggyBanks || false;

        const transactions = window.store.filterTransactions(this.currentFilter);

        // Calculate Totals by Category
        const categories = [...window.store.categories]; // Copy
        const totalsByCategory = {};
        let totalAmount = 0;

        // Add special categories if needed
        // We'll handle 'others' dynamically, but let's define metadata for them
        const piggyCat = { id: 'cat_piggy', name: 'Huchas', icon: 'fa-piggy-bank', color: 'bg-teal-100 text-teal-600' };
        const otherCat = { id: 'cat_other', name: 'Otros', icon: 'fa-circle-question', color: 'bg-gray-100 text-gray-600' };

        transactions.forEach(tx => {
            if (tx.type === currentType) {
                let catId = tx.category;

                // Detect Piggy Bank transfers (Expenses only usually)
                // Improved Piggy detection logic consistent with renderAccount
                const isPiggy = (tx.notes && (tx.notes.includes('Ahorro automático') || tx.notes.includes('Depósito inicial hucha'))) ||
                    (tx.concept && (tx.concept.startsWith('Añadido a') || tx.concept.startsWith('Apertura')));

                if (isPiggy) {
                    if (!showPiggy) return; // Skip if Hidden
                    catId = 'cat_piggy';
                } else if (!categories.find(c => c.id === catId)) {
                    catId = 'cat_other';
                }

                if (!totalsByCategory[catId]) totalsByCategory[catId] = 0;
                totalsByCategory[catId] += tx.amount;
                totalAmount += tx.amount;
            }
        });

        // Add 'Otros' to categories list if it has data
        // Hucha is now a permanent category, so no need to push manually unless we want to hide it if empty?
        // But renderStats logic relies on iterating ALL categories.
        // Let's just remove the manual push for piggy
        // Add 'Huchas' to categories list if it has data (since it's no longer in default list)
        // Only if not already present (failsafe for migration edge cases)
        if (totalsByCategory['cat_piggy'] && !categories.find(c => c.id === 'cat_piggy')) {
            categories.push(piggyCat);
        }

        if (totalsByCategory['cat_other']) categories.push(otherCat);

        const labels = categories.map(c => c.name);
        const data = categories.map(c => totalsByCategory[c.id] || 0);

        const expenseColors = [
            '#fb923c', '#60a5fa', '#c084fc', '#f472b6', '#f87171', '#4ade80',
            '#2dd4bf', // Teal (Huchas)
            '#94a3b8', // Gray (Otros)
        ];

        const incomeColors = [
            '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#a78bfa', '#fb7185',
            '#2dd4bf', // Teal (Huchas - unlikely for income but consistent)
            '#94a3b8', // Gray (Otros)
        ];

        // We need to match colors to the extended categories list
        // Store categories are first 6. Then appended.
        // Let's construct a color array that matches `categories` length
        const baseColors = currentType === 'expense' ? expenseColors : incomeColors;
        const chartColors = categories.map((c, i) => {
            if (c.id === 'cat_piggy') return '#2dd4bf'; // Teal-400
            if (c.id === 'cat_tech') return '#06b6d4'; // Cyan-500
            if (c.id === 'cat_other') return '#94a3b8'; // Slate-400
            // Fallback to index mapping for standard cats
            return baseColors[i] || '#cbd5e1';
        });

        const activeClass = "bg-white dark:bg-slate-700 text-brand-primary dark:text-white shadow-sm font-bold";
        const inactiveClass = "text-gray-500 dark:text-dark-text/60 hover:text-gray-700 dark:hover:text-slate-200 font-medium";

        this.app.innerHTML = `
            <div class="space-y-6 animate-fade-in pb-20">
                <h2 class="text-2xl font-bold text-brand-text dark:text-dark-text px-1">Estadísticas</h2>
                
                <!-- Type Toggle (Expense/Income) -->
                <div class="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 mx-1 mb-2">
                    <button onclick="window.ui.renderStats('expense', null, null)" class="flex-1 py-2 rounded-lg text-sm transition-all ${currentType === 'expense' ? activeClass : inactiveClass}">
                        Gastos
                    </button>
                    <button onclick="window.ui.renderStats('income', null, null)" class="flex-1 py-2 rounded-lg text-sm transition-all ${currentType === 'income' ? activeClass : inactiveClass}">
                        Ingresos
                    </button>
                </div>

                <!-- Chart Type Selector -->
                <div class="flex justify-center gap-4 mb-4">
                    <button onclick="window.ui.renderStats(null, 'doughnut', null)" class="w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentChart === 'doughnut' ? 'bg-brand-primary text-white shadow-md' : 'bg-white dark:bg-white/5 text-gray-400 hover:text-brand-primary'}">
                        <i class="fa-solid fa-chart-pie"></i>
                    </button>
                    <button onclick="window.ui.renderStats(null, 'pie', null)" class="w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentChart === 'pie' ? 'bg-brand-primary text-white shadow-md' : 'bg-white dark:bg-white/5 text-gray-400 hover:text-brand-primary'}">
                        <i class="fa-solid fa-pizza-slice"></i>
                    </button>
                     <button onclick="window.ui.renderStats(null, 'bar', null)" class="w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentChart === 'bar' ? 'bg-brand-primary text-white shadow-md' : 'bg-white dark:bg-white/5 text-gray-400 hover:text-brand-primary'}">
                        <i class="fa-solid fa-chart-simple"></i>
                    </button>
                    <button onclick="window.ui.renderStats(null, 'polarArea', null)" class="w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentChart === 'polarArea' ? 'bg-brand-primary text-white shadow-md' : 'bg-white dark:bg-white/5 text-gray-400 hover:text-brand-primary'}">
                        <i class="fa-regular fa-snowflake"></i>
                    </button>
                </div>

                 <!-- Piggy Bank Toggle -->
                <div class="flex justify-end px-2 mb-2">
                    <button onclick="window.ui.renderStats(null, null, ${!showPiggy})" class="text-xs flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${showPiggy ? 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-700' : 'bg-white text-gray-500 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-transparent'}">
                        <i class="fa-solid ${showPiggy ? 'fa-check' : 'fa-piggy-bank'}"></i>
                        ${showPiggy ? 'Huchas Incluidas' : 'Incluir Huchas'}
                    </button>
                </div>

                 <!-- Chart Card -->
                <div class="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors">
                    <h3 class="font-bold text-brand-text dark:text-dark-text mb-6">
                        ${currentType === 'expense' ? 'Gastos' : 'Ingresos'} por Categoría
                    </h3>
                    <div class="h-64 relative flex justify-center">
                        <canvas id="categoryChart"></canvas>
                    </div>
                    <div class="text-center mt-4">
                        <p class="text-xs text-brand-muted dark:text-dark-text/60 uppercase tracking-wider">Total</p>
                        <p class="text-2xl font-bold ${currentType === 'expense' ? 'text-brand-text dark:text-dark-text' : 'text-status-incomeText dark:text-green-400'}">
                            ${this.formatMoney(totalAmount)}
                        </p>
                    </div>
                </div>

                <!-- Category Details List -->
                <div class="space-y-3">
                    ${categories.map((cat, index) => {
            const amount = totalsByCategory[cat.id] || 0;
            const percentage = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
            if (amount === 0) return '';
            return `
                        <div class="bg-white dark:bg-dark-surface rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-transparent hover:border-gray-100 dark:hover:border-white/10 transition-all">
                            <div class="w-10 h-10 rounded-full ${cat.color} flex items-center justify-center text-md shadow-sm">
                                <i class="fa-solid ${cat.icon}"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-bold text-brand-text dark:text-dark-text">${cat.name}</h4>
                                <div class="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5 mt-2">
                                    <div class="bg-brand-primary h-1.5 rounded-full" style="width: ${percentage}%; background-color: ${chartColors[index]}"></div>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-brand-text dark:text-dark-text">${this.formatMoney(amount)}</p>
                                <p class="text-xs text-brand-muted dark:text-dark-text/60">${percentage}%</p>
                            </div>
                        </div>
                        `;
        }).join('')}
                    
                    ${totalAmount === 0 ? '<div class="text-center text-gray-400 dark:text-dark-text/40 py-4">No hay datos en este periodo</div>' : ''}
                </div>
            </div>
        `;

        // Render Chart
        setTimeout(() => {
            const ctx = document.getElementById('categoryChart');
            if (ctx) {
                // Config options based on type
                const isBar = currentChart === 'bar';
                const scales = isBar ? {
                    y: { beginAtZero: true, grid: { color: this.getChartGridColor() } },
                    x: { grid: { display: false } }
                } : {
                    x: { display: false },
                    y: { display: false }
                };

                new Chart(ctx, {
                    type: currentChart,
                    data: {
                        labels: labels,
                        datasets: [{
                            label: currentType === 'expense' ? 'Gastos' : 'Ingresos',
                            data: data,
                            backgroundColor: chartColors,
                            borderWidth: 0,
                            hoverOffset: 4,
                            borderRadius: isBar ? 4 : 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: !isBar, // Hide legend for bar chart usually
                                position: 'bottom',
                                labels: { usePointStyle: true, padding: 20, font: { family: 'DM Sans' } }
                            }
                        },
                        scales: scales,
                        cutout: currentChart === 'doughnut' ? '70%' : 0,
                    }
                });
            }
        }, 50);
    }

    getChartGridColor() {
        return document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    }

    applyTheme(themeName) {
        const root = document.documentElement;
        const themes = {
            'default': {
                '--color-brand-primary': '#6366f1', // Indigo
                '--color-brand-secondary': '#4f46e5',
                '--color-brand-accent': '#818cf8',
                '--color-brand-bg': '#f8fafc',
                '--body-bg-light': '#F5F2FF',
                '--body-bg-dark': '#050505' // Much Darker
            },
            'gold': {
                '--color-brand-primary': '#D4AF37', // Gold
                '--color-brand-secondary': '#C5A028',
                '--color-brand-accent': '#E5C158',
                '--color-brand-bg': '#FAFAFA',
                '--body-bg-light': '#FFFCF0',
                '--body-bg-dark': '#000000' // True Black
            },
            'emerald': {
                '--color-brand-primary': '#10B981', // Emerald
                '--color-brand-secondary': '#047857',
                '--color-brand-accent': '#34D399',
                '--color-brand-bg': '#F0FDF4',
                '--body-bg-light': '#F0FDF4',
                '--body-bg-dark': '#011c15' // Deep Green/Black
            },
            'rose': {
                '--color-brand-primary': '#F43F5E', // Rose
                '--color-brand-secondary': '#E11D48',
                '--color-brand-accent': '#FB7185',
                '--color-brand-bg': '#FFF1F2',
                '--body-bg-light': '#FFF1F2',
                '--body-bg-dark': '#0f0506' // Deep Rose/Black
            }
        };

        const theme = themes[themeName] || themes['default'];
        for (const [key, value] of Object.entries(theme)) {
            root.style.setProperty(key, value);
        }

        // Save if initialized with valid store
        if (window.store) {
            window.store.updateSetting('theme', themeName);
            // Re-render settings if actively viewing settings (check for tab bar or palette icon)
            // This ensures feedback loop is closed
            if (window.router && window.router.currentRoute === 'settings') {
                this.renderSettings('appearance');
            }
        }
    }

    renderSettings(activeTab = 'general') {
        const user = window.auth.user || { email: 'invitado@pocketfinance.app' };
        const userAvatar = user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email)}&background=random&size=128`;

        const isDark = localStorage.getItem('finance_dark_mode') === 'true';
        const isDyslexic = localStorage.getItem('finance_access_dyslexic') === 'true';
        const isHighContrast = localStorage.getItem('finance_access_contrast') === 'true';
        const colorBlindMode = localStorage.getItem('finance_access_colorblind') || 'none';
        const currentCurrency = window.store?.settings?.currency || 'EUR';
        const currentTheme = window.store?.settings?.theme || 'default';

        // --- Tabs Logic ---
        const tabs = [
            { id: 'general', label: 'General', icon: 'fa-sliders' },
            { id: 'appearance', label: 'Apariencia', icon: 'fa-palette' },
            { id: 'account', label: 'Cuenta', icon: 'fa-user-shield' }
        ];

        // --- Content rendering based on activeTab ---
        let contentHtml = '';

        if (activeTab === 'general') {
            contentHtml = `
                <div class="space-y-6 animate-fade-in">
                    <!-- Preferences Group -->
                     <div class="bg-white dark:bg-dark-surface rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5">
                        
                        <!-- Currency -->
                        <div class="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                             <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                    <i class="fa-solid fa-coins"></i>
                                </div>
                                <span class="font-bold text-slate-700 dark:text-slate-200">Moneda Principal</span>
                            </div>
                            <div class="relative group">
                                <select onchange="window.ui.updateCurrency(this.value)" class="appearance-none bg-gray-100 dark:bg-white/10 hover:bg-gray-200 border-none text-brand-primary dark:text-white font-bold text-sm rounded-xl focus:ring-0 cursor-pointer py-2.5 pl-4 pr-10 transition-colors">
                                    <option value="EUR" ${currentCurrency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                                    <option value="USD" ${currentCurrency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                    <option value="GBP" ${currentCurrency === 'GBP' ? 'selected' : ''}>GBP (£)</option>
                                    <option value="JPY" ${currentCurrency === 'JPY' ? 'selected' : ''}>JPY (¥)</option>
                                    <option value="PLN" ${currentCurrency === 'PLN' ? 'selected' : ''}>PLN (zł)</option>
                                </select>
                                <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-brand-muted pointer-events-none group-hover:text-brand-primary transition-colors"></i>
                            </div>
                        </div>

                        <!-- Categories -->
                        <button onclick="window.ui.renderCategoryManager()" class="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left">
                             <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                                    <i class="fa-solid fa-tags"></i>
                                </div>
                                <div>
                                    <span class="block font-bold text-slate-700 dark:text-slate-200">Categorías</span>
                                </div>
                            </div>
                             <i class="fa-solid fa-chevron-right text-gray-300"></i>
                        </button>
                    </div>

                    <!-- Accessibility Group: Dyslexic & Contrast -->
                     <h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-4">Accesibilidad</h3>
                     <div class="bg-white dark:bg-dark-surface rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5">
                        
                         <div class="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                    <i class="fa-solid fa-font"></i>
                                </div>
                                <span class="font-bold text-slate-700 dark:text-slate-200">Lectura Fácil</span>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" onchange="window.ui.setAccessMode('dyslexic', this.checked)" ${isDyslexic ? 'checked' : ''}>
                                <div class="w-12 h-7 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-primary"></div>
                            </label>
                        </div>

                         <div class="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                                    <i class="fa-solid fa-circle-half-stroke"></i>
                                </div>
                                <span class="font-bold text-slate-700 dark:text-slate-200">Alto Contraste</span>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" onchange="window.ui.setAccessMode('contrast', this.checked)" ${isHighContrast ? 'checked' : ''}>
                                <div class="w-12 h-7 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        } else if (activeTab === 'appearance') {
            contentHtml = `
                <div class="space-y-6 animate-fade-in" id="appearance-tab-content">
                    <!-- Themes -->
                    <div class="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5">
                        <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Tema de Color</h4>
                        <!-- Added pt-4 and px-2 to prevent clipping of scale/ring -->
                        <div class="flex gap-6 overflow-x-auto pb-4 pt-4 px-2 no-scrollbar sm:justify-start justify-between">
                            ${this._renderThemeOption('default', '#6366f1', currentTheme)}
                            ${this._renderThemeOption('gold', '#D4AF37', currentTheme)}
                            ${this._renderThemeOption('emerald', '#10B981', currentTheme)}
                            ${this._renderThemeOption('rose', '#F43F5E', currentTheme)}
                        </div>
                    </div>

                    <!-- Dark Mode -->
                    <div class="bg-white dark:bg-dark-surface rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 p-5 flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-500/30">
                                <i class="fa-solid fa-moon"></i>
                            </div>
                            <span class="font-bold text-slate-700 dark:text-slate-200">Modo Oscuro</span>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" onchange="window.ui.toggleDarkMode()" ${isDark ? 'checked' : ''}>
                            <div class="w-12 h-7 bg-gray-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-primary transition-colors"></div>
                        </label>
                    </div>

                    <!-- Color Blindness (Graphic Selector) -->
                    <div class="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                                <i class="fa-solid fa-eye"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-slate-700 dark:text-slate-200">Modo Daltonismo</h4>
                                <span class="text-xs text-slate-400">Ajusta los colores para tu visión</span>
                            </div>
                        </div>
                        
                        <!-- Responsive Grid: 1 col mobile, 2 cols tablet/desktop -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${this._renderColorBlindOption('none', 'Visión Normal', 'fa-eye', 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white', colorBlindMode)}
                            ${this._renderColorBlindOption('protanopia', 'Protanopia (Rojo)', 'fa-eye-slash', 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400', colorBlindMode)}
                            ${this._renderColorBlindOption('deuteranopia', 'Deuteranopia (Verde)', 'fa-eye-low-vision', 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400', colorBlindMode)}
                            ${this._renderColorBlindOption('tritanopia', 'Tritanopia (Azul)', 'fa-glasses', 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400', colorBlindMode)}
                        </div>
                    </div>
                </div>
            `;
        } else if (activeTab === 'account') {
            contentHtml = `
                <div class="space-y-6 animate-fade-in">
                     <!-- Profile Actions -->
                     <button onclick="window.ui.renderEditProfileModal()" class="w-full bg-white dark:bg-dark-surface rounded-3xl p-5 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                        <div class="flex items-center gap-4">
                            <div class="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-2xl overflow-hidden shrink-0">
                                ${userAvatar ? `<img src="${userAvatar}" class="w-full h-full object-cover">` : '<i class="fa-solid fa-user-pen"></i>'}
                            </div>
                            <div class="text-left w-full">
                                <span class="block font-bold text-lg text-slate-700 dark:text-slate-200">${user.user_metadata?.full_name || 'Usuario'}</span>
                                <span class="block text-xs text-brand-primary font-bold uppercase tracking-wider mb-1">Pro Member</span>
                                
                                ${user.user_metadata?.location ? `<div class="flex items-center gap-1 text-xs text-slate-400 mb-1"><i class="fa-solid fa-location-dot"></i> ${user.user_metadata.location}</div>` : ''}
                                
                                <div class="flex flex-wrap gap-2 mt-2">
                                     ${user.user_metadata?.phone ? `<span class="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-xs text-slate-500 dark:text-slate-300"><i class="fa-solid fa-phone mr-1"></i> ${user.user_metadata.phone}</span>` : ''}
                                     <span class="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-xs text-slate-500 dark:text-slate-300"><i class="fa-solid fa-envelope mr-1"></i> ${user.email}</span>
                                </div>

                                ${user.user_metadata?.bio ? `<p class="mt-3 text-sm text-slate-500 dark:text-slate-400 italic">"${user.user_metadata.bio}"</p>` : ''}
                            </div>
                        </div>
                        <div class="self-start mt-2">
                            <i class="fa-solid fa-pen-to-square text-brand-primary"></i>
                        </div>
                    </button>

                    <!-- Add Bank Account (DEV/PREMIUM) -->
                    <button disabled class="w-full bg-gray-50 dark:bg-white/5 rounded-3xl p-5 shadow-inner border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-between opacity-75 cursor-not-allowed group relative overflow-hidden">
                        <div class="flex items-center gap-4 z-10">
                            <div class="w-12 h-12 rounded-full bg-slate-200 dark:bg-white/10 text-slate-400 flex items-center justify-center text-xl">
                                <i class="fa-solid fa-building-columns"></i>
                            </div>
                            <div class="text-left">
                                <span class="block font-bold text-slate-500 dark:text-slate-400">Añadir Cuenta Bancaria</span>
                                <span class="text-xs text-brand-primary font-bold uppercase tracking-wide">
                                    <i class="fa-solid fa-crown mr-0.5"></i> Premium / En Desarrollo
                                </span>
                            </div>
                        </div>
                         <i class="fa-solid fa-lock text-slate-300 z-10"></i>
                         <!-- Diagonal lines pattern -->
                         <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style="background-image: repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%); background-size: 10px 10px;"></div>
                    </button>

                    <!-- Account Actions -->
                     <div class="bg-white dark:bg-dark-surface rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-white/5 divide-y divide-gray-50 dark:divide-white/5">
                        <button onclick="window.auth.signOut()" class="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group text-left">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">
                                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                                </div>
                                <span class="font-bold text-slate-700 dark:text-slate-200">Cerrar Sesión</span>
                            </div>
                        </button>
                        
                        <button onclick="window.ui.showDeleteAccountModal()" class="w-full flex items-center justify-between p-5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group text-left">
                             <div class="flex items-center gap-4">
                                <div class="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                    <i class="fa-solid fa-trash-can"></i>
                                </div>
                                <span class="font-bold text-red-600 dark:text-red-400">Eliminar Cuenta</span>
                            </div>
                        </button>
                     </div>
                </div>
            `;
        }

        // --- Main Render ---
        this.app.innerHTML = `
            <div class="max-w-3xl mx-auto space-y-6 animate-fade-in pb-32">
                
                <!-- Minimal Hero (Common) -->
                 <div class="flex items-center gap-4 mb-2 px-2">
                    <div class="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-brand-primary to-purple-500">
                        <img src="${userAvatar}" 
                            class="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900">
                    </div>
                    <div>
                        <h2 class="text-xl font-display font-bold text-slate-800 dark:text-white leading-tight">${user.user_metadata?.full_name || 'Usuario'}</h2>
                        <span class="text-xs font-medium px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full">Pro Member</span>
                    </div>
                </div>

                <!-- Tab Bar -->
                <div class="bg-white dark:bg-dark-surface p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex gap-1 sticky top-0 z-20 backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80">
                    ${tabs.map(tab => `
                        <button id="tab-btn-${tab.id}" onclick="window.ui.renderSettings('${tab.id}')" 
                            class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-brand-bg dark:bg-white/10 text-brand-primary dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-white/5'}">
                            <i class="fa-solid ${tab.icon}"></i>
                            <span>${tab.label}</span>
                        </button>
                    `).join('')}
                </div>

                <!-- Content Area -->
                <div class="min-h-[400px]">
                    ${contentHtml}
                </div>

                <div class="text-center pt-8 pb-4 opacity-40">
                    <p class="text-[10px] uppercase tracking-widest text-brand-muted">PocketFinance Settings</p>
                </div>
            </div>
        `;
    }

    _renderThemeOption(value, color, currentTheme) {
        const isActive = currentTheme === value;
        const labels = { 'default': 'Classic', 'gold': 'Gold', 'emerald': 'Nature', 'rose': 'Berry' };

        return `
            <button onclick="window.ui.applyTheme('${value}')" class="group relative flex flex-col items-center gap-3 min-w-[80px]">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110 shadow-lg shadow-brand-primary/30 ring-4 ring-brand-primary/20' : 'hover:scale-105 shadow-sm hover:shadow-md'} overflow-hidden relative">
                    <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent z-10"></div>
                    <div style="background-color: ${color}" class="absolute inset-0"></div>
                    ${isActive ? '<i class="fa-solid fa-check text-white text-xl z-20 drop-shadow-md animate-fade-in"></i>' : ''}
                </div>
                <span class="text-xs font-bold uppercase tracking-wide transition-colors ${isActive ? 'text-brand-primary' : 'text-gray-400 group-hover:text-gray-600'}">
                    ${labels[value]}
                </span>
            </button>
        `;
    }

    _renderColorBlindOption(mode, label, icon, colorClass, currentMode) {
        const isActive = currentMode === mode;
        return `
            <button onclick="window.ui.setAccessMode('colorblind', '${mode}')" 
                class="relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group
                ${isActive
                ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-md shadow-brand-primary/20 scale-[1.02]'
                : 'border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:scale-[1.01]'}">
                
                <div class="flex items-center gap-4 mb-3">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center ${colorClass} text-xl shadow-sm transition-transform group-hover:scale-110">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    ${isActive ? '<div class="absolute top-4 right-4 bg-brand-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md"><i class="fa-solid fa-check"></i></div>' : ''}
                </div>
                
                <span class="block text-base font-bold text-slate-700 dark:text-slate-200 mb-1">${label}</span>
                <span class="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">
                    ${mode === 'none' ? 'Visión Normal' : 'Filtro de corrección activo'}
                </span>
            </button>
        `;
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    renderEditProfileModal() {
        const user = window.auth.user;
        const currentName = user.user_metadata?.full_name || '';
        const currentPhoto = user.user_metadata?.avatar_url || '';
        const currentBio = user.user_metadata?.bio || '';
        let currentPhone = user.user_metadata?.phone || '';
        const currentLocation = user.user_metadata?.location || '';
        const currentEmail = user.email || '';

        // Country Codes Configuration
        const countries = [
            { code: 'ES', dial: '+34', flag: '🇪🇸', maxLength: 9 },
            { code: 'US', dial: '+1', flag: '🇺🇸', maxLength: 10 },
            { code: 'UK', dial: '+44', flag: '🇬🇧', maxLength: 10 },
            { code: 'FR', dial: '+33', flag: '🇫🇷', maxLength: 9 },
            { code: 'DE', dial: '+49', flag: '🇩🇪', maxLength: 11 },
            { code: 'IT', dial: '+39', flag: '🇮🇹', maxLength: 10 },
            { code: 'PT', dial: '+351', flag: '🇵🇹', maxLength: 9 }
        ];

        // Detect current country logic
        let selectedCountry = countries[0]; // Default ES
        let phoneNumber = currentPhone;

        // Try to match dial code
        const foundCountry = countries.find(c => currentPhone.startsWith(c.dial));
        if (foundCountry) {
            selectedCountry = foundCountry;
            phoneNumber = currentPhone.replace(foundCountry.dial, '').trim();
        }

        const modalHtml = `
            <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onclick="this.remove()">
                <div class="bg-white dark:bg-dark-surface w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-gray-100 dark:border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar" onclick="event.stopPropagation()">
                    <button class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white" onclick="this.closest('.fixed').remove()">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                    
                    <h2 class="text-xl font-bold text-brand-text dark:text-dark-text mb-6 text-center">Editar Perfil</h2>
                    
                    <form onsubmit="event.preventDefault(); window.ui.handleProfileUpdate(event, this)">
                        
                         <div class="mb-6">
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Foto de Perfil</label>
                            
                            <!-- Preview & Upload -->
                            <div class="flex items-center gap-4 mb-3">
                                <div class="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-white/10 group relative">
                                    <img id="avatar-preview" src="${currentPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentName)}" class="w-full h-full object-cover">
                                    <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <i class="fa-solid fa-camera text-white"></i>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <label for="avatar-upload" class="cursor-pointer bg-brand-primary text-white border border-transparent px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-secondary transition-colors inline-flex items-center gap-2 mb-2 shadow-lg shadow-brand-primary/20">
                                        <i class="fa-solid fa-cloud-arrow-up"></i> Subir imagen
                                    </label>
                                    <input type="file" id="avatar-upload" name="avatarFile" accept="image/*" class="hidden" 
                                        onchange="const file = this.files[0]; if(file) { const reader = new FileReader(); reader.onload = (e) => document.getElementById('avatar-preview').src = e.target.result; reader.readAsDataURL(file); }">
                                        
                                    <p class="text-xs text-slate-400 dark:text-slate-500">Recomendado: 500x500px. JPG, PNG.</p>
                                </div>
                            </div>

                            <!-- URL Fallback Toggle -->
                            <details class="text-xs text-slate-400">
                                <summary class="cursor-pointer hover:text-brand-primary transition-colors">Usar URL externa</summary>
                                <input type="url" name="avatarUrl" value="${currentPhoto}" placeholder="https://example.com/avatar.jpg" 
                                    class="w-full mt-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm"
                                    oninput="document.getElementById('avatar-preview').src = this.value || 'https://ui-avatars.com/api/?name=User'">
                            </details>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nombre Completo</label>
                            <input type="text" name="fullName" value="${currentName}" placeholder="Tu nombre" required
                                class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                        </div>

                         <div class="mb-4">
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Teléfono</label>
                            <div class="flex gap-2 relative">
                                <!-- Hidden input to store the selected code -->
                                <input type="hidden" name="phoneCode" id="phoneCodeInput" value="${selectedCountry.dial}">
                                
                                <!-- Custom Dropdown Trigger -->
                                <button type="button" id="country-trigger" 
                                    onclick="document.getElementById('country-list').classList.toggle('hidden')"
                                    class="w-32 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-3 font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm flex items-center justify-between gap-2">
                                    <span id="selected-flag">${selectedCountry.flag}</span>
                                    <span id="selected-dial">${selectedCountry.dial}</span>
                                    <i class="fa-solid fa-chevron-down text-xs text-slate-400"></i>
                                </button>

                                <!-- Custom Dropdown List -->
                                <div id="country-list" class="hidden absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 max-h-60 overflow-y-auto no-scrollbar animate-fade-in">
                                    ${countries.map(c => `
                                        <div onclick="
                                            document.getElementById('phoneCodeInput').value = '${c.dial}';
                                            document.getElementById('selected-flag').textContent = '${c.flag}';
                                            document.getElementById('selected-dial').textContent = '${c.dial}';
                                            const phoneInput = document.getElementById('phone-number-input');
                                            phoneInput.maxLength = ${c.maxLength};
                                            if(phoneInput.value.length > ${c.maxLength}) phoneInput.value = phoneInput.value.slice(0, ${c.maxLength});
                                            document.getElementById('country-list').classList.add('hidden');
                                        " class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors border-b border-gray-50 dark:border-white/5 last:border-0">
                                            <span class="text-lg">${c.flag}</span>
                                            <span class="font-bold text-slate-700 dark:text-slate-200">${c.dial}</span>
                                            <span class="text-xs text-slate-400 ml-auto">${c.code}</span>
                                        </div>
                                    `).join('')}
                                </div>

                                <!-- Backdrop to close -->
                                <div onclick="document.getElementById('country-list').classList.add('hidden')" class="fixed inset-0 z-40 hidden" id="country-backdrop"></div>
                                <script>
                                    // Toggle backdrop with list
                                    const trigger = document.getElementById('country-trigger');
                                    const list = document.getElementById('country-list');
                                    const backdrop = document.getElementById('country-backdrop');
                                    
                                    trigger.onclick = () => {
                                        const isHidden = list.classList.contains('hidden');
                                        list.classList.toggle('hidden');
                                        backdrop.classList.toggle('hidden');
                                    }
                                    backdrop.onclick = () => {
                                        list.classList.add('hidden');
                                        backdrop.classList.add('hidden');
                                    }
                                </script>

                                <input type="tel" id="phone-number-input" name="phoneNumber" value="${phoneNumber}" placeholder="000 00 00 00" maxlength="${selectedCountry.maxLength}"
                                    class="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                                    oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email (Doble Verificación)</label>
                            <div class="relative">
                                <input type="email" name="email" id="input-email" value="${currentEmail}" placeholder="tu@email.com" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                                oninput="document.getElementById('password-verify-container').classList.toggle('hidden', this.value === '${currentEmail}')">
                                <i class="fa-solid fa-envelope absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                            </div>
                            <p class="text-xs text-slate-400 mt-1 pl-1">Si cambias el email, deberás confirmarlo en ambas cuentas.</p>
                        </div>
                        
                        <!-- Password Verification (Hidden by default) -->
                        <div id="password-verify-container" class="hidden mb-4 animate-fade-in">
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Contraseña Actual <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <input type="password" name="password" placeholder="Confirma tu contraseña para continuar"
                                    class="w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl px-4 py-3 font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all">
                                <i class="fa-solid fa-lock absolute right-4 top-1/2 transform -translate-y-1/2 text-red-500"></i>
                            </div>
                             <p class="text-xs text-red-500 mt-1 font-medium"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Requerido para cambiar el email</p>
                        </div>

                         <div class="mb-4">
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Ubicación</label>
                            <input type="text" name="location" value="${currentLocation}" placeholder="Ciudad, País" 
                                class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                        </div>

                         <div class="mb-6">
                            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Biografía</label>
                            <textarea name="bio" rows="3" placeholder="Cuéntanos un poco sobre ti..."
                                class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-medium dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all resize-none">${currentBio}</textarea>
                        </div>
                        
                        <div id="profile-error" class="hidden text-red-500 text-sm text-center font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded-lg mb-4 border border-red-100 dark:border-red-900/10"></div>
                        <div id="profile-success" class="hidden text-green-500 text-sm text-center font-bold bg-green-50 dark:bg-green-900/20 p-2 rounded-lg mb-4 border border-green-100 dark:border-green-900/10"></div>

                        <div class="flex gap-3">
                            <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                                Cancelar
                            </button>
                            <button type="submit" class="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/30 hover:scale-[1.02] transition-transform active:scale-95">
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async handleProfileUpdate(e, formEl) {
        const formData = new FormData(e.target);
        const fullName = formData.get('fullName');
        let avatarUrl = formData.get('avatarUrl'); // Default to URL input
        const bio = formData.get('bio');
        const phoneCode = formData.get('phoneCode');
        const phoneNumber = formData.get('phoneNumber');
        const location = formData.get('location');
        const email = formData.get('email');
        const password = formData.get('password');

        const phone = phoneNumber ? `${phoneCode} ${phoneNumber}` : '';

        // Check for file upload
        const fileInput = document.getElementById('avatar-upload');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            try {
                // Reuse existing base64 converter
                avatarUrl = await this.readFileAsBase64(fileInput.files[0]);
            } catch (err) {
                console.error("Error reading file", err);
                alert("Error al procesar la imagen");
                return;
            }
        }

        const btn = formEl.querySelector('button[type="submit"]');
        const errorEl = formEl.querySelector('#profile-error');
        const successEl = formEl.querySelector('#profile-success');

        // Loading state
        const originalText = btn.textContent;
        btn.textContent = 'Guardando...';
        btn.disabled = true;
        errorEl.classList.add('hidden');
        if (successEl) successEl.classList.add('hidden');

        try {
            // Check if email changed
            const currentEmail = window.auth.user.email;
            let emailChanged = email && email !== currentEmail;

            if (emailChanged && !password) {
                throw new Error("Para cambiar el email, debes confirmar tu contraseña actual.");
            }

            const result = await window.auth.updateProfile({
                fullName,
                avatarUrl,
                bio,
                phone,
                location,
                email: emailChanged ? email : null,
                password: emailChanged ? password : null
            });

            // Show success
            if (successEl) {
                successEl.textContent = 'Perfil actualizado correctamente';
                successEl.classList.remove('hidden');

                if (result && result.emailUpdated) {
                    successEl.textContent += '. Revisa tu nuevo correo (y el antiguo) para confirmar el cambio.';
                }
            }

            // Short delay to show success message before closing
            setTimeout(() => {
                // Close modal
                formEl.closest('.fixed').remove();
                // Refresh visuals
                this.renderSettings('account'); // Re-open account tab
            }, 2000);

        } catch (err) {
            console.error(err);
            errorEl.classList.remove('hidden');
            errorEl.textContent = err.message || 'Error al actualizar perfil';
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    showDeleteAccountModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in';
        modal.innerHTML = `
            <div class="bg-white dark:bg-dark-surface rounded-3xl shadow-2xl max-w-md w-full p-8 border border-red-100 dark:border-red-900/30 transform scale-100 transition-all">
                <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 text-2xl animate-pulse">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                
                <h3 class="text-2xl font-bold text-center text-brand-text dark:text-dark-text mb-2">¿Estás seguro?</h3>
                <p class="text-center text-brand-muted dark:text-dark-text/60 mb-8">
                    Esta acción eliminará <strong>permanentemente</strong> todos tus datos, transacciones y configuraciones. <br>
                    <span class="text-red-500 font-bold">No se puede deshacer.</span>
                </p>

                <div class="space-y-3">
                    <button id="btn-confirm-delete" disabled class="w-full py-4 bg-gray-300 text-white rounded-xl font-bold cursor-not-allowed transition-colors select-none">
                        Eliminar Cuenta (5)
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="w-full py-4 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const btnConfirm = modal.querySelector('#btn-confirm-delete');
        let timeLeft = 5;

        const timer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                btnConfirm.textContent = `Eliminar Cuenta (${timeLeft})`;
            } else {
                clearInterval(timer);
                btnConfirm.textContent = 'ELIMINAR MI CUENTA';
                btnConfirm.disabled = false;
                btnConfirm.classList.remove('bg-gray-300', 'cursor-not-allowed');
                btnConfirm.classList.add('bg-red-500', 'hover:bg-red-600', 'shadow-lg', 'shadow-red-200', 'dark:shadow-none');

                btnConfirm.onclick = () => {
                    // Loading state
                    btnConfirm.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Borrando...';
                    window.auth.deleteAccount();
                };
            }
        }, 1000);
    }

    toggleDarkMode() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('finance_dark_mode', isDark);
    }

    setAccessMode(mode, value) {
        if (mode === 'dyslexic') {
            localStorage.setItem('finance_access_dyslexic', value);
        } else if (mode === 'contrast') {
            localStorage.setItem('finance_access_contrast', value);
        } else if (mode === 'colorblind') {
            localStorage.setItem('finance_access_colorblind', value);
        }
        this.applyAccessibilityModes();
    }

    applyAccessibilityModes() {
        const isDark = localStorage.getItem('finance_dark_mode') === 'true';
        const isDyslexic = localStorage.getItem('finance_access_dyslexic') === 'true';
        const isHighContrast = localStorage.getItem('finance_access_contrast') === 'true';
        const colorBlindMode = localStorage.getItem('finance_access_colorblind') || 'none';

        // Apply Dark Mode
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        // Apply Dyslexia Font
        if (isDyslexic) document.body.classList.add('font-dyslexic');
        else document.body.classList.remove('font-dyslexic');

        // Apply High Contrast
        if (isHighContrast) document.body.classList.add('high-contrast');
        else document.body.classList.remove('high-contrast');

        // Apply Color Blindness
        document.body.classList.remove('protanopia', 'deuteranopia', 'tritanopia');
        if (colorBlindMode !== 'none') {
            document.body.classList.add(colorBlindMode);
        }
    }
    renderInvestments(activeTab = 'simulator') {
        const tabs = [
            { id: 'simulator', label: 'Simulador', icon: 'fa-calculator' },
            { id: 'plans', label: 'Planes', icon: 'fa-list-check' },
            { id: 'market', label: 'Mercado', icon: 'fa-chart-line' }
        ];

        this.app.innerHTML = `
            <div class="space-y-6 animate-fade-in pb-20">
                <h2 class="text-2xl font-bold text-brand-text px-1">Planificación</h2>
                
                <!-- Tabs -->
                <div class="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl mb-6 transition-colors">
                    ${tabs.map(tab => `
                        <button onclick="window.ui.renderInvestments('${tab.id}')" 
                            class="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white dark:bg-dark-surface dark:text-white text-brand-primary shadow-sm' : 'text-gray-500 dark:text-dark-text/60 hover:text-gray-700 dark:hover:text-dark-text'}">
                            <i class="fa-solid ${tab.icon}"></i>
                            ${tab.label}
                        </button>
                    `).join('')}
                </div>

                <!-- Content Area -->
                <div id="investments-content">
                    <!-- Content injected by sub-methods -->
                </div>
            </div>
        `;

        if (activeTab === 'simulator') this.renderInvestmentSimulator();
        else if (activeTab === 'plans') this.renderInvestmentPlans();
        else if (activeTab === 'market') this.renderInvestmentMarket();
    }

    renderInvestmentSimulator() {
        const amount = 1000;
        const years = 5;
        const planId = this.currentPlanId || 'p2';

        const content = `
            <div class="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/10 animate-fade-in transition-colors">
                <h3 class="font-bold text-brand-text dark:text-dark-text mb-4">Simulador de Inversión</h3>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-xs font-bold text-brand-muted dark:text-dark-text/60 uppercase mb-1">Inversión (€)</label>
                        <input type="number" id="calc-amount" value="${amount}" class="w-full bg-gray-50 dark:bg-white/5 dark:text-dark-text rounded-xl px-3 py-2 font-bold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary" oninput="window.ui.updateCalculator()">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-brand-muted dark:text-dark-text/60 uppercase mb-1">Duración (Años)</label>
                        <input type="number" id="calc-years" value="${years}" max="50" min="1" class="w-full bg-gray-50 dark:bg-white/5 dark:text-dark-text rounded-xl px-3 py-2 font-bold text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary" oninput="window.ui.updateCalculator()">
                    </div>
                </div>

                <div class="mb-6">
                        <label class="block text-xs font-bold text-brand-muted dark:text-dark-text/60 uppercase mb-2">Selecciona Plan</label>
                        <div class="flex gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                        ${window.store.investmentPlans.map(p => `
                            <button onclick="window.ui.selectPlan('${p.id}')" id="plan-btn-${p.id}" class="flex-1 py-2 rounded-lg text-xs font-bold transition-all ${p.id === planId ? 'bg-white dark:bg-dark-surface dark:text-white shadow-sm text-brand-primary' : 'text-gray-500 dark:text-dark-text/60 hover:text-gray-700 dark:hover:text-dark-text'}">
                                ${p.name}
                            </button>
                        `).join('')}
                        </div>
                </div>

                <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white text-center relative overflow-hidden">
                    <div class="relative z-10">
                        <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Retorno Estimado</p>
                        <h2 id="calc-result" class="text-4xl font-bold mb-2">€ 0.00</h2>
                        <p id="calc-roi" class="text-sm text-green-400 font-medium">+0% total</p>
                    </div>
                    <div class="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                </div>
            </div>
        `;
        document.getElementById('investments-content').innerHTML = content;
        setTimeout(() => this.selectPlan(planId), 0);
    }

    renderInvestmentPlans() {
        const content = `
            <div class="grid gap-4 md:grid-cols-2 animate-fade-in">
            ${window.store.investmentPlans.map(p => `
                <div class="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/10 flex flex-col h-full hover:shadow-md transition-shadow">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-12 h-12 rounded-full ${p.color} flex items-center justify-center text-xl shrink-0">
                            <i class="fa-solid ${p.icon}"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-brand-text dark:text-dark-text text-lg">${p.name}</h4>
                            <div class="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-dark-text/80 inline-block mt-1">
                                ROI Esperado: ${(p.roi * 100)}%
                            </div>
                        </div>
                    </div>
                    
                    <p class="text-sm text-slate-600 dark:text-dark-text/60 mb-6 leading-relaxed flex-grow">
                        ${p.detailedDesc}
                    </p>

                    <div class="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 space-y-3">
                        <h5 class="text-xs font-bold text-slate-400 dark:text-dark-text/40 uppercase tracking-wider">Incluye</h5>
                        <ul class="space-y-2">
                            ${p.features.map(feat => `
                                <li class="flex items-start gap-2 text-sm text-slate-700 dark:text-dark-text/80">
                                    <i class="fa-solid fa-check text-green-500 mt-1"></i>
                                    <span class="leading-tight">${feat}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `).join('')}
            </div>
        `;
        document.getElementById('investments-content').innerHTML = content;
    }

    renderInvestmentMarket() {
        const content = `
            <div class="space-y-6 animate-fade-in">
                <!-- Market Placeholder Card -->
                <div class="bg-white dark:bg-dark-surface rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/10 text-center transition-colors">
                    <div class="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 dark:text-dark-text/40 text-2xl mx-auto mb-4">
                        <i class="fa-solid fa-chart-line"></i>
                    </div>
                    <h3 class="font-bold text-brand-text dark:text-dark-text mb-2">Mercado en Tiempo Real</h3>
                    <p class="text-slate-500 dark:text-dark-text/60 text-sm mb-6">Conectando con la API de Bolsa...</p>
                    
                    <!-- Placeholder Chart -->
                    <div class="h-40 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center">
                        <p class="text-xs font-bold text-gray-400 dark:text-dark-text/40 uppercase">Gráfico de Mercado (Placeholder)</p>
                    </div>
                </div>

                <!-- Placeholder Table -->
                <div class="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/10 transition-colors">
                    <h3 class="font-bold text-brand-text dark:text-dark-text mb-4 px-2">Activos Populares</h3>
                    <div class="space-y-4">
                        ${[1, 2, 3, 4, 5].map(() => `
                            <div class="flex items-center justify-between animate-pulse">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10"></div>
                                    <div class="space-y-2">
                                        <div class="h-3 w-16 bg-gray-200 dark:bg-white/10 rounded"></div>
                                        <div class="h-2 w-24 bg-gray-100 dark:bg-white/5 rounded"></div>
                                    </div>
                                </div>
                                <div class="space-y-2 text-right">
                                    <div class="h-3 w-12 bg-gray-200 dark:bg-white/10 rounded ml-auto"></div>
                                    <div class="h-2 w-8 bg-gray-100 dark:bg-white/5 rounded ml-auto"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.getElementById('investments-content').innerHTML = content;
    }

    selectPlan(id) {
        this.currentPlanId = id;

        // Update Buttons
        window.store.investmentPlans.forEach(p => {
            const btn = document.getElementById(`plan-btn-${p.id}`);
            if (btn) {
                if (p.id === id) {
                    btn.className = 'flex-1 py-2 rounded-lg text-xs font-bold transition-all bg-white dark:bg-dark-surface dark:text-white shadow-sm text-brand-primary';
                } else {
                    btn.className = 'flex-1 py-2 rounded-lg text-xs font-bold transition-all text-gray-500 dark:text-dark-text/60 hover:text-gray-700 dark:hover:text-dark-text';
                }
            }
        });

        this.updateCalculator();
    }

    updateCalculator() {
        const amount = parseFloat(document.getElementById('calc-amount').value) || 0;
        let years = parseFloat(document.getElementById('calc-years').value) || 0;

        if (years > 50) {
            years = 50;
            document.getElementById('calc-years').value = 50;
            this.showNotification('Límite máximo de 50 años', 'error');
        }
        const plan = window.store.investmentPlans.find(p => p.id === this.currentPlanId);

        if (!plan) return;

        // Compound interest: A = P(1 + r)^t
        const result = amount * Math.pow((1 + plan.roi), years);
        const profit = result - amount;
        const roiPercent = ((profit / amount) * 100).toFixed(0);

        document.getElementById('calc-result').innerText = this.formatMoney(result);
        document.getElementById('calc-roi').innerText = `+${this.formatMoney(profit)} (${roiPercent}%)`;
    }

    renderLogin() {
        this.app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-6 animate-fade-in bg-slate-50">
                <div class="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-blue-100 text-center">
                    <div class="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center text-brand-primary text-4xl mx-auto mb-6">
                        <i class="fa-solid fa-users-viewfinder"></i>
                    </div>
                    <h1 class="text-3xl font-bold text-brand-text mb-2">Bienvenido</h1>
                    <p class="text-brand-muted mb-8">Selecciona una opción para entrar</p>

                    <div class="space-y-4">
                        <button onclick="window.ui.renderSignInForm()" class="w-full py-5 bg-white border-2 border-brand-primary text-brand-primary rounded-2xl font-bold shadow-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-3 group">
                            <i class="fa-solid fa-arrow-right-to-bracket text-xl group-hover:translate-x-1 transition-transform"></i>
                            <span class="text-lg">Acceder a mi Perfil</span>
                        </button>

                        <button onclick="window.ui.renderRegisterForm()" class="w-full py-5 bg-brand-primary text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
                            <i class="fa-solid fa-user-plus text-xl"></i>
                            <span class="text-lg">Crear Nuevo Usuario</span>
                        </button>

                        <button onclick="window.auth.enableGuestMode()" class="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm">
                            Continuar como Invitado (Sin Guardar)
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderRegisterForm() {
        this.app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-6 animate-fade-in bg-slate-50">
                <div class="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-blue-100 relative">
                    <button onclick="window.ui.renderLogin()" class="absolute top-6 left-6 text-slate-400 hover:text-slate-600">
                        <i class="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <div class="text-center mb-8 mt-4">
                        <h2 class="text-2xl font-bold text-brand-text">Crear Perfil</h2>
                        <p class="text-brand-muted">Tus datos, seguros y en la nube.</p>
                    </div>

                    <form onsubmit="window.auth.handleRegisterSubmit(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">Email</label>
                            <input type="email" name="email" required placeholder="ejemplo@email.com"
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">Contraseña Nueva</label>
                            <input type="password" name="password" required minlength="6" placeholder="Mínimo 6 caracteres"
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                        </div>

                        <div id="auth-error" class="hidden text-red-500 text-sm text-center font-bold bg-red-50 p-3 rounded-lg"></div>
                        <div id="auth-success" class="hidden text-green-600 text-sm text-center font-bold bg-green-50 p-3 rounded-lg">
                            ¡Cuenta creada! Revisa tu email o inicia sesión.
                        </div>

                        <button type="submit" class="w-full py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform active:scale-95">
                            Registrarme
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    renderSignInForm() {
        this.app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-6 animate-fade-in bg-slate-50">
                <div class="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl shadow-blue-100 relative">
                    <button onclick="window.ui.renderLogin()" class="absolute top-6 left-6 text-slate-400 hover:text-slate-600">
                        <i class="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <div class="text-center mb-8 mt-4">
                        <h2 class="text-2xl font-bold text-brand-text">Acceder</h2>
                        <p class="text-brand-muted">Entra a tu espacio personal.</p>
                    </div>

                    <form onsubmit="window.auth.handleSignInSubmit(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">Email</label>
                            <input type="email" name="email" required 
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
                            <input type="password" name="password" required
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                        </div>

                        <div id="auth-error" class="hidden text-red-500 text-sm text-center font-bold bg-red-50 p-3 rounded-lg"></div>

                        <button type="submit" class="w-full py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform active:scale-95">
                            Entrar
                        </button>
                    </form>
                </div>
            </div>
        `;
    }



    toggleUserMenu(btn) {
        const menu = document.getElementById('sidebar-user-menu');
        if (menu) {
            menu.classList.toggle('hidden');

            // Close when clicking outside
            if (!menu.classList.contains('hidden')) {
                const closeMenu = (e) => {
                    if (!menu.contains(e.target) && !btn.contains(e.target)) {
                        menu.classList.add('hidden');
                        document.removeEventListener('click', closeMenu);
                    }
                };
                // Delay listener to avoid immediate trigger
                setTimeout(() => document.addEventListener('click', closeMenu), 0);
            }
        }
    }
    // --- Piggy Banks UI ---

    renderPiggyBanks() {
        const banks = window.store.piggyBanks;
        const totalSaved = banks.reduce((acc, b) => acc + b.current, 0);

        this.app.innerHTML = `
            <div class="space-y-6 animate-fade-in pb-20">
                <header class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-brand-text dark:text-dark-text px-1">Mis Huchas</h2>
                        <p class="text-sm text-brand-muted dark:text-dark-text/60 px-1">Total Ahorrado: <span class="font-bold text-brand-primary dark:text-blue-400">${this.formatMoney(totalSaved)}</span></p>
                    </div>
                    <button onclick="window.ui.renderCreatePiggyBankForm()" class="w-10 h-10 bg-brand-primary text-white rounded-full shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center hover:scale-110 transition-transform">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </header>

                <div class="grid gap-4 md:grid-cols-2">
                    ${banks.length === 0 ? `
                        <div class="col-span-2 text-center py-10 opacity-50">
                            <i class="fa-solid fa-piggy-bank text-4xl mb-2 text-gray-300 dark:text-gray-600"></i>
                            <p class="text-sm text-slate-500 dark:text-dark-text/60">No tienes huchas activas. ¡Crea una!</p>
                        </div>
                    ` : banks.map(b => {
            const progress = b.target > 0 ? Math.min((b.current / b.target) * 100, 100) : 0;
            const isInterest = b.type === 'interest';
            return `
                        <div class="bg-white dark:bg-dark-surface rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-white/10 relative overflow-hidden group">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full ${b.color} flex items-center justify-center text-lg">
                                        <i class="fa-solid ${b.icon}"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-brand-text dark:text-dark-text">${b.name}</h3>
                                        ${isInterest ? `<span class="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Interés ${(b.interestRate * 100)}%</span>` : ''}
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold text-brand-text dark:text-dark-text">${this.formatMoney(b.current)}</p>
                                    <p class="text-xs text-brand-muted dark:text-dark-text/60">de ${this.formatMoney(b.target)}</p>
                                </div>
                            </div>

                            <!-- Progress Bar -->
                            <div class="w-full bg-gray-100 dark:bg-white/5 rounded-full h-3 mb-4 overflow-hidden">
                                <div class="h-full bg-brand-primary transition-all duration-1000" style="width: ${progress}%"></div>
                            </div>
                            
                            <!-- Actions -->
                            <div class="flex gap-2">
                                <button onclick="window.ui.renderDepositToPiggyBankForm('${b.id}')" class="flex-1 py-2 bg-brand-primary text-white hover:bg-brand-secondary rounded-xl text-sm font-bold transition-colors shadow-lg shadow-brand-primary/20">
                                    <i class="fa-solid fa-plus mr-1"></i> Añadir
                                </button>
                                <button onclick="window.ui.renderEditPiggyBankForm('${b.id}')" class="w-10 py-2 bg-gray-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-white rounded-xl transition-colors">
                                    <i class="fa-solid fa-pen"></i>
                                </button>
                                <button onclick="if(confirm('¿Seguro que quieres borrar esta hucha? El dinero (${this.formatMoney(b.current)}) se devolverá a tu cuenta.')) { window.store.deletePiggyBank('${b.id}'); window.ui.renderPiggyBanks(); }" class="w-10 py-2 bg-gray-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-500 rounded-xl transition-colors">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    `;
        }).join('')}
                </div>
            </div>
        `;
    }

    renderCreatePiggyBankForm() {
        this.app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-6 animate-fade-in bg-slate-50 dark:bg-dark-bg">
                <div class="w-full max-w-md bg-white dark:bg-dark-surface rounded-3xl p-8 shadow-xl shadow-blue-100 dark:shadow-none relative">
                    <button onclick="window.ui.renderPiggyBanks()" class="absolute top-6 left-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <i class="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <div class="text-center mb-8 mt-4">
                        <h2 class="text-2xl font-bold text-brand-text dark:text-dark-text">Nueva Hucha</h2>
                        <p class="text-brand-muted dark:text-dark-text/60">Define tu objetivo de ahorro.</p>
                    </div>

                    <form onsubmit="window.ui.handleCreatePiggyBank(event)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-dark-text/80 mb-2">Cantidad a añadir (€)</label>
                            <input type="number" name="amount" required autofocus placeholder="5" min="5" step="0.01"
                                oninput="this.value = this.value.replace(/[^0-9.]/g, '')"
                                class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-4 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-dark-text/80 mb-2">Objetivo (€)</label>
                                <input type="number" name="target" required placeholder="1000"
                                    oninput="this.value = this.value.replace(/[^0-9.]/g, '')"
                                    class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-slate-700 dark:text-dark-text/80 mb-2">Inicial (€)</label>
                                <input type="number" name="initial" placeholder="0"
                                    oninput="this.value = this.value.replace(/[^0-9.]/g, '')"
                                    class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-dark-text/80 mb-2">Tipo</label>
                            <select name="type" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer">
                                <option value="simple">Hucha Simple</option>
                                <option value="interest">Genera Interés (2% Anual)</option>
                            </select>
                        </div>

                        <button type="submit" class="w-full py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:scale-[1.02] transition-transform active:scale-95 mt-6">
                            Crear Hucha
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    handleCreatePiggyBank(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            target: formData.get('target'),
            initial: formData.get('initial'),
            type: formData.get('type'),
            // Random default color/icon for now
            color: 'bg-purple-100 text-purple-600',
            icon: 'fa-piggy-bank'
        };

        window.store.addPiggyBank(data);
        this.renderPiggyBanks();
    }

    renderEditPiggyBankForm(id) {
        const bank = window.store.piggyBanks.find(b => b.id == id);
        if (!bank) return;

        this.app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-6 animate-fade-in bg-slate-50 dark:bg-dark-bg">
                <div class="w-full max-w-md bg-white dark:bg-dark-surface rounded-3xl p-8 shadow-xl shadow-blue-100 dark:shadow-none relative">
                    <button onclick="window.ui.renderPiggyBanks()" class="absolute top-6 left-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <i class="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <div class="text-center mb-8 mt-4">
                        <h2 class="text-2xl font-bold text-brand-text dark:text-dark-text">Editar Hucha</h2>
                        <p class="text-brand-muted dark:text-dark-text/60">Modifica tus metas.</p>
                    </div>

                    <form onsubmit="window.ui.handleEditPiggyBank(event, '${bank.id}')" class="space-y-4">
                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-dark-text/80 mb-2">Nombre</label>
                            <input type="text" name="name" required value="${bank.name}" placeholder="Ej: Viaje a Japón" maxlength="20"
                                class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-dark-text/80 mb-2">Objetivo (€)</label>
                            <input type="number" name="target" required value="${bank.target}" placeholder="1000"
                                oninput="this.value = this.value.replace(/[^0-9.]/g, '')"
                                class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-dark-text/80 mb-2">Tipo</label>
                            <select name="type" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer">
                                <option value="simple" ${bank.type === 'simple' ? 'selected' : ''}>Hucha Simple</option>
                                <option value="interest" ${bank.type === 'interest' ? 'selected' : ''}>Genera Interés (2% Anual)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-dark-text/80 mb-2">Color</label>
                            <select name="color" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer">
                                <option value="bg-purple-100 text-purple-600" ${bank.color.includes('purple') ? 'selected' : ''}>Morado</option>
                                <option value="bg-blue-100 text-blue-600" ${bank.color.includes('blue') ? 'selected' : ''}>Azul</option>
                                <option value="bg-green-100 text-green-600" ${bank.color.includes('green') ? 'selected' : ''}>Verde</option>
                                <option value="bg-yellow-100 text-yellow-600" ${bank.color.includes('yellow') ? 'selected' : ''}>Amarillo</option>
                                <option value="bg-red-100 text-red-600" ${bank.color.includes('red') ? 'selected' : ''}>Rojo</option>
                                <option value="bg-pink-100 text-pink-600" ${bank.color.includes('pink') ? 'selected' : ''}>Rosa</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-bold text-slate-700 dark:text-dark-text/80 mb-2">Icono</label>
                            <select name="icon" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all cursor-pointer">
                                <option value="fa-piggy-bank" ${bank.icon === 'fa-piggy-bank' ? 'selected' : ''}>Cerdito</option>
                                <option value="fa-plane" ${bank.icon === 'fa-plane' ? 'selected' : ''}>Viaje</option>
                                <option value="fa-car" ${bank.icon === 'fa-car' ? 'selected' : ''}>Coche</option>
                                <option value="fa-house" ${bank.icon === 'fa-house' ? 'selected' : ''}>Casa</option>
                                <option value="fa-laptop" ${bank.icon === 'fa-laptop' ? 'selected' : ''}>Tecnología</option>
                                <option value="fa-gift" ${bank.icon === 'fa-gift' ? 'selected' : ''}>Regalo</option>
                            </select>
                        </div>

                        <button type="submit" class="w-full py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:scale-[1.02] transition-transform active:scale-95 mt-6">
                            Guardar Cambios
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    handleEditPiggyBank(e, id) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            target: formData.get('target'),
            type: formData.get('type'),
            color: formData.get('color'),
            icon: formData.get('icon')
        };

        window.store.updatePiggyBank(id, data);
        this.showNotification('Hucha actualizada');
        this.renderPiggyBanks();
    }

    renderDepositToPiggyBankForm(id) {
        const bank = window.store.piggyBanks.find(b => b.id == id);
        if (!bank) return;

        this.app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-6 animate-fade-in bg-slate-50 dark:bg-dark-bg">
                <div class="w-full max-w-md bg-white dark:bg-dark-surface rounded-3xl p-8 shadow-xl shadow-blue-100 dark:shadow-none relative">
                    <button onclick="window.ui.renderPiggyBanks()" class="absolute top-6 left-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <i class="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <div class="text-center mb-8 mt-4">
                        <div class="w-16 h-16 rounded-full ${bank.color} flex items-center justify-center text-2xl mx-auto mb-4">
                            <i class="fa-solid ${bank.icon}"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-brand-text dark:text-dark-text">Añadir a ${bank.name}</h2>
                        <p class="text-brand-muted dark:text-dark-text/60">Balance actual: ${this.formatMoney(bank.current)}</p>
                    </div>

                    <form onsubmit="window.ui.handleDepositSubmit(event, '${bank.id}')" class="space-y-6">
                        <div class="flex flex-col items-center justify-center mb-10">
                            <label class="text-xs font-bold text-brand-muted tracking-widest uppercase mb-4">Importe</label>
                            
                            <div class="relative w-full max-w-[350px] mx-auto flex items-center justify-center">
                                <div class="relative w-full">
                                    <input type="number" name="amount" id="deposit-amount" placeholder="0.00" required autofocus step="0.01" min="0"
                                        oninput="window.ui.validateDecimalInput(this)"
                                        onkeydown="window.ui.validateDecimalKeydown(event)"
                                        class="text-5xl font-bold text-brand-text dark:text-dark-text text-center w-full bg-transparent focus:outline-none placeholder-gray-300 px-8" placeholder="0.00" required autofocus>
                                    <span class="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl text-gray-400">€</span>
                                </div>

                                <div class="flex flex-col gap-1 ml-2">
                                     <button type="button" onclick="window.ui.adjustAmount(1, 'deposit-amount')" class="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 text-brand-primary dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors active:scale-90">
                                        <i class="fa-solid fa-chevron-up text-sm"></i>
                                    </button>
                                    <button type="button" onclick="window.ui.adjustAmount(-1, 'deposit-amount')" class="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 text-brand-primary dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors active:scale-90">
                                        <i class="fa-solid fa-chevron-down text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="w-full py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:scale-[1.02] transition-transform active:scale-95">
                            Confirmar Depósito
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    handleDepositSubmit(e, id) {
        e.preventDefault();
        const form = e.target;
        const amount = parseFloat(form.amount.value);

        if (amount <= 0) {
            alert('Introduce una cantidad válida');
            return;
        }

        window.store.depositToPiggyBank(id, amount);
        this.showNotification('Depósito realizado con éxito');
        this.renderPiggyBanks();
    }
    renderCategoryManager() {
        this.app.innerHTML = `
            <div class="min-h-screen pb-20 animate-fade-in bg-slate-50 dark:bg-dark-bg">
                <!-- Header -->
                <div class="bg-white dark:bg-dark-surface sticky top-0 z-20 px-6 py-4 shadow-sm flex items-center gap-4">
                    <button onclick="window.ui.renderSettings()" class="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-dark-text hover:bg-slate-200 transition-colors">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <h1 class="text-xl font-bold text-brand-text dark:text-dark-text">Editar Categorías</h1>
                </div>

                <div class="p-6 space-y-6">
                    <!-- Add New -->
                    <div class="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                        <h3 class="font-bold text-brand-text dark:text-dark-text mb-4">Nueva Categoría</h3>
                        <form onsubmit="window.ui.handleAddCategory(event)" class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                                <input type="text" name="name" required placeholder="Ej: Mascotas" maxlength="12"
                                    class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Icono</label>
                                    <select name="icon" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                                        <option value="fa-tag">Etiqueta</option>
                                        <option value="fa-paw">Mascota</option>
                                        <option value="fa-car">Coche</option>
                                        <option value="fa-plane">Viaje</option>
                                        <option value="fa-gift">Regalo</option>
                                        <option value="fa-basket-shopping">Compra</option>
                                        <option value="fa-wifi">Internet</option>
                                        <option value="fa-mobile-screen">Móvil</option>
                                        <option value="fa-bolt">Luz</option>
                                         <option value="fa-droplet">Agua</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Color</label>
                                    <select name="color" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:text-dark-text rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all">
                                        <option value="bg-gray-100 text-gray-600">Gris</option>
                                        <option value="bg-red-100 text-red-600">Rojo</option>
                                        <option value="bg-orange-100 text-orange-600">Naranja</option>
                                        <option value="bg-yellow-100 text-yellow-600">Amarillo</option>
                                        <option value="bg-green-100 text-green-600">Verde</option>
                                        <option value="bg-teal-100 text-teal-600">Turquesa</option>
                                        <option value="bg-blue-100 text-blue-600">Azul</option>
                                        <option value="bg-indigo-100 text-indigo-600">Índigo</option>
                                        <option value="bg-purple-100 text-purple-600">Morado</option>
                                        <option value="bg-pink-100 text-pink-600">Rosa</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" class="w-full py-3 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none hover:scale-[1.02] transition-transform active:scale-95">
                                <i class="fa-solid fa-plus mr-2"></i> Añadir
                            </button>
                        </form>
                    </div>

                    <!-- Existing List -->
                     <div class="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                        <h3 class="font-bold text-brand-text dark:text-dark-text mb-4">Tus Categorías</h3>
                        <div class="space-y-3">
                            ${window.store.categories.map(cat => `
                                <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full ${cat.color} flex items-center justify-center">
                                            <i class="fa-solid ${cat.icon}"></i>
                                        </div>
                                        <span class="font-medium text-slate-700 dark:text-slate-200">${cat.name}</span>
                                    </div>
                                    <button onclick="window.ui.handleDeleteCategory('${cat.id}')" class="w-8 h-8 rounded-full bg-white dark:bg-white/10 text-red-500 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shadow-sm">
                                        <i class="fa-solid fa-trash-can text-sm"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    handleAddCategory(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        window.store.addCategory(
            formData.get('name'),
            formData.get('icon'),
            formData.get('color')
        );
        this.renderCategoryManager();
        // Maybe show toast?
    }

    handleDeleteCategory(id) {
        if (confirm('¿Borrar esta categoría?')) {
            window.store.deleteCategory(id);
            this.renderCategoryManager();
        }
    }
}
window.UI = UI;
