import { supabase } from '/supabase.js'

const { data: { session } } = await supabase.auth.getSession();
const currentUser = session?.user;

// â”€â”€ Role Authorization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let isAdmin = false;
let isManager = false;
if (currentUser) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
  isAdmin = (profile?.role === 'Admin') || (currentUser.user_metadata?.role === 'Admin') || (currentUser.email === 'macario@duke.com');
  isManager = !isAdmin && (profile?.role === 'Manager');
}

const app = {
  state: {
    activeView: 'dashboard',
    users: [],
    ferias: [],
    timeLogs: [],
    activeWorkers: [],
    allTodayLogs: [], // New state to track all logs from today
    viewedUserLogs: [],
    viewedUserName: '',
    logs: [
      { id: 101, user: 'Juan Pérez', action: 'Acceso Concedido', area: 'Entrada Principal', time: '10:15 AM' },
      { id: 102, user: 'Visitante Desconocido', action: 'Acceso Denegado', area: 'Laboratorio', time: '10:08 AM' },
    ]
  },

  async handleInit() {
    if (!session) {
      this.showLogin();
    } else {
      this.showDashboard();
      await this.init();
    }
  },

  showLogin() {
    document.getElementById('app').style.display = 'none';
    const loginScreen = document.getElementById('login-screen');
    loginScreen.style.display = 'block';
    this.renderLogin();
  },

  showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
  },

  renderLogin() {
    const loginScreen = document.getElementById('login-screen');
    loginScreen.innerHTML = `
      <style>
        .login-bg { position: fixed; inset: 0; z-index: 0; background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1e1b4b 100%); overflow: hidden; height: 100vh; width: 100vw; }
        .login-bg::before, .login-bg::after { content: ''; position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; }
        .login-bg::before { width: 600px; height: 600px; background: radial-gradient(circle, #2563eb, transparent); top: -150px; left: -150px; }
        .login-bg::after  { width: 500px; height: 500px; background: radial-gradient(circle, #7c3aed, transparent); bottom: -100px; right: -100px; }
        .login-layout { position: relative; z-index: 1; display: flex; width: 100%; height: 100vh; }
        .brand-panel { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 4rem; color: white; }
        .brand-headline { font-size: 2.75rem; font-weight: 800; line-height: 1.15; margin-bottom: 1.25rem; }
        .card-panel { width: 480px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .card-auth { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(24px); border-radius: 20px; padding: 2.5rem; width: 100%; color: white; }
        .auth-tabs { display: flex; background: rgba(255,255,255,0.07); border-radius: 10px; padding: 4px; margin-bottom: 2rem; }
        .auth-tab { flex: 1; padding: 0.625rem; text-align: center; font-size: 0.875rem; font-weight: 600; color: rgba(255,255,255,0.5); border-radius: 7px; cursor: pointer; }
        .auth-tab.active { background: #2563eb; color: white; }
        .auth-form { display: none; }
        .auth-form.active { display: block; }
        .auth-input { width: 100%; padding: 0.7rem 1rem; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; color: white; margin-bottom: 1rem; }
        .btn-auth { width: 100%; padding: 0.8rem; background: #2563eb; color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
        @media (max-width: 900px) { .brand-panel { display: none; } .card-panel { width: 100%; } }
      </style>
      <div class="login-bg"></div>
      <div class="login-layout">
        <div class="brand-panel">
          <h1 class="brand-headline">Controla el acceso<br>a tu <span style="color: #60a5fa;">organización</span></h1>
          <p style="color: rgba(255,255,255,0.6); max-width: 380px;">Gestión centralizada de permisos y registros en tiempo real.</p>
        </div>
        <div class="card-panel">
          <div class="card-auth">
            <div class="auth-tabs">
              <div class="auth-tab active" id="tab-login">Iniciar Sesión</div>
              <div class="auth-tab" id="tab-register">Registrarse</div>
            </div>
            <div class="auth-form active" id="form-login">
              <div id="login-alert" style="display:none; padding:10px; border-radius:8px; margin-bottom:15px; font-size:14px;"></div>
              <input type="email" id="login-email" class="auth-input" placeholder="Email">
              <input type="password" id="login-password" class="auth-input" placeholder="Contraseña">
              <button class="btn-auth" id="btn-login-action">Entrar</button>
            </div>
            <div class="auth-form" id="form-register">
              <div id="register-alert" style="display:none; padding:10px; border-radius:8px; margin-bottom:15px; font-size:14px;"></div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <input type="text" id="reg-name" class="auth-input" placeholder="Nombre">
                <input type="text" id="reg-lastname" class="auth-input" placeholder="Apellido">
              </div>
              <input type="email" id="reg-email" class="auth-input" placeholder="Email">
              <input type="password" id="reg-password" class="auth-input" placeholder="Contraseña">
              <button class="btn-auth" id="btn-register-action">Crear Cuenta</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Listeners para pestañas
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    tabLogin.onclick = () => {
      tabLogin.classList.add('active'); tabRegister.classList.remove('active');
      formLogin.classList.add('active'); formRegister.classList.remove('active');
    };
    tabRegister.onclick = () => {
      tabRegister.classList.add('active'); tabLogin.classList.remove('active');
      formRegister.classList.add('active'); formLogin.classList.remove('active');
    };

    // Acciones
    document.getElementById('btn-login-action').onclick = async () => {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const al = document.getElementById('login-alert');
        al.textContent = "Error: " + error.message;
        al.style.display = 'block'; al.style.background = '#fee2e2'; al.style.color = '#991b1b';
      } else {
        window.location.reload(); // Recargar para actualizar sesión
      }
    };

    document.getElementById('btn-register-action').onclick = async () => {
      const name = document.getElementById('reg-name').value;
      const lastname = document.getElementById('reg-lastname').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { name: name + ' ' + lastname, role: 'Employee' } }
      });

      if (error) {
        const al = document.getElementById('register-alert');
        al.textContent = error.message; al.style.display = 'block'; al.style.background = '#fee2e2';
      } else {
        if (data.user) {
          await supabase.from('profiles').insert({ id: data.user.id, name: name + ' ' + lastname, role: 'Employee', status: 'Active' });
          const al = document.getElementById('register-alert');
          al.textContent = "¡Cuenta creada! Revisa tu email.";
          al.style.display = 'block'; al.style.background = '#dcfce7'; al.style.color = '#166534';
        }
      }
    };
  },


  async init() {
    this.setupGlobalListeners();
    this.injectModal();
    this.injectFeriaModal();
    this.injectWorkersModal();
    this.injectEditFeriaModal();

    // Manager: ocultar vistas restringidas y redirigir a kiosk
    if (isManager) {
      document.querySelector('[data-view="dashboard"]')?.closest('a')?.remove() ||
        document.querySelector('[data-view="dashboard"]')?.remove();
      document.querySelector('[data-view="manage-ferias"]')?.closest('a')?.remove() ||
        document.querySelector('[data-view="manage-ferias"]')?.remove();
      this.state.activeView = 'kiosk';
    }

    // Carga en paralelo — profiles+ferias al mismo tiempo
    await Promise.all([this.loadUsers(), this.loadFeriasData()]);
    if (this.state.activeView === 'kiosk') await this.loadKioskData();
    if (this.state.activeView === 'dashboard') await this.loadDashboardData();

    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const navItem = document.querySelector(`[data-view="${this.state.activeView}"]`);
    if(navItem) navItem.classList.add('active');

    this.updateHeader();
    this.renderView(this.state.activeView);
  },

  async loadUsers() {
    // Limitar logs a 2 años atrás — más que suficiente para calcular totales
    const since = new Date();
    since.setFullYear(since.getFullYear() - 2);
    const [{ data: profiles, error: pError }, { data: logs }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('time_logs')
        .select('user_id, action_type, timestamp, feria_id, hourly_rate, ferias(base_hourly_rate)')
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: true }),
    ]);

    const statsByUser = {};
    if (profiles) {
      profiles.forEach(p => {
        statsByUser[p.id] = { totalMs: 0, totalEarnings: 0, lastIn: null, defaultRate: Number(p.hourly_rate) || 10 };
      });
    }

    if (logs && profiles) {
      logs.forEach(l => {
        const uData = statsByUser[l.user_id];
        if (!uData) return;
        
        if (l.action_type === 'Entrada') {
          uData.lastIn = { ts: new Date(l.timestamp), logRate: l.hourly_rate, feriaRate: l.ferias?.base_hourly_rate };
        } else if (l.action_type === 'Salida' && uData.lastIn) {
          const ms = new Date(l.timestamp) - uData.lastIn.ts;
          uData.totalMs += ms;
          const shiftRate = uData.lastIn.logRate > 0 ? uData.lastIn.logRate
            : uData.lastIn.feriaRate > 0 ? uData.lastIn.feriaRate
            : uData.defaultRate;
          uData.totalEarnings += (ms / 3600000) * shiftRate;
          uData.lastIn = null;
        }
      });
    }

    if (!pError && profiles) {
      this.state.users = profiles.map(u => {
        const stats = statsByUser[u.id] || { totalMs: 0, totalEarnings: 0 };
        const ms = stats.totalMs;
        const hrs = Math.floor(ms / 1000 / 60 / 60);
        const mins = Math.floor((ms / 1000 / 60) % 60);
        return {
          id: u.id,
          name: u.name,
          email: u.email || '',
          role: u.role,
          status: u.status,
          lastAccess: u.last_access || 'Nunca',
          totalHours: hrs > 0 || mins > 0 ? `${hrs}h ${mins}m` : '0h 0m',
          totalMs: ms,
          totalEarnings: stats.totalEarnings,
          hourlyRate: Number(u.hourly_rate) || 0,
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
    }
  },

  updateHeader() {
    if (!currentUser) return;
    const name = currentUser.user_metadata?.name || currentUser.email || 'Usuario';
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const avatarEl = document.getElementById('userAvatar');
    const nameEl   = document.getElementById('userName');
    if (avatarEl) avatarEl.textContent = initials;
    if (nameEl)   nameEl.textContent = name;
  },

  injectModal() {
    const existing = document.getElementById('modalOverlay');
    if (existing) existing.remove();

    const modalHTML = `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 style="font-size: 1.125rem; font-weight: 700;">Añadir Nuevo Usuario</h2>
            <button class="btn btn-ghost" id="closeModal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <form id="userForm">
            <div class="modal-body">
              <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" id="userFullName" class="input-field" placeholder="Ej. Alex Smith" required>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" id="userEmail" class="input-field" placeholder="alex@empresa.com" required>
              </div>
              <div class="form-group">
                <label>Contraseña inicial</label>
                <input type="password" id="userPassword" class="input-field" placeholder="Mínimo 6 caracteres" required>
              </div>
              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <label>Rol</label>
                  <select id="userRole" class="input-field">
                    <option value="Admin">Admin</option>
                    <option value="Employee" selected>Empleado</option>
                  </select>
                </div>
                <div>
                  <label>Estado</label>
                  <select id="userStatus" class="input-field">
                    <option value="Active">Activo</option>
                    <option value="Inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              <div id="modal-error" style="display:none; padding: 0.6rem 0.8rem; background: #fee2e2; border-radius: 6px; color: #991b1b; font-size: 0.8125rem; margin-top: 0.5rem;"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" id="cancelBtn">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="saveBtn">Guardar Usuario</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.setupModalListeners();
  },

  setupGlobalListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.onclick = (e) => {
        e.preventDefault();
        this.switchView(item.getAttribute('data-view'));
      };
    });

    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
      searchInput.oninput = (e) => {
        if (this.state.activeView === 'users') this.filterUsers(e.target.value.toLowerCase());
      };
    }

    const mobBtn = document.getElementById('mobileMenuBtn');
    if (mobBtn) {
      mobBtn.onclick = () => document.querySelector('.sidebar').classList.toggle('mobile-open');
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await supabase.auth.signOut();
        window.location.reload();
      };
    }
  },

  bindViewEvents() {
    const addBtn = document.querySelector('.btn-add-user');
    if (addBtn) addBtn.onclick = () => this.openModal();

    document.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.onclick = () => this.deleteUser(btn.getAttribute('data-id'));
    });

    const totalUsersCard = document.getElementById('totalUsersCard');
    if (totalUsersCard && isAdmin) {
      totalUsersCard.onclick = () => this.switchView('users');
    }
  },

  setupModalListeners() {
    const overlay   = document.getElementById('modalOverlay');
    const closeBtn  = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form      = document.getElementById('userForm');
    const close     = () => overlay.classList.remove('active');

    closeBtn.onclick  = close;
    cancelBtn.onclick = close;
    overlay.onclick   = (e) => { if (e.target === overlay) close(); };

    form.onsubmit = async (e) => {
      e.preventDefault();
      await this.addUser();
    };
  },

  async switchView(view) {
    if (isManager && (view === 'dashboard' || view === 'manage-ferias')) return;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.sidebar').classList.remove('mobile-open');
    const navItem = document.querySelector(`[data-view="${view}"]`);
    if (navItem) navItem.classList.add('active');
    this.state.activeView = view;

    // Solo re-fetch si han pasado más de 30 segundos desde la última carga
    const now = Date.now();
    const stale = key => !this.state._lastFetch?.[key] || now - this.state._lastFetch[key] > 30000;
    const stamp = key => { this.state._lastFetch = this.state._lastFetch || {}; this.state._lastFetch[key] = now; };

    if (view === 'dashboard') { await this.loadDashboardData(); stamp('dashboard'); }
    if (view === 'users' && stale('users')) { await this.loadUsers(); stamp('users'); }
    if (view === 'manage-ferias' && stale('ferias')) { await this.loadFeriasData(); stamp('ferias'); }
    if (view === 'kiosk') await this.loadKioskData();
    this.renderView(view);
  },

  openModal() {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('modal-error').style.display = 'none';
  },

  async addUser() {
    const name     = document.getElementById('userFullName').value.trim();
    const email    = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role     = document.getElementById('userRole').value;
    const status   = document.getElementById('userStatus').value;
    const errEl    = document.getElementById('modal-error');
    const saveBtn  = document.getElementById('saveBtn');

    errEl.style.display = 'none';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    // Guardar sesión del admin antes de crear usuario
    // (signUp puede reemplazar la sesión activa si no hay confirmación de email)
    const { data: { session: adminSession } } = await supabase.auth.getSession();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } }
    });

    if (error) {
      errEl.textContent = error.message;
      errEl.style.display = 'block';
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar Usuario';
      return;
    }

    // Restaurar sesión del admin si signUp la reemplazó
    if (adminSession && data.session) {
      await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token
      });
    }

    // Insertar perfil en la tabla profiles
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        email,
        role,
        status,
        last_access: 'Nunca'
      });
      if (profileError) {
        errEl.textContent = 'Usuario creado pero error al guardar perfil: ' + profileError.message;
        errEl.style.display = 'block';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar Usuario';
        return;
      }
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar Usuario';
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('userForm').reset();
    await this.loadUsers();
    this.renderView('users');
  },

  async deleteUser(id) {
    if (!confirm('Â¿Deseas eliminar este usuario?')) return;

    await supabase.from('profiles').delete().eq('id', id);
    await this.loadUsers();
    this.renderView('users');
  },

  filterUsers(query) {
    document.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
  },

  renderView(view) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    if (view === 'dashboard') {
      content.innerHTML = this.getDashboardHTML();
    } else if (view === 'kiosk') {
      content.innerHTML = this.getKioskHTML();
    } else if (view === 'users') {
      content.innerHTML = this.getUsersHTML();
    } else if (view === 'manage-ferias') {
      content.innerHTML = this.getManageFeriasHTML();
    } else if (view === 'user-history') {
      content.innerHTML = this.getUserHistoryHTML();
    } else {
      content.innerHTML = `<div style="text-align:center;padding:4rem;color:var(--text-secondary);">
        <h2>Vista próximamente</h2><p>Esta sección está en desarrollo.</p>
      </div>`;
    }

    this.bindViewEvents();
  },

  async loadDashboardData() {
    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - 3);
    filterDate.setHours(0, 0, 0, 0);
    const tasks = [
      supabase.from('time_logs').select('*, ferias(id, name)')
        .gte('timestamp', filterDate.toISOString())
        .order('timestamp', { ascending: true }),
    ];
    if (this.state.users.length === 0) tasks.push(this.loadUsers());
    const [{ data: logs }] = await Promise.all(tasks);
    this.state.dashboardLogs = logs || [];
  },

  getDashboardHTML() {
    const logs = this.state.dashboardLogs || [];

    // Agrupar logs por usuario y obtener el último evento de cada uno (dentro de los últimos 3 días)
    const userLastLog = {};
    logs.forEach(log => {
      userLastLog[log.user_id] = log;
    });

    const beginOfToday = new Date().setHours(0, 0, 0, 0);
    const todayLogs = logs.filter(l => new Date(l.timestamp).getTime() >= beginOfToday);
    const todayUsersWithLogsCount = new Set(todayLogs.map(l => l.user_id)).size;
    const todayActiveFeriasCount = new Set(todayLogs.map(l => l.feria_id).filter(Boolean)).size;

    // Filtrar los que están actualmente trabajando (último log = Entrada)
    const workingNow = Object.entries(userLastLog)
      .filter(([, log]) => log.action_type === 'Entrada')
      .map(([userId, log]) => {
        const profile = this.state.users.find(u => u.id === userId);
        const since = new Date(log.timestamp);
        const elapsedMs = new Date() - since;
        const h = Math.floor(elapsedMs / 3600000);
        const m = Math.floor((elapsedMs % 3600000) / 60000);
        return {
          name: profile?.name || 'Desconocido',
          initials: (profile?.name || 'XX').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          feria: log.ferias?.name || 'Sin feria',
          since: since.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          elapsed: `${h}h ${m}m`,
          elapsedMs,
        };
      })
      .sort((a, b) => a.elapsedMs - b.elapsedMs);

    const now = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const todayFormatted = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

    const cards = workingNow.length > 0
      ? workingNow.map(w => `
          <div style="background:white;border:1px solid #e2e8f0;border-radius:14px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);display:flex;flex-direction:column;gap:1rem;position:relative;overflow:hidden;">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#22c55e,#16a34a);"></div>
            <div style="display:flex;align-items:center;gap:1rem;">
              <div style="width:48px;height:48px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;color:white;font-size:1.1rem;flex-shrink:0;">${w.initials}</div>
              <div>
                <div style="font-weight:700;font-size:1rem;color:var(--text-main);">${w.name}</div>
                <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.15rem;">📍 ${w.feria}</div>
              </div>
              <div style="margin-left:auto;display:flex;align-items:center;gap:0.4rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:99px;padding:0.3rem 0.75rem;">
                <span style="width:7px;height:7px;background:#22c55e;border-radius:50%;display:inline-block;"></span>
                <span style="font-size:0.78rem;font-weight:700;color:#16a34a;">Trabajando</span>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
              <div style="background:#f8fafc;border-radius:8px;padding:0.75rem;">
                <div style="font-size:0.72rem;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Entrada</div>
                <div style="font-weight:700;font-size:1rem;color:var(--text-main);margin-top:0.2rem;">${w.since}</div>
              </div>
              <div style="background:#f0fdf4;border-radius:8px;padding:0.75rem;">
                <div style="font-size:0.72rem;color:#16a34a;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Tiempo trabajado</div>
                <div style="font-weight:800;font-size:1rem;color:#15803d;margin-top:0.2rem;">${w.elapsed}</div>
              </div>
            </div>
          </div>
        `).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;background:white;border-radius:14px;border:1px dashed #cbd5e1;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin:0 auto 1rem;display:block;"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          <p style="font-size:1.1rem;font-weight:600;color:var(--text-secondary);">Nadie está trabajando ahora mismo</p>
          <p style="font-size:0.875rem;color:var(--text-muted);margin-top:0.5rem;">Los empleados aparecerán aquí en cuanto fichen entrada.</p>
        </div>`;

    return `
      <div style="margin-bottom:2rem;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:1rem;">
        <div>
          <h1 style="font-size:1.5rem;font-weight:800;color:var(--text-main);">Dashboard en tiempo real</h1>
          <p style="color:var(--text-secondary);margin-top:0.25rem;">${todayFormatted} · Actualizado a las ${now}</p>
        </div>
        <button onclick="app.switchView('dashboard')" style="display:flex;align-items:center;gap:0.5rem;background:white;border:1px solid #e2e8f0;border-radius:8px;padding:0.5rem 1rem;cursor:pointer;font-size:0.875rem;font-weight:600;color:var(--text-secondary);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
          Actualizar
        </button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:2rem;">
        <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem;">
          <div style="width:42px;height:42px;background:#f0fdf4;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
          </div>
          <div>
            <div style="font-size:1.75rem;font-weight:800;color:var(--text-main);">${workingNow.length}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);font-weight:500;">Trabajando ahora</div>
          </div>
        </div>
        <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem;">
          <div style="width:42px;height:42px;background:#eff6ff;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div>
            <div style="font-size:1.75rem;font-weight:800;color:var(--text-main);">${todayUsersWithLogsCount}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);font-weight:500;">Fichajes hoy</div>
          </div>
        </div>
        <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem;">
          <div style="width:42px;height:42px;background:#faf5ff;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div>
            <div style="font-size:1.75rem;font-weight:800;color:var(--text-main);">${todayActiveFeriasCount}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);font-weight:500;">Ferias activas hoy</div>
          </div>
        </div>
      </div>

      <h2 style="font-size:1rem;font-weight:700;color:var(--text-main);margin-bottom:1rem;">
        Empleados en turno
        ${workingNow.length > 0 ? `<span style="display:inline-flex;align-items:center;gap:0.3rem;margin-left:0.5rem;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:99px;padding:0.15rem 0.6rem;font-size:0.78rem;font-weight:700;"><span style="width:6px;height:6px;background:#22c55e;border-radius:50%;"></span>${workingNow.length} activo${workingNow.length !== 1 ? 's' : ''}</span>` : ''}
      </h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;">
        ${cards}
      </div>
    `;
  },

  async loadKioskData() {
    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - 3);
    filterDate.setHours(0,0,0,0);

    const [{ data: ferias }, { data: feriaWorkers }, { data: casetas }, { data: casetaWorkers }, { data: logs }] = await Promise.all([
      supabase.from('ferias').select('*').order('start_date', { ascending: true }),
      supabase.from('feria_workers').select('*'),
      supabase.from('casetas').select('*').order('name', { ascending: true }),
      supabase.from('caseta_workers').select('*'),
      supabase.from('time_logs').select('*').gte('timestamp', filterDate.toISOString()).order('timestamp', { ascending: true }),
    ]);

    this.state.ferias = ferias || [];
    this.state.feriaWorkers = feriaWorkers || [];
    this.state.casetas = casetas || [];
    this.state.casetaWorkers = casetaWorkers || [];
    this.state.allTodayLogs = logs || [];
  },

  getKioskHTML() {
    // Auto-detectar la feria activa por fecha de hoy
    const todayStr = new Date().toISOString().split('T')[0];
    const currentFeria = this.state.ferias.find(f => f.start_date <= todayStr && f.end_date >= todayStr);

    // Si no hay selección manual, pre-seleccionar la feria activa de hoy (o la primera)
    if (!window.selectedKioskFeriaId && currentFeria) {
      window.selectedKioskFeriaId = currentFeria.id;
    }
    const activeFeriaId = window.selectedKioskFeriaId || (this.state.ferias.length > 0 ? this.state.ferias[0].id : '');

    // Comprobar si la feria seleccionada es la activa hoy
    const selectedFeria = this.state.ferias.find(f => f.id === activeFeriaId);
    const isFeriaActive = selectedFeria && selectedFeria.start_date <= todayStr && selectedFeria.end_date >= todayStr;

    // Casetas de la feria seleccionada
    const feriaCasetas = (this.state.casetas || []).filter(c => c.feria_id === activeFeriaId);
    const hasCasetas = feriaCasetas.length > 0;

    // Si la caseta seleccionada no pertenece a la feria actual, resetear
    if (window.selectedKioskCasetaId && !feriaCasetas.some(c => c.id === window.selectedKioskCasetaId)) {
      window.selectedKioskCasetaId = '';
    }
    const activeCasetaId = window.selectedKioskCasetaId || '';

    // Trabajadores asignados: si hay caseta seleccionada, filtrar por caseta_workers;
    // si no, caer al comportamiento antiguo (feria_workers)
    let assignedWorkerIds = [];
    if (activeCasetaId) {
      assignedWorkerIds = (this.state.casetaWorkers || [])
        .filter(cw => cw.caseta_id === activeCasetaId)
        .map(cw => cw.user_id);
    } else if (!hasCasetas && activeFeriaId) {
      assignedWorkerIds = (this.state.feriaWorkers || [])
        .filter(fw => fw.feria_id === activeFeriaId)
        .map(fw => fw.user_id);
    }

    const feriaEmployees = activeFeriaId && assignedWorkerIds.length > 0
      ? this.state.users.filter(u => u.role !== 'Admin' && assignedWorkerIds.includes(u.id))
      : (!hasCasetas && activeFeriaId ? this.state.users.filter(u => u.role !== 'Admin') : []);
    const noAssignedWorkers = activeFeriaId && (hasCasetas ? activeCasetaId && assignedWorkerIds.length === 0 : assignedWorkerIds.length === 0);

    if (window.selectedKioskWorkerId && assignedWorkerIds.length > 0 && !assignedWorkerIds.includes(window.selectedKioskWorkerId)) {
      window.selectedKioskWorkerId = '';
    }
    const activeWorkerId = window.selectedKioskWorkerId || '';

    let isWorking = false;
    let workerLogs = [];
    if (activeWorkerId) {
      workerLogs = this.state.allTodayLogs.filter(l => l.user_id === activeWorkerId);
      isWorking = workerLogs.length > 0 && workerLogs[workerLogs.length - 1].action_type === 'Entrada';
    }

    return `
      <div style="max-width:650px; margin:2rem auto; padding:0 1rem;">
        <div style="text-align:center; margin-bottom:2.5rem;">
          <h1 style="font-size:2rem; font-weight:800; color:var(--text-main); margin-bottom:0.5rem;">Punto de Control Central</h1>
          <p style="color:var(--text-secondary); font-size:1.1rem;">Selecciona la Feria y el Empleado para registrar su jornada</p>
          ${currentFeria
            ? `<div style="display:inline-flex; align-items:center; gap:0.5rem; margin-top:0.75rem; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:99px; padding:0.35rem 1rem;">
                <span style="width:9px; height:9px; background:#22c55e; border-radius:50%; display:inline-block; box-shadow:0 0 0 3px #bbf7d0;"></span>
                <span style="font-weight:600; color:#15803d; font-size:0.9rem;">Feria en curso: ${currentFeria.name}</span>
              </div>`
            : `<div style="display:inline-flex; align-items:center; gap:0.5rem; margin-top:0.75rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:99px; padding:0.35rem 1rem;">
                <span style="width:9px; height:9px; background:#94a3b8; border-radius:50%; display:inline-block;"></span>
                <span style="font-weight:600; color:#64748b; font-size:0.9rem;">Sin feria activa hoy</span>
              </div>`
          }
        </div>

        <div class="card" style="padding:3rem 2rem; background:white; border-radius:16px; box-shadow:0 10px 25px rgba(0,0,0,0.05);">
          <!-- 1. Feria -->
          <div class="form-group" style="text-align:left; margin-bottom: 2rem;">
            <label style="font-weight:700; font-size:1.05rem; color:var(--text-main); display:block; margin-bottom:0.75rem;">1. Seleccionar Feria</label>
            <div style="position:relative;">
              <select id="kioskFeriaSelect" class="input-field" style="padding:1rem; font-size:1.1rem; width:100%; appearance:none; background-color:#f8fafc;" onchange="window.selectedKioskFeriaId = this.value; window.selectedKioskWorkerId = ''; app.renderView('kiosk')">
                <option value="" disabled ${!activeFeriaId ? 'selected' : ''}>-- Elige una feria --</option>
                ${this.state.ferias.map(f => {
                  const isActive = f.start_date <= todayStr && f.end_date >= todayStr;
                  return `<option value="${f.id}" ${f.id === activeFeriaId ? 'selected' : ''}>${isActive ? '● ' : ''}${f.name}${isActive ? ' (Activa hoy)' : ''}</option>`;
                }).join('')}
              </select>
              <div style="position:absolute; right:1.2rem; top:50%; transform:translateY(-50%); pointer-events:none;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
            ${selectedFeria ? `<div style="margin-top:0.5rem; font-size:0.82rem; color:var(--text-secondary);">
              ${selectedFeria.location ? `📍 ${selectedFeria.location} &nbsp;·&nbsp; ` : ''}
              📅 ${selectedFeria.start_date} — ${selectedFeria.end_date}
              ${isFeriaActive ? `&nbsp;<span style="color:#16a34a; font-weight:600;">· En curso</span>` : ''}
            </div>` : ''}
          </div>

          <!-- 2. Caseta (solo si la feria tiene casetas) -->
          ${hasCasetas ? `
          <div class="form-group" style="text-align:left; margin-bottom: 2rem;">
            <label style="font-weight:700; font-size:1.05rem; color:var(--text-main); display:block; margin-bottom:0.75rem;">
              2. Seleccionar Caseta
              <span style="font-weight:400; font-size:0.82rem; color:var(--text-secondary); margin-left:0.5rem;">(${feriaCasetas.length} caseta${feriaCasetas.length !== 1 ? 's' : ''} en esta feria)</span>
            </label>
            <div style="position:relative;">
              <select id="kioskCasetaSelect" class="input-field" style="padding:1rem; font-size:1.1rem; width:100%; appearance:none; background-color:#f8fafc;" onchange="window.selectedKioskCasetaId = this.value; window.selectedKioskWorkerId = ''; app.renderView('kiosk')">
                <option value="" disabled ${!activeCasetaId ? 'selected' : ''}>-- Elige una caseta --</option>
                ${feriaCasetas.map(c => `<option value="${c.id}" ${c.id === activeCasetaId ? 'selected' : ''}>🏠 ${c.name}</option>`).join('')}
              </select>
              <div style="position:absolute; right:1.2rem; top:50%; transform:translateY(-50%); pointer-events:none;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>` : ''}

          <!-- ${hasCasetas ? '3' : '2'}. Trabajador -->
          ${activeFeriaId && (!hasCasetas || activeCasetaId) ? `
          <div class="form-group" style="text-align:left;">
            <label style="font-weight:700; font-size:1.05rem; color:var(--text-main); display:block; margin-bottom:0.75rem;">
              ${hasCasetas ? '3' : '2'}. Seleccionar Trabajador
              ${!noAssignedWorkers ? `<span style="font-weight:400; font-size:0.82rem; color:var(--text-secondary); margin-left:0.5rem;">(${feriaEmployees.length} asignado${feriaEmployees.length !== 1 ? 's' : ''})</span>` : ''}
            </label>
            ${noAssignedWorkers
              ? `<div style="padding:1rem; background:#fefce8; border:1px solid #fde68a; border-radius:8px; color:#92400e; font-size:0.9rem;">
                  ⚠️ No hay trabajadores asignados a esta ${hasCasetas ? 'caseta' : 'feria'}. Ve a <strong>Gestión de Ferias</strong> para asignarlos.
                </div>`
              : `<div style="position:relative;">
                  <select id="kioskWorkerSelect" class="input-field" style="padding:1rem; font-size:1.1rem; width:100%; appearance:none; background-color:#f8fafc;" onchange="window.selectedKioskWorkerId = this.value; app.renderView('kiosk')">
                    <option value="" disabled ${!activeWorkerId ? 'selected' : ''}>-- Elige un empleado --</option>
                    ${feriaEmployees.map(u => `<option value="${u.id}" ${u.id === activeWorkerId ? 'selected' : ''}>${u.name}</option>`).join('')}
                  </select>
                  <div style="position:absolute; right:1.2rem; top:50%; transform:translateY(-50%); pointer-events:none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>`
            }
          </div>` : (hasCasetas && !activeCasetaId ? `<div style="padding:1rem; background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; color:#1d4ed8; font-size:0.9rem;">ℹ️ Primero selecciona una caseta.</div>` : '')}

          <!-- Botón Fichar -->
          <div style="margin-top:3.5rem;">
            ${activeWorkerId && activeFeriaId && (!hasCasetas || activeCasetaId)
              ? `<button id="btnPunchAction" class="btn-punch ${isWorking ? 'out' : 'in'}" onclick="window.handlePunch('${isWorking ? 'Salida' : 'Entrada'}', '${activeWorkerId}', '${activeFeriaId}', '${activeCasetaId}')" style="width:100%; padding:1.25rem; font-size:1.25rem; border-radius:12px; transition:transform 0.1s;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  ${isWorking ? 'Fichar SALIDA de ' : 'Fichar ENTRADA de '}<span style="font-weight:800">${this.state.users.find(u=>u.id===activeWorkerId)?.name || ''}</span>
                </button>
                <div style="margin-top:1.5rem; text-align:center; padding:1rem; background:${isWorking ? '#f0fdf4' : '#f8fafc'}; border-radius:8px; display:inline-block; border: 1px solid ${isWorking ? '#bbf7d0' : '#e2e8f0'};">
                  <span style="color:var(--text-secondary); font-size:0.9rem;">Estado hoy: </span>
                  <span style="font-weight:700; color:${isWorking ? 'var(--success-text)' : 'var(--text-main)'}; font-size:1rem;">
                    ${isWorking ? '🟢 Trabajando actualmente' : '⚪ Inactivo'}
                  </span>
                </div>`
              : `<button class="btn-punch" disabled style="width:100%; padding:1.25rem; font-size:1.25rem; background:linear-gradient(135deg, #3b82f6, #2563eb); color:white; border:none; border-radius:12px; cursor:not-allowed; box-shadow:0 10px 25px -5px rgba(37,99,235,0.4);">
                  Rellena los datos para fichar
                </button>`
            }
          </div>
        </div>
      </div>
    `;
  },

  async applyGlobalRate() {
    const input = document.getElementById('globalRateInput');
    const newRate = Number(input.value);
    if (!isFinite(newRate) || newRate < 0) { alert('Introduce un precio válido.'); return; }
    
    if (!confirm(`¿Estás seguro de establecer ${newRate} €/h a todos los empleados en sistema?`)) return;
    
    const userIds = this.state.users.filter(u => u.role !== 'Admin').map(u => u.id);
    if (userIds.length === 0) { alert('No hay empleados a los que aplicar la tarifa.'); return; }
    
    const saveBtn = document.getElementById('applyGlobalRateBtn');
    saveBtn.disabled = true; saveBtn.textContent = 'Aplicando...';
    
    const { error } = await supabase.from('profiles').update({ hourly_rate: newRate }).in('id', userIds);
    if (error) { 
        alert('Error al aplicar la tarifa: ' + error.message); 
        saveBtn.disabled = false; saveBtn.textContent = 'Aplicar a todos';
        return; 
    }
    
    alert(`Tarifa de ${newRate} €/h aplicada a ${userIds.length} empleados correctamentee.`);
    await this.loadUsers();
    this.renderView('users');
  },

  getUsersHTML() {
    const colCount = isAdmin ? 8 : (isManager ? 5 : 6);
    return `
      <div style="margin-bottom:2rem;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h1 style="font-size:1.5rem;font-weight:700;">${isManager ? 'Directorio de Personal' : 'Gestión de Usuarios'}</h1>
          <p style="color:var(--text-secondary);">${isManager ? 'Consulta las horas de cada empleado.' : 'Administra los permisos y accesos.'}</p>
        </div>
        ${isAdmin ? '<button class="btn btn-primary btn-add-user">Añadir Usuario</button>' : ''}
      </div>

      ${isAdmin ? `
      <div class="card global-rate-card" style="margin-bottom:2rem;flex-direction:row;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;">
        <div>
           <h3 style="font-size:1.05rem;font-weight:700;color:var(--text-main);margin:0;">Tarifa Global por Defecto</h3>
           <p style="font-size:0.85rem;color:var(--text-secondary);margin:0.25rem 0 0;">Establece el precio por hora para todos los trabajadores simultáneamente.</p>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;">
           <input type="number" id="globalRateInput" value="10" step="0.5" class="input-field" style="width:90px;text-align:right;font-weight:700;">
           <span style="font-weight:600;color:var(--text-secondary);">€/h</span>
           <button id="applyGlobalRateBtn" class="btn btn-primary" onclick="app.applyGlobalRate()">Aplicar a todos</button>
        </div>
      </div>
      ` : ''}

      <div class="table-container">
        <div class="table-header">
          <h3 style="font-size:1rem;font-weight:600;">Directorio de Personal</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Usuario</th><th>Rol</th><th>Estado</th><th>Horas</th>${isAdmin ? '<th>€/hora</th><th>Ganancias</th>' : ''}<th>Último Acceso</th>${!isManager ? '<th>Acciones</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${this.state.users.length === 0
              ? `<tr><td colspan="${colCount}" style="text-align:center;color:var(--text-muted);padding:2rem;">No hay usuarios todavía.</td></tr>`
              : this.state.users.map(u => this.renderUserRow(u)).join('')
            }
          </tbody>
        </table>
      </div>`;
  },

  renderUserRow(user) {
    const roleClass   = 'badge-' + user.role.toLowerCase();
    const statusClass = 'badge-' + user.status.toLowerCase();
    const safeName = user.name.replace(/'/g, "\\'");
    const earnings = user.totalEarnings || 0;
    const rateCell = isAdmin
      ? `<td onclick="event.stopPropagation()" style="cursor:pointer;" onclick="window.editHourlyRate('${user.id}','${safeName}',${user.hourlyRate || 10})">
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span style="font-weight:600;">${(user.hourlyRate || 10).toFixed(2)} €</span>
            <button onclick="event.stopPropagation(); window.editHourlyRate('${user.id}','${safeName}',${user.hourlyRate || 10})" title="Editar precio/hora" style="background:none;border:none;cursor:pointer;padding:0.2rem;border-radius:4px;color:#64748b;" onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='none'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
          </div>
        </td>
        <td style="font-weight:700;color:#16a34a;">${earnings.toFixed(2)} €</td>`
      : '';
    return `
      <tr onclick="window.showHorasPorFeria('${user.id}', '${safeName}', ${user.hourlyRate || 10})" style="cursor:pointer;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="width:32px;height:32px;background:#e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#64748b;font-size:0.75rem;">
              ${user.name.split(' ').map(n => n[0]).join('').slice(0,2)}
            </div>
            <div>
              <div style="font-weight:600;">${user.name}</div>
              <div style="font-size:0.75rem;color:var(--text-secondary);">${user.email}</div>
            </div>
          </div>
        </td>
        <td><span class="badge ${roleClass}">${user.role}</span></td>
        <td><span class="badge ${statusClass}">${user.status}</span></td>
        <td style="font-weight:700; color:var(--primary);">${user.totalHours}</td>
        ${rateCell}
        <td style="color:var(--text-secondary);">${user.lastAccess}</td>
        ${!isManager ? `<td onclick="event.stopPropagation()">
          <button class="btn btn-primary" title="Ver Historial, Horas y GPS" style="padding:0.4rem 0.8rem; font-size:0.75rem; margin-right:0.5rem;" onclick="app.viewUserHistory('${user.id}', '${safeName}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:relative;top:2px;margin-right:2px"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Historial y GPS
          </button>
          <button class="btn btn-ghost btn-delete-user" data-id="${user.id}" style="padding:0.4rem;color:var(--error-text);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>` : ''}
      </tr>`;
  },

  async viewUserHistory(id, name) {
    this.state.viewedUserName = name;
    this.state.viewedUserId = id;
    this.state.viewedUserLogs = [];
    this.state.viewedUserError = null;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.state.activeView = 'user-history';
    // Pintar pantalla de carga inmediata
    this.renderView('user-history');

    const { data: logs, error } = await supabase
      .from('time_logs')
      .select('id, timestamp, action_type, latitude, longitude, feria_id, caseta_id, hourly_rate, ferias(name, base_hourly_rate), casetas(name)')
      .eq('user_id', id)
      .order('timestamp', { ascending: true });

    if (error) {
      this.state.viewedUserError = error.message || 'Error desconocido al cargar registros.';
    } else {
      this.state.viewedUserLogs = logs || [];
    }
    this.renderView('user-history');
  },

  getUserHistoryHTML() {
    const userName = this.state.viewedUserName || 'Empleado';
    const errorMsg = this.state.viewedUserError;
    const logs = this.state.viewedUserLogs || [];

    // Agrupar por dia y emparejar Entrada/Salida correctamente, incluso turnos cruzados.
    const logsByDay = {};
    let openShift = null; // Entrada sin Salida pareja a traves de los dias
    let totalMsAll = 0;
    let totalEarningsAll = 0;
    const feriasSet = new Set();

    logs.forEach(log => {
      const ts = new Date(log.timestamp);
      const dateKey = ts.toISOString().slice(0, 10); // YYYY-MM-DD para orden estable
      const dateStr = ts.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      if (!logsByDay[dateKey]) {
        logsByDay[dateKey] = { dateStr, dateKey, events: [], totalMs: 0, openAtEod: false };
      }
      const day = logsByDay[dateKey];

      if (log.feria_id) feriasSet.add(log.feria_id);

      if (log.action_type === 'Entrada') {
        if (openShift) {
          // Entrada nueva sin salida previa: marcar la anterior como abierta
          openShift.unmatched = true;
        }
        openShift = { startLog: log, startTs: ts, dayKey: dateKey };
        day.events.push({ log, ts, type: 'Entrada', paired: false, durationMs: null, paireWith: null });
      } else if (log.action_type === 'Salida') {
        if (openShift) {
          const ms = ts - openShift.startTs;
          day.totalMs += ms;
          totalMsAll += ms;
          const hourlyRate = Number(openShift.startLog.hourly_rate) > 0
            ? Number(openShift.startLog.hourly_rate)
            : Number(openShift.startLog.ferias?.base_hourly_rate) > 0
              ? Number(openShift.startLog.ferias.base_hourly_rate)
              : 10;
          totalEarningsAll += (ms / 3600000) * hourlyRate;
          // Marcar el evento Entrada como emparejado (puede estar en otro dia)
          const entradaDay = logsByDay[openShift.dayKey];
          if (entradaDay) {
            const entradaEv = [...entradaDay.events].reverse().find(e => e.type === 'Entrada' && e.log.id === openShift.startLog.id);
            if (entradaEv) { entradaEv.paired = true; entradaEv.durationMs = ms; entradaEv.salidaTs = ts; }
          }
          day.events.push({ log, ts, type: 'Salida', paired: true, durationMs: ms, entradaTs: openShift.startTs });
          openShift = null;
        } else {
          // Salida sin Entrada previa: huerfana
          day.events.push({ log, ts, type: 'Salida', paired: false, durationMs: null, orphan: true });
        }
      }
    });

    // Si quedo un openShift al final y es de hoy, sumamos tiempo en vivo
    let liveExtraMs = 0;
    let liveSinceTs = null;
    if (openShift) {
      const todayKey = new Date().toISOString().slice(0, 10);
      if (openShift.dayKey === todayKey) {
        liveExtraMs = new Date() - openShift.startTs;
        liveSinceTs = openShift.startTs;
        const dayLive = logsByDay[openShift.dayKey];
        if (dayLive) dayLive.openAtEod = true;
      } else {
        const dayOld = logsByDay[openShift.dayKey];
        if (dayOld) dayOld.openAtEod = true;
      }
    }

    const daysList = Object.keys(logsByDay).sort((a, b) => b.localeCompare(a));

    // Helpers
    const fmtTime = ts => ts.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const fmtDur = ms => {
      if (!ms || ms < 0) return '—';
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      return `${h}h ${m.toString().padStart(2, '0')}m`;
    };
    const mapLink = (lat, lon, label, color) => {
      if (lat == null || lon == null) {
        return `<span style="display:inline-flex;align-items:center;gap:0.3rem;color:var(--text-muted);font-size:0.78rem;font-weight:500;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
          Sin GPS
        </span>`;
      }
      return `<a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.3rem;color:${color};font-weight:600;font-size:0.78rem;text-decoration:none;border:1px solid currentColor;padding:0.2rem 0.55rem;border-radius:99px;background:rgba(255,255,255,0.04);">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        ${label}
      </a>`;
    };

    // Resumen superior
    const totalHrs = Math.floor((totalMsAll + liveExtraMs) / 3600000);
    const totalMin = Math.floor(((totalMsAll + liveExtraMs) % 3600000) / 60000);
    const punchCount = logs.length;
    const firstLog = logs[0] ? new Date(logs[0].timestamp) : null;
    const lastLog = logs[logs.length - 1] ? new Date(logs[logs.length - 1].timestamp) : null;
    const firstLogStr = firstLog ? firstLog.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const lastLogStr = lastLog ? lastLog.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    // Tarjetas resumen
    const summaryHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:2rem;">
        <div class="card">
          <div class="card-title">Horas totales</div>
          <div class="card-value" style="color:var(--primary);">${totalHrs}h ${totalMin.toString().padStart(2,'0')}m</div>
          ${liveExtraMs > 0 ? `<div class="card-trend trend-up">● En turno desde ${fmtTime(liveSinceTs)}</div>` : ''}
        </div>
        <div class="card">
          <div class="card-title">Ganancias estimadas</div>
          <div class="card-value" style="color:var(--success-text);">${(totalEarningsAll).toFixed(2)} €</div>
        </div>
        <div class="card">
          <div class="card-title">Fichajes registrados</div>
          <div class="card-value">${punchCount}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">${daysList.length} día${daysList.length !== 1 ? 's' : ''} con actividad</div>
        </div>
        <div class="card">
          <div class="card-title">Periodo</div>
          <div style="font-size:0.95rem;font-weight:700;color:var(--text-main);line-height:1.4;">${firstLogStr}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">hasta ${lastLogStr}</div>
        </div>
      </div>
    `;

    // Render por día
    const historyHTML = daysList.map(dateKey => {
      const day = logsByDay[dateKey];
      const dayMs = day.totalMs + (dateKey === new Date().toISOString().slice(0, 10) ? liveExtraMs : 0);

      const eventsHTML = day.events.map(ev => {
        const isIn = ev.type === 'Entrada';
        const accent = isIn ? 'var(--success-solid)' : 'var(--error-solid)';
        const accentSoft = isIn ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
        const accentText = isIn ? 'var(--success-text)' : 'var(--error-text)';
        const icon = isIn
          ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>'
          : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>';

        const feriaLbl = ev.log.ferias?.name ? `· ${ev.log.ferias.name}` : '';
        const casetaLbl = ev.log.casetas?.name ? ` / ${ev.log.casetas.name}` : '';

        let extra = '';
        if (isIn && ev.paired) extra = `<span style="font-size:0.78rem;color:var(--text-secondary);">→ Salida ${fmtTime(ev.salidaTs)} · <strong style="color:var(--text-main);">${fmtDur(ev.durationMs)}</strong></span>`;
        else if (isIn && !ev.paired) extra = `<span style="font-size:0.78rem;font-weight:600;color:var(--warning-text);">⏳ Sin salida registrada</span>`;
        else if (!isIn && ev.paired) extra = `<span style="font-size:0.78rem;color:var(--text-secondary);">← Entrada ${fmtTime(ev.entradaTs)} · <strong style="color:var(--text-main);">${fmtDur(ev.durationMs)}</strong></span>`;
        else if (!isIn && ev.orphan) extra = `<span style="font-size:0.78rem;font-weight:600;color:var(--warning-text);">⚠️ Salida sin entrada previa</span>`;

        return `
          <div style="display:flex;align-items:center;gap:0.85rem;padding:0.75rem 1rem;border-radius:10px;background:${accentSoft};border:1px solid ${accent}33;">
            <div style="width:32px;height:32px;border-radius:50%;background:${accent};color:#fff;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 10px -4px ${accent};">${icon}</div>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                <span style="font-weight:700;color:${accentText};font-size:0.92rem;">${ev.type}</span>
                <span style="font-weight:800;color:var(--text-main);font-size:1.05rem;font-variant-numeric:tabular-nums;letter-spacing:-0.01em;">${fmtTime(ev.ts)}</span>
                <span style="font-size:0.78rem;color:var(--text-secondary);">${feriaLbl}${casetaLbl}</span>
              </div>
              ${extra ? `<div style="margin-top:0.2rem;">${extra}</div>` : ''}
            </div>
            <div style="flex-shrink:0;">${mapLink(ev.log.latitude, ev.log.longitude, isIn ? 'Mapa entrada' : 'Mapa salida', accent)}</div>
          </div>
        `;
      }).join('');

      const dayDateLabel = day.dateStr.charAt(0).toUpperCase() + day.dateStr.slice(1);

      return `
        <div class="card" style="padding:1.25rem 1.5rem;margin-bottom:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;padding-bottom:0.85rem;border-bottom:1px solid var(--divider);margin-bottom:1rem;">
            <div style="display:flex;align-items:center;gap:0.6rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span style="font-weight:700;color:var(--text-main);font-size:1rem;">${dayDateLabel}</span>
              <span style="font-size:0.78rem;color:var(--text-secondary);">· ${day.events.length} fichaje${day.events.length !== 1 ? 's' : ''}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.6rem;">
              ${day.openAtEod && dateKey === new Date().toISOString().slice(0, 10) ? '<span class="badge" style="background:rgba(217,119,6,0.18);color:#fbbf24;">En curso</span>' : ''}
              <span style="font-size:1rem;font-weight:800;color:var(--primary);font-variant-numeric:tabular-nums;letter-spacing:-0.01em;">${fmtDur(dayMs)}</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.55rem;">
            ${eventsHTML}
          </div>
        </div>
      `;
    }).join('');

    const emptyHTML = `
      <div class="empty">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 0.75rem;display:block;color:var(--text-muted);"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <p style="font-size:1rem;font-weight:600;color:var(--text-main);">Sin registros todavía</p>
        <p style="font-size:0.875rem;color:var(--text-secondary);margin-top:0.35rem;">Este empleado aún no ha fichado en el sistema.</p>
      </div>
    `;

    const errorHTML = errorMsg ? `
      <div style="padding:1rem 1.25rem;background:var(--error-bg);color:var(--error-text);border-radius:var(--radius-md);border:1px solid currentColor;margin-bottom:1.5rem;font-size:0.9rem;">
        <strong>No se pudieron cargar los registros:</strong> ${errorMsg}
      </div>` : '';

    return `
      <div style="margin-bottom:1.75rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
        <button class="btn btn-ghost" onclick="app.switchView('users')" title="Volver al directorio" style="padding:0.55rem 0.9rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Volver
        </button>
        <div style="flex:1;min-width:200px;">
          <h1 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;color:var(--text-main);">Historial de ${userName}</h1>
          <p style="color:var(--text-secondary);font-size:0.9rem;margin-top:0.15rem;">Fichajes detallados con horas y ubicación GPS de cada evento.</p>
        </div>
      </div>
      ${errorHTML}
      ${logs.length > 0 ? summaryHTML : ''}
      <div style="max-width:920px;">
        ${logs.length > 0 ? historyHTML : (errorMsg ? '' : emptyHTML)}
      </div>
    `;
  },

  async loadAttendanceData() {
    let feriasList = [];
    if (isAdmin) {
      const { data } = await supabase.from('ferias').select('*').order('start_date', { ascending: true });
      feriasList = data || [];
    } else {
      const { data: assigns } = await supabase.from('feria_workers').select('feria_id').eq('user_id', currentUser.id);
      if (assigns && assigns.length > 0) {
        const fIds = assigns.map(a => a.feria_id);
        const { data } = await supabase.from('ferias').select('*').in('id', fIds).order('start_date', { ascending: true });
        feriasList = data || [];
      }
    }
    this.state.ferias = feriasList;

    const { data: logs } = await supabase.from('time_logs')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('timestamp', { ascending: true });
    
    this.state.timeLogs = logs || [];
  },

  getAttendanceHTML() {
    const logsByDay = {};
    this.state.timeLogs.forEach(log => {
      const dateStr = new Date(log.timestamp).toLocaleDateString('es-ES');
      if (!logsByDay[dateStr]) logsByDay[dateStr] = { logs: [], totalMs: 0, lastIn: null };
      
      const dayData = logsByDay[dateStr];
      dayData.logs.push(log);
      
      if (log.action_type === 'Entrada') {
        dayData.lastIn = new Date(log.timestamp);
      } else if (log.action_type === 'Salida' && dayData.lastIn) {
        dayData.totalMs += new Date(log.timestamp) - dayData.lastIn;
        dayData.lastIn = null;
      }
    });

    const todayStr = new Date().toLocaleDateString('es-ES');
    if (logsByDay[todayStr] && logsByDay[todayStr].lastIn) {
      logsByDay[todayStr].totalMs += new Date() - logsByDay[todayStr].lastIn;
    }

    const todayData = logsByDay[todayStr] || { logs: [], totalMs: 0 };
    const hrs = Math.floor(todayData.totalMs / 1000 / 60 / 60);
    const mins = Math.floor((todayData.totalMs / 1000 / 60) % 60);
    const isWorking = todayData.logs.length > 0 && todayData.logs[todayData.logs.length - 1].action_type === 'Entrada';

    const historyDays = Object.keys(logsByDay).filter(d => d !== todayStr).sort((a,b) => {
      const pA = a.split('/'); const dtA = new Date(pA[2], pA[1]-1, pA[0]);
      const pB = b.split('/'); const dtB = new Date(pB[2], pB[1]-1, pB[0]);
      return dtB - dtA;
    });

    const historyHTML = historyDays.map(dateStr => {
      const ms = logsByDay[dateStr].totalMs;
      const h = Math.floor(ms / 1000 / 60 / 60);
      const m = Math.floor((ms / 1000 / 60) % 60);
      return `<div style="display:flex;justify-content:space-between;padding:1rem 0;border-bottom:1px solid #e2e8f0;font-size:0.875rem;">
        <span style="font-weight:600;color:var(--text-main);">${dateStr}</span>
        <span style="color:var(--text-secondary);">${h}h ${m}m trabajados</span>
      </div>`;
    }).join('') || '<p style="color:var(--text-muted);font-size:0.875rem;">No hay registros de horas de días anteriores.</p>';

    return `
      <div style="margin-bottom:2rem;">
        <h1 style="font-size:1.5rem;font-weight:700;">Mi Horario</h1>
        <p style="color:var(--text-secondary);">Revisa próximamente las ferias, ficha hoy y mira tu historial.</p>
      </div>
      <div class="attendance-grid">
        <div class="card">
          <h2 style="font-size:1.125rem;font-weight:600;margin-bottom:1rem;">Próximas Ferias</h2>
          <div class="feria-list">
            ${this.state.ferias.length === 0 ? '<p style="color:var(--text-muted);">No hay ferias registradas en sistema.</p>' : ''}
            ${this.state.ferias.map(f => `
              <div class="feria-item">
                <div>
                  <div class="feria-date">${new Date(f.start_date).toLocaleDateString('es-ES')} - ${new Date(f.end_date).toLocaleDateString('es-ES')}</div>
                  <div class="feria-name">${f.name}</div>
                  <div class="feria-loc">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    ${f.location}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div>
          <div class="punch-card" style="margin-bottom:1.5rem; padding: 2.5rem 1.5rem;">
            <h2 style="font-size:1.125rem;font-weight:600;margin-bottom:2rem;">Fichar Hoy</h2>
            <button id="btnPunchAction" class="btn-punch ${isWorking ? 'out' : 'in'}" onclick="window.handlePunch('${isWorking ? 'Salida' : 'Entrada'}')">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${isWorking ? 'Fichar SALIDA' : 'Fichar ENTRADA'}
            </button>
            <div class="total-hours">${hrs}h ${mins}m trabajados hoy</div>
            <div class="time-log-list" style="margin-top:1rem;">
              ${todayData.logs.map(log => `
                <div class="time-log-item">
                  <span style="font-weight:600;color:${log.action_type === 'Entrada' ? 'var(--success-text)' : 'var(--error-text)'}">${log.action_type}</span>
                  <span>${new Date(log.timestamp).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              `).reverse().slice(0, 5).join('')}
            </div>
          </div>
          <div class="card">
            <h2 style="font-size:1.125rem;font-weight:600;margin-bottom:1rem;">Historial de Trabajo</h2>
            ${historyHTML}
          </div>
        </div>
      </div>
    `;
  },


  async loadFeriasData() {
    const [{ data: ferias }, { data: assigns }, { data: casetas }, { data: casetaAssigns }] = await Promise.all([
      supabase.from('ferias').select('*').order('start_date', { ascending: true }),
      supabase.from('feria_workers').select('feria_id'),
      supabase.from('casetas').select('*'),
      supabase.from('caseta_workers').select('*'),
    ]);

    this.state.ferias = ferias || [];
    this.state.casetas = casetas || [];
    this.state.casetaWorkers = casetaAssigns || [];

    const counts = {};
    (assigns || []).forEach(a => { counts[a.feria_id] = (counts[a.feria_id] || 0) + 1; });
    const casetaCounts = {};
    (casetas || []).forEach(c => { casetaCounts[c.feria_id] = (casetaCounts[c.feria_id] || 0) + 1; });

    this.state.ferias.forEach(f => {
      f.workerCount = counts[f.id] || 0;
      f.casetaCount = casetaCounts[f.id] || 0;
    });
  },

  getManageFeriasHTML() {
    return `
      <div style="margin-bottom:2rem;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h1 style="font-size:1.5rem;font-weight:700;">Gestión de Ferias</h1>
          <p style="color:var(--text-secondary);">Administra el calendario de eventos globales.</p>
        </div>
        <button class="btn btn-primary" onclick="app.openFeriaModal()">Añadir Feria</button>
      </div>
      <div class="card" style="padding:2rem;">
        <div class="feria-list">
          ${this.state.ferias.length === 0 ? '<p style="color:var(--text-muted);text-align:center;">No existen ferias registradas. Añade una para tus empleados.</p>' : ''}
          ${this.state.ferias.map(f => `
            <div class="feria-item">
              <div>
                <div class="feria-date">${new Date(f.start_date).toLocaleDateString('es-ES')} - ${new Date(f.end_date).toLocaleDateString('es-ES')}</div>
                <div class="feria-name">${f.name}</div>
                <div class="feria-loc">${f.location}</div>
                ${f.base_hourly_rate > 0 ? `<div style="font-size:0.75rem;color:#16a34a;margin-top:0.25rem;font-weight:700;">💰 ${f.base_hourly_rate} €/h (Tarifa Fija)</div>` : ''}
                <div style="font-size:0.75rem;color:var(--primary);margin-top:0.25rem;font-weight:600;">👥 ${f.workerCount || 0} Personal Asignado &nbsp;·&nbsp; 🏠 ${f.casetaCount || 0} Caseta${f.casetaCount === 1 ? '' : 's'}</div>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-end;">
                <button class="btn btn-primary" style="background:#7c3aed;padding:0.4rem 0.8rem; font-size:0.75rem; font-weight:600;" onclick="window.openCasetasModal('${f.id}')">Gestionar Casetas</button>
                <button class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem; font-weight:600;" onclick="app.manageFeriaWorkers('${f.id}')">Gestionar Empleados</button>
                <button class="btn btn-primary" style="background:#475569; padding:0.4rem 0.8rem; font-size:0.75rem; font-weight:600;" onclick="app.openEditFeriaModal('${f.id}')">Editar Fechas</button>
                <button class="btn btn-ghost" style="color:var(--error-text); padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="app.deleteFeria('${f.id}')">Borrar Feria</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  injectFeriaModal() {
    const existing = document.getElementById('feriaModalOverlay');
    if (existing) existing.remove();
    const HTML = `
      <div id="feriaModalOverlay" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 style="font-size: 1.125rem; font-weight: 700;">Nueva Feria</h2>
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('feriaModalOverlay').classList.remove('active')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
          <form id="feriaForm">
            <div class="modal-body">
              <div class="form-group"><label>Nombre del Evento</label><input type="text" id="feriaName" class="input-field" required></div>
              <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div><label>Fecha Inicio</label><input type="date" id="feriaStart" class="input-field" required></div>
                <div><label>Fecha Fin</label><input type="date" id="feriaEnd" class="input-field" required></div>
              </div>
              <div class="form-group"><label>Ubicación</label><input type="text" id="feriaLoc" class="input-field" required></div>
              <div class="form-group">
                <label>Precio por hora en esta feria (€) <span style="font-weight:400;color:var(--text-secondary);font-size:0.8rem;">(Opcional, sobreescribe la tarifa del empleado)</span></label>
                <input type="number" step="0.5" id="feriaRate" class="input-field" placeholder="Ej. 12.5" />
              </div>
              <div class="form-group">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
                  <label style="margin:0;">Trabajadores Asignados</label>
                  <button type="button" id="toggleAllNewBtn" onclick="window.toggleAllWorkers('feria_workers','toggleAllNewBtn')" style="font-size:0.78rem;font-weight:600;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:0.3rem 0.75rem;cursor:pointer;">Seleccionar todos</button>
                </div>
                <div id="feriaWorkersList" style="max-height:150px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px; padding:0.5rem; display:flex; flex-direction:column; gap:0.5rem; background:#f8fafc;">
                  <!-- Checkboxes generados por JS -->
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" onclick="document.getElementById('feriaModalOverlay').classList.remove('active')">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', HTML);
    document.getElementById('feriaForm').onsubmit = async (e) => { e.preventDefault(); await this.addFeria(); };
  },

  injectWorkersModal() {
    const existing = document.getElementById('workersModalOverlay');
    if (existing) existing.remove();
    const HTML = `
      <div id="workersModalOverlay" class="modal-overlay">
        <div class="modal" style="max-width:400px;">
          <div class="modal-header">
            <h2 style="font-size: 1.125rem; font-weight: 700;">Gestionar Plantilla</h2>
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('workersModalOverlay').classList.remove('active')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
          <form id="workersForm">
            <input type="hidden" id="editFeriaId" />
            <div class="modal-body">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
                <p style="font-size:0.875rem;color:var(--text-secondary);margin:0;">Selecciona quiénes tendrán acceso:</p>
                <button type="button" id="toggleAllEditBtn" onclick="window.toggleAllWorkers('edit_feria_workers','toggleAllEditBtn')" style="font-size:0.78rem;font-weight:600;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:0.3rem 0.75rem;cursor:pointer;">Seleccionar todos</button>
              </div>
              <div id="editWorkersList" style="max-height:300px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:8px; padding:1rem; display:flex; flex-direction:column; gap:0.75rem; background:#f8fafc;">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" onclick="document.getElementById('workersModalOverlay').classList.remove('active')">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="saveWorkersBtn">Guardar Plantilla</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', HTML);
    document.getElementById('workersForm').onsubmit = async (e) => { e.preventDefault(); await this.saveWorkers(); };
  },

  injectEditFeriaModal() {
    const existing = document.getElementById('editFeriaModalOverlay');
    if (existing) existing.remove();
    const HTML = `
      <div id="editFeriaModalOverlay" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h2 style="font-size: 1.125rem; font-weight: 700;">Editar Fechas de Feria</h2>
            <button type="button" class="btn btn-ghost" onclick="document.getElementById('editFeriaModalOverlay').classList.remove('active')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          </div>
          <form id="editFeriaForm">
            <input type="hidden" id="editFeriaUpdateId" />
            <div class="modal-body">
              <div class="form-group"><label>Nombre del Evento</label><input type="text" id="editFeriaName" class="input-field" required></div>
              <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div><label>Fecha Inicio</label><input type="date" id="editFeriaStart" class="input-field" required></div>
                <div><label>Fecha Fin</label><input type="date" id="editFeriaEnd" class="input-field" required></div>
              </div>
              <div class="form-group"><label>Ubicación</label><input type="text" id="editFeriaLoc" class="input-field" required></div>
              <div class="form-group">
                <label>Precio por hora en esta feria (€) <span style="font-weight:400;color:var(--text-secondary);font-size:0.8rem;">(Opcional, sobreescribe la tarifa del empleado)</span></label>
                <input type="number" step="0.5" id="editFeriaRate" class="input-field" placeholder="Ej. 12.5" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-ghost" onclick="document.getElementById('editFeriaModalOverlay').classList.remove('active')">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', HTML);
    document.getElementById('editFeriaForm').onsubmit = async (e) => { e.preventDefault(); await this.updateFeria(); };
  },

  openEditFeriaModal(feriaId) {
    const f = this.state.ferias.find(x => x.id === feriaId);
    if (!f) return;
    document.getElementById('editFeriaUpdateId').value = f.id;
    document.getElementById('editFeriaName').value = f.name;
    document.getElementById('editFeriaStart').value = f.start_date;
    document.getElementById('editFeriaEnd').value = f.end_date;
    document.getElementById('editFeriaLoc').value = f.location;
    document.getElementById('editFeriaRate').value = f.base_hourly_rate > 0 ? f.base_hourly_rate : '';
    document.getElementById('editFeriaModalOverlay').classList.add('active');
  },

  async updateFeria() {
    const id = document.getElementById('editFeriaUpdateId').value;
    const name = document.getElementById('editFeriaName').value;
    const start_date = document.getElementById('editFeriaStart').value;
    const end_date = document.getElementById('editFeriaEnd').value;
    const location = document.getElementById('editFeriaLoc').value;
    const rateVal = document.getElementById('editFeriaRate').value;
    const base_hourly_rate = rateVal ? Number(rateVal) : 0;

    const btn = document.querySelector('#editFeriaForm button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const { error } = await supabase.from('ferias').update({
      name, start_date, end_date, location, base_hourly_rate
    }).eq('id', id);

    btn.disabled = false;
    btn.textContent = 'Guardar Cambios';

    if (!error) {
      document.getElementById('editFeriaModalOverlay').classList.remove('active');
      await this.loadFeriasData();
      this.renderView('manage-ferias');
    } else {
      alert('Error actualizando feria: ' + error.message);
    }
  },

  async manageFeriaWorkers(feriaId) {
    const { data: currentAssigns } = await supabase.from('feria_workers').select('user_id').eq('feria_id', feriaId);
    const assignedIds = (currentAssigns || []).map(a => a.user_id);
    
    document.getElementById('editFeriaId').value = feriaId;
    const list = document.getElementById('editWorkersList');
    const workers = this.state.users.filter(u => u.role !== 'Admin');
    
    list.innerHTML = workers.length === 0 ? '<div style="color:var(--text-muted);font-size:0.875rem;">No hay empleados creados</div>' : workers.map(u => `
      <label style="display:flex;align-items:center;gap:0.75rem;cursor:pointer;font-size:0.875rem;padding:0.25rem 0;">
        <input type="checkbox" name="edit_feria_workers" value="${u.id}" ${assignedIds.includes(u.id) ? 'checked' : ''} style="width:16px;height:16px;">
        <span style="font-weight:500;">${u.name}</span>
      </label>
    `).join('');
    
    document.getElementById('workersModalOverlay').classList.add('active');
  },

  async saveWorkers() {
    const btn = document.getElementById('saveWorkersBtn');
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    
    const feriaId = document.getElementById('editFeriaId').value;
    const checkboxes = Array.from(document.querySelectorAll('input[name="edit_feria_workers"]:checked'));
    
    await supabase.from('feria_workers').delete().eq('feria_id', feriaId);
    
    if (checkboxes.length > 0) {
      const assigns = checkboxes.map(cb => ({ feria_id: feriaId, user_id: cb.value }));
      await supabase.from('feria_workers').insert(assigns);
    }
    
    btn.disabled = false;
    btn.textContent = 'Guardar Plantilla';
    document.getElementById('workersModalOverlay').classList.remove('active');
    await this.loadFeriasData(); 
    this.renderView('manage-ferias');
  },

  openFeriaModal() {
    const list = document.getElementById('feriaWorkersList');
    if (list) {
      const workers = this.state.users.filter(u => u.role !== 'Admin');
      list.innerHTML = workers.length === 0 ? '<div style="color:var(--text-muted);font-size:0.875rem;">No hay empleados creados</div>' : workers.map(u => `
        <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.875rem;">
          <input type="checkbox" name="feria_workers" value="${u.id}"> ${u.name}
        </label>
      `).join('');
    }
    document.getElementById('feriaModalOverlay').classList.add('active');
  },
  async addFeria() {
    const rateVal = document.getElementById('feriaRate').value;
    const base_hourly_rate = rateVal ? Number(rateVal) : 0;
    const { data: insertedFeria, error } = await supabase.from('ferias').insert({
      name: document.getElementById('feriaName').value,
      start_date: document.getElementById('feriaStart').value,
      end_date: document.getElementById('feriaEnd').value,
      location: document.getElementById('feriaLoc').value,
      base_hourly_rate
    }).select('id').single();

    if (!error && insertedFeria) {
      const checkboxes = Array.from(document.querySelectorAll('input[name="feria_workers"]:checked'));
      if (checkboxes.length > 0) {
        const assigns = checkboxes.map(cb => ({ feria_id: insertedFeria.id, user_id: cb.value }));
        await supabase.from('feria_workers').insert(assigns);
      }
      document.getElementById('feriaModalOverlay').classList.remove('active');
      document.getElementById('feriaForm').reset();
      await this.loadFeriasData(); this.renderView('manage-ferias');
    } else alert(error?.message || "Error al crear la feria");
  },
  async deleteFeria(id) {
    if (confirm('¿Eliminar esta feria de forma permanente para todos los usuarios?')) {
      await supabase.from('ferias').delete().eq('id', id);
      await this.loadFeriasData(); this.renderView('manage-ferias');
    }
  }
};

window.app = app;

function showGeoBlockedModal() {
  const existing = document.getElementById('geoBlockedModal');
  if (existing) existing.remove();
  const isFirefox = navigator.userAgent.includes('Firefox');
  const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
  const isEdge = navigator.userAgent.includes('Edg');
  let steps = '';
  if (isFirefox) {
    steps = `<li>Haz clic en el icono del <strong>candado 🔒</strong> en la barra de dirección</li><li>Busca <strong>"Acceder a tu posición"</strong> y cámbialo a <strong>Permitir</strong></li><li>Recarga la página</li>`;
  } else if (isSafari) {
    steps = `<li>Ve a <strong>Safari → Ajustes para este sitio web</strong></li><li>Cambia <strong>Ubicación</strong> a <strong>Permitir</strong></li><li>Recarga la página</li>`;
  } else if (isEdge) {
    steps = `<li>Haz clic en el icono del <strong>candado 🔒</strong> en la barra de dirección</li><li>Haz clic en <strong>Permisos para este sitio</strong></li><li>En <strong>Ubicación</strong>, selecciona <strong>Permitir</strong></li><li>Recarga la página</li>`;
  } else {
    steps = `<li>Haz clic en el icono del <strong>candado 🔒</strong> en la barra de dirección</li><li>Selecciona <strong>Configuración del sitio</strong></li><li>En <strong>Ubicación</strong>, cambia a <strong>Permitir</strong></li><li>Recarga la página</li>`;
  }
  document.body.insertAdjacentHTML('beforeend', `
    <div id="geoBlockedModal" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;">
      <div style="background:white;border-radius:16px;padding:2rem;max-width:420px;width:100%;box-shadow:0 25px 50px rgba(0,0,0,0.25);">
        <div style="text-align:center;margin-bottom:1.5rem;">
          <div style="font-size:3rem;margin-bottom:0.5rem;">📍</div>
          <h2 style="font-size:1.25rem;font-weight:800;color:#0f172a;margin-bottom:0.5rem;">Ubicación bloqueada</h2>
          <p style="color:#64748b;font-size:0.9rem;">La ubicación GPS es <strong>obligatoria</strong> para fichar. Tu navegador tiene el acceso bloqueado.</p>
        </div>
        <div style="background:#f8fafc;border-radius:10px;padding:1.25rem;margin-bottom:1.5rem;">
          <p style="font-weight:700;font-size:0.875rem;color:#0f172a;margin-bottom:0.75rem;">Cómo activarla:</p>
          <ol style="padding-left:1.25rem;color:#334155;font-size:0.875rem;display:flex;flex-direction:column;gap:0.5rem;">${steps}</ol>
        </div>
        <button onclick="document.getElementById('geoBlockedModal').remove(); location.reload();" style="width:100%;padding:0.85rem;background:#2563eb;color:white;border:none;border-radius:10px;font-weight:700;font-size:0.9rem;cursor:pointer;">
          Recargar página tras activarla
        </button>
        <button onclick="document.getElementById('geoBlockedModal').remove();" style="width:100%;padding:0.6rem;background:transparent;color:#64748b;border:none;cursor:pointer;margin-top:0.5rem;font-size:0.85rem;">
          Cancelar
        </button>
      </div>
    </div>
  `);
}

window.handlePunch = async function(type, workerId, feriaId, casetaId) {
  const btn = document.getElementById('btnPunchAction');
  if(btn) { btn.disabled = true; btn.textContent = 'Obteniendo ubicación...'; }

  if (!navigator.geolocation) {
    showGeoBlockedModal();
    if(btn) { btn.disabled = false; btn.textContent = type === 'Entrada' ? 'Fichar ENTRADA' : 'Fichar SALIDA'; }
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const row = {
      user_id: workerId,
      feria_id: feriaId,
      action_type: type,
      latitude: lat,
      longitude: lon,
    };
    if (casetaId) row.caseta_id = casetaId;

    const { error } = await supabase.from('time_logs').insert(row);

    if (error) {
      alert('Error al fichar en base de datos: ' + error.message);
      if(btn) { btn.disabled = false; btn.textContent = type === 'Entrada' ? 'Fichar ENTRADA' : 'Fichar SALIDA'; }
    } else {
      await app.loadKioskData();
      app.renderView('kiosk');
    }
  }, (_err) => {
    if(btn) { btn.disabled = false; btn.textContent = type === 'Entrada' ? 'Fichar ENTRADA' : 'Fichar SALIDA'; }
    showGeoBlockedModal();
  }, { timeout: 10000 });
};

