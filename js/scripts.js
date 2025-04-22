const WORKER_URL = 'https://bate-ponto-web.ofc-rede.workers.dev';
const API_URL = 'https://bate-ponto.discloud.app';

function initiateDiscordLogin() {
    showNotification('Iniciando login com Discord...');
    window.location.href = `${API_URL}/auth/login`;
}

async function fetchUserData() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const response = await fetch(`${WORKER_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar usuário');
        const user = await response.json();
        document.getElementById('username').textContent = user.username;
        document.getElementById('discord_id').textContent = user.discord_id;
        document.getElementById('email').textContent = user.email || 'Não fornecido';
        document.getElementById('created_at').textContent = new Date(user.created_at).toLocaleDateString('pt-BR');
        document.getElementById('avatar').src = user.avatar ? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar}.png` : '/images/default-avatar.png';
        if (user.is_admin || user.is_server_admin) {
            document.getElementById('admin-link').style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        showNotification('Erro ao carregar perfil.', 'error');
        window.location.href = '/login.html';
    }
}

async function fetchPointsHistory() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
        const response = await fetch(`${WORKER_URL}/points`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar pontos');
        const points = await response.json();
        const tbody = document.getElementById('points-list');
        tbody.innerHTML = '';
        let totalHours = 0;
        points.forEach(point => {
            const duration = point.duration ? `${point.duration} horas` : '-';
            if (point.action === 'close' && point.duration) totalHours += point.duration;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(point.timestamp).toLocaleString('pt-BR')}</td>
                <td>${point.server_name}</td>
                <td>${point.action}</td>
                <td>${duration}</td>
            `;
            tbody.appendChild(tr);
        });
        document.getElementById('total-hours').textContent = `${totalHours.toFixed(2)} horas`;
    } catch (error) {
        console.error('Erro ao buscar histórico de pontos:', error);
        showNotification('Erro ao carregar histórico.', 'error');
    }
}

async function fetchUserServers() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
        const response = await fetch(`${WORKER_URL}/users/me/servers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar servidores');
        const servers = await response.json();
        const tbody = document.getElementById('servers-list');
        tbody.innerHTML = '';
        const select = document.getElementById('server-select');
        select.innerHTML = '<option value="">Selecione um servidor</option>';
        servers.forEach(server => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${server.name}</td>
                <td>${server.server_id}</td>
                <td>${server.role || 'Membro'}</td>
            `;
            tbody.appendChild(tr);
            const option = document.createElement('option');
            option.value = server.server_id;
            option.textContent = server.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar servidores:', error);
        showNotification('Erro ao carregar servidores.', 'error');
    }
}

async function fetchWeeklyRanking() {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
        const response = await fetch(`${WORKER_URL}/ranking/weekly`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao buscar ranking');
        const ranking = await response.json();
        const ul = document.getElementById('weekly-ranking');
        ul.innerHTML = '';
        ranking.forEach((user, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${user.username} - ${user.total_hours.toFixed(2)} horas`;
            ul.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        showNotification('Erro ao carregar ranking.', 'error');
    }
}

async function openPoint() {
    const token = localStorage.getItem('jwt_token');
    const serverId = document.getElementById('server-select').value;
    if (!token || !serverId) {
        showNotification('Selecione um servidor.', 'error');
        return;
    }

    try {
        const response = await fetch(`${WORKER_URL}/points`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ server_id: serverId, action: 'open' })
        });
        if (!response.ok) throw new Error('Falha ao abrir ponto');
        fetchPointsHistory();
        showNotification('Ponto aberto com sucesso!');
    } catch (error) {
        console.error('Erro ao abrir ponto:', error);
        showNotification('Erro ao abrir ponto.', 'error');
    }
}

async function pausePoint() {
    const token = localStorage.getItem('jwt_token');
    const serverId = document.getElementById('server-select').value;
    if (!token || !serverId) {
        showNotification('Selecione um servidor.', 'error');
        return;
    }

    try {
        const response = await fetch(`${WORKER_URL}/points`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ server_id: serverId, action: 'pause' })
        });
        if (!response.ok) throw new Error('Falha ao pausar ponto');
        fetchPointsHistory();
        showNotification('Ponto pausado com sucesso!');
    } catch (error) {
        console.error('Erro ao pausar ponto:', error);
        showNotification('Erro ao pausar ponto.', 'error');
    }
}

async function resumePoint() {
    const token = localStorage.getItem('jwt_token');
    const serverId = document.getElementById('server-select').value;
    if (!token || !serverId) {
        showNotification('Selecione um servidor.', 'error');
        return;
    }

    try {
        const response = await fetch(`${WORKER_URL}/points`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ server_id: serverId, action: 'resume' })
        });
        if (!response.ok) throw new Error('Falha ao retornar ponto');
        fetchPointsHistory();
        showNotification('Ponto retornado com sucesso!');
    } catch (error) {
        console.error('Erro ao retornar ponto:', error);
        showNotification('Erro ao retornar ponto.', 'error');
    }
}

