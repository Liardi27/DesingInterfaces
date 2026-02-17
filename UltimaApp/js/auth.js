class Auth {
    constructor() {
        this.user = null;
    }

    async init() {
        this.isGuest = localStorage.getItem('finance_guest_mode') === 'true';

        if (this.isGuest) {
            const guestProfile = JSON.parse(localStorage.getItem('finance_guest_profile') || '{}');
            this.user = {
                id: 'guest',
                email: 'invitado@pocketfinance.app',
                user_metadata: guestProfile
            };
            console.log('Guest mode active');
            if (window.router.currentRoute === 'login') {
                window.router.navigate('home');
            }
            this.updateUI(); // Ensure UI is updated with guest info
            window.store.init();
            return;
        }

        // Check active session
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        this.user = session?.user || null;

        // Listen for auth changes
        window.supabaseClient.auth.onAuthStateChange((_event, session) => {
            if (this.isGuest) return; // Ignore supabase events in guest mode

            this.user = session?.user || null;
            this.updateUI();

            if (this.user) {
                // If logged in, ensure we are not on login page
                if (window.router.currentRoute === 'login') {
                    window.router.navigate('home');
                }
                // Reload data for this user
                window.store.init();
            } else {
                // If logged out, go to login
                window.router.navigate('login');
            }
        });
    }

    enableGuestMode() {
        this.isGuest = true;
        const guestProfile = JSON.parse(localStorage.getItem('finance_guest_profile') || '{}');
        this.user = {
            id: 'guest',
            email: 'invitado@pocketfinance.app',
            user_metadata: guestProfile
        };
        localStorage.setItem('finance_guest_mode', 'true');
        this.updateUI(); // Immediate UI update
        window.store.init();
        window.router.navigate('home');
    }

    disableGuestMode() {
        this.isGuest = false;
        this.user = null;
        localStorage.removeItem('finance_guest_mode');
        // Let normal auth flow take over or reload
        window.router.navigate('login');
    }

    async signIn(email, password) {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    async signUp(email, password) {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    async signOut() {
        if (this.isGuest) {
            this.disableGuestMode();
            return;
        }

        try {
            await window.supabaseClient.auth.signOut();
        } catch (error) {
            console.warn('Supabase SignOut failed (Network?), forcing local cleanup:', error);
        }

        // Session Cleanup: Clear user-specific local data to prevent leaks
        localStorage.removeItem('finance_piggybanks');
        localStorage.removeItem('finance_settings');
        localStorage.removeItem('finance_categories');
        localStorage.removeItem('finance_data'); // Just in case
        localStorage.removeItem('sb-qtcdkqqjlrphfxrhzpkx-auth-token'); // Clear Supabase token specifically

        // Force reload to reset application state
        window.location.reload();
    }

    async deleteAccount() {
        if (confirm('Última advertencia: ¿Borrar todo?')) {
            // 1. Clear Local Data
            localStorage.removeItem('finance_data');
            localStorage.removeItem('finance_guest_mode');
            localStorage.removeItem('finance_guest_profile');
            // Keep settings? Maybe better to clear everything to be safe/clean
            localStorage.removeItem('finance_settings');
            localStorage.removeItem('finance_dark_mode');
            // ... other keys ...
            localStorage.clear(); // Nuclear option as requested "Borrar cuenta" usually means reset.

            // 2. If Supabase User, attempt to delete (or just sign out if RLS prevents deletion)
            if (!this.isGuest && this.user) {
                // In a real app, you'd call a cloud function or delete from DB.
                // For now, we'll just sign out.
                await window.supabaseClient.auth.signOut();
            }

            // 3. Reload to reset state
            window.location.reload();
        }
    }

    async updateUI() {
        const usernameEl = document.getElementById('sidebar-username');
        const planEl = document.getElementById('sidebar-plan');
        const userImageEl = document.querySelector('#sidebar-user-image'); // Add ID to img in HTML or select by path

        if (this.user) {
            const displayName = this.user.user_metadata?.full_name || this.user.email;
            if (usernameEl) usernameEl.textContent = displayName;

            // Update avatar from metadata or fallback to UI Avatars
            if (userImageEl) {
                const avatarUrl = this.user.user_metadata?.avatar_url;
                if (avatarUrl) {
                    userImageEl.src = avatarUrl;
                } else {
                    userImageEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                }
            }
        } else {
            if (usernameEl) usernameEl.textContent = 'Desconectado';
        }
    }

    async updateProfile({ fullName, avatarUrl, bio, phone, location, email, password }) {
        console.log('updateProfile called with:', { fullName, avatarUrl, bio, phone, location, emailChanged: !!email });

        const newMetadata = {
            ...this.user.user_metadata,
            full_name: fullName,
            avatar_url: avatarUrl,
            bio: bio,
            phone: phone,
            location: location
        };

        if (this.isGuest) {
            this.user.user_metadata = newMetadata;
            if (email) this.user.email = email; // Allow mock email change in guest mode
            localStorage.setItem('finance_guest_profile', JSON.stringify(newMetadata));
            this.updateUI();
            return { data: { user: this.user }, error: null, emailUpdated: !!email };
        }

        // 1. Handle Email Change (Requires Password Verification)
        let emailUpdated = false;
        if (email && email !== this.user.email) {
            if (!password) throw new Error("Se requiere contraseña para cambiar el email.");

            // Verify password by signing in (Double Verification)
            const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                email: this.user.email,
                password: password
            });

            if (signInError) throw new Error("Contraseña incorrecta. No se pudo verificar la identidad.");

            // Update Email
            const { error: emailError } = await window.supabaseClient.auth.updateUser({ email: email });
            if (emailError) throw emailError;

            emailUpdated = true;
        }

        // 2. Update Metadata
        const { data, error } = await window.supabaseClient.auth.updateUser({
            data: newMetadata
        });

        if (error) throw error;

        // Supabase sends back the updated user in data.user
        if (data.user) {
            this.user = data.user;
            this.updateUI();
        }

        return { ...data, emailUpdated };
    }

    async handleRegisterSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const errorEl = document.getElementById('auth-error');
        const successEl = document.getElementById('auth-success');

        errorEl.classList.add('hidden');
        successEl.classList.add('hidden');

        try {
            await this.signUp(email, password);
            // If auto-confirm is enabled, they might be logged in. If not, show success message.
            // Usually signUp returns user.
            successEl.classList.remove('hidden');
            successEl.textContent = '¡Cuenta creada! Iniciando sesión...';

            // Attempt auto-login if supabase session is active immediately
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                window.router.navigate('home');
            } else {
                successEl.textContent = 'Revisa tu email para confirmar la cuenta.';
            }

        } catch (err) {
            errorEl.classList.remove('hidden');
            errorEl.textContent = err.message || 'Error al registrarse';
        }
    }

    async handleSignInSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const errorEl = document.getElementById('auth-error');

        errorEl.classList.add('hidden');

        try {
            await this.signIn(email, password);
            window.router.navigate('home');
        } catch (err) {
            console.error('Login error:', err);
            errorEl.classList.remove('hidden');

            if (err.message.includes('Email not confirmed')) {
                errorEl.textContent = 'Por favor confirma tu email antes de entrar.';
            } else if (err.message.includes('Invalid login credentials')) {
                errorEl.textContent = 'Email o contraseña incorrectos';
            } else {
                errorEl.textContent = 'Error: ' + (err.message || 'No se pudo iniciar sesión');
            }
        }
    }
}

window.Auth = Auth;