window.toggleAllWorkers = function(checkboxName, btnId) {
  const checkboxes = Array.from(document.querySelectorAll(`input[name="${checkboxName}"]`));
  const allChecked = checkboxes.every(cb => cb.checked);
  checkboxes.forEach(cb => { cb.checked = !allChecked; });
  const btn = document.getElementById(btnId);
  if (btn) btn.textContent = allChecked ? 'Seleccionar todos' : 'Deseleccionar todos';
};

window.showHorasPorFeria = async function(userId, userName, hourlyRate) {
  hourlyRate = Number(hourlyRate) || 10;
  const existing = document.getElementById('horasFeriaModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'horasFeriaModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';
  overlay.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:2rem;max-width:760px;width:100%;max-height:88vh;overflow-y:auto;box-shadow:var(--shadow-xl);color:var(--text-main);">
      <div style="text-align:center;padding:2rem;color:var(--text-secondary);">Cargando datos…</div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  const { data: logs } = await supabase
    .from('time_logs')
    .select('*, ferias(id, name, start_date, end_date, base_hourly_rate)')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });

  const fmtMs = ms => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };
  const fmtTime = d => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = d => d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

  // Agrupar: feria → día de ENTRADA → turnos.
  // El día siempre se toma de la hora de Entrada, así un turno
  // nocturno 22:00→05:00 queda atribuido al día de la entrada.
  const feriaMap = {};
  let pendingEntry = null; // { ts, dayKey, feriaId, entryTime }

  (logs || []).forEach(log => {
    const feriaId   = log.feria_id || '__sin_feria__';
    const feriaName = log.ferias?.name  || 'Sin feria asignada';
    const feriaStart = log.ferias?.start_date || null;
    const feriaEnd   = log.ferias?.end_date   || null;
    const feriaBaseRate = log.ferias?.base_hourly_rate || 0;

    if (!feriaMap[feriaId]) {
      feriaMap[feriaId] = { name: feriaName, start: feriaStart, end: feriaEnd, baseRate: feriaBaseRate, totalMs: 0, days: {} };
    }

    if (log.action_type === 'Entrada') {
      const entryTs = new Date(log.timestamp);
      const dayKey  = fmtDate(entryTs);
      pendingEntry  = { ts: entryTs, dayKey, feriaId, entryTime: fmtTime(entryTs), entryLogId: log.id, shiftRate: log.hourly_rate || null };
      if (!feriaMap[feriaId].days[dayKey]) {
        feriaMap[feriaId].days[dayKey] = { totalMs: 0, turnos: [] };
      }

    } else if (log.action_type === 'Salida' && pendingEntry && pendingEntry.feriaId === feriaId) {
      const exitTs  = new Date(log.timestamp);
      const ms      = exitTs - pendingEntry.ts;
      const exitDay = fmtDate(exitTs);
      const overnight = exitDay !== pendingEntry.dayKey;
      const effectiveRate = pendingEntry.shiftRate > 0 ? pendingEntry.shiftRate
        : feriaMap[feriaId].baseRate > 0 ? feriaMap[feriaId].baseRate
        : hourlyRate;

      feriaMap[feriaId].totalMs += ms;
      feriaMap[feriaId].totalEarnings = (feriaMap[feriaId].totalEarnings || 0) + (ms / 3600000) * effectiveRate;
      if (!feriaMap[feriaId].days[pendingEntry.dayKey]) {
        feriaMap[feriaId].days[pendingEntry.dayKey] = { totalMs: 0, turnos: [] };
      }
      feriaMap[feriaId].days[pendingEntry.dayKey].totalMs += ms;
      feriaMap[feriaId].days[pendingEntry.dayKey].turnos.push({
        entryTime: pendingEntry.entryTime,
        exitTime:  fmtTime(exitTs),
        ms, overnight,
        exitDayShort: overnight
          ? exitTs.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
          : null,
        entryLogId: pendingEntry.entryLogId,
        exitLogId: log.id,
        entryIso: pendingEntry.ts.toISOString(),
        exitIso: exitTs.toISOString(),
        shiftRate: pendingEntry.shiftRate,
        effectiveRate,
      });
      pendingEntry = null;

    } else if (log.action_type === 'Salida' && pendingEntry && pendingEntry.feriaId !== feriaId) {
      pendingEntry = null;
    }
  });

  // Turno abierto (sin salida todavía)
  if (pendingEntry && feriaMap[pendingEntry.feriaId]) {
    const ms = new Date() - pendingEntry.ts;
    const f  = feriaMap[pendingEntry.feriaId];
    f.totalMs += ms;
    if (!f.days[pendingEntry.dayKey]) f.days[pendingEntry.dayKey] = { totalMs: 0, turnos: [] };
    f.days[pendingEntry.dayKey].totalMs += ms;
    f.days[pendingEntry.dayKey].turnos.push({
      entryTime: pendingEntry.entryTime,
      exitTime: null, ms, overnight: false, active: true,
      entryLogId: pendingEntry.entryLogId,
      exitLogId: null,
      entryIso: pendingEntry.ts.toISOString(),
      exitIso: null,
    });
  }

  const feriaEntries = Object.entries(feriaMap);
  const totalMs = feriaEntries.reduce((acc, [, f]) => acc + f.totalMs, 0);
  const totalFeriaEarnings = feriaEntries.reduce((acc, [, f]) => {
     const effRate = f.baseRate > 0 ? f.baseRate : hourlyRate;
     return acc + ((f.totalMs / 3600000) * effRate);
  }, 0);
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const feriaBlocks = feriaEntries.length > 0
    ? feriaEntries.map(([feriaId, f]) => {
        const dayEntries = Object.entries(f.days).sort((a, b) => {
          const parse = s => {
            const parts = s.split(', ')[1]?.split('/') || [];
            return new Date(parts[2], parts[1] - 1, parts[0]);
          };
          return parse(a[0]) - parse(b[0]);
        });

        const dayRows = dayEntries.map(([dayKey, dayData], idx) => {
          const rows = dayData.turnos.map(t => {
            const exitLabel = t.active
              ? `<span style="color:#f59e0b;font-weight:600;">En turno...</span>`
              : t.overnight
                ? `${t.exitTime}&nbsp;<span title="Salida al día siguiente" style="background:#fef3c7;color:#92400e;border-radius:4px;padding:0.1rem 0.35rem;font-size:0.7rem;font-weight:700;">+1 día (${t.exitDayShort})</span>`
                : t.exitTime;
            const rateLabel = t.shiftRate > 0
              ? `<span style="color:#2563eb;font-weight:700;">${t.shiftRate.toFixed(2)}€</span>`
              : `<span style="color:#94a3b8;font-size:0.75rem;">${(t.effectiveRate||0).toFixed(2)}€</span>`;
            const actionsCell = isAdmin && !t.active
              ? `<td style="padding:0.6rem 0.75rem;text-align:center;border-bottom:1px solid var(--divider);white-space:nowrap;">
                  <button class="shift-action-btn shift-edit" onclick="window.openShiftModal({mode:'edit',userId:'${userId}',userName:'${userName.replace(/'/g, "\\'")}',hourlyRate:${hourlyRate},feriaId:'${feriaId}',entryLogId:'${t.entryLogId}',exitLogId:'${t.exitLogId}',entryIso:'${t.entryIso}',exitIso:'${t.exitIso}',shiftRate:${t.shiftRate||0}})" title="Editar turno">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="shift-action-btn shift-delete" onclick="window.deleteShiftAdmin('${t.entryLogId}','${t.exitLogId}','${userId}','${userName.replace(/'/g, "\\'")}',${hourlyRate})" title="Eliminar turno">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                 </td>`
              : isAdmin
                ? `<td style="padding:0.6rem 0.75rem;text-align:center;border-bottom:1px solid var(--divider);color:var(--text-muted);font-size:0.75rem;">—</td>`
                : '';
            return `
              <tr style="background:${idx % 2 === 0 ? 'var(--bg-muted)' : 'var(--bg-card)'};">
                <td style="padding:0.7rem 1rem 0.7rem 2rem;font-size:0.82rem;font-weight:600;color:var(--text-main);border-bottom:1px solid var(--divider);">${dayKey}</td>
                <td style="padding:0.7rem 0.75rem;font-size:0.9rem;font-weight:700;color:var(--success-text);border-bottom:1px solid var(--divider);font-variant-numeric:tabular-nums;">${t.entryTime}</td>
                <td style="padding:0.7rem 0.75rem;font-size:0.9rem;font-weight:700;color:var(--text-main);border-bottom:1px solid var(--divider);font-variant-numeric:tabular-nums;">${exitLabel}</td>
                <td style="padding:0.7rem 0.75rem;text-align:right;font-weight:800;font-size:0.92rem;color:var(--primary);border-bottom:1px solid var(--divider);font-variant-numeric:tabular-nums;letter-spacing:-0.01em;">${fmtMs(t.ms)}</td>
                ${isAdmin ? `<td style="padding:0.7rem 0.75rem;text-align:right;font-size:0.82rem;border-bottom:1px solid var(--divider);">${rateLabel}<br><span style="color:var(--success-text);font-weight:800;font-size:0.85rem;font-variant-numeric:tabular-nums;">${((t.ms/3600000)*(t.effectiveRate||0)).toFixed(2)}€</span></td>` : ''}
                ${actionsCell}
              </tr>`;
          }).join('');

          const dayEarnings = dayData.turnos.reduce((s, t) => s + (t.ms/3600000)*(t.effectiveRate||0), 0);
          const subtotalColspan = isAdmin ? 4 : 3;
          const subtotal = dayData.turnos.length > 1
            ? `<tr style="background:var(--primary-soft);">
                <td colspan="${subtotalColspan}" style="padding:0.4rem 1rem 0.4rem 2rem;font-size:0.75rem;color:var(--primary);font-weight:700;border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:0.04em;">Total del día</td>
                <td style="padding:0.4rem 1rem 0.4rem 0.75rem;text-align:right;font-weight:800;font-size:0.85rem;color:var(--primary);border-bottom:1px solid var(--border);font-variant-numeric:tabular-nums;">${fmtMs(dayData.totalMs)}</td>
                ${isAdmin ? `<td style="padding:0.4rem 0.75rem;text-align:right;font-weight:800;font-size:0.85rem;color:var(--success-text);border-bottom:1px solid var(--border);font-variant-numeric:tabular-nums;">${dayEarnings.toFixed(2)}€</td><td style="border-bottom:1px solid var(--border);"></td>` : ''}
               </tr>`
            : '';

          return rows + subtotal;
        }).join('');

        const isRealFeria = feriaId && feriaId !== '__sin_feria__';
        const addBtn = isAdmin && isRealFeria
          ? `<div style="padding:0.75rem 1rem;background:var(--bg-muted);border-top:1px solid var(--divider);text-align:center;">
              <button class="btn btn-primary" onclick="window.openShiftModal({mode:'add',userId:'${userId}',userName:'${userName.replace(/'/g, "\\'")}',hourlyRate:${hourlyRate},feriaId:'${feriaId}',feriaName:'${(f.name || '').replace(/'/g, "\\'")}',feriaStart:'${f.start || ''}',feriaEnd:'${f.end || ''}'})" style="font-size:0.82rem;padding:0.5rem 1.1rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Añadir turno manual
              </button>
             </div>`
          : '';
        return `
          <div style="border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:1.25rem;background:var(--bg-card);box-shadow:var(--shadow-sm);">
            <div style="padding:1rem 1.25rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--divider);background:var(--bg-muted);">
              <div>
                <div style="font-weight:700;font-size:0.98rem;color:var(--text-main);display:flex;align-items:center;gap:0.4rem;">
                  <span style="display:inline-flex;width:24px;height:24px;border-radius:6px;background:var(--primary-soft);color:var(--primary);align-items:center;justify-content:center;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </span>
                  ${f.name}
                </div>
                ${f.baseRate > 0 ? `<div style="font-size:0.76rem;color:var(--success-text);margin-top:0.3rem;font-weight:700;">${f.baseRate} €/h · Tarifa de feria</div>` : ''}
                ${f.start ? `<div style="font-size:0.76rem;color:var(--text-secondary);margin-top:0.2rem;">${f.start} — ${f.end}</div>` : ''}
              </div>
              <div style="text-align:right;">
                <div style="font-weight:800;font-size:1.15rem;color:var(--primary);font-variant-numeric:tabular-nums;letter-spacing:-0.01em;">${fmtMs(f.totalMs)}</div>
                <div style="font-size:0.72rem;color:var(--text-secondary);margin-top:0.1rem;">${dayEntries.length} día${dayEntries.length !== 1 ? 's' : ''}</div>
                ${isAdmin && (f.totalEarnings||0) > 0 ? `<div style="margin-top:0.3rem;font-weight:800;font-size:0.95rem;color:var(--success-text);font-variant-numeric:tabular-nums;">${(f.totalEarnings||0).toFixed(2)} €</div>` : ''}
              </div>
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:var(--bg-subtle);">
                  <th style="padding:0.55rem 1rem 0.55rem 2rem;text-align:left;font-size:0.7rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--divider);">Día</th>
                  <th style="padding:0.55rem 0.75rem;text-align:left;font-size:0.7rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--divider);">Entrada</th>
                  <th style="padding:0.55rem 0.75rem;text-align:left;font-size:0.7rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--divider);">Salida</th>
                  <th style="padding:0.55rem 1rem 0.55rem 0.75rem;text-align:right;font-size:0.7rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--divider);">Horas</th>
                  ${isAdmin ? `<th style="padding:0.55rem 0.75rem;text-align:right;font-size:0.7rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--divider);">A Cobrar</th>
                  <th style="padding:0.55rem 0.75rem;text-align:center;font-size:0.7rem;color:var(--text-secondary);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;border-bottom:1px solid var(--divider);">Acciones</th>` : ''}
                </tr>
              </thead>
              <tbody>${dayRows}</tbody>
            </table>
            ${addBtn}
          </div>`;
      }).join('')
    : `<div class="empty">Este empleado no tiene fichajes registrados.</div>`;

  const box = overlay.querySelector('div');
  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;">
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="width:48px;height:48px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;color:white;font-size:1.1rem;flex-shrink:0;">${initials}</div>
        <div>
          <h2 style="font-size:1.3rem;font-weight:800;color:var(--text-main);margin:0;">${userName}</h2>
          <p style="color:var(--text-secondary);font-size:0.85rem;margin:0.2rem 0 0;">Horas por feria y día</p>
        </div>
      </div>
      <button class="icon-btn" onclick="document.getElementById('horasFeriaModal').remove()" style="line-height:0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    ${feriaEntries.length > 0 ? `
    <div style="background:var(--primary-soft);border:1px solid color-mix(in oklab, var(--primary) 25%, transparent);border-radius:14px;padding:1.1rem 1.5rem;margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;">
      <div>
        <div style="font-size:0.78rem;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.06em;">Total acumulado</div>
        <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:0.2rem;">${feriaEntries.length} feria${feriaEntries.length !== 1 ? 's' : ''}${isAdmin && hourlyRate > 0 ? ` · ${hourlyRate.toFixed(2)} €/h` : ''}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:2rem;font-weight:800;color:var(--primary);line-height:1;font-variant-numeric:tabular-nums;letter-spacing:-0.02em;">${fmtMs(totalMs)}</div>
        ${isAdmin && totalFeriaEarnings > 0 ? `<div style="font-size:1.2rem;font-weight:800;color:var(--success-text);margin-top:0.35rem;font-variant-numeric:tabular-nums;">${totalFeriaEarnings.toFixed(2)} €</div>` : ''}
      </div>
    </div>` : ''}

    ${feriaBlocks}

    <div style="margin-top:0.75rem;text-align:center;">
      <button class="btn btn-ghost" onclick="document.getElementById('horasFeriaModal').remove()" style="padding:0.55rem 1.6rem;">Cerrar</button>
    </div>
  `;
};

