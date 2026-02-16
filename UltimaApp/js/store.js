
// Remove export, define directly
class Store {
    constructor() {
        this.transactions = [];
        this.categories = [
            { id: 'cat_1', name: 'Comida', icon: 'fa-utensils', color: 'bg-orange-100 text-orange-600' },
            { id: 'cat_2', name: 'Transporte', icon: 'fa-bus', color: 'bg-blue-100 text-blue-600' },
            { id: 'cat_3', name: 'Hogar', icon: 'fa-house', color: 'bg-purple-100 text-purple-600' },
            { id: 'cat_4', name: 'Ocio', icon: 'fa-gamepad', color: 'bg-pink-100 text-pink-600' },
            { id: 'cat_5', name: 'Salud', icon: 'fa-heart-pulse', color: 'bg-red-100 text-red-600' },
            { id: 'cat_6', name: 'Salario', icon: 'fa-money-bill-wave', color: 'bg-green-100 text-green-600' },
            { id: 'cat_piggy', name: 'Huchas', icon: 'fa-piggy-bank', color: 'bg-teal-100 text-teal-600' },
        ];
        this.settings = {
            currency: 'EUR',
            theme: 'default'
        };
        this.investmentPlans = [
            {
                id: 'p1',
                name: 'Conservador',
                roi: 0.05,
                desc: 'Riesgo bajo, crecimiento estable.',
                color: 'bg-green-100 text-green-600',
                icon: 'fa-shield-halved',
                detailedDesc: 'Diseñado para preservar el capital minimizando la exposición a la volatilidad del mercado. Ideal para objetivos a corto plazo o inversores con baja tolerancia al riesgo.',
                features: ['Bonos del Estado garantizados', 'Cuentas de ahorro de alto rendimiento', 'Protección contra inflación']
            },
            {
                id: 'p2',
                name: 'Moderado',
                roi: 0.08,
                desc: 'Equilibrio entre riesgo y retorno.',
                color: 'bg-blue-100 text-blue-600',
                icon: 'fa-scale-balanced',
                detailedDesc: 'Busca un crecimiento del capital superior a la inflación asumiendo un riesgo controlado. Combina renta fija con renta variable global.',
                features: ['50% Renta Variable / 50% Renta Fija', 'Diversificación en mercados globales', 'Rebalanceo automático trimestral']
            },
            {
                id: 'p3',
                name: 'Arriesgado',
                roi: 0.12,
                desc: 'Alto potencial, mayor volatilidad.',
                color: 'bg-orange-100 text-orange-600',
                icon: 'fa-rocket',
                detailedDesc: 'Estrategia agresiva enfocada en la maximización de retornos a largo plazo. Acepta fluctuaciones significativas a cambio de mayor rentabilidad potencial.',
                features: ['Acciones tecnológicas y emergentes', 'Exposición a criptoactivos (5%)', 'ETFs de sectores disruptivos']
            }
        ];
        this.activeInvestments = [];
        this.piggyBanks = [];
    }

