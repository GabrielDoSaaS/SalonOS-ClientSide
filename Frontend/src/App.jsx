import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';
import './Styles.css';
import Auth from './Auth';
import Dashboard from './Dashboard';
import PublicBooking from './PublicBooking';

const API_BASE_URL = 'http://localhost:3000/api';

const App = () => {
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessageText, setConfirmMessageText] = useState('');
    const [confirmResolve, setConfirmResolve] = useState(null);
    const [currentUser, setCurrentUser] = useState(undefined);
    const [currentEstablishmentId, setCurrentEstablishmentId] = useState(null);
    const [currentEstablishmentPublicLink, setCurrentEstablishmentPublicLink] = useState(null);
    const [publicBookingEstablishmentId, setPublicBookingEstablishmentId] = useState(null);
    const [showAuthSection, setShowAuthSection] = useState(true);
    const [showPlansSection, setShowPlansSection] = useState(false);
    const [showDashboardSection, setShowDashboardSection] = useState(false);
    const [showPublicBookingSection, setShowPublicBookingSection] = useState(false);
    const [showPaymentStatusPage, setShowPaymentStatusPage] = useState(false);
    const [paymentStatusTitle, setPaymentStatusTitle] = useState('');
    const [paymentStatusMessageText, setPaymentStatusMessageText] = useState('');
    const [countdown, setCountdown] = useState(5);

    const showMessageBox = useCallback((text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }, []);

    const showCustomConfirm = useCallback((msg) => {
        setConfirmMessageText(msg);
        setShowConfirmModal(true);
        return new Promise((resolve) => {
            setConfirmResolve(() => resolve);
        });
    }, []);

    const handleConfirmResponse = (response) => {
        setShowConfirmModal(false);
        if (confirmResolve) {
            confirmResolve(response);
            setConfirmResolve(null);
        }
    };

    const showSection = useCallback((sectionName) => {
        setShowAuthSection(false);
        setShowDashboardSection(false);
        setShowPublicBookingSection(false);
        setShowPlansSection(false);
        setShowPaymentStatusPage(false);
        switch (sectionName) {
            case 'auth-section': setShowAuthSection(true); break;
            case 'dashboard-section': setShowDashboardSection(true); break;
            case 'public-booking-section': setShowPublicBookingSection(true); break;
            case 'plans-section': setShowPlansSection(true); break;
            case 'payment-status-page': setShowPaymentStatusPage(true); break;
            default: break;
        }
    }, []);

    const saveAuthData = useCallback((token, role, establishmentId, email, planoAtivo, dataExpiracaoPlano) => {
        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userRole', role);
        if (establishmentId) {
            localStorage.setItem('establishmentId', establishmentId);
        } else {
            localStorage.removeItem('establishmentId');
        }
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPlanoAtivo', planoAtivo);
        localStorage.setItem('userDataExpiracaoPlano', dataExpiracaoPlano);
        setCurrentUser({ token, role, establishmentId, email, planoAtivo, dataExpiracaoPlano });
        setCurrentEstablishmentId(establishmentId);
    }, []);

    const loadAuthData = useCallback(() => {
        const token = localStorage.getItem('jwtToken');
        const role = localStorage.getItem('userRole');
        const establishmentId = localStorage.getItem('establishmentId');
        const email = localStorage.getItem('userEmail');
        const planoAtivo = localStorage.getItem('userPlanoAtivo') === 'true';
        const dataExpiracaoPlano = localStorage.getItem('userDataExpiracaoPlano');
        if (token && role) {
            setCurrentUser({ token, role, establishmentId, email, planoAtivo, dataExpiracaoPlano });
            setCurrentEstablishmentId(establishmentId);
            return true;
        }
        setCurrentUser(null);
        setCurrentEstablishmentId(null);
        return false;
    }, []);

    const clearAuthData = useCallback(() => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('establishmentId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userPlanoAtivo');
        localStorage.removeItem('userDataExpiracaoPlano');
        setCurrentUser(null);
        setCurrentEstablishmentId(null);
        setCurrentEstablishmentPublicLink(null);
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const plano = urlParams.get('plano');
        const establishmentIdParam = urlParams.get('establishmentId');
        const status = urlParams.get('status');

        if (status) {
            const title = status === 'success' ? 'Pagamento Aprovado!' : 'Pagamento Cancelado!';
            const messageText = status === 'success' ? 'Seu pagamento foi aprovado com sucesso! A página será recarregada.' : 'O pagamento foi cancelado. A página será recarregada.';
            setPaymentStatusTitle(title);
            setPaymentStatusMessageText(messageText);
            showSection('payment-status-page');
            let timer = countdown;
            const interval = setInterval(() => {
                timer -= 1;
                setCountdown(timer);
                if (timer === 0) {
                    clearInterval(interval);
                    window.location.href = window.location.origin;
                }
            }, 1000);
            return;
        }

        if (token && plano) {
            try {
                const parts = token.split('.');
                const payload = JSON.parse(atob(parts[1]));
                const { id, role, email, planoAtivo, dataExpiracaoPlano } = payload;
                saveAuthData(token, role, id, email, planoAtivo, dataExpiracaoPlano);
                window.history.pushState({}, document.title, window.location.pathname);
            } catch (e) {
                console.error('Erro ao decodificar token:', e);
                clearAuthData();
                window.history.pushState({}, document.title, window.location.pathname);
            }
        }

        if (establishmentIdParam) {
            setPublicBookingEstablishmentId(establishmentIdParam);
            showSection('public-booking-section');
            setLoading(false);
        } else {
            if (loadAuthData()) {
                if (currentUser && currentUser.planoAtivo === false) {
                    showSection('plans-section');
                } else {
                    showSection('dashboard-section');
                }
            } else {
                showSection('auth-section');
            }
            setLoading(false);
        }
    }, [loadAuthData, saveAuthData, showSection, currentUser, countdown]);

    const handleLogout = useCallback(() => {
        clearAuthData();
        showSection('auth-section');
    }, [clearAuthData, showSection]);

    const handleAuthSuccess = useCallback((token, role, establishmentId, email, planoAtivo, dataExpiracaoPlano) => {
        saveAuthData(token, role, establishmentId, email, planoAtivo, dataExpiracaoPlano);
        if (planoAtivo) {
            showSection('dashboard-section');
        } else {
            showSection('plans-section');
        }
    }, [saveAuthData, showSection]);

    return (
        <>
            {message.text && (
                <div className={`message-box ${message.type}`}>
                    <span className="message-text">{message.text}</span>
                </div>
            )}
            {showConfirmModal && (
                <div className="modal flex">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => handleConfirmResponse(false)}>&times;</span>
                        <p className="confirm-message">{confirmMessageText}</p>
                        <div className="confirm-buttons">
                            <button className="confirm-btn confirm-yes-btn" onClick={() => handleConfirmResponse(true)}>Sim</button>
                            <button className="confirm-btn confirm-no-btn" onClick={() => handleConfirmResponse(false)}>Não</button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.main-flex-center { min-height: 100vh; display: flex; align-items: center; justify-content: center; }`}</style>
            <div className="main-flex-center">
                <div className="app-container">
                    {loading ? (
                        <div className="loading-spinner"><div className="spinner-animation"></div></div>
                    ) : (
                        <>
                            {showAuthSection && (
                                <Auth API_BASE_URL={API_BASE_URL} onAuthSuccess={handleAuthSuccess} showMessageBox={showMessageBox} />
                            )}
                            {showPlansSection && (
                                <div>
                                    <h2 className="plans-section-title">Escolha seu plano</h2>
                                    <p className="plans-description">
                                        Para começar, selecione um plano que se encaixe nas suas necessidades.
                                    </p>
                                    <div className="plan-cards-container">
                                        <div className="plan-card">
                                            <h3 className="plan-title">Plano Básico</h3>
                                            <p className="plan-price">Grátis<span>/mês</span></p>
                                            <ul className="plan-features">
                                                <li><i className="fas fa-check"></i> 1 funcionário</li>
                                                <li><i className="fas fa-check"></i> 50 agendamentos/mês</li>
                                                <li><i className="fas fa-check"></i> Página pública de agendamento</li>
                                            </ul>
                                            <button className="btn-action btn-purple">Selecionar</button>
                                        </div>
                                        <div className="plan-card">
                                            <h3 className="plan-title">Plano Profissional</h3>
                                            <p className="plan-price">R$49<span>/mês</span></p>
                                            <ul className="plan-features">
                                                <li><i className="fas fa-check"></i> Agendamentos ilimitados</li>
                                                <li><i className="fas fa-check"></i> Quantos funcionários quiser</li>
                                                <li><i className="fas fa-check"></i> Funcionalidades avançadas</li>
                                            </ul>
                                            <button className="btn-action btn-purple">Selecionar</button>
                                        </div>
                                    </div>
                                    <button className="logout-plans-btn" onClick={handleLogout}>Sair</button>
                                </div>
                            )}
                            {showDashboardSection && (
                                <Dashboard
                                    currentUser={currentUser}
                                    API_BASE_URL={API_BASE_URL}
                                    currentEstablishmentId={currentEstablishmentId}
                                    currentEstablishmentPublicLink={currentEstablishmentPublicLink}
                                    setCurrentEstablishmentPublicLink={setCurrentEstablishmentPublicLink}
                                    showMessageBox={showMessageBox}
                                    showCustomConfirm={showCustomConfirm}
                                    handleLogout={handleLogout}
                                />
                            )}
                            {showPublicBookingSection && (
                                <PublicBooking
                                    API_BASE_URL={API_BASE_URL}
                                    publicBookingEstablishmentId={publicBookingEstablishmentId}
                                    showMessageBox={showMessageBox}
                                    showSection={showSection}
                                    moment={moment}
                                />
                            )}
                            {showPaymentStatusPage && (
                                <div className="payment-status-page">
                                    <h1 className="payment-status-title">{paymentStatusTitle}</h1>
                                    <p className="payment-status-message">{paymentStatusMessageText}</p>
                                    <p className="countdown-text">Você será redirecionado em <span className="countdown-value">{countdown}</span> segundos.</p>
                                    <button className="btn-go-home" onClick={() => window.location.href = window.location.origin}>Ir para a Home</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default App;