window.editHourlyRate = async function(userId, userName, currentRate) {
  if (!isAdmin) { alert('Solo los administradores pueden cambiar el precio por hora.'); return; }
  const input = prompt(`Precio por hora de ${userName} (€)\nDeja en blanco para cancelar.`, String(currentRate || 10));
  if (input === null) return;
  const trimmed = input.trim().replace(',', '.');
  if (trimmed === '') return;
  const newRate = Number(trimmed);
  if (!isFinite(newRate) || newRate < 0) { alert('Valor no válido. Introduce un número positivo.'); return; }
  const { error } = await supabase.from('profiles').update({ hourly_rate: newRate }).eq('id', userId);
  if (error) { alert('Error guardando el precio/hora: ' + error.message); return; }
  await app.loadUsers();
  if (app.state.activeView === 'users') app.renderView('users');
  const modal = document.getElementById('horasFeriaModal');
  if (modal) { modal.remove(); window.showHorasPorFeria(userId, userName, newRate); }
};

window.openShiftModal = function(opts) {
  if (!isAdmin) { alert('Solo los administradores pueden editar turnos.'); return; }
  const existing = document.getElementById('shiftEditModal');
  if (existing) existing.remove();

  const toLocalInput = iso => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const isEdit = opts.mode === 'edit';
  const defaultEntry  = isEdit ? toLocalInput(opts.entryIso) : (opts.feriaStart ? `${opts.feriaStart}T09:00` : '');
  const defaultExit   = isEdit ? toLocalInput(opts.exitIso)  : (opts.feriaStart ? `${opts.feriaStart}T17:00` : '');
  const defaultRate   = opts.shiftRate > 0 ? opts.shiftRate : (opts.hourlyRate || '');

  const overlay = document.createElement('div');
  overlay.id = 'shiftEditModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(3px);';
  overlay.innerHTML = `
    <div style="background:white;border-radius:16px;padding:1.75rem;max-width:440px;width:100%;box-shadow:0 25px 50px rgba(0,0,0,0.2);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;">
        <div>
          <h3 style="font-size:1.15rem;font-weight:800;margin:0;color:var(--text-main);">${isEdit ? 'Editar turno' : 'Añadir turno manual'}</h3>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin:0.25rem 0 0;">${opts.userName}${opts.feriaName ? ' · ' + opts.feriaName : ''}</p>
        </div>
        <button onclick="document.getElementById('shiftEditModal').remove()" style="background:none;border:none;cursor:pointer;padding:0.4rem;color:var(--text-secondary);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.9rem;">
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:600;color:var(--text-main);margin-bottom:0.35rem;">Entrada</label>
          <input type="datetime-local" id="shiftEntryInput" value="${defaultEntry}" style="width:100%;padding:0.6rem 0.75rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;">
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:600;color:var(--text-main);margin-bottom:0.35rem;">Salida</label>
          <input type="datetime-local" id="shiftExitInput" value="${defaultExit}" style="width:100%;padding:0.6rem 0.75rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;">
        </div>
        <div>
          <label style="display:block;font-size:0.8rem;font-weight:600;color:var(--text-main);margin-bottom:0.35rem;">Precio/hora (€) <span style="font-weight:400;color:var(--text-secondary);">— deja vacío para usar la tarifa por defecto</span></label>
          <input type="number" id="shiftRateInput" value="${defaultRate}" min="0" step="0.5" placeholder="Ej: 8.50" style="width:100%;padding:0.6rem 0.75rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;">
        </div>
        <div id="shiftErrorMsg" style="color:#dc2626;font-size:0.8rem;display:none;"></div>
      </div>
      <div style="display:flex;gap:0.6rem;justify-content:flex-end;margin-top:1.5rem;">
        <button id="shiftCancelBtn" style="background:none;border:1px solid #e2e8f0;padding:0.55rem 1.1rem;border-radius:8px;cursor:pointer;font-size:0.85rem;color:var(--text-secondary);font-weight:600;">Cancelar</button>
        <button id="shiftSaveBtn" style="background:#2563eb;color:white;border:none;padding:0.55rem 1.1rem;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:700;">${isEdit ? 'Guardar cambios' : 'Crear turno'}</button>
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  document.getElementById('shiftCancelBtn').onclick = () => overlay.remove();
  document.getElementById('shiftSaveBtn').onclick = async () => {
    const errEl = document.getElementById('shiftErrorMsg');
    errEl.style.display = 'none';
    const entryVal = document.getElementById('shiftEntryInput').value;
    const exitVal  = document.getElementById('shiftExitInput').value;
    if (!entryVal || !exitVal) { errEl.textContent = 'Debes rellenar ambas fechas/horas.'; errEl.style.display = 'block'; return; }
    const entryDate = new Date(entryVal);
    const exitDate  = new Date(exitVal);
    if (exitDate <= entryDate) { errEl.textContent = 'La salida debe ser posterior a la entrada.'; errEl.style.display = 'block'; return; }

    const saveBtn = document.getElementById('shiftSaveBtn');
    saveBtn.disabled = true; saveBtn.textContent = 'Guardando...';

    const rateRaw = document.getElementById('shiftRateInput').value.trim().replace(',', '.');
    const shiftRate = rateRaw !== '' && isFinite(Number(rateRaw)) && Number(rateRaw) >= 0 ? Number(rateRaw) : null;

    const fail = msg => { errEl.textContent = msg; errEl.style.display='block'; saveBtn.disabled=false; saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Crear turno'; };

    if (isEdit) {
      const entryUpdate = { timestamp: entryDate.toISOString() };
      if (shiftRate !== null) entryUpdate.hourly_rate = shiftRate;
      else entryUpdate.hourly_rate = null;

      const { data: d1, error: e1 } = await supabase
        .from('time_logs').update(entryUpdate).eq('id', opts.entryLogId).select();
      if (e1) { fail('Error al guardar entrada: ' + e1.message); return; }
      if (!d1 || d1.length === 0) { fail('No se actualizó la entrada. Revisa permisos RLS (ejecuta el bloque 4 de schema.sql en Supabase).'); return; }

      const { data: d2, error: e2 } = await supabase
        .from('time_logs').update({ timestamp: exitDate.toISOString() }).eq('id', opts.exitLogId).select();
      if (e2) { fail('Error al guardar salida: ' + e2.message); return; }
      if (!d2 || d2.length === 0) { fail('No se actualizó la salida. Revisa permisos RLS.'); return; }
    } else {
      const entryRow = { user_id: opts.userId, feria_id: opts.feriaId, action_type: 'Entrada', timestamp: entryDate.toISOString() };
      if (shiftRate !== null) entryRow.hourly_rate = shiftRate;
      const { data, error } = await supabase.from('time_logs').insert([
        entryRow,
        { user_id: opts.userId, feria_id: opts.feriaId, action_type: 'Salida', timestamp: exitDate.toISOString() },
      ]).select();
      if (error) { fail('Error al crear turno: ' + error.message); return; }
      if (!data || data.length < 2) { fail('No se crearon los fichajes. Revisa permisos RLS.'); return; }
    }

    overlay.remove();
    await app.loadUsers();
    if (app.state.activeView === 'users') app.renderView('users');
    const modal = document.getElementById('horasFeriaModal');
    if (modal) modal.remove();
    window.showHorasPorFeria(opts.userId, opts.userName, opts.hourlyRate);
  };
};

window.deleteShiftAdmin = async function(entryLogId, exitLogId, userId, userName, hourlyRate) {
  if (!isAdmin) { alert('Solo los administradores pueden eliminar turnos.'); return; }
  if (!confirm('¿Seguro que quieres eliminar este turno? Se borrarán la entrada y la salida.')) return;
  const ids = [entryLogId, exitLogId].filter(Boolean);
  const { data, error } = await supabase.from('time_logs').delete().in('id', ids).select();
  if (error) { alert('Error eliminando el turno: ' + error.message); return; }
  if (!data || data.length === 0) { alert('No se eliminó ningún fichaje. Revisa los permisos de admin (RLS DELETE en schema.sql).'); return; }
  await app.loadUsers();
  if (app.state.activeView === 'users') app.renderView('users');
  const modal = document.getElementById('horasFeriaModal');
  if (modal) modal.remove();
  window.showHorasPorFeria(userId, userName, hourlyRate);
};

window.openCasetasModal = async function(feriaId) {
  if (!isAdmin) { alert('Solo el admin puede gestionar casetas.'); return; }
  const feria = app.state.ferias.find(f => f.id === feriaId);
  if (!feria) { alert('Feria no encontrada'); return; }

  const existing = document.getElementById('casetasModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'casetasModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(2px);';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  const render = async () => {
    const [{ data: casetas }, { data: caseta_workers }] = await Promise.all([
      supabase.from('casetas').select('*').eq('feria_id', feriaId).order('name', { ascending: true }),
      supabase.from('caseta_workers').select('*'),
    ]);
    const workersByCaseta = {};
    (caseta_workers || []).forEach(cw => {
      workersByCaseta[cw.caseta_id] = (workersByCaseta[cw.caseta_id] || 0) + 1;
    });

    const rows = (casetas || []).map(c => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:0.5rem;">
        <div>
          <div style="font-weight:700;font-size:0.95rem;">🏠 ${c.name}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.15rem;">👥 ${workersByCaseta[c.id] || 0} empleado${(workersByCaseta[c.id]||0) !== 1 ? 's' : ''} asignado${(workersByCaseta[c.id]||0) !== 1 ? 's' : ''}</div>
        </div>
        <div style="display:flex;gap:0.4rem;">
          <button onclick="window.manageCasetaWorkers('${c.id}','${c.name.replace(/'/g,"\\'")}','${feriaId}')" style="background:#2563eb;color:white;border:none;padding:0.45rem 0.9rem;border-radius:8px;cursor:pointer;font-size:0.78rem;font-weight:600;">Empleados</button>
          <button onclick="window.deleteCaseta('${c.id}','${feriaId}')" style="background:none;border:1px solid #fecaca;color:#dc2626;padding:0.45rem 0.7rem;border-radius:8px;cursor:pointer;font-size:0.78rem;font-weight:600;">Borrar</button>
        </div>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div style="background:white;border-radius:16px;padding:1.75rem;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,0.2);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.25rem;">
          <div>
            <h3 style="font-size:1.2rem;font-weight:800;margin:0;">Casetas de ${feria.name}</h3>
            <p style="font-size:0.82rem;color:var(--text-secondary);margin:0.2rem 0 0;">Crea casetas y asigna empleados a cada una</p>
          </div>
          <button onclick="document.getElementById('casetasModal').remove()" style="background:none;border:none;cursor:pointer;padding:0.4rem;color:var(--text-secondary);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div style="margin-bottom:1rem;">
          ${(casetas||[]).length === 0 ? '<p style="text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.9rem;">No hay casetas todavía. Crea la primera abajo.</p>' : rows}
        </div>

        <div style="border-top:1px solid #e2e8f0;padding-top:1rem;">
          <label style="display:block;font-size:0.85rem;font-weight:700;margin-bottom:0.4rem;">Crear nueva caseta</label>
          <div style="display:flex;gap:0.5rem;">
            <input id="newCasetaName" type="text" placeholder="Ej: Caseta 1, Caseta Principal..." style="flex:1;padding:0.6rem 0.8rem;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;">
            <button onclick="window.addCaseta('${feriaId}')" style="background:#16a34a;color:white;border:none;padding:0.6rem 1.1rem;border-radius:8px;cursor:pointer;font-weight:700;font-size:0.85rem;">+ Añadir</button>
          </div>
          <div id="casetaError" style="display:none;color:#dc2626;font-size:0.8rem;margin-top:0.4rem;"></div>
        </div>
      </div>
    `;
  };

  window._rerenderCasetasModal = render;
  await render();
};