async function closePoint() {
    const token = localStorage.getItem('jwt_token');
    const serverId = document.getElementById('server-select').value;
    if (!token || !serverId) {
        showNotification('Selecione um servidor.', 'error');
        return;
    }

    try {
        const response = await fetch(`${WORKER_URL}/points`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ server_id: serverId, action: 'close' })
        });
        if (!response.ok) throw new Error('Falha ao encerrar ponto');
        fetchPointsHistory();
        showNotification('Ponto encerrado com sucesso!');
    } catch (error) {
        console.error('Erro ao encerrar ponto:', error);
        showNotification('Erro ao encerrar ponto.', 'error');
    }
}

async function editProfile(event) {
    event.preventDefault();
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const username = document.getElementById('edit-username').value;
    const email = document.getElementById('edit-email').value;

    try {
        const response = await fetch(`${WORKER_URL}/users/me`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email })
        });
        if (!response.ok) throw new Error('Falha ao atualizar perfil');
        closeModal('edit-profile-modal');
        fetchUserData();
        showNotification('Perfil atualizado com sucesso!');
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        showNotification('Erro ao atualizar perfil.', 'error');
    }
}

async function fetchAdminData() {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // Pontos
        const pointsResponse = await fetch(`${WORKER_URL}/admin/points`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!pointsResponse.ok) throw new Error('Falha ao buscar pontos');
        const points = await pointsResponse.json();
        const pointsTbody = document.getElementById('points-list');
        pointsTbody.innerHTML = '';
        points.forEach(point => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(point.timestamp).toLocaleString('pt-BR')}</td>
                <td>${point.username}</td>
                <td>${point.server_name}</td>
                <td>${point.action}</td>
                <td>${point.duration ? point.duration + ' horas' : '-'}</td>
                <td><button class="btn btn-danger" onclick="deletePoint('${point._id}')">Excluir</button></td>
            `;
            pointsTbody.appendChild(tr);
        });

        // Servidores
        const serversResponse = await fetch(`${WORKER_URL}/admin/servers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!serversResponse.ok) throw new Error('Falha ao buscar servidores');
        const servers = await serversResponse.json();
        const serversTbody = document.getElementById('servers-list');
        serversTbody.innerHTML = '';
        const select = document.getElementById('points-server-filter');
        select.innerHTML = '<option value="">Todos os Servidores</option>';
        servers.forEach(server => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${server.name}</td>
                <td>${server.server_id}</td>
                <td>${server.owner_id}</td>
                <td>${server.admin_ids ? server.admin_ids.join(', ') : '-'}</td>
                <td>
                    <button class="btn btn-primary" onclick="openEditServerModal('${server.server_id}', '${server.name}', '${server.owner_id}', '${server.admin_ids}')">Editar</button>
                    <button class="btn btn-danger" onclick="deleteServer('${server.server_id}')">Excluir</button>
                </td>
            `;
            serversTbody.appendChild(tr);
            const option = document.createElement('option');
            option.value = server.server_id;
            option.textContent = server.name;
            select.appendChild(option);
        });

        // Usuários
        const usersResponse = await fetch(`${WORKER_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!usersResponse.ok) throw new Error('Falha ao buscar usuários');
        const users = await usersResponse.json();
        const usersTbody = document.getElementById('users-list');
        usersTbody.innerHTML = '';
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.discord_id}</td>
                <td>${user.email || '-'}</td>
                <td><button class="btn btn-danger" onclick="banUser('${user.discord_id}')">Banir</button></td>
            `;
            usersTbody.appendChild(tr);
        });

        // Estatísticas
        document.getElementById('total-points').textContent = points.length;
        document.getElementById('active-users').textContent = users.length;
        document.getElementById('total-servers').textContent = servers.length;

        // Filtros
        document.getElementById('search-points').addEventListener('input', (e) => filterTable('points-table', e.target.value));
        document.getElementById('search-servers').addEventListener('input', (e) => filterTable('servers-table', e.target.value));
        document.getElementById('search-users').addEventListener('input', (e) => filterTable('users-table', e.target.value));
        document.getElementById('points-server-filter').addEventListener('change', (e) => {
            const serverId = e.target.value;
            const rows = document.getElementById('points-list').querySelectorAll('tr');
            rows.forEach(row => {
                const serverCell = row.cells[2].textContent;
                row.style.display = serverId && !serverCell.includes(serverId) ? 'none' : '';
            });
        });
    } catch (error) {
        console.error('Erro ao buscar dados do admin:', error);
        showNotification('Erro ao carregar dados.', 'error');
    }
}

async function createServer(event) {
    event.preventDefault();
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const name = document.getElementById('server-name').value;
    const serverId = document.getElementById('server-id').value;
    const ownerId = document.getElementById('owner-id').value;
    const adminIds = document.getElementById('admin-ids').value.split(',').map(id => id.trim()).filter(id => id);

    try {
        const response = await fetch(`${WORKER_URL}/servers`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ server_id: serverId, name, owner_id: ownerId, admin_ids: adminIds })
        });
        if (!response.ok) throw new Error('Falha ao criar servidor');
        closeModal('create-server-modal');
        fetchAdminData();
        showNotification('Servidor criado com sucesso!');
    } catch (error) {
        console.error('Erro ao criar servidor:', error);
        showNotification('Erro ao criar servidor.', 'error');
    }
}

async function editServer(event) {
    event.preventDefault();
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    const serverId = document.getElementById('edit-server-id').value;
    const name = document.getElementById('edit-server-name').value;
    const ownerId = document.getElementById('edit-owner-id').value;
    const adminIds = document.getElementById('edit-admin-ids').value.split(',').map(id => id.trim()).filter(id => id);

    try {
        const response = await fetch(`${WORKER_URL}/servers/${serverId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, owner_id: ownerId, admin_ids: adminIds })
        });
        if (!response.ok) throw new Error('Falha ao editar servidor');
        closeModal('edit-server-modal');
        fetchAdminData();
        showNotification('Servidor editado com sucesso!');
    } catch (error) {
        console.error('Erro ao editar servidor:', error);
        showNotification('Erro ao editar servidor.', 'error');
    }
}

