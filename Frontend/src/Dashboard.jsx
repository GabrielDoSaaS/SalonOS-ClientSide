import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';

const Dashboard = ({ currentUser, API_BASE_URL, currentEstablishmentId, currentEstablishmentPublicLink, setCurrentEstablishmentPublicLink, showMessageBox, showCustomConfirm, handleLogout }) => {
    const [dashboardActiveContent, setDashboardActiveContent] = useState('profile-section');
    const [establishmentName, setEstablishmentName] = useState('');
    const [establishmentAddress, setEstablishmentAddress] = useState('');
    const [establishmentPhone, setEstablishmentPhone] = useState('');
    const [establishmentDescription, setEstablishmentDescription] = useState('');
    const [employeeName, setEmployeeName] = useState('');
    const [employeeEmail, setEmployeeEmail] = useState('');
    const [employeePhone, setEmployeePhone] = useState('');
    const [employees, setEmployees] = useState([]);
    const [availabilityEmployeeSelect, setAvailabilityEmployeeSelect] = useState('');
    const [employeeAvailabilityData, setEmployeeAvailabilityData] = useState({});
    const [employeesForAvailability, setEmployeesForAvailability] = useState([]);
    const [serviceName, setServiceName] = useState('');
    const [servicePrice, setServicePrice] = useState('');
    const [serviceDuration, setServiceDuration] = useState('');
    const [services, setServices] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const showDashboardContent = useCallback((contentName) => {
        setDashboardActiveContent(contentName);
    }, []);

    const fetchEstablishmentProfile = useCallback(async () => {
        if (!currentUser || !currentUser.establishmentId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/establishment/${currentUser.establishmentId}`, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEstablishmentName(data.name);
                setEstablishmentAddress(data.address);
                setEstablishmentPhone(data.phone);
                setEstablishmentDescription(data.description);
                setCurrentEstablishmentPublicLink(`${window.location.origin}?establishmentId=${currentUser.establishmentId}`);
            } else {
                showMessageBox('Erro ao carregar perfil do estabelecimento.', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede ao carregar perfil.', 'error');
        }
    }, [currentUser, API_BASE_URL, showMessageBox, setCurrentEstablishmentPublicLink]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/establishment/${currentUser.establishmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({ name: establishmentName, address: establishmentAddress, phone: establishmentPhone, description: establishmentDescription }),
            });
            if (response.ok) {
                showMessageBox('Perfil atualizado com sucesso!', 'success');
            } else {
                showMessageBox('Erro ao atualizar perfil.', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
        }
    };

    const fetchEmployees = useCallback(async () => {
        if (!currentUser || !currentUser.establishmentId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/establishment/${currentUser.establishmentId}/employees`, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEmployees(data);
                setEmployeesForAvailability(data);
                if (data.length > 0) {
                    setAvailabilityEmployeeSelect(data[0].id);
                }
            }
        } catch (error) {
            showMessageBox('Erro de rede ao carregar funcionários.', 'error');
        }
    }, [currentUser, API_BASE_URL, showMessageBox]);

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/establishment/${currentUser.establishmentId}/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({ name: employeeName, email: employeeEmail, phone: employeePhone }),
            });
            if (response.ok) {
                showMessageBox('Funcionário adicionado com sucesso!', 'success');
                setEmployeeName('');
                setEmployeeEmail('');
                setEmployeePhone('');
                fetchEmployees();
            } else {
                const data = await response.json();
                showMessageBox(data.message || 'Erro ao adicionar funcionário.', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        const confirmed = await showCustomConfirm('Tem certeza que deseja remover este funcionário?');
        if (!confirmed) return;
        try {
            const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            if (response.ok) {
                showMessageBox('Funcionário removido com sucesso!', 'success');
                fetchEmployees();
            } else {
                showMessageBox('Erro ao remover funcionário.', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
        }
    };

    const fetchEmployeeAvailability = useCallback(async (employeeId) => {
        if (!employeeId) {
            setEmployeeAvailabilityData({});
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/availability`, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const availability = data.reduce((acc, item) => ({
                    ...acc,
                    [item.dayOfWeek]: { start: item.startTime, end: item.endTime }
                }), {});
                setEmployeeAvailabilityData(availability);
            } else {
                setEmployeeAvailabilityData({});
            }
        } catch (error) {
            showMessageBox('Erro de rede ao carregar disponibilidade.', 'error');
        }
    }, [currentUser, API_BASE_URL, showMessageBox]);

    const handleUpdateAvailability = async (e) => {
        e.preventDefault();
        const availabilityArray = Object.entries(employeeAvailabilityData)
            .filter(([day, times]) => times.start && times.end)
            .map(([day, times]) => ({ dayOfWeek: parseInt(day), startTime: times.start, endTime: times.end }));

        try {
            const response = await fetch(`${API_BASE_URL}/employees/${availabilityEmployeeSelect}/availability`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify(availabilityArray),
            });
            if (response.ok) {
                showMessageBox('Disponibilidade atualizada com sucesso!', 'success');
            } else {
                showMessageBox('Erro ao atualizar disponibilidade.', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
        }
    };

    const fetchServices = useCallback(async () => {
        if (!currentUser || !currentUser.establishmentId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/establishment/${currentUser.establishmentId}/services`, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setServices(data);
            }
        } catch (error) {
            showMessageBox('Erro de rede ao carregar serviços.', 'error');
        }
    }, [currentUser, API_BASE_URL, showMessageBox]);

    const handleAddService = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/establishment/${currentUser.establishmentId}/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({ name: serviceName, price: servicePrice, duration: parseInt(serviceDuration) }),
            });
            if (response.ok) {
                showMessageBox('Serviço adicionado com sucesso!', 'success');
                setServiceName('');
                setServicePrice('');
                setServiceDuration('');
                fetchServices();
            } else {
                const data = await response.json();
                showMessageBox(data.message || 'Erro ao adicionar serviço.', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
        }
    };

    const handleDeleteService = async (serviceId) => {
        const confirmed = await showCustomConfirm('Tem certeza que deseja remover este serviço?');
        if (!confirmed) return;
        try {
            const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            if (response.ok) {
                showMessageBox('Serviço removido com sucesso!', 'success');
                fetchServices();
            } else {
                showMessageBox('Erro ao remover serviço.', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
        }
    };

    const fetchAppointments = useCallback(async () => {
        if (!currentUser || !currentUser.establishmentId) return;
        const url = currentUser.role === 'establishment' ? `${API_BASE_URL}/establishment/${currentUser.establishmentId}/appointments` : `${API_BASE_URL}/employee/${currentUser.id}/appointments`;
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAppointments(data);
            }
        } catch (error) {
            showMessageBox('Erro de rede ao carregar agendamentos.', 'error');
        }
    }, [currentUser, API_BASE_URL, showMessageBox]);

    const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) {
                showMessageBox('Status do agendamento atualizado!', 'success');
                fetchAppointments();
            } else {
                showMessageBox('Erro ao atualizar status do agendamento.', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
        }
    };

    useEffect(() => {
        if (currentUser && currentUser.establishmentId) {
            fetchEstablishmentProfile();
            fetchEmployees();
            fetchServices();
            fetchAppointments();
        } else if (currentUser && currentUser.role === 'employee') {
            fetchAppointments();
        }
    }, [currentUser, fetchEstablishmentProfile, fetchEmployees, fetchServices, fetchAppointments]);

    useEffect(() => {
        if (availabilityEmployeeSelect) {
            fetchEmployeeAvailability(availabilityEmployeeSelect);
        }
    }, [availabilityEmployeeSelect, fetchEmployeeAvailability]);

    return (
        <section className="section-spacing">
            <button className="dashboard-logout-btn" onClick={handleLogout}>Sair</button>
            <h1 className="dashboard-title">Dashboard</h1>
            {currentUser && currentUser.email && <p className="welcome-text">Olá, <span>{currentUser.email}</span>!</p>}
            {currentUser && currentUser.role && <p className="role-text">Função: <span>{currentUser.role}</span></p>}
            <nav className="dashboard-nav">
                {currentUser && currentUser.role === 'establishment' && (
                    <>
                        <button
                            onClick={() => showDashboardContent('profile-section')}
                            className={`dashboard-nav-btn ${dashboardActiveContent === 'profile-section' ? 'active' : ''}`}
                        >
                            Perfil
                        </button>
                        <button
                            onClick={() => showDashboardContent('employees-section')}
                            className={`dashboard-nav-btn ${dashboardActiveContent === 'employees-section' ? 'active' : ''}`}
                        >
                            Funcionários
                        </button>
                        <button
                            onClick={() => showDashboardContent('services-section')}
                            className={`dashboard-nav-btn ${dashboardActiveContent === 'services-section' ? 'active' : ''}`}
                        >
                            Serviços
                        </button>
                    </>
                )}
                <button
                    onClick={() => showDashboardContent('appointments-section')}
                    className={`dashboard-nav-btn ${dashboardActiveContent === 'appointments-section' ? 'active' : ''}`}
                >
                    Agendamentos
                </button>
            </nav>
            <div className="dashboard-content-section">
                {dashboardActiveContent === 'profile-section' && (
                    <div>
                        <h2 className="profile-section-title">Perfil do Estabelecimento</h2>
                        {currentEstablishmentPublicLink && (
                            <div className="public-link-display">
                                <span className="public-link-text">Link Público de Agendamento:</span>
                                <a href={currentEstablishmentPublicLink} className="public-link-value" target="_blank" rel="noopener noreferrer">
                                    {currentEstablishmentPublicLink}
                                </a>
                            </div>
                        )}
                        <form className="form-spacing" onSubmit={handleSaveProfile}>
                            <div>
                                <label className="form-label">Nome</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={establishmentName}
                                    onChange={(e) => setEstablishmentName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Endereço</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={establishmentAddress}
                                    onChange={(e) => setEstablishmentAddress(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Telefone</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={establishmentPhone}
                                    onChange={(e) => setEstablishmentPhone(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="form-label">Descrição</label>
                                <textarea
                                    className="form-textarea"
                                    value={establishmentDescription}
                                    onChange={(e) => setEstablishmentDescription(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn-action btn-green">Salvar Perfil</button>
                        </form>
                    </div>
                )}
                {dashboardActiveContent === 'employees-section' && (
                    <div>
                        <h2 className="employees-section-title">Gerenciar Funcionários</h2>
                        <div className="add-form-card">
                            <h3 className="add-form-title">Adicionar Novo Funcionário</h3>
                            <form className="form-spacing" onSubmit={handleAddEmployee}>
                                <div>
                                    <label className="form-label">Nome</label>
                                    <input type="text" className="form-input" value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="form-label">Telefone</label>
                                    <input type="tel" className="form-input" value={employeePhone} onChange={(e) => setEmployeePhone(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn-action btn-blue">Adicionar Funcionário</button>
                            </form>
                        </div>
                        <h3 className="employees-section-title">Lista de Funcionários</h3>
                        <div className="card-list-container">
                            {employees.length > 0 ? (
                                employees.map(emp => (
                                    <div key={emp.id} className="item-card">
                                        <div>
                                            <p className="item-name">{emp.name}</p>
                                            <p className="item-details">{emp.email} | {emp.phone}</p>
                                        </div>
                                        <div className="item-actions">
                                            <button className="btn-red btn-small" onClick={() => handleDeleteEmployee(emp.id)}>Remover</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>Nenhum funcionário cadastrado.</p>
                            )}
                        </div>
                        <h2 className="availability-section-title">Definir Disponibilidade</h2>
                        <form className="form-spacing" onSubmit={handleUpdateAvailability}>
                            <div>
                                <label className="form-label">Selecionar Funcionário</label>
                                <select
                                    className="form-select"
                                    value={availabilityEmployeeSelect}
                                    onChange={(e) => setAvailabilityEmployeeSelect(e.target.value)}
                                    required
                                >
                                    {employeesForAvailability.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((day, index) => (
                                    <div key={index} className="day-availability-item">
                                        <input
                                            type="checkbox"
                                            id={`day-${index}`}
                                            className="day-checkbox"
                                            checked={!!employeeAvailabilityData[index]}
                                            onChange={(e) => setEmployeeAvailabilityData(prev => ({
                                                ...prev,
                                                [index]: e.target.checked ? { start: '09:00', end: '18:00' } : undefined,
                                            }))}
                                        />
                                        <label htmlFor={`day-${index}`} className="day-label">{day}</label>
                                        <input
                                            type="time"
                                            className="time-input"
                                            value={employeeAvailabilityData[index]?.start || ''}
                                            onChange={(e) => setEmployeeAvailabilityData(prev => ({
                                                ...prev,
                                                [index]: { ...prev[index], start: e.target.value }
                                            }))}
                                            disabled={!employeeAvailabilityData[index]}
                                        />
                                        <span className="time-separator">às</span>
                                        <input
                                            type="time"
                                            className="time-input"
                                            value={employeeAvailabilityData[index]?.end || ''}
                                            onChange={(e) => setEmployeeAvailabilityData(prev => ({
                                                ...prev,
                                                [index]: { ...prev[index], end: e.target.value }
                                            }))}
                                            disabled={!employeeAvailabilityData[index]}
                                        />
                                    </div>
                                ))}
                            </div>
                            <button type="submit" className="btn-action btn-green">Salvar Disponibilidade</button>
                        </form>
                    </div>
                )}
                {dashboardActiveContent === 'services-section' && (
                    <div>
                        <h2 className="services-section-title">Gerenciar Serviços</h2>
                        <div className="add-form-card">
                            <h3 className="add-form-title">Adicionar Novo Serviço</h3>
                            <form className="form-spacing" onSubmit={handleAddService}>
                                <div>
                                    <label className="form-label">Nome do Serviço</label>
                                    <input type="text" className="form-input" value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="form-label">Preço</label>
                                    <input type="number" step="0.01" className="form-input" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="form-label">Duração (minutos)</label>
                                    <input type="number" className="form-input" value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn-action btn-blue">Adicionar Serviço</button>
                            </form>
                        </div>
                        <h3 className="services-section-title">Lista de Serviços</h3>
                        <div className="card-list-container">
                            {services.length > 0 ? (
                                services.map(service => (
                                    <div key={service.id} className="item-card">
                                        <div>
                                            <p className="item-name">{service.name}</p>
                                            <p className="item-details">R${service.price} - {service.duration} min</p>
                                        </div>
                                        <div className="item-actions">
                                            <button className="btn-red btn-small" onClick={() => handleDeleteService(service.id)}>Remover</button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>Nenhum serviço cadastrado.</p>
                            )}
                        </div>
                    </div>
                )}
                {dashboardActiveContent === 'appointments-section' && (
                    <div>
                        <h2 className="appointments-section-title">Meus Agendamentos</h2>
                        <div className="card-list-container">
                            {appointments.length > 0 ? (
                                appointments.map(appt => (
                                    <div key={appt.id} className="item-card">
                                        <div>
                                            <p className="item-name">
                                                {moment(appt.dateTime).format('DD/MM/YYYY [às] HH:mm')} - {appt.serviceName}
                                            </p>
                                            <p className="item-details">
                                                Cliente: {appt.clientName} ({appt.clientPhone}) | Funcionário: {appt.employeeName}
                                            </p>
                                            <div className="appointment-status-container">
                                                <p className={`appointment-status-text status-${appt.status}`}>{appt.status}</p>
                                                {currentUser && currentUser.role === 'establishment' && (
                                                    <select
                                                        className="status-select"
                                                        value={appt.status}
                                                        onChange={(e) => handleUpdateAppointmentStatus(appt.id, e.target.value)}
                                                    >
                                                        <option value="pending">Pendente</option>
                                                        <option value="confirmed">Confirmado</option>
                                                        <option value="completed">Concluído</option>
                                                        <option value="cancelled">Cancelado</option>
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>Nenhum agendamento encontrado.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Dashboard;