const { data: { session } } = await supabase.auth.getSession();
const currentUser = session?.user;

// ── Role Authorization ─────────────────────────────────────────────────────
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
    if (!isAdmin) this.state.activeView = 'attendance';

    this.setupGlobalListeners();
    this.injectModal();
    this.injectFeriaModal();
    this.injectWorkersModal();
    
    await this.loadUsers();
    if (this.state.activeView === 'dashboard') {
      await this.loadDashboardData();
    } else if (this.state.activeView === 'attendance') {
      await this.loadAttendanceData();
    }
    
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const navItem = document.querySelector(`[data-view="${this.state.activeView}"]`);
    if(navItem) navItem.classList.add('active');

    this.updateHeader();
    this.renderView(this.state.activeView);
  },

  async loadUsers() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) {
      this.state.users = data.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email || '',
        role: u.role,
        status: u.status,
        lastAccess: u.last_access || 'Nunca'
      })).sort((a, b) => a.name.localeCompare(b.name));
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
                <input type="text" id="userName" class="input-field" placeholder="Ej. Alex Smith" required>
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
    if (!isAdmin && (view === 'dashboard' || view === 'users' || view === 'logs' || view === 'manage-ferias')) {
      alert('Acceso denegado. Se requiere nivel de administrador.');
      return;
    }

    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector('.sidebar').classList.remove('mobile-open');
    const navItem = document.querySelector(`[data-view="${view}"]`);
    if (navItem) navItem.classList.add('active');
    this.state.activeView = view;

    if (view === 'users') await this.loadUsers();
    if (view === 'attendance') await this.loadAttendanceData();
    if (view === 'manage-ferias') await this.loadFeriasData();
    if (view === 'dashboard') await this.loadDashboardData();
    this.renderView(view);
  },

  openModal() {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById('modal-error').style.display = 'none';
  },

  async addUser() {
    const name     = document.getElementById('userName').value.trim();
    const email    = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role     = document.getElementById('userRole').value;
    const status   = document.getElementById('userStatus').value;
    const errEl    = document.getElementById('modal-error');
    const saveBtn  = document.getElementById('saveBtn');

    errEl.style.display = 'none';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    // Sign up the user via Supabase Auth
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

    // Insert profile row
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name,
        email,
        role,
        status,
        last_access: 'Nunca'
      });
    }

    saveBtn.disabled = false;
    saveBtn.textContent = 'Guardar Usuario';
    document.getElementById('modalOverlay').classList.remove('active');
    document.getElementById('userForm').reset();
    await this.loadUsers();
    this.renderView('users');
  },

  async deleteUser(id) {
    if (!confirm('¿Deseas eliminar este usuario?')) return;

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
    } else if (view === 'users') {
      content.innerHTML = this.getUsersHTML();
    } else if (view === 'attendance') {
      content.innerHTML = this.getAttendanceHTML();
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

  getDashboardHTML() {
    const activeCount = this.state.users.filter(u => u.status === 'Active').length;
    return `
      <div style="margin-bottom: 2rem;">
        <h1 style="font-size: 1.5rem; font-weight: 700;">Panel de Control</h1>
        <p style="color: var(--text-secondary);">Bienvenido. Hay ${activeCount} usuarios activos.</p>
      </div>
      <div class="metrics-grid">
        <div class="card" ${isAdmin ? 'id="totalUsersCard" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'translateY(0)\'" title="Ir al listado de usuarios"' : ''}>
          <span class="card-title">Usuarios Totales</span>
          <div class="card-value">${this.state.users.length}</div>
          <div class="card-trend trend-up">${isAdmin ? 'Ver listado →' : 'En Supabase'}</div>
        </div>
        <div class="card">
          <span class="card-title">Accesos Hoy</span>
          <div class="card-value">148</div>
          <div class="card-trend trend-up">+12% vs ayer</div>
        </div>
        <div class="card">
          <span class="card-title">Denegaciones</span>
          <div class="card-value" style="color:var(--error-text)">3</div>
          <div class="card-trend trend-down">Estable</div>
        </div>
        <div class="card">
          <span class="card-title">Estado Sistema</span>
          <div class="card-value" style="color:var(--success-text)">Online</div>
          <div class="card-trend" style="color:var(--success-text)">Correcto</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.5rem;">
        <div class="card" style="height:350px;display:flex;flex-direction:column; overflow-y:auto;">
          <h3 style="font-size:1rem;margin-bottom:1rem;">Actividad de Hoy</h3>
          ${isAdmin ? `
            <div style="display:flex;flex-direction:column;gap:1rem;">
              ${!this.state.allTodayLogs || this.state.allTodayLogs.length === 0 ? '<p style="color:var(--text-muted);text-align:center;padding:2rem;">Sin actividad registrada hoy.</p>' : ''}
              ${(this.state.allTodayLogs || []).map(w => `
                <div style="display:flex;justify-content:space-between;padding:1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:0.75rem; border-left: 4px solid ${w.isFinished ? '#94a3b8' : 'var(--success-text)'};">
                  <div style="display:flex;align-items:flex-start;gap:0.75rem;">
                    <div style="width:10px;height:10px;border-radius:50%;background:${w.isFinished ? '#94a3b8' : 'var(--success-text)'};box-shadow:0 0 5px ${w.isFinished ? 'transparent' : 'var(--success-text)'};margin-top:6px;"></div>
                    <div style="display:flex;flex-direction:column;">
                      <a href="javascript:void(0)" onclick="app.viewUserHistory('${w.id}', '${w.name.replace(/'/g, "\\'")}')" style="font-weight:600;color:var(--primary);text-decoration:none;font-size:0.95rem;">${w.name}</a>
                      <span style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.25rem;font-weight:500;">🎪 Feria: ${w.feria_name}</span>
                    </div>
                  </div>
                  <div style="color:var(--text-secondary);font-size:0.8125rem;text-align:right;">
                    <div style="font-weight:600; color:var(--success-text);">Entrada: ${w.entryTime}</div>
                    ${w.exitTime ? `<div style="font-weight:600; color:var(--error-text);">Salida: ${w.exitTime}</div>` : '<div style="font-style:italic; color:var(--warning-text);">Trabajando...</div>'}
                    ${w.latitude && w.longitude ? `<a href="https://www.google.com/maps?q=${w.latitude},${w.longitude}" target="_blank" style="color:var(--primary);text-decoration:none;display:inline-flex;align-items:center;margin-top:0.25rem; font-size:11px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:2px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>Ver GPS</a>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<div style="flex-grow:1;display:flex;align-items:center;justify-content:center;color:var(--text-muted);border:2px dashed #f1f5f9;border-radius:8px;">[ Gráfico Reservado ]</div>'}
        </div>
        <div class="card">
          <h3 style="font-size:1rem;margin-bottom:1rem;">Alertas Recientes</h3>
          <div style="display:flex;flex-direction:column;gap:1rem;">
            ${this.state.logs.map(log => `
              <div style="padding-bottom:0.75rem;border-bottom:1px solid #f8fafc;">
                <div style="font-size:0.8125rem;font-weight:600;">${log.action}</div>
                <div style="font-size:0.75rem;color:var(--text-secondary);">${log.user}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">${log.time}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
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
              <th>Usuario</th><th>Rol</th><th>Estado</th><th>Último Acceso</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${this.state.users.length === 0
              ? `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No hay usuarios todavía.</td></tr>`
              : this.state.users.map(u => this.renderUserRow(u)).join('')
            }
          </tbody>
        </table>
      </div>`;
  },

  renderUserRow(user) {
    const roleClass   = 'badge-' + user.role.toLowerCase();
    const statusClass = 'badge-' + user.status.toLowerCase();
    return `
      <tr>
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
        <td style="color:var(--text-secondary);">${user.lastAccess}</td>
        <td>
          <button class="btn btn-primary" title="Ver Historial, Horas y GPS" style="padding:0.4rem 0.8rem; font-size:0.75rem; margin-right:0.5rem;" onclick="app.viewUserHistory('${user.id}', '${user.name.replace(/'/g, "\\'")}')">
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
                <label>Trabajadores Asignados</label>
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
              <p style="font-size:0.875rem;color:var(--text-secondary);margin-bottom:1rem;">Selecciona quiénes tendrán acceso a esta feria en su calendario:</p>
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

app.init();
window.app = app; // Exponer app al objeto window para los gestores inline

// Logout
window.logout = async function() {
  await supabase.auth.signOut();
  window.location.href = '/login.html';
}

window.handlePunch = async function(type) {
  const btn = document.getElementById('btnPunchAction');
  if(btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }

  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización o está desactivada.");
    if(btn) { btn.disabled = false; btn.textContent = 'Reintentar'; }
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    const { error } = await supabase.from('time_logs').insert({
      user_id: currentUser.id,
      action_type: type,
      latitude: lat,
      longitude: lon
    });

    if (error) {
      alert("Error al fichar en base de datos: " + error.message);
      if(btn) { btn.disabled = false; btn.textContent = 'Reintentar'; }
    } else {
      await app.loadAttendanceData();
      app.renderView('attendance');
    }
  }, (err) => {
    alert("No se ha podido obtener tu ubicación GPS (necesario para fichar y verificar tu posición). Por favor da permiso a tu navegador.");
    if(btn) { btn.disabled = false; btn.textContent = 'Reintentar'; }
  });
};
a p p . h a n d l e I n i t ( ) ;  
 