async function deleteServer(serverId) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    if (!confirm('Tem certeza que deseja excluir este servidor?')) return;

    try {
        const response = await fetch(`${WORKER_URL}/servers/${serverId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao excluir servidor');
        fetchAdminData();
        showNotification('Servidor excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir servidor:', error);
        showNotification('Erro ao excluir servidor.', 'error');
    }
}

async function deletePoint(pointId) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    if (!confirm('Tem certeza que deseja excluir este ponto?')) return;

    try {
        const response = await fetch(`${WORKER_URL}/points/${pointId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao excluir ponto');
        fetchAdminData();
        showNotification('Ponto excluído com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir ponto:', error);
        showNotification('Erro ao excluir ponto.', 'error');
    }
}

async function banUser(userId) {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    if (!confirm('Tem certeza que deseja banir este usuário?')) return;

    try {
        const response = await fetch(`${WORKER_URL}/users/${userId}/ban`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Falha ao banir usuário');
        fetchAdminData();
        showNotification('Usuário banido com sucesso!');
    } catch (error) {
        console.error('Erro ao banir usuário:', error);
        showNotification('Erro ao banir usuário.', 'error');
    }
}

function logout() {
    localStorage.removeItem('jwt_token');
    showNotification('Sessão encerrada.');
    window.location.href = '/login.html';
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function openEditProfileModal() {
    document.getElementById('edit-profile-modal').style.display = 'flex';
    document.getElementById('edit-profile-form').onsubmit = editProfile;
    const username = document.getElementById('username').textContent;
    const email = document.getElementById('email').textContent;
    document.getElementById('edit-username').value = username;
    document.getElementById('edit-email').value = email === 'Não fornecido' ? '' : email;
}

function openCreateServerModal() {
    document.getElementById('create-server-modal').style.display = 'flex';
    document.getElementById('create-server-form').onsubmit = createServer;
}

function openEditServerModal(serverId, name, ownerId, adminIds) {
    document.getElementById('edit-server-modal').style.display = 'flex';
    document.getElementById('edit-server-form').onsubmit = editServer;
    document.getElementById('edit-server-id').value = serverId;
    document.getElementById('edit-server-name').value = name;
    document.getElementById('edit-owner-id').value = ownerId;
    document.getElementById('edit-admin-ids').value = adminIds ? adminIds.join(', ') : '';
}

function openSettingsModal() {
    document.getElementById('settings-modal').style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function saveSettings() {
    const notificationsEnabled = document.getElementById('notifications-enabled').checked;
    localStorage.setItem('notifications', notificationsEnabled);
    showNotification('Configurações salvas!');
    closeModal('settings-modal');
}

function updateSEOMetaTags({ title, description, keywords }) {
    document.title = title;
    document.querySelector('meta[name="description"]').content = description;
    document.querySelector('meta[name="keywords"]').content = keywords;
    document.querySelector('meta[property="og:title"]').content = title;
    document.querySelector('meta[property="og:description"]').content = description;
}

function initializeThemeToggle() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    toggleBtn.textContent = currentTheme === 'dark' ? '🌙' : '☀';

    toggleBtn.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        toggleBtn.textContent = newTheme === 'dark' ? '🌙' : '☀';
    });
}

function sortTable(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const isAscending = table.dataset.sortDirection !== 'asc';
    table.dataset.sortDirection = isAscending ? 'asc' : 'desc';

    rows.sort((a, b) => {
        const aText = a.cells[columnIndex].textContent.toLowerCase();
        const bText = b.cells[columnIndex].textContent.toLowerCase();
        return isAscending ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });

    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

function filterTable(tableId, search) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll('tbody tr');
    search = search.toLowerCase();
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}

// Inicialização
if (window.location.pathname.includes('user_dashboard.html')) {
    fetchUserData();
    fetchPointsHistory();
    fetchUserServers();
    fetchWeeklyRanking();
} else if (window.location.pathname.includes('admin_dashboard.html')) {
    fetchAdminData();
}