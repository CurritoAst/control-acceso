import { supabase } from '/supabase.js'

const { data: { session } } = await supabase.auth.getSession();
const currentUser = session?.user;

// â”€â”€ Role Authorization â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let isAdmin = false;
if (currentUser) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single();
  isAdmin = (profile?.role === 'Admin') || (currentUser.user_metadata?.role === 'Admin') || (currentUser.email === 'macario@duke.com');
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
    // Configuración central en modo Kiosco

    this.setupGlobalListeners();
    this.injectModal();
    this.injectFeriaModal();
    this.injectWorkersModal();
    this.injectEditFeriaModal();
    
    await this.loadUsers();
    await this.loadFeriasData();
    if (this.state.activeView === 'kiosk') {
      await this.loadKioskData();
    }
    if (this.state.activeView === 'dashboard') {
      await this.loadDashboardData();
    }
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const navItem = document.querySelector(`[data-view="${this.state.activeView}"]`);
    if(navItem) navItem.classList.add('active');

    this.updateHeader();
    this.renderView(this.state.activeView);
  },

  async loadUsers() {
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    const { data: logs, error: lError } = await supabase.from('time_logs').select('user_id, action_type, timestamp').order('timestamp', { ascending: true });

    const totalMsByUser = {};
    if (logs) {
      const logsByUser = {};
      logs.forEach(l => {
        if (!logsByUser[l.user_id]) logsByUser[l.user_id] = { totalMs: 0, lastIn: null };
        const uData = logsByUser[l.user_id];
        if (l.action_type === 'Entrada') {
          uData.lastIn = new Date(l.timestamp);
        } else if (l.action_type === 'Salida' && uData.lastIn) {
          uData.totalMs += new Date(l.timestamp) - uData.lastIn;
          uData.lastIn = null;
        }
      });
      Object.keys(logsByUser).forEach(uid => {
        totalMsByUser[uid] = logsByUser[uid].totalMs;
      });
    }

    if (!pError && profiles) {
      this.state.users = profiles.map(u => {
        const ms = totalMsByUser[u.id] || 0;
        const hrs = Math.floor(ms / 1000 / 60 / 60);
        const mins = Math.floor((ms / 1000 / 60) % 60);
        return {
          id: u.id,
          name: u.name,
          email: u.email || '',
          role: u.role,
          status: u.status,
          lastAccess: u.last_access || 'Nunca',
          totalHours: hrs > 0 || mins > 0 ? `${hrs}h ${mins}m` : '0h 0m'
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
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.sidebar').classList.remove('mobile-open');
    const navItem = document.querySelector(`[data-view="${view}"]`);
    if (navItem) navItem.classList.add('active');
    this.state.activeView = view;

    if (view === 'dashboard') await this.loadDashboardData();
    if (view === 'users') await this.loadUsers();
    if (view === 'manage-ferias') await this.loadFeriasData();
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
    if (this.state.users.length === 0) await this.loadUsers();

    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - 3); // Obtener 3 días atrás para capturar turnos abiertos
    filterDate.setHours(0, 0, 0, 0);
    const { data: logs } = await supabase
      .from('time_logs')
      .select('*, ferias(id, name)')
      .gte('timestamp', filterDate.toISOString())
      .order('timestamp', { ascending: true });

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
    const { data: ferias } = await supabase.from('ferias').select('*').order('start_date', { ascending: true });
    this.state.ferias = ferias || [];

    const { data: feriaWorkers } = await supabase.from('feria_workers').select('*');
    this.state.feriaWorkers = feriaWorkers || [];

    const filterDate = new Date();
    filterDate.setDate(filterDate.getDate() - 3); // Obtener hasta 3 días para ver quién fichó Entrada ayer
    filterDate.setHours(0,0,0,0);
    const { data: logs } = await supabase.from('time_logs')
      .select('*')
      .gte('timestamp', filterDate.toISOString())
      .order('timestamp', { ascending: true });

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

    // Filtrar trabajadores asignados a la feria seleccionada
    const assignedWorkerIds = (this.state.feriaWorkers || [])
      .filter(fw => fw.feria_id === activeFeriaId)
      .map(fw => fw.user_id);
    const feriaEmployees = activeFeriaId && assignedWorkerIds.length > 0
      ? this.state.users.filter(u => u.role !== 'Admin' && assignedWorkerIds.includes(u.id))
      : this.state.users.filter(u => u.role !== 'Admin');
    const noAssignedWorkers = activeFeriaId && assignedWorkerIds.length === 0;

    // Si el trabajador seleccionado no está en la feria actual, resetear
    if (window.selectedKioskWorkerId && activeFeriaId && assignedWorkerIds.length > 0 && !assignedWorkerIds.includes(window.selectedKioskWorkerId)) {
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

          <!-- 2. Trabajador -->
          <div class="form-group" style="text-align:left;">
            <label style="font-weight:700; font-size:1.05rem; color:var(--text-main); display:block; margin-bottom:0.75rem;">
              2. Seleccionar Trabajador
              ${activeFeriaId && !noAssignedWorkers ? `<span style="font-weight:400; font-size:0.82rem; color:var(--text-secondary); margin-left:0.5rem;">(${feriaEmployees.length} asignado${feriaEmployees.length !== 1 ? 's' : ''} a esta feria)</span>` : ''}
            </label>
            ${noAssignedWorkers
              ? `<div style="padding:1rem; background:#fefce8; border:1px solid #fde68a; border-radius:8px; color:#92400e; font-size:0.9rem;">
                  ⚠️ No hay trabajadores asignados a esta feria. Ve a <strong>Gestión de Ferias</strong> para asignarlos.
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
          </div>

          <!-- 3. Botón Fichar -->
          <div style="margin-top:3.5rem;">
            ${activeWorkerId && activeFeriaId
              ? `<button id="btnPunchAction" class="btn-punch ${isWorking ? 'out' : 'in'}" onclick="window.handlePunch('${isWorking ? 'Salida' : 'Entrada'}', '${activeWorkerId}', '${activeFeriaId}')" style="width:100%; padding:1.25rem; font-size:1.25rem; border-radius:12px; transition:transform 0.1s;">
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

  getUsersHTML() {
    return `
      <div style="margin-bottom:2rem;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h1 style="font-size:1.5rem;font-weight:700;">Gestión de Usuarios</h1>
          <p style="color:var(--text-secondary);">Administra los permisos y accesos.</p>
        </div>
        <button class="btn btn-primary btn-add-user">Añadir Usuario</button>
      </div>
      <div class="table-container">
        <div class="table-header">
          <h3 style="font-size:1rem;font-weight:600;">Directorio de Personal</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Usuario</th><th>Rol</th><th>Estado</th><th>Horas Acumuladas</th><th>Último Acceso</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.users.length === 0
              ? `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem;">No hay usuarios todavía.</td></tr>`
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
    return `
      <tr onclick="window.showHorasPorFeria('${user.id}', '${safeName}')" style="cursor:pointer;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
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
        <td style="color:var(--text-secondary);">${user.lastAccess}</td>
        <td onclick="event.stopPropagation()">
          <button class="btn btn-primary" title="Ver Historial, Horas y GPS" style="padding:0.4rem 0.8rem; font-size:0.75rem; margin-right:0.5rem;" onclick="app.viewUserHistory('${user.id}', '${safeName}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:relative;top:2px;margin-right:2px"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Historial y GPS
          </button>
          <button class="btn btn-ghost btn-delete-user" data-id="${user.id}" style="padding:0.4rem;color:var(--error-text);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </td>
      </tr>`;
  },

  async viewUserHistory(id, name) {
    this.state.viewedUserName = name;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.state.activeView = 'user-history';
    const { data: logs } = await supabase.from('time_logs').select('*').eq('user_id', id).order('timestamp', { ascending: true });
    this.state.viewedUserLogs = logs || [];
    this.renderView('user-history');
  },

  getUserHistoryHTML() {
    const logsByDay = {};
    this.state.viewedUserLogs.forEach(log => {
      const dateStr = new Date(log.timestamp).toLocaleDateString('es-ES');
      if (!logsByDay[dateStr]) logsByDay[dateStr] = { logs: [], totalMs: 0, lastIn: null, inLoc: null, outLoc: null };
      
      const dayData = logsByDay[dateStr];
      dayData.logs.push(log);
      
      if (log.action_type === 'Entrada') {
        dayData.lastIn = new Date(log.timestamp);
        if (!dayData.inLoc) dayData.inLoc = { lat: log.latitude, lon: log.longitude };
      } else if (log.action_type === 'Salida') {
        if (dayData.lastIn) {
          dayData.totalMs += new Date(log.timestamp) - dayData.lastIn;
          dayData.lastIn = null;
        }
        dayData.outLoc = { lat: log.latitude, lon: log.longitude };
      }
    });

    const daysList = Object.keys(logsByDay).sort((a,b) => {
      const pA = a.split('/'); const dtA = new Date(pA[2], pA[1]-1, pA[0]);
      const pB = b.split('/'); const dtB = new Date(pB[2], pB[1]-1, pB[0]);
      return dtB - dtA;
    });

    const historyHTML = daysList.map(dateStr => {
      const dayData = logsByDay[dateStr];
      let ms = dayData.totalMs;
      
      const isWorkingUnfinished = dayData.lastIn !== null && daysList[0] === dateStr && new Date().toLocaleDateString('es-ES') === dateStr;
      if (isWorkingUnfinished) {
        ms += new Date() - dayData.lastIn;
      }
      
      const h = Math.floor(ms / 1000 / 60 / 60);
      const m = Math.floor((ms / 1000 / 60) % 60);
      
      const inLink = dayData.inLoc && dayData.inLoc.lat ? `<a href="https://www.google.com/maps?q=${dayData.inLoc.lat},${dayData.inLoc.lon}" target="_blank" style="color:var(--success-text);text-decoration:underline;display:flex;align-items:center;gap:0.3rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Mapa (Entrada)</a>` : '<span style="color:var(--text-muted)">🚫 Sin GPS detectado</span>';
      
      const outLink = dayData.outLoc && dayData.outLoc.lat ? `<a href="https://www.google.com/maps?q=${dayData.outLoc.lat},${dayData.outLoc.lon}" target="_blank" style="color:var(--error-text);text-decoration:underline;display:flex;align-items:center;gap:0.3rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Mapa (Salida)</a>` : '<span style="color:var(--text-muted)">🚫 Aún trabajando o sin GPS</span>';

      const statusText = isWorkingUnfinished ? '<span style="color:var(--warning-text);font-weight:600;background:#fefce8;padding:0.25rem 0.5rem;border-radius:6px;border:1px solid #fef08a;">(Aún en su turno)</span>' : `<span style="font-weight:700;">${h}h ${m}m </span>`;

      return `
        <div style="padding:1.5rem;background:white;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:1.5rem;box-shadow:var(--shadow-sm);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;border-bottom:1px solid #f8fafc;padding-bottom:1rem;">
            <div style="font-size:1.125rem;font-weight:700;color:var(--text-main);display:flex;align-items:center;gap:0.5rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--primary);"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Jornada del ${dateStr}
            </div>
            <div style="font-size:1.125rem;">${statusText}</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
            <div style="display:flex;flex-direction:column;gap:0.75rem;padding:1rem;background:#f8fafc;border-radius:8px;">
              <span style="font-weight:700;color:var(--success-text);">Hora de Entrada</span>
              ${inLink}
            </div>
            <div style="display:flex;flex-direction:column;gap:0.75rem;padding:1rem;background:#f8fafc;border-radius:8px;">
              <span style="font-weight:700;color:var(--error-text);">Hora de Salida Final</span>
              ${outLink}
            </div>
          </div>
        </div>
      `;
    }).join('') || '<div style="text-align:center;padding:4rem;background:white;border-radius:12px;border:1px dashed #cbd5e1;"><p style="color:var(--text-muted);font-size:1rem;">Este empleado no tiene registros en el sistema todavía.</p></div>';

    return `
      <div style="margin-bottom:2.5rem;display:flex;align-items:center;gap:1.5rem;">
        <button class="btn btn-ghost" onclick="app.switchView('users')" style="padding:0.75rem;background:white;border:1px solid #e2e8f0;border-radius:50%;box-shadow:var(--shadow-sm);transition:all 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='none'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <div>
          <h1 style="font-size:1.75rem;font-weight:800;letter-spacing:-0.02em;">Historial Laboral: ${this.state.viewedUserName}</h1>
          <p style="color:var(--text-secondary);font-size:1rem;margin-top:0.25rem;">Registro de asistencia detallado y ubicaciones GPS de conexión/desconexión.</p>
        </div>
      </div>
      <div style="max-width:850px;margin-left:0;">
        ${historyHTML}
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

  async loadDashboardData() {
    if (!isAdmin) return;
    const today = new Date();
    today.setHours(0,0,0,0);
    const { data: logs } = await supabase.from('time_logs')
      .select('*')
      .gte('timestamp', today.toISOString())
      .order('timestamp', { ascending: true }); // Orden ascendente para procesar pares entrada-salida

    const dailyActivity = {}; // user_id -> { name, entryTime, exitTime, isFinished, ... }
    
    if (this.state.users.length === 0) await this.loadUsers();
    const { data: feriasList } = await supabase.from('ferias').select('*');
    const { data: feriaWorkers } = await supabase.from('feria_workers').select('*');

    if (logs) {
      logs.forEach(log => {
        const userId = log.user_id;
        const profile = this.state.users.find(u => u.id === userId);
        const timeStr = new Date(log.timestamp).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
        
        if (!dailyActivity[userId]) {
          // Determinar feria activa actual
          let currentFeriaName = 'General / Sin Feria';
          if (feriaWorkers && feriasList) {
            const uAssigns = feriaWorkers.filter(fw => fw.user_id === userId).map(fw => fw.feria_id);
            const activeOrAssigned = feriasList.filter(f => uAssigns.includes(f.id));
            if (activeOrAssigned.length > 0) {
              const currentObj = activeOrAssigned.find(f => {
                const start = new Date(f.start_date); start.setHours(0,0,0,0);
                const end = new Date(f.end_date); end.setHours(23,59,59,999);
                const now = new Date();
                return now >= start && now <= end;
              }) || activeOrAssigned[0];
              currentFeriaName = currentObj.name;
            }
          }

          dailyActivity[userId] = {
            id: userId,
            name: profile ? profile.name : 'Desconocido',
            entryTime: log.action_type === 'Entrada' ? timeStr : 'N/A',
            exitTime: log.action_type === 'Salida' ? timeStr : null,
            isFinished: log.action_type === 'Salida',
            latitude: log.latitude,
            longitude: log.longitude,
            feria_name: currentFeriaName
          };
        } else {
          // Actualizar registros existentes para el usuario hoy
          if (log.action_type === 'Entrada') {
             dailyActivity[userId].entryTime = timeStr;
             dailyActivity[userId].isFinished = false;
             dailyActivity[userId].exitTime = null;
          } else {
             dailyActivity[userId].exitTime = timeStr;
             dailyActivity[userId].isFinished = true;
          }
          // Siempre guardar la última ubicación conocida
          if (log.latitude) {
            dailyActivity[userId].latitude = log.latitude;
            dailyActivity[userId].longitude = log.longitude;
          }
        }
      });
    }

    this.state.allTodayLogs = Object.values(dailyActivity).sort((a, b) => {
      // Ordenar por quién está trabajando ahora o por hora de entrada
      if (a.isFinished !== b.isFinished) return a.isFinished ? 1 : -1;
      return a.entryTime.localeCompare(b.entryTime);
    });
  },

  async loadFeriasData() {
    const { data } = await supabase.from('ferias').select('*').order('start_date', { ascending: true });
    this.state.ferias = data || [];
    
    // Contar trabajadores
    const { data: assigns } = await supabase.from('feria_workers').select('feria_id');
    const counts = {};
    if (assigns) assigns.forEach(a => { counts[a.feria_id] = (counts[a.feria_id] || 0) + 1; });
    
    this.state.ferias.forEach(f => f.workerCount = counts[f.id] || 0);
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
                <div style="font-size:0.75rem;color:var(--primary);margin-top:0.25rem;font-weight:600;">👥 ${f.workerCount || 0} Personal Asignado</div>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-end;">
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
    document.getElementById('editFeriaModalOverlay').classList.add('active');
  },

  async updateFeria() {
    const id = document.getElementById('editFeriaUpdateId').value;
    const name = document.getElementById('editFeriaName').value;
    const start_date = document.getElementById('editFeriaStart').value;
    const end_date = document.getElementById('editFeriaEnd').value;
    const location = document.getElementById('editFeriaLoc').value;

    const btn = document.querySelector('#editFeriaForm button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const { error } = await supabase.from('ferias').update({
      name, start_date, end_date, location
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
    const { data: insertedFeria, error } = await supabase.from('ferias').insert({
      name: document.getElementById('feriaName').value,
      start_date: document.getElementById('feriaStart').value,
      end_date: document.getElementById('feriaEnd').value,
      location: document.getElementById('feriaLoc').value
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

window.handlePunch = async function(type, workerId, feriaId) {
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

    const { error } = await supabase.from('time_logs').insert({
      user_id: workerId,
      feria_id: feriaId,
      action_type: type,
      latitude: lat,
      longitude: lon
    });

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

window.showHorasPorFeria = async function(userId, userName) {
  // Crear overlay
  const existing = document.getElementById('horasFeriaModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'horasFeriaModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(2px);';
  overlay.innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;max-width:580px;width:100%;max-height:85vh;overflow-y:auto;box-shadow:0 25px 50px rgba(0,0,0,0.15);">
      <div style="text-align:center;padding:2rem;color:var(--text-secondary);">Cargando datos...</div>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);

  // Cargar logs con info de feria
  const { data: logs } = await supabase
    .from('time_logs')
    .select('*, ferias(id, name, start_date, end_date)')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });

  // Agrupar por feria y calcular horas
  const feriaMap = {};
  (logs || []).forEach(log => {
    const feriaId = log.feria_id || '__sin_feria__';
    const feriaName = log.ferias?.name || 'Sin feria asignada';
    const feriaStart = log.ferias?.start_date || null;
    const feriaEnd = log.ferias?.end_date || null;
    if (!feriaMap[feriaId]) {
      feriaMap[feriaId] = { name: feriaName, start: feriaStart, end: feriaEnd, totalMs: 0, lastIn: null, days: new Set() };
    }
    const d = feriaMap[feriaId];
    d.days.add(new Date(log.timestamp).toLocaleDateString('es-ES'));
    if (log.action_type === 'Entrada') {
      d.lastIn = new Date(log.timestamp);
    } else if (log.action_type === 'Salida' && d.lastIn) {
      d.totalMs += new Date(log.timestamp) - d.lastIn;
      d.lastIn = null;
    }
  });

  const fmtMs = ms => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const entries = Object.entries(feriaMap);
  const totalMs = entries.reduce((acc, [, f]) => acc + f.totalMs, 0);

  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const rows = entries.length > 0
    ? entries.map(([, f]) => `
        <tr onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
          <td style="padding:1rem 1.25rem;">
            <div style="font-weight:600;color:var(--text-main);">${f.name}</div>
            ${f.start ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.2rem;">📅 ${f.start} — ${f.end}</div>` : ''}
          </td>
          <td style="padding:1rem;text-align:center;color:var(--text-secondary);font-size:0.9rem;">${f.days.size} día${f.days.size !== 1 ? 's' : ''}</td>
          <td style="padding:1rem 1.25rem;text-align:right;">
            <span style="font-weight:800;font-size:1.1rem;color:var(--primary);">${fmtMs(f.totalMs)}</span>
          </td>
        </tr>
      `).join('')
    : `<tr><td colspan="3" style="padding:3rem;text-align:center;color:var(--text-muted);">Este empleado no tiene fichajes registrados.</td></tr>`;

  const box = overlay.querySelector('div');
  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.75rem;">
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="width:48px;height:48px;background:linear-gradient(135deg,#3b82f6,#2563eb);border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;color:white;font-size:1.1rem;flex-shrink:0;">${initials}</div>
        <div>
          <h2 style="font-size:1.3rem;font-weight:800;color:var(--text-main);margin:0;">${userName}</h2>
          <p style="color:var(--text-secondary);font-size:0.85rem;margin:0.2rem 0 0;">Horas trabajadas por feria</p>
        </div>
      </div>
      <button onclick="document.getElementById('horasFeriaModal').remove()" style="background:none;border:none;cursor:pointer;padding:0.4rem;border-radius:8px;color:var(--text-secondary);line-height:0;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>

    ${entries.length > 0 ? `
    <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:1rem 1.5rem;margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:0.8rem;font-weight:600;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.05em;">Total acumulado</div>
        <div style="font-size:0.75rem;color:#3b82f6;margin-top:0.1rem;">${entries.length} feria${entries.length !== 1 ? 's' : ''}</div>
      </div>
      <div style="font-size:2rem;font-weight:800;color:#1d4ed8;">${fmtMs(totalMs)}</div>
    </div>` : ''}

    <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <th style="padding:0.75rem 1.25rem;text-align:left;font-size:0.78rem;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Feria</th>
            <th style="padding:0.75rem 1rem;text-align:center;font-size:0.78rem;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Días</th>
            <th style="padding:0.75rem 1.25rem;text-align:right;font-size:0.78rem;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Horas</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <div style="margin-top:1rem;text-align:center;">
      <button onclick="document.getElementById('horasFeriaModal').remove()" style="background:none;border:1px solid #e2e8f0;border-radius:8px;padding:0.5rem 1.5rem;cursor:pointer;color:var(--text-secondary);font-size:0.9rem;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='none'">Cerrar</button>
    </div>
  `;
};

app.handleInit();