window.addCaseta = async function(feriaId) {
  const input = document.getElementById('newCasetaName');
  const errEl = document.getElementById('casetaError');
  const name = (input.value || '').trim();
  errEl.style.display = 'none';
  if (!name) { errEl.textContent = 'Escribe un nombre.'; errEl.style.display='block'; return; }
  const { error } = await supabase.from('casetas').insert({ feria_id: feriaId, name });
  if (error) { errEl.textContent = 'Error: ' + error.message; errEl.style.display='block'; return; }
  input.value = '';
  await app.loadFeriasData();
  if (app.state.activeView === 'manage-ferias') app.renderView('manage-ferias');
  if (window._rerenderCasetasModal) await window._rerenderCasetasModal();
};

window.deleteCaseta = async function(casetaId, feriaId) {
  if (!confirm('¿Eliminar esta caseta? Los fichajes existentes se mantendrán pero perderán la referencia.')) return;
  const { error } = await supabase.from('casetas').delete().eq('id', casetaId);
  if (error) { alert('Error: ' + error.message); return; }
  await app.loadFeriasData();
  if (app.state.activeView === 'manage-ferias') app.renderView('manage-ferias');
  if (window._rerenderCasetasModal) await window._rerenderCasetasModal();
};

window.manageCasetaWorkers = async function(casetaId, casetaName, feriaId) {
  if (!isAdmin) return;
  const existing = document.getElementById('casetaWorkersModal');
  if (existing) existing.remove();

  const { data: current } = await supabase.from('caseta_workers').select('user_id').eq('caseta_id', casetaId);
  const assigned = new Set((current || []).map(a => a.user_id));
  const employees = app.state.users.filter(u => u.role !== 'Admin' && u.role !== 'Manager');

  const overlay = document.createElement('div');
  overlay.id = 'casetaWorkersModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.6);z-index:1100;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(3px);';
  overlay.innerHTML = `
    <div style="background:white;border-radius:16px;padding:1.75rem;max-width:460px;width:100%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 50px rgba(0,0,0,0.2);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem;">
        <div>
          <h3 style="font-size:1.1rem;font-weight:800;margin:0;">Empleados de 🏠 ${casetaName}</h3>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin:0.2rem 0 0;">Marca quienes fichan en esta caseta</p>
        </div>
        <button onclick="document.getElementById('casetaWorkersModal').remove()" style="background:none;border:none;cursor:pointer;padding:0.4rem;color:var(--text-secondary);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:0.5rem;">
        <button type="button" onclick="window.toggleAllWorkers('caseta_workers_cb','toggleAllCasetaBtn')" id="toggleAllCasetaBtn" style="font-size:0.78rem;font-weight:600;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:0.3rem 0.75rem;cursor:pointer;">Seleccionar todos</button>
      </div>
      <div style="flex:1;overflow-y:auto;border:1px solid #e2e8f0;border-radius:10px;padding:0.75rem;background:#f8fafc;display:flex;flex-direction:column;gap:0.5rem;">
        ${employees.length === 0 ? '<p style="text-align:center;color:var(--text-muted);padding:1rem;font-size:0.9rem;">No hay empleados registrados.</p>' :
          employees.map(u => `
            <label style="display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0.75rem;background:white;border-radius:8px;border:1px solid #e2e8f0;cursor:pointer;">
              <input type="checkbox" name="caseta_workers_cb" value="${u.id}" ${assigned.has(u.id) ? 'checked' : ''} style="width:16px;height:16px;">
              <span style="font-weight:600;font-size:0.9rem;">${u.name}</span>
              <span style="font-size:0.75rem;color:var(--text-secondary);">${u.email}</span>
            </label>`).join('')
        }
      </div>
      <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
        <button onclick="document.getElementById('casetaWorkersModal').remove()" style="background:none;border:1px solid #e2e8f0;padding:0.55rem 1.1rem;border-radius:8px;cursor:pointer;font-weight:600;font-size:0.85rem;">Cancelar</button>
        <button id="saveCasetaWorkersBtn" style="background:#2563eb;color:white;border:none;padding:0.55rem 1.1rem;border-radius:8px;cursor:pointer;font-weight:700;font-size:0.85rem;">Guardar</button>
      </div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  document.getElementById('saveCasetaWorkersBtn').onclick = async () => {
    const checkboxes = Array.from(document.querySelectorAll('input[name="caseta_workers_cb"]:checked'));
    const saveBtn = document.getElementById('saveCasetaWorkersBtn');
    saveBtn.disabled = true; saveBtn.textContent = 'Guardando...';
    await supabase.from('caseta_workers').delete().eq('caseta_id', casetaId);
    if (checkboxes.length > 0) {
      const rows = checkboxes.map(cb => ({ caseta_id: casetaId, user_id: cb.value }));
      const { error } = await supabase.from('caseta_workers').insert(rows);
      if (error) { alert('Error: ' + error.message); saveBtn.disabled=false; saveBtn.textContent='Guardar'; return; }
    }
    overlay.remove();
    await app.loadFeriasData();
    if (window._rerenderCasetasModal) await window._rerenderCasetasModal();
  };
};

app.handleInit();
