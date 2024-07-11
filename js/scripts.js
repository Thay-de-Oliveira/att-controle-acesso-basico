document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');

    const loginUser = async (email, password) => {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Login failed');
        }

        return await response.json();
    };

    const registerUser = async (name, phone, email, password, dashboard, reports) => {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, phone, email, password, dashboard, reports })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error registering user');
        }

        return await response.json();
    };

    const login = (user) => {
        console.log('Logged in user:', user);
        localStorage.setItem('userEmail', user.email); // Armazenar o email do usuário no localStorage
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await loginUser(email, password);
            login(data.user);
            loginMessage.classList.remove('d-none');
            loginMessage.classList.replace('alert-danger', 'alert-success');
            loginMessage.textContent = 'Login bem-sucedido';
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } catch (error) {
            loginMessage.classList.remove('d-none');
            loginMessage.classList.replace('alert-success', 'alert-danger');
            loginMessage.textContent = error.message || 'Erro no login';
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const dashboard = document.getElementById('dashboardPermission').checked;
        const reports = document.getElementById('reportsPermission').checked;

        try {
            const data = await registerUser(name, phone, email, password, dashboard, reports);
            registerMessage.classList.remove('d-none');
            registerMessage.classList.replace('alert-danger', 'alert-success');
            registerMessage.textContent = 'Registro realizado com sucesso';
            loadUsers(); // Carregar a lista de usuários após registrar um novo usuário
        } catch (error) {
            registerMessage.classList.remove('d-none');
            registerMessage.classList.replace('alert-success', 'alert-danger');
            registerMessage.textContent = error.message || 'Erro ao registrar usuário';
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }

    // Função para carregar a lista de usuários do banco de dados
    function loadUsers() {
        fetch('/get-users')
            .then(response => response.json())
            .then(users => {
                const userList = document.getElementById('userList');
                userList.innerHTML = '';
                users.forEach(user => {
                    const userItem = document.createElement('div');
                    userItem.classList.add('user-item', 'mb-2', 'p-2', 'border', 'rounded');
                    userItem.innerHTML = `
                        <p><strong>Nome:</strong> ${user.name}</p>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <div>
                            <input type="checkbox" class="form-check-input" id="dashboard_${user.id}" ${user.dashboard ? 'checked' : ''}>
                            <label class="form-check-label" for="dashboard_${user.id}">Ver Dashboard</label>
                        </div>
                        <div>
                            <input type="checkbox" class="form-check-input" id="reports_${user.id}" ${user.reports ? 'checked' : ''}>
                            <label class="form-check-label" for="reports_${user.id}">Ver Relatórios</label>
                        </div>
                        <button class="btn btn-primary btn-sm mt-2" onclick="saveUserPermission(${user.id})">Salvar Permissões</button>
                    `;
                    userList.appendChild(userItem);
                });
            })
            .catch(error => console.error('Erro ao carregar a lista de usuários:', error));
    }

    // Função para salvar permissões de um usuário específico
    function saveUserPermission(userId) {
        const dashboardPermission = document.getElementById(`dashboard_${userId}`).checked;
        const reportsPermission = document.getElementById(`reports_${userId}`).checked;

        fetch('/save-permissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id: userId, dashboard: dashboardPermission, reports: reportsPermission })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                alert('Permissões salvas com sucesso!');
            })
            .catch(error => console.error('Erro ao salvar permissões:', error));
    }

    // Carregar a lista de usuários ao carregar a página
    loadUsers();
});
