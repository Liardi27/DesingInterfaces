const i18n = {
    defaultLanguage: 'es',
    supportedLanguages: {
        'es': { flag: '🇪🇸', name: 'Español' },
        'en': { flag: '🇬🇧', name: 'English' },
        'ja': { flag: '🇯🇵', name: '日本語' },
        'de': { flag: '🇩🇪', name: 'Deutsch' },
        'fr': { flag: '🇫🇷', name: 'Français' },
        'pt': { flag: '🇵🇹', name: 'Português' },
        'it': { flag: '🇮🇹', name: 'Italiano' }
    },

    // Translation Dictionary
    translations: {
        // --- Navigation ---
        'nav_home': {
            es: 'Inicio', en: 'Home', ja: 'ホーム', de: 'Startseite', fr: 'Accueil', pt: 'Início', it: 'Home'
        },
        'nav_account': {
            es: 'Cuenta', en: 'Account', ja: 'アカウント', de: 'Konto', fr: 'Compte', pt: 'Conta', it: 'Account'
        },
        'nav_investments': {
            es: 'Inversiones', en: 'Investments', ja: '投資', de: 'Investitionen', fr: 'Investissements', pt: 'Investimentos', it: 'Investimenti'
        },
        'nav_piggybanks': {
            es: 'Huchas', en: 'Piggy Banks', ja: '貯金箱', de: 'Sparschweine', fr: 'Tirelires', pt: 'Cofrinhos', it: 'Salvadanaio'
        },
        'nav_stats': {
            es: 'Estadísticas', en: 'Statistics', ja: '統計', de: 'Statistiken', fr: 'Statistiques', pt: 'Estatísticas', it: 'Statistiche'
        },
        'nav_settings': {
            es: 'Ajustes', en: 'Settings', ja: '設定', de: 'Einstellungen', fr: 'Paramètres', pt: 'Configurações', it: 'Impostazioni'
        },
        'nav_new_movement': {
            es: 'Nuevo Movimiento', en: 'New Transaction', ja: '新規取引', de: 'Neue Transaktion', fr: 'Nouvelle Transaction', pt: 'Nova Transação', it: 'Nuova Transazione'
        },
        'nav_profile': {
            es: 'Mi Perfil', en: 'My Profile', ja: 'プロフィール', de: 'Mein Profil', fr: 'Mon Profil', pt: 'Meu Perfil', it: 'Il Mio Profilo'
        },
        'nav_logout': {
            es: 'Cerrar Sesión', en: 'Sign Out', ja: 'ログアウト', de: 'Abmelden', fr: 'Déconnexion', pt: 'Sair', it: 'Disconnettersi'
        },

        // --- Dashboard / Headers ---
        'header_summary': {
            es: 'Resumen', en: 'Summary', ja: '概要', de: 'Zusammenfassung', fr: 'Résumé', pt: 'Resumo', it: 'Riepilogo'
        },
        'balance_total': {
            es: 'Balance Total', en: 'Total Balance', ja: '総残高', de: 'Gesamtsaldo', fr: 'Solde Total', pt: 'Saldo Total', it: 'Saldo Totale'
        },
        'income': {
            es: 'Ingresos', en: 'Income', ja: '収入', de: 'Einnahmen', fr: 'Revenus', pt: 'Receitas', it: 'Entrate'
        },
        'expenses': {
            es: 'Gastos', en: 'Expenses', ja: '支出', de: 'Ausgaben', fr: 'Dépenses', pt: 'Despesas', it: 'Spese'
        },
        'weekly_summary': {
            es: 'Resumen Semanal', en: 'Weekly Summary', ja: '週間概要', de: 'Wochenzusammenfassung', fr: 'Résumé Hebdomadaire', pt: 'Resumo Semanal', it: 'Riepilogo Settimanale'
        },
        'recent_activity': {
            es: 'Recientes', en: 'Recent Activity', ja: '最近のアクティビティ', de: 'Letzte Aktivitäten', fr: 'Activité Récente', pt: 'Atividade Recente', it: 'Attività Recente'
        },
        'see_all': {
            es: 'Ver todo', en: 'See all', ja: 'すべて見る', de: 'Alle ansehen', fr: 'Voir tout', pt: 'Ver tudo', it: 'Vedi tutto'
        },

        // --- Settings ---
        'settings_general': {
            es: 'General', en: 'General', ja: '一般', de: 'Allgemein', fr: 'Général', pt: 'Geral', it: 'Generale'
        },
        'settings_appearance': {
            es: 'Apariencia', en: 'Appearance', ja: '外観', de: 'Aussehen', fr: 'Apparence', pt: 'Aparência', it: 'Aspetto'
        },
        'settings_account': {
            es: 'Cuenta', en: 'Account', ja: 'アカウント', de: 'Konto', fr: 'Compte', pt: 'Conta', it: 'Account'
        },
        'settings_language': {
            es: 'Idioma', en: 'Language', ja: '言語', de: 'Sprache', fr: 'Langue', pt: 'Idioma', it: 'Lingua'
        },
        'settings_main_currency': {
            es: 'Moneda Principal', en: 'Main Currency', ja: '主要通貨', de: 'Hauptwährung', fr: 'Devise Principale', pt: 'Moeda Principal', it: 'Valuta Principale'
        },
        'settings_categories': {
            es: 'Categorías', en: 'Categories', ja: 'カテゴリー', de: 'Kategorien', fr: 'Catégories', pt: 'Categorias', it: 'Categorie'
        },
        'settings_accessibility': {
            es: 'Accesibilidad', en: 'Accessibility', ja: 'アクセシビリティ', de: 'Barrierefreiheit', fr: 'Accessibilité', pt: 'Acessibilidade', it: 'Accessibilità'
        },
        'settings_dyslexic': {
            es: 'Lectura Fácil', en: 'Easy Read', ja: '読みやすいフォント', de: 'Leichte Sprache', fr: 'Lecture Facile', pt: 'Leitura Fácil', it: 'Lettura Facilitata'
        },
        'settings_contrast': {
            es: 'Alto Contraste', en: 'High Contrast', ja: 'ハイコントラスト', de: 'Hoher Kontrast', fr: 'Haut Contraste', pt: 'Alto Contraste', it: 'Alto Contrasto'
        },
        'settings_theme': {
            es: 'Tema de Color', en: 'Color Theme', ja: 'カラーテーマ', de: 'Farbthema', fr: 'Thème de Couleur', pt: 'Tema de Cor', it: 'Tema Colore'
        },
        'settings_dark_mode': {
            es: 'Modo Oscuro', en: 'Dark Mode', ja: 'ダークモード', de: 'Dunkelmodus', fr: 'Mode Sombre', pt: 'Modo Escuro', it: 'Modalità Scura'
        },
        'settings_colorblind': {
            es: 'Modo Daltonismo', en: 'Color Blindness Mode', ja: '色覚多様性モード', de: 'Farbenblind-Modus', fr: 'Mode Daltonisme', pt: 'Modo Daltonismo', it: 'Modalità Daltonismo'
        },
        'settings_colorblind_desc': {
            es: 'Ajusta los colores para tu visión', en: 'Adjust colors for your vision', ja: '視覚に合わせて色を調整', de: 'Farben an Ihre Sicht anpassen', fr: 'Ajustez les couleurs pour votre vision', pt: 'Ajuste as cores para sua visão', it: 'Regola i colori per la tua visione'
        },
        'settings_reset_access': {
            es: 'Restablecer Accesibilidad', en: 'Reset Accessibility', ja: 'アクセシビリティをリセット', de: 'Barrierefreiheit zurücksetzen', fr: 'Réinitialiser l\'Accessibilité', pt: 'Redefinir Acessibilidade', it: 'Ripristina Accessibilità'
        },

        // --- Common ---
        'save': {
            es: 'Guardar', en: 'Save', ja: '保存', de: 'Speichern', fr: 'Enregistrer', pt: 'Salvar', it: 'Salva'
        },
        'cancel': {
            es: 'Cancelar', en: 'Cancel', ja: 'キャンセル', de: 'Abbrechen', fr: 'Annuler', pt: 'Cancelar', it: 'Annulla'
        },
        'delete': {
            es: 'Eliminar', en: 'Delete', ja: '削除', de: 'Löschen', fr: 'Supprimer', pt: 'Excluir', it: 'Elimina'
        },
        'edit': {
            es: 'Editar', en: 'Edit', ja: '編集', de: 'Bearbeiten', fr: 'Modifier', pt: 'Editar', it: 'Modifica'
        },
        'loading': {
            es: 'Cargando...', en: 'Loading...', ja: '読み込み中...', de: 'Laden...', fr: 'Chargement...', pt: 'Carregando...', it: 'Caricamento...'
        },

        // --- Filter Options ---
        'filter_week': {
            es: 'Esta Semana', en: 'This Week', ja: '今週', de: 'Diese Woche', fr: 'Cette Semaine', pt: 'Esta Semana', it: 'Questa Settimana'
        },
        'filter_month': {
            es: 'Este Mes', en: 'This Month', ja: '今月', de: 'Diesen Monat', fr: 'Ce Mois', pt: 'Este Mês', it: 'Questo Mese'
        },
        'filter_year': {
            es: 'Este Año', en: 'This Year', ja: '今年', de: 'Dieses Jahr', fr: 'Cette Année', pt: 'Este Ano', it: 'Questo Anno'
        }
    },

    // Current Language
    currentLang: 'es',

    // Initialize
    init() {
        // Try to get language from store, then local storage, then browser, then default
        const savedLang = localStorage.getItem('finance_language');
        const browserLang = navigator.language.split('-')[0];

        if (savedLang && this.supportedLanguages[savedLang]) {
            this.currentLang = savedLang;
        } else if (this.supportedLanguages[browserLang]) {
            this.currentLang = browserLang;
        } else {
            this.currentLang = this.defaultLanguage;
        }

        // Apply
        this.updatePageLanguage();
    },

    // Set Language
    setLanguage(lang) {
        if (this.supportedLanguages[lang]) {
            this.currentLang = lang;
            localStorage.setItem('finance_language', lang);
            this.updatePageLanguage();

            // Trigger UI update if window.ui exists
            if (window.ui && typeof window.ui.render === 'function') {
                // Determine active tab/view to re-render contextually if needed
                // For now, reload is easiest for full propagation, but we can try dynamic first
                // window.location.reload(); // Too aggressive?

                if (window.router) {
                    // Re-run current route handler to refresh content
                    const currentRoute = window.location.hash.slice(1) || 'home';
                    window.router.navigate(currentRoute);
                }
            }
        }
    },

    // Get Translation
    t(key) {
        const entry = this.translations[key];
        if (!entry) return key; // Fallback to key if not found
        return entry[this.currentLang] || entry[this.defaultLanguage] || key;
    },

    // Update Static Elements with data-i18n attribute
    updatePageLanguage() {
        document.documentElement.lang = this.currentLang;

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);

            // Check if element has placeholder
            if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                el.placeholder = translation;
            } else {
                // Preserve icons if they exist in HTML but are not part of translation
                // Actually safer to just replace textContent if structure allows, 
                // but for buttons with icons <i> + <span>, we should target the <span>.
                // Strategy: If element has children and one is a span, update the span?
                // Or just assume data-i18n is on the text node container.

                // If the element has specific structure (icon + text), we might overwrite icon if we use innerText.
                // Better to put data-i18n on the SPAN wrapping the text.
                el.textContent = translation;
            }
        });
    }
};

// Expose to window
window.i18n = i18n;
