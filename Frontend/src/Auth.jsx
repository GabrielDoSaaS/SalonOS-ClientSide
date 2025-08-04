import React, { useState, useCallback } from 'react';

const Auth = ({ API_BASE_URL, onAuthSuccess, showMessageBox }) => {
    const [showLoginForm, setShowLoginForm] = useState(true);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerRole, setRegisterRole] = useState('establishment');
    const [registerEstablishmentId, setRegisterEstablishmentId] = useState('');

    const clearForms = useCallback(() => {
        setLoginEmail('');
        setLoginPassword('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterRole('establishment');
        setRegisterEstablishmentId('');
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });
            const data = await response.json();
            if (response.ok) {
                const { token, role, establishmentId, email, planoAtivo, dataExpiracaoPlano } = data;
                showMessageBox('Login realizado com sucesso!', 'success');
                onAuthSuccess(token, role, establishmentId, email, planoAtivo, dataExpiracaoPlano);
                clearForms();
            } else {
                showMessageBox(data.message || 'Erro ao fazer login', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registerEmail, password: registerPassword, role: registerRole, establishmentId: registerEstablishmentId }),
            });
            const data = await response.json();
            if (response.ok) {
                showMessageBox(data.message || 'Registro realizado com sucesso. Faça login para continuar.', 'success');
                setShowLoginForm(true);
                clearForms();
            } else {
                showMessageBox(data.message || 'Erro ao registrar.', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
        }
    };

    return (
        <section className="section-spacing">
            <h1 className="auth-section-title">Bem-vindo(a)</h1>
            <div className="auth-toggle-buttons">
                <button
                    className={`auth-toggle-btn ${showLoginForm ? 'active' : 'inactive'}`}
                    onClick={() => setShowLoginForm(true)}
                >
                    Entrar
                </button>
                <button
                    className={`auth-toggle-btn ${!showLoginForm ? 'active' : 'inactive'}`}
                    onClick={() => setShowLoginForm(false)}
                >
                    Registrar
                </button>
            </div>
            {showLoginForm ? (
                <form className="form-spacing" onSubmit={handleLogin}>
                    <div>
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-input"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-action btn-purple">Entrar</button>
                </form>
            ) : (
                <form className="form-spacing" onSubmit={handleRegister}>
                    <div>
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-input"
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="form-label">Função</label>
                        <select
                            className="form-select"
                            value={registerRole}
                            onChange={(e) => setRegisterRole(e.target.value)}
                        >
                            <option value="establishment">Estabelecimento</option>
                            <option value="employee">Funcionário</option>
                        </select>
                    </div>
                    {registerRole === 'employee' && (
                        <div>
                            <label className="form-label">ID do Estabelecimento</label>
                            <input
                                type="text"
                                className="form-input"
                                value={registerEstablishmentId}
                                onChange={(e) => setRegisterEstablishmentId(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <button type="submit" className="btn-action btn-purple">Registrar</button>
                </form>
            )}
        </section>
    );
};

export default Auth;