    async init() {
        // Load Categories
        const localCategories = localStorage.getItem('finance_categories');
        if (localCategories) {
            this.categories = JSON.parse(localCategories);
            // Ensure Huchas category exists (migration)
            if (!this.categories.find(c => c.id === 'cat_piggy')) {
                this.categories.push({ id: 'cat_piggy', name: 'Huchas', icon: 'fa-piggy-bank', color: 'bg-teal-100 text-teal-600' });
            }
        }

        // Load Settings
        const localSettings = localStorage.getItem('finance_settings');
        if (localSettings) {
            this.settings = { ...this.settings, ...JSON.parse(localSettings) };
        }

        // ALWAYS load Piggy Banks from LocalStorage
        const localPiggyBanks = localStorage.getItem('finance_piggybanks');
        this.piggyBanks = localPiggyBanks ? JSON.parse(localPiggyBanks) : [];

        if (!window.auth.user) {
            this.transactions = [];
            return;
        }

        // GUEST MODE: Load from LocalStorage
        if (window.auth.isGuest) {
            const localData = localStorage.getItem('finance_guest_data');
            this.transactions = localData ? JSON.parse(localData) : [];
            // Trigger UI update if needed, or rely on caller
            const localInvestments = localStorage.getItem('finance_guest_investments');
            this.activeInvestments = localInvestments ? JSON.parse(localInvestments) : [];

            if (window.ui && window.router.currentRoute === 'home') window.ui.renderHome();
            return;
        }

        // SUPABASE MODE: Load from Cloud
        const { data, error } = await window.supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', window.auth.user.id)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error loading transactions:', error);
            this.transactions = [];
        } else {
            this.transactions = data || [];
        }
    }

    // Category Management
    addCategory(name, icon, color) {
        const newCat = {
            id: 'cat_' + Date.now(),
            name,
            icon: icon || 'fa-tag',
            color: color || 'bg-gray-100 text-gray-600'
        };
        this.categories.push(newCat);
        this.saveCategories();
    }

    deleteCategory(id) {
        // Prevent deleting if it's the only one or strictly required? 
        // For now allow deleting, transactions will fall back to 'Other' display logic
        this.categories = this.categories.filter(c => c.id !== id);
        this.saveCategories();
    }

    saveCategories() {
        localStorage.setItem('finance_categories', JSON.stringify(this.categories));
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    saveSettings() {
        localStorage.setItem('finance_settings', JSON.stringify(this.settings));
    }

    async addTransaction(data) {
        if (!window.auth.user) return;

        const dbData = {
            user_id: window.auth.user.id,
            type: data.type,
            amount: data.amount,
            concept: data.concept,
            category: data.category,
            notes: data.notes || '',
            invoice: data.invoice || null, // Base64 string
            date: data.date
        };

        // GUEST MODE: Save to LocalStorage
        if (window.auth.isGuest) {
            const newTx = { ...dbData, id: Date.now() };
            this.transactions.unshift(newTx);
            this.saveLocal();
            if (window.router.currentRoute === 'home') window.ui.renderHome();
            return;
        }

        // SUPABASE MODE: Optimistic UI + Cloud Save
        const tempId = Date.now();
        const optimisticTx = { ...dbData, id: tempId };
        this.transactions.unshift(optimisticTx);
        // Refresh UI immediately
        if (window.router.currentRoute === 'home') window.ui.renderHome();

        // Send to Cloud
        const { data: inserted, error } = await window.supabaseClient
            .from('transactions')
            .insert([dbData])
            .select();

        if (error) {
            console.error('Error saving to Cloud:', error);
            alert('Error al guardar en la nube. Verifica tu conexión.');
            // Revert optimistic update
            this.transactions = this.transactions.filter(t => t.id !== tempId);
            if (window.router.currentRoute === 'home') window.ui.renderHome();
        } else {
            // Update the temporary ID with real ID
            if (inserted && inserted[0]) {
                const index = this.transactions.findIndex(t => t.id === tempId);
                if (index !== -1) {
                    this.transactions[index] = inserted[0];
                }
            }
        }
    }

    async deleteTransaction(id) {
        // Optimistic Delete
        const prevTxs = [...this.transactions];
        this.transactions = this.transactions.filter(t => t.id !== id);
        if (window.router.currentRoute === 'home') window.ui.renderHome();

        // GUEST MODE: Update LocalStorage
        if (window.auth.isGuest) {
            this.saveLocal();
            return;
        }

        // SUPABASE MODE: Delete from Cloud
        const { error } = await window.supabaseClient
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting from Cloud:', error);
            alert('No se pudo borrar. Verifica tu conexión.');
            this.transactions = prevTxs; // Revert
            if (window.router.currentRoute === 'home') window.ui.renderHome();
        }
    }

    // Persist data
    saveLocal() {
        if (window.auth.isGuest) {
            localStorage.setItem('finance_guest_data', JSON.stringify(this.transactions));
            localStorage.setItem('finance_guest_investments', JSON.stringify(this.activeInvestments));
        }
        // Always save piggy banks locally (shared behavior for now)
        localStorage.setItem('finance_piggybanks', JSON.stringify(this.piggyBanks));
    }

    // Piggy Banks Logic
    addPiggyBank(data) {
        const initialAmount = parseFloat(data.initial) || 0;
        const targetAmount = parseFloat(data.target) || 0;

        const newBank = {
            id: Date.now(),
            name: data.name,
            target: targetAmount,
            current: initialAmount,
            type: data.type || 'simple',
            interestRate: data.type === 'interest' ? (parseFloat(data.rate) || 0.02) : 0,
            color: data.color || 'bg-brand-primary text-white',
            icon: data.icon || 'fa-piggy-bank',
            history: []
        };

        if (initialAmount > 0) {
            newBank.history.push({
                date: new Date().toISOString(),
                amount: initialAmount,
                type: 'deposit'
            });

            // Deduct initial deposit from balance
            const progress = targetAmount > 0 ? Math.min((initialAmount / targetAmount) * 100, 100).toFixed(0) : 0;
            this.addTransaction({
                type: 'expense',
                amount: initialAmount,
                concept: `Apertura ${data.name} ${progress}%`,
                category: 'cat_3',
                date: new Date().toISOString(),
                notes: 'Depósito inicial hucha'
            });
        }

        this.piggyBanks.unshift(newBank);
        this.saveLocal();
    }

    depositToPiggyBank(id, amount) {
        const bank = this.piggyBanks.find(b => b.id == id); // loose equality
        if (!bank) return;

        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        bank.current += val;

        // Calculate progress percentage
        const progress = bank.target > 0 ? Math.min((bank.current / bank.target) * 100, 100).toFixed(0) : 0;

        bank.history.unshift({
            date: new Date().toISOString(),
            amount: val,
            type: 'deposit'
        });

        // Link with main balance: Create an expense transaction
        this.addTransaction({
            type: 'expense',
            amount: val,
            concept: `Añadido a ${bank.name} ${progress}%`, // "Añadido a hucha tanto %"
            category: 'cat_3', // 'Hogar' or maybe we need a 'Savings' category? Using 'Hogar' (House) or generic for now.
            date: new Date().toISOString(),
            notes: 'Ahorro automático'
        });

        this.saveLocal();
    }

    filterTransactions(filter) {
        if (!filter || filter === 'all') return this.transactions;

        const now = new Date();
        return this.transactions.filter(t => {
            const txDate = new Date(t.date);
            if (filter === 'month') {
                return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            } else if (filter === 'year') {
                return txDate.getFullYear() === now.getFullYear();
            } else if (filter === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return txDate >= oneWeekAgo;
            }
            return true;
        });
    }

    getBalance(filter = 'all') {
        const txs = this.filterTransactions(filter);
        return txs.reduce((acc, t) => {
            return t.type === 'income' ? acc + t.amount : acc - t.amount;
        }, 0);
    }

    getIncome(filter = 'all') {
        const txs = this.filterTransactions(filter);
        return txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    }

    getExpense(filter = 'all') {
        const txs = this.filterTransactions(filter);
        return txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    }

    getRecent(limit = 5, filter = 'all') {
        // Recent usually implies "latest added", but in context of dash, it might mean "latest in this period". 
        // Let's filter first then slice.
        const txs = this.filterTransactions(filter);
        return [...txs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
    }

    addInvestment(planId, amount) {
        const plan = this.investmentPlans.find(p => p.id === planId);
        if (!plan) return;

        const investment = {
            id: Date.now(),
            planId,
            planName: plan.name,
            amount: parseFloat(amount),
            date: new Date().toISOString(),
            roi: plan.roi
        };
        this.activeInvestments.unshift(investment);
        // Persist only in guest mode for now to keep simple, or could add to DB table
        if (window.auth.isGuest) {
            this.saveLocal();
        }
    }

    getHistogramData(filter) {
        const now = new Date();
        const txs = this.filterTransactions(filter);

        let labels = [];
        let incomeData = [];
        let expenseData = [];

        if (filter === 'week') {
            labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
            incomeData = new Array(7).fill(0);
            expenseData = new Array(7).fill(0);

            // Calculate start of current week (Monday)
            const day = now.getDay() || 7; // 1=Mon, 7=Sun
            const startOfWeek = new Date(now);
            startOfWeek.setHours(0, 0, 0, 0); // Reset time part for accurate comparison
            startOfWeek.setDate(now.getDate() - day + 1);

            txs.forEach(t => {
                const d = new Date(t.date);
                // Difference in days from start of week
                const diffTime = Math.abs(d - startOfWeek);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                // Only count if within the last 7 days actually (or specifically this Mon-Sun window)
                // Since `filterTransactions` already cuts to "last 7 days" roughly, let's map accurately to 0-6 index
                // Note: The `filterTransactions('week')` logic just did `now - 7 days`. 
                // Let's rely on standard JS getDay().

                // Map JS getDay() (0=Sun, 1=Mon) to index (0=Mon, 6=Sun)
                let dayIndex = d.getDay() - 1;
                if (dayIndex === -1) dayIndex = 6;

                if (t.type === 'income') incomeData[dayIndex] += t.amount;
                else expenseData[dayIndex] += t.amount;
            });

        } else if (filter === 'year') {
            labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            incomeData = new Array(12).fill(0);
            expenseData = new Array(12).fill(0);

            txs.forEach(t => {
                const d = new Date(t.date);
                const month = d.getMonth(); // 0-11
                if (t.type === 'income') incomeData[month] += t.amount;
                else expenseData[month] += t.amount;
            });
        } else {
            // 'month' or 'all' - Show roughly by weeks of month (1-4) or just last 30 days
            // Let's simplify and show last 7 days for 'month' too, or maybe 4 weeks?
            // Let's default to a "Last 30 Days" dynamic view if 'month' is selected but actually renderHome defaults to "week" usually.

            // Let's align 'month' view to show "Days of Month" would be too crowded (30 bars).
            // Let's just return Weekly view for 'month' too, or maybe aggregated by 5-day chunks?
            // For simplicity, let's just use the Weekly view data for now if 'month' is selected but aggregated by Week 1-4.

            labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
            incomeData = [0, 0, 0, 0];
            expenseData = [0, 0, 0, 0];

            txs.forEach(t => {
                const d = new Date(t.date);
                const date = d.getDate(); // 1-31
                const weekIndex = Math.min(Math.floor((date - 1) / 7), 3);

                if (t.type === 'income') incomeData[weekIndex] += t.amount;
                else expenseData[weekIndex] += t.amount;
            });
        }

        return { labels, incomeData, expenseData };
    }

    calculateBalance() {
        return {
            total: this.getBalance(this.currentFilter), // This needs currentFilter passed or stored? 
            // Store doesn't track currentFilter, UI does. UI should call singular methods.
            income: this.getIncome(this.currentFilter), // Stub, refactor UI to call getIncome directly
            expense: this.getExpense(this.currentFilter)
        };
    }
}


// Attach to window so other scripts can see it
window.Store = Store;
