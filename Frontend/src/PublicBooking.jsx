import React, { useState, useEffect, useCallback } from 'react';
import moment from 'moment';

const PublicBooking = ({ API_BASE_URL, publicBookingEstablishmentId, showMessageBox, showSection }) => {
    const [publicClientName, setPublicClientName] = useState('');
    const [publicClientPhone, setPublicClientPhone] = useState('');
    const [publicSelectedServices, setPublicSelectedServices] = useState([]);
    const [publicSelectedEmployee, setPublicSelectedEmployee] = useState('');
    const [publicAvailableTimes, setPublicAvailableTimes] = useState([]);
    const [publicSelectedTime, setPublicSelectedTime] = useState('');
    const [publicCurrentCalendarDate, setPublicCurrentCalendarDate] = useState(new Date());
    const [publicSelectedDate, setPublicSelectedDate] = useState('');
    const [publicEstablishmentDetails, setPublicEstablishmentDetails] = useState(null);
    const [publicEmployees, setPublicEmployees] = useState([]);
    const [publicServices, setPublicServices] = useState([]);

    const fetchPublicEstablishmentDetails = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/establishment/public/${publicBookingEstablishmentId}`);
            if (response.ok) {
                const data = await response.json();
                setPublicEstablishmentDetails(data);
                setPublicServices(data.services);
                setPublicEmployees(data.employees);
            } else {
                showMessageBox('Estabelecimento não encontrado.', 'error');
                showSection('auth-section');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
            showSection('auth-section');
        }
    }, [API_BASE_URL, publicBookingEstablishmentId, showMessageBox, showSection]);

    const handleDateChange = (date) => {
        setPublicSelectedDate(date);
        setPublicSelectedTime('');
    };

    const generateCalendarDays = (date) => {
        const startOfMonth = moment(date).startOf('month');
        const endOfMonth = moment(date).endOf('month');
        const startDay = moment(startOfMonth).startOf('week');
        const endDay = moment(endOfMonth).endOf('week');
        const days = [];
        let day = startDay.clone();
        while (day.isSameOrBefore(endDay, 'day')) {
            days.push(day.clone());
            day.add(1, 'day');
        }
        return days;
    };

    const fetchAvailableTimes = useCallback(async () => {
        if (!publicSelectedDate || !publicSelectedEmployee || publicSelectedServices.length === 0) {
            setPublicAvailableTimes([]);
            return;
        }

        const selectedDateFormatted = moment(publicSelectedDate).format('YYYY-MM-DD');
        const serviceIds = publicSelectedServices.join(',');

        try {
            const response = await fetch(`${API_BASE_URL}/booking/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    establishmentId: publicBookingEstablishmentId,
                    employeeId: publicSelectedEmployee,
                    serviceIds: publicSelectedServices,
                    date: selectedDateFormatted,
                })
            });
            if (response.ok) {
                const data = await response.json();
                setPublicAvailableTimes(data);
            } else {
                setPublicAvailableTimes([]);
            }
        } catch (error) {
            setPublicAvailableTimes([]);
            showMessageBox('Erro ao buscar horários disponíveis.', 'error');
        }
    }, [publicSelectedDate, publicSelectedEmployee, publicSelectedServices, API_BASE_URL, publicBookingEstablishmentId, showMessageBox]);

    const handleBookAppointment = async (e) => {
        e.preventDefault();

        if (!publicClientName || !publicClientPhone || !publicSelectedServices.length || !publicSelectedEmployee || !publicSelectedDate || !publicSelectedTime) {
            showMessageBox('Por favor, preencha todos os campos.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    establishmentId: publicBookingEstablishmentId,
                    clientName: publicClientName,
                    clientPhone: publicClientPhone,
                    serviceIds: publicSelectedServices,
                    employeeId: publicSelectedEmployee,
                    appointmentDateTime: moment(publicSelectedDate).format('YYYY-MM-DD') + ' ' + publicSelectedTime,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showMessageBox('Agendamento realizado com sucesso!', 'success');
                setPublicClientName('');
                setPublicClientPhone('');
                setPublicSelectedServices([]);
                setPublicSelectedEmployee('');
                setPublicSelectedDate('');
                setPublicSelectedTime('');
                setPublicAvailableTimes([]);
            } else {
                showMessageBox(data.message || 'Erro ao realizar agendamento.', 'error');
            }
        } catch (error) {
            showMessageBox('Erro de rede. Tente novamente.', 'error');
        }
    };

    useEffect(() => {
        if (publicBookingEstablishmentId) {
            fetchPublicEstablishmentDetails();
        }
    }, [publicBookingEstablishmentId, fetchPublicEstablishmentDetails]);

    useEffect(() => {
        fetchAvailableTimes();
    }, [publicSelectedDate, publicSelectedEmployee, publicSelectedServices, fetchAvailableTimes]);

    if (!publicEstablishmentDetails) return null;

    return (
        <section className="section-spacing">
            <h1 className="public-section-title">{publicEstablishmentDetails.name}</h1>
            <p className="public-section-description">{publicEstablishmentDetails.description}</p>
            <form className="form-spacing" onSubmit={handleBookAppointment}>
                <div className="public-form-group">
                    <label className="form-label">Seu Nome</label>
                    <input
                        type="text"
                        className="form-input"
                        value={publicClientName}
                        onChange={(e) => setPublicClientName(e.target.value)}
                        required
                    />
                </div>
                <div className="public-form-group">
                    <label className="form-label">Seu Telefone</label>
                    <input
                        type="tel"
                        className="form-input"
                        value={publicClientPhone}
                        onChange={(e) => setPublicClientPhone(e.target.value)}
                        required
                    />
                </div>
                <div className="public-form-group">
                    <label className="form-label">Serviço(s)</label>
                    <select
                        multiple
                        className="form-select public-services-select"
                        value={publicSelectedServices}
                        onChange={(e) => setPublicSelectedServices(Array.from(e.target.selectedOptions, option => option.value))}
                        required
                    >
                        {publicServices.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name} (R${service.price} - {service.duration} min)
                            </option>
                        ))}
                    </select>
                    <p className="public-select-info">Use Ctrl/Cmd para selecionar múltiplos serviços.</p>
                </div>
                <div className="public-form-group">
                    <label className="form-label">Funcionário</label>
                    <select
                        className="form-select"
                        value={publicSelectedEmployee}
                        onChange={(e) => setPublicSelectedEmployee(e.target.value)}
                        required
                    >
                        <option value="">Selecione um funcionário</option>
                        {publicEmployees.map(employee => (
                            <option key={employee.id} value={employee.id}>{employee.name}</option>
                        ))}
                    </select>
                </div>
                {publicSelectedServices.length > 0 && publicSelectedEmployee && (
                    <div className="public-calendar-wrapper">
                        <div className="calendar-header">
                            <button
                                type="button"
                                onClick={() => setPublicCurrentCalendarDate(moment(publicCurrentCalendarDate).subtract(1, 'month').toDate())}
                            >
                                Anterior
                            </button>
                            <h3 className="calendar-title">{moment(publicCurrentCalendarDate).format('MMMM YYYY')}</h3>
                            <button
                                type="button"
                                onClick={() => setPublicCurrentCalendarDate(moment(publicCurrentCalendarDate).add(1, 'month').toDate())}
                            >
                                Próximo
                            </button>
                        </div>
                        <div className="calendar-grid">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                <div key={day} className="day-name">{day}</div>
                            ))}
                            {generateCalendarDays(publicCurrentCalendarDate).map((day, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleDateChange(day.toDate())}
                                    disabled={day.isBefore(moment().startOf('day'))}
                                    className={`calendar-day 
                                        ${day.month() === moment(publicCurrentCalendarDate).month() ? 'current-month' : 'other-month'} 
                                        ${day.isSame(moment(publicSelectedDate), 'day') ? 'selected' : ''} 
                                        ${day.isSame(moment(), 'day') ? 'today' : ''}`}
                                >
                                    {day.date()}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {publicSelectedDate && (
                    <div className="time-slots-container">
                        {publicAvailableTimes.length > 0 ? (
                            publicAvailableTimes.map(timeSlot => (
                                <button
                                    key={timeSlot}
                                    type="button"
                                    className={`time-slot ${publicSelectedTime === timeSlot ? 'selected-time' : ''}`}
                                    onClick={() => setPublicSelectedTime(timeSlot)}
                                >
                                    {timeSlot}
                                </button>
                            ))
                        ) : (
                            <p>Nenhum horário disponível para a data selecionada.</p>
                        )}
                    </div>
                )}
                <button type="submit" className="btn-action btn-purple">Agendar Horário</button>
            </form>
        </section>
    );
};

export default PublicBooking;