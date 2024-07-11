const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const app = express();
const port = 3000;

// Conectar ao MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // seu usuário do MySQL
    password: '', // sua senha do MySQL
    database: 'controleAcesso'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar com MySQL:', err.message);
        process.exit(1); // Sai do processo com código de erro
    }
    console.log('Conectado com sucesso ao MySQL');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve todos os arquivos estáticos na raiz do projeto
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Rota para servir a página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para servir a página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Rota para servir a página de admin
app.get('/admin', (req, res) => {
    if (req.session.user && req.session.user.email === 'admin@teste.com') {
        res.sendFile(path.join(__dirname, 'admin.html'));
    } else {
        res.status(403).send('Acesso negado');
    }
});

// Rota para servir a página de dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Rota para servir a página de relatórios
app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'reports.html'));
});

// Rota para registrar usuário
app.post('/register', (req, res) => {
    const { name, phone, email, password, dashboard, reports } = req.body;

    const sqlInsertUser = 'INSERT INTO users (name, phone, email, password) VALUES (?, ?, ?, ?)';
    db.query(sqlInsertUser, [name, phone, email, password], (err, result) => {
        if (err) {
            console.error('Erro ao registrar o usuário:', err.message);
            res.status(500).json({ error: 'Erro ao registrar o usuário' });
        } else {
            const userId = result.insertId; // ID do usuário recém-criado
            const sqlInsertPermissions = 'INSERT INTO permissions (user_id, dashboard, reports) VALUES (?, ?, ?)';
            db.query(sqlInsertPermissions, [userId, dashboard, reports], (err, result) => {
                if (err) {
                    console.error('Ops! Erro ao salvar permissões:', err.message);
                    res.status(500).json({ error: 'Erro ao salvar permissões' });
                } else {
                    console.log('Usuário e permissões registrados:', result);
                    res.status(200).json({ message: 'Usuário e permissões registrados com sucesso!!' });
                }
            });
        }
    });
});

// Rota para fazer login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('Error reading users:', err.message);
            res.status(500).json({ error: 'Error reading users' });
        } else if (results.length > 0) {
            const user = results[0];
            req.session.user = user; // Armazena o usuário na sessão
            console.log('User logged in:', user);
            res.status(200).json({ user: { email: user.email, name: user.name } });
        } else {
            console.warn('Ops! E-mail ou senha inválidos');
            res.status(401).json({ error: 'Ops!! E-mail ou senha inválidos' });
        }
    });
});

// Rota para salvar permissões
app.post('/save-permissions', (req, res) => {
    const { user_id, dashboard, reports } = req.body;
    const sql = 'REPLACE INTO permissions (user_id, dashboard, reports) VALUES (?, ?, ?)';
    db.query(sql, [user_id, dashboard, reports], (err, result) => {
        if (err) {
            console.error('Ops! Erro ao salvar permissões', err.message);
            res.status(500).json({ error: 'Ops! Erro ao salvar permissões' });
        } else {
            console.log('Permissões salvas!:', result);
            res.status(200).json({ message: 'Permissões salvas com sucesso' });
        }
    });
});

// Rota para carregar permissões
app.post('/get-permissions', (req, res) => {
    const { email } = req.body;
    const sql = 'SELECT p.dashboard, p.reports FROM users u LEFT JOIN permissions p ON u.id = p.user_id WHERE u.email = ?';
    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Ops! Erro ao salvar permissões:', err.message);
            res.status(500).json({ error: 'Ops! Erro ao salvar permissões' });
        } else {
            res.status(200).json(results[0]);
        }
    });
});

// Rota para verificar se o usuário é administrador
app.post('/check-admin', (req, res) => {
    if (req.session.user && req.session.user.email === 'admin@teste.com') {
        res.status(200).json({ isAdmin: true });
    } else {
        res.status(200).json({ isAdmin: false });
    }
});

// Rota para obter usuários
app.get('/get-users', (req, res) => {
    const sql = 'SELECT u.id, u.name, u.email, p.dashboard, p.reports FROM users u LEFT JOIN permissions p ON u.id = p.user_id';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Ops! Erro ao salvar o usuário:', err.message);
            res.status(500).json({ error: 'rro ao salvar o usuário' });
        } else {
            res.status(200).json(results);
        }
    });
});

app.get('/get-user-permissions', (req, res) => {
    const userEmail = req.session.user.email;
    const sql = `
        SELECT u.email, p.dashboard, p.reports
        FROM users u
        LEFT JOIN permissions p ON u.id = p.user_id
        WHERE u.email = ?
    `;
    db.query(sql, [userEmail], (err, results) => {
        if (err) {
            console.error('Ops! Erro ao salvar permissões:', err.message);
            res.status(500).json({ error: 'Ops! Erro ao salvar permissões' });
        } else if (results.length > 0) {
            const user = results[0];
            const isAdmin = user.email === 'admin@teste.com';
            res.status(200).json({ isAdmin, dashboard: user.dashboard, reports: user.reports });
        } else {
            res.status(404).json({ error: 'Ops!! Usuário não localizado' });
        }
    });
});


// Inicia o servidor
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
