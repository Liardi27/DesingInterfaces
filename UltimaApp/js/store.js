
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
            { id: 'cat_tech', name: 'Tecnología', icon: 'fa-laptop', color: 'bg-cyan-100 text-cyan-600' },
        ];
        this.settings = {
            currency: 'EUR',
            theme: 'default',
            language: 'es'
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
            // Remove "Huchas" dynamically if present in localStorage (cleanup)
            const hadPiggy = this.categories.find(c => c.id === 'cat_piggy');
            if (hadPiggy) {
                this.categories = this.categories.filter(c => c.id !== 'cat_piggy');
                this.saveCategories();
            }
            // Ensure Huchas category exists (migration)
            if (!this.categories.find(c => c.id === 'cat_piggy')) {
                this.categories.push({ id: 'cat_piggy', name: 'Huchas', icon: 'fa-piggy-bank', color: 'bg-teal-100 text-teal-600' });
            }
            // Ensure Tecnología exists (migration)
            const tech = this.categories.find(c => c.id === 'cat_tech');
            if (!tech) {
                this.categories.push({ id: 'cat_tech', name: 'Tecnología', icon: 'fa-laptop', color: 'bg-cyan-100 text-cyan-600' });
            } else {
                // Force update color if it exists
                tech.color = 'bg-cyan-100 text-cyan-600';
                tech.icon = 'fa-laptop'; // Ensure icon is correct too
                this.saveCategories();
            }
        }

        // Load Settings
        const localSettings = localStorage.getItem('finance_settings');
        if (localSettings) {
            this.settings = { ...this.settings, ...JSON.parse(localSettings) };
        }

        // Sync with Cloud Settings (Metadata)
        if (window.auth.user && !window.auth.isGuest) {
            const cloudSettings = window.auth.user.user_metadata?.settings;
            if (cloudSettings) {
                this.settings = { ...this.settings, ...cloudSettings };
                localStorage.setItem('finance_settings', JSON.stringify(this.settings));
            }
        }

        // Apply loaded settings to UI (Theme & Currency)
        if (window.ui) {
            window.ui.applyTheme(this.settings.theme, true);
            if (this.settings.currency) window.ui.updateCurrency(this.settings.currency, true); // true = skip save, just update UI
        }

        // Sync Language with i18n
        if (window.i18n && this.settings.language) {
            // Only set if different to avoid redundant updates on load
            if (window.i18n.currentLang !== this.settings.language) {
                window.i18n.setLanguage(this.settings.language);
            }
        }

        // ALWAYS load Piggy Banks from LocalStorage first as cache/offline
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

        // SUPABASE MODE: Load Pigs from Metadata & Transactions from Table
        // 1. Piggy Banks (Metadata)
        if (window.auth.user.user_metadata && window.auth.user.user_metadata.piggybanks) {
            // Overwrite local cache with cloud truth if available
            this.piggyBanks = window.auth.user.user_metadata.piggybanks;
            // Update local cache
            localStorage.setItem('finance_piggybanks', JSON.stringify(this.piggyBanks));
        }

        // Check for Auto Contributions (Run on every app load)
        this.checkAutoContributions();

        // 2. Transactions (Table)
        try {
            console.log('Fetching transactions for User ID:', window.auth.user.id);

            const query = window.supabaseClient
                .from('transactions')
                .select('*')
                .eq('user_id', window.auth.user.id)
                .order('date', { ascending: false });

            console.log('DEBUG: Sending Supabase Query...');
            const { data, error } = await query;

            if (error) {
                console.error('DEBUG: Query Error Details:', JSON.stringify(error, null, 2));
                throw error;
            }

            console.log('DEBUG: Query Success. Rows:', data?.length);

            if (error) throw error;

            this.transactions = data || [];
            // Cache to localStorage for offline fallback
            localStorage.setItem('finance_transactions_cache', JSON.stringify(this.transactions));

            // Clear any previous error flags
            window.IS_OFFLINE_MODE = false;

        } catch (err) {
            console.error('Error loading transactions:', err);

            // Determine failure reason
            const isOffline = !navigator.onLine;
            const isProjectPaused = err.message && (err.message.includes('upstream') || err.message.includes('503'));

            // Mark app as running in offline/cached mode
            window.IS_OFFLINE_MODE = true;

            // FALLBACK: Use locally cached transactions
            const localTx = localStorage.getItem('finance_transactions_cache');
            this.transactions = localTx ? JSON.parse(localTx) : [];

            // Notify User via UI with specific message
            const alert = document.createElement('div');
            const colorClass = isOffline ? 'bg-orange-500' : 'bg-red-500';
            const icon = isOffline ? 'fa-wifi' : 'fa-server';
            const msg = isOffline
                ? 'Modo Sin Conexión (Datos en Caché)'
                : (isProjectPaused ? 'Error: Servidor Pausado (Supabase)' : 'Error de Conexión con Base de Datos');

            alert.className = `fixed bottom-20 left-1/2 transform -translate-x-1/2 ${colorClass} text-white px-4 py-2 rounded-full shadow-lg z-[50] text-sm font-bold flex items-center gap-2 animate-pulse`;
            alert.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
            document.body.appendChild(alert);

            // If it's a server error, keep it visible longer or until manual dismiss? 
            // For now, 5s is fine, UI should probably have a persistent indicator if offline.
            setTimeout(() => alert.remove(), 8000);
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
        this.categories = this.categories.filter(c => c.id !== id);
        this.saveCategories();
    }

    saveCategories() {
        localStorage.setItem('finance_categories', JSON.stringify(this.categories));
    }

    async convertGlobalCurrency(newCurrency) {
        const oldCurrency = this.settings.currency || 'EUR';

        // ALLOW RE-CONVERSION always to fix desync states
        // if (oldCurrency === newCurrency) ...

        try {
            // 1. Get Rate
            let rate = await window.api.getExchangeRate(oldCurrency, newCurrency);

            console.log(`Converting ${oldCurrency} -> ${newCurrency} @ ${rate}`);

            if (!rate || isNaN(rate)) {
                console.warn(`Invalid exchange rate (${rate}), aborting conversion.`);
                return null;
            }

            // Force rate if same currency but user wants to re-calculate? No.
            // If old == new, rate is 1. We just re-parse numbers.


            const convert = (val) => {
                // Handle mixed types: numbers, strings with commas, etc.
                let num = val;
                if (typeof val === 'string') {
                    num = parseFloat(val.replace(',', '.'));
                }

                if (isNaN(num)) {
                    console.warn('Value is NaN, skipping convert:', val);
                    return val;
                }

                // Math
                const res = num * rate;
                return parseFloat(res.toFixed(2));
            };

            console.log('Starting conversion of transactions...', this.transactions.length);

            // 2. Convert Transactions
            let convertedCount = 0;
            this.transactions.forEach(tx => {
                const oldVal = tx.amount;
                tx.amount = convert(tx.amount);
                if (oldVal !== tx.amount) convertedCount++;
                // Debug first few
                if (convertedCount < 3) console.log(`Tx ${tx.concept}: ${oldVal} -> ${tx.amount}`);
            });
            console.log(`Converted ${convertedCount} transactions.`);

            // 3. Convert Piggy Banks
            this.piggyBanks.forEach(piggy => {
                piggy.target = convert(piggy.target);
                piggy.current = convert(piggy.current);
                if (piggy.autoAmount) piggy.autoAmount = convert(piggy.autoAmount);
                if (piggy.history) {
                    piggy.history.forEach(h => {
                        h.amount = convert(h.amount);
                    });
                }
            });

            // 4. Convert Investments
            this.activeInvestments.forEach(inv => {
                inv.currentPrice = convert(inv.currentPrice); // Also convert price cache
                inv.avgPrice = convert(inv.avgPrice);
                // amount is qty? check store. If amount is money invested, convert it.
                // Looking at renderInvestments, amount seems to be quantity or total value?
                // Let's assume it's total value or cost basis. 
                // Actually, store uses 'amount' usually for monetary value in this app.
                if (inv.invested) inv.invested = convert(inv.invested);
                if (inv.amount) inv.amount = convert(inv.amount);
            });

            // 5. Update Settings
            this.settings.currency = newCurrency;

            // 6. Save All
            this.saveLocal(); // Saves transactions (guest) & piggies
            this.saveSettings();

            return rate;

        } catch (err) {
            console.error('Currency Conversion Failed:', err);
            throw err;
        }
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    saveSettings() {
        // 1. Local Save
        localStorage.setItem('finance_settings', JSON.stringify(this.settings));

        // 2. Cloud Sync
        if (!window.auth.isGuest && window.auth.user) {
            window.supabaseClient.auth.updateUser({
                data: { settings: this.settings }
            }).then(({ data, error }) => {
                if (error) console.error('Error syncing settings:', error);
                // Update local auth user reference immediately to avoid stale metadata
                if (data && data.user) window.auth.user = data.user;
            });
        }
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
            invoice: data.invoice || null,
            date: data.date
        };

        // GUEST MODE
        if (window.auth.isGuest) {
            const newTx = { ...dbData, id: Date.now() };
            this.transactions.unshift(newTx);
            this.saveLocal();
            if (window.router.currentRoute === 'home' && window.ui) window.ui.renderHome();
            return;
        }

        // SUPABASE MODE
        try {
            // ✅ PATRÓN SOLICITADO POR EL USUARIO
            const { data: { user } } = await window.supabaseClient.auth.getUser();

            if (user) {
                // Preparar datos con el ID seguro y fecha ISO
                const dbData = {
                    user_id: user.id, // <--- ¡OBLIGATORIO!
                    type: data.type,
                    amount: data.amount,
                    concept: data.concept,
                    category: data.category,
                    notes: data.notes || '',
                    invoice: data.invoice || null,
                    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString()
                };

                // Optimistic UI Update
                const tempId = Date.now();
                const optimisticTx = { ...dbData, id: tempId };
                this.transactions.unshift(optimisticTx);
                if (window.router.currentRoute === 'home' && window.ui) window.ui.renderHome();

                const { data: inserted, error } = await window.supabaseClient
                    .from('transactions')
                    .insert([dbData]) // Insert object in array as per Supabase JS v2
                    .select();

                if (error) {
                    console.error('Error saving to Cloud:', error);
                    alert(`❌ Error al guardar: ${error.message || JSON.stringify(error)}\nDetails: ${error.details || ''}\nHint: ${error.hint || ''}`);
                    // Revert optimistic
                    this.transactions = this.transactions.filter(t => t.id !== tempId);
                    if (window.router.currentRoute === 'home' && window.ui) window.ui.renderHome();
                } else if (inserted && inserted[0]) {
                    const index = this.transactions.findIndex(t => t.id === tempId);
                    if (index !== -1) this.transactions[index] = inserted[0];
                }
            } else {
                alert("⚠️ Error: No se pudo obtener el usuario de la sesión.");
            }
        } catch (err) {
            console.error("Excepción en addTransaction:", err);
            alert("Error crítico al intentar guardar.");
        }
    }

    async deleteTransaction(id) {
        const prevTxs = [...this.transactions];
        this.transactions = this.transactions.filter(t => t.id !== id);
        if (window.router.currentRoute === 'home' && window.ui) window.ui.renderHome();

        if (window.auth.isGuest) {
            this.saveLocal();
            return;
        }

        const { error } = await window.supabaseClient
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting from Cloud:', error);
            alert('No se pudo borrar.');
            this.transactions = prevTxs;
            if (window.router.currentRoute === 'home' && window.ui) window.ui.renderHome();
        }
    }

    saveLocal() {
        if (window.auth.isGuest) {
            localStorage.setItem('finance_guest_data', JSON.stringify(this.transactions));
            localStorage.setItem('finance_guest_investments', JSON.stringify(this.activeInvestments));
        }
        // Also save piggybanks as backup
        localStorage.setItem('finance_piggybanks', JSON.stringify(this.piggyBanks));
    }

    savePiggyBanks() {
        // 1. Save Local (Backup/Cache/Guest)
        localStorage.setItem('finance_piggybanks', JSON.stringify(this.piggyBanks));

        // 2. Save Cloud (If Logged In)
        if (!window.auth.isGuest && window.auth.user) {
            window.supabaseClient.auth.updateUser({
                data: { piggybanks: this.piggyBanks }
            }).then(({ error }) => {
                if (error) console.error('Error syncing piggy banks:', error);
                else console.log('Piggy Banks synced to cloud');
            });
        }
    }

    // Piggy Banks Logic
    addPiggyBank(data) {
        // ... (creation logic same as before) ...
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

        // Auto Contribution Setup
        if (data.contributionMode === 'auto') {
            newBank.contributionMode = 'auto';
            newBank.autoAmount = parseFloat(data.autoAmount) || 0;
            newBank.autoDay = parseInt(data.autoDay) || 1;
            newBank.lastAutoContribution = new Date().toISOString();
        } else {
            newBank.contributionMode = 'manual';
        }

        this.piggyBanks.unshift(newBank);
        this.savePiggyBanks();
    }

    checkAutoContributions() {
        if (!this.piggyBanks.length) return;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11
        const currentDay = now.getDate();
        let changesMade = false;

        this.piggyBanks.forEach(bank => {
            if (bank.contributionMode === 'auto' && bank.autoAmount > 0) {
                const dayToPay = bank.autoDay || 1;

                // Parse last contribution date
                const lastDate = bank.lastAutoContribution ? new Date(bank.lastAutoContribution) : new Date(0); // 1970 if null

                // Determine if we need to pay for THIS month
                // Logic: If current day >= dayToPay AND (last contribution was in previous month OR never)
                // We should theoretically check for EVERY missed month, but let's stick to "Current Month Catch-up" for simplicity first
                // Or better: Check if "Target Payment Date for This Month" has passed AND we haven't paid yet.

                const targetDateThisMonth = new Date(currentYear, currentMonth, dayToPay);

                // If today is past the target date
                if (now >= targetDateThisMonth) {
                    // Check if we already paid this month
                    // Warning: lastDate might be from today if we just created it.
                    const alreadyPaidThisMonth = lastDate.getFullYear() === currentYear && lastDate.getMonth() === currentMonth;

                    if (!alreadyPaidThisMonth) {
                        // TRIGGER DEPOSIT
                        console.log(`Auto-contributing ${bank.autoAmount} to ${bank.name}`);
                        this.depositToPiggyBank(bank.id, bank.autoAmount, true); // true = automated
                        bank.lastAutoContribution = new Date().toISOString();
                        changesMade = true;
                    }
                }
            }
        });

        if (changesMade) this.savePiggyBanks();
    }

    // Updated deposit to handle auto flag for notes
    depositToPiggyBank(id, amount, isAuto = false) {
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
            type: 'deposit',
            isAuto: isAuto
        });

        // Link with main balance: Create an expense transaction
        this.addTransaction({
            type: 'expense',
            amount: val,
            concept: `Añadido a ${bank.name} ${progress}%`,
            category: 'cat_piggy',
            date: new Date().toISOString(),
            notes: isAuto ? 'Ahorro automático mensual' : 'Ahorro manual'
        });

        this.savePiggyBanks();
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
            labels = [];
            incomeData = new Array(7).fill(0);
            expenseData = new Array(7).fill(0);

            const daysMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S']; // 0=Sun, 1=Mon...
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            // Generate labels for last 7 days (Today-6 to Today)
            for (let i = 6; i >= 0; i--) {
                const d = new Date(todayStart);
                d.setDate(d.getDate() - i);
                labels.push(daysMap[d.getDay()]);
            }

            txs.forEach(t => {
                const d = new Date(t.date);
                d.setHours(0, 0, 0, 0);

                // Difference in days from Today
                const diffTime = todayStart.getTime() - d.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                // If within last 7 days (0 to 6)
                if (diffDays >= 0 && diffDays < 7) {
                    const index = 6 - diffDays; // Today is index 6, Yesterday is 5...
                    if (t.type === 'income') incomeData[index] += t.amount;
                    else expenseData[index] += t.amount;
                }
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
