import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Load Tailwind CSS CDN explicitly for the Canvas environment
const TAILWIND_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');

    /* Load Tailwind Base, Components, and Utilities */
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    /* Base styling for the app */
    body {
        font-family: 'Inter', sans-serif;
    }

    /* Custom fix for the select/dropdown element */
    .custom-select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        padding-right: 2.5rem; /* Space for a custom arrow if needed */
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3 5 3-5m0 0H7' stroke='%234B5563' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 1.5em 1.5em;
    }
`;

// Icons from lucide-react (used inline to avoid external dependency issues)
const Home = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const Users = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const Zap = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const DollarSign = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const LogOut = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>;
const User = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const X = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const CheckCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const AlertTriangle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
const Edit = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
const Trash2 = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const Tag = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.586 12.586a2 2 0 1 0 2.828 2.828l3.172-3.172a2 2 0 0 0 0-2.828l-6-6a2 2 0 0 0-2.828 0L3 12v6a2 2 0 0 0 2 2h6l6-6Z"/><path d="M7 10h.01"/></svg>;
const Plus = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>;


// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Global Constants and API Setup ---
// const API_BASE_URL = "http://localhost:8000/api/";
const API_BASE_URL = "https://home-expense-manager-vgxi.onrender.com/api/";
const PAGES = {
    DASHBOARD: 'Dashboard',
    TENANTS: 'Tenants',
    READINGS: 'Electricity Readings',
    EXPENSES: 'Expenses',
    LOGIN: 'Login',
    REGISTER: 'Register',
};
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Creates an Axios instance with base URL and token.
 */
const getApiClient = (token) => {
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Token ${token}`;
    }

    const client = axios.create({
        baseURL: API_BASE_URL,
        headers: defaultHeaders,
        timeout: 10000,
    });

    // Handle 401 response globally
    client.interceptors.response.use(
        response => response,
        error => {
            if (error.response && error.response.status === 401) {
                // If unauthorized, redirect to login (or force logout)
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                // Use a standard location change to trigger re-render and redirect
                if (window.location.hash !== '#login') {
                    window.location.hash = '#login';  
                }
                
                // Note: The App component handles the redirection based on the cleared token.
            }
            return Promise.reject(error);
        }
    );

    return client;
};

// --- Toast Notification System ---

const Toast = ({ message, type, id, onClose }) => {
    const baseClasses = "flex items-center w-full max-w-xs p-4 mb-3 text-gray-900 bg-white rounded-lg shadow-xl transition-transform transform duration-300 ease-out";
    let icon, colorClasses;

    switch (type) {
        case 'success':
            icon = <CheckCircle className="w-5 h-5" />;
            colorClasses = 'text-green-600 bg-green-50 border-green-200';
            break;
        case 'error':
            icon = <AlertTriangle className="w-5 h-5" />;
            colorClasses = 'text-red-600 bg-red-50 border-red-200';
            break;
        case 'info':
        default:
            icon = <AlertTriangle className="w-5 h-5" />;
            colorClasses = 'text-blue-600 bg-blue-50 border-blue-200';
            break;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    return (
        <div className={`${baseClasses} translate-x-0 opacity-100 border ${colorClasses}`}>
            <div className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full`}>
                {icon}
            </div>
            <div className="ml-3 text-sm font-medium flex-grow">{message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-gray-400 hover:text-gray-900 rounded-lg p-1.5 hover:bg-gray-100 transition duration-150"
                onClick={() => onClose(id)}
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

const ToastContainer = ({ toasts, removeToast }) => (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
        {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
    </div>
);


// --- Custom Components (Shared UI) ---

const Card = ({ title, value, icon: Icon, color }) => (
    <div className={`p-5 rounded-xl shadow-lg border-b-4 ${color.border} bg-white transition duration-300 hover:shadow-xl`}>
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-full ${color.bg} ${color.text}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    </div>
);

const Section = ({ title, children, className = '' }) => (
    <div className={`bg-white p-5 sm:p-6 rounded-xl shadow-lg mb-6 ${className}`}>
        {title && <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h2>}
        {children}
    </div>
);

const InputField = ({ label, name, type = 'text', value, onChange, placeholder, required = false, disabled = false }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            value={value === null || value === undefined ? '' : value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 transition duration-150"
        />
    </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false, disabled = false }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={name}>
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            id={name}
            name={name}
            value={value === null || value === undefined ? '' : value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className="custom-select w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 transition duration-150"
        >
            <option value="" disabled>Select {label}</option>
            {options.map(option => (
                <option key={option.value} value={option.value} className="text-gray-900 bg-white">
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

const Button = ({ onClick, children, className = '', color = 'indigo', disabled = false, type = 'button', icon: Icon }) => {
    const baseClasses = "flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg shadow-md transition duration-150 ease-in-out focus:ring-4 focus:outline-none";
    let colorClasses = '';

    switch (color) {
        case 'red':
            colorClasses = 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-300';
            break;
        case 'green':
            colorClasses = 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-300';
            break;
        case 'gray':
            colorClasses = 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400';
            break;
        case 'indigo':
        default:
            colorClasses = 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-300';
            break;
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${colorClasses} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {Icon && <Icon className="w-5 h-5 mr-2" />}
            {children}
        </button>
    );
};

const Modal = ({ isOpen, title, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transition-all transform scale-100">
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition duration-150">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- Page Components ---

const LoginForm = ({ setToken, setUser, setCurrentPage, apiClient, addToast }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await apiClient.post('login/', credentials);
            const { token, username, is_superuser } = response.data;
            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify({ username, is_superuser }));
            setToken(token);
            setUser({ username, is_superuser });
            setCurrentPage(PAGES.DASHBOARD);
            addToast(`Welcome back, ${username}!`, 'success');
        } catch (err) {
            let errorMessage = 'Login failed. Please check your credentials.';
            if (err.response) {
                if (err.response.status === 400) {
                    errorMessage = err.response.data?.non_field_errors?.[0] || errorMessage;
                    errorMessage = err.response.data?.detail || errorMessage;
                } else if (err.response.status === 500) {
                    errorMessage = 'Server error during login. Please contact support.';
                }
            }
            setError(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full p-8 space-y-8 bg-white shadow-2xl rounded-xl">
                <h2 className="text-3xl font-extrabold text-gray-900 text-center">
                    Sign In to Home Manager
                </h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <InputField
                        label="Username"
                        name="username"
                        type="text"
                        value={credentials.username}
                        onChange={handleChange}
                        required
                    />
                    <InputField
                        label="Password"
                        name="password"
                        type="password"
                        value={credentials.password}
                        onChange={handleChange}
                        required
                    />
                    <div>
                        <Button type="submit" className="w-full">
                            Sign In
                        </Button>
                    </div>
                </form>
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button onClick={() => setCurrentPage(PAGES.REGISTER)} className="text-indigo-600 hover:text-indigo-500 font-medium transition duration-150">
                            Register Here
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

const RegisterForm = ({ setCurrentPage, apiClient, addToast }) => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await apiClient.post('register/', formData);
            
            const successMessage = 'Registration successful! Please log in.';
            setMessage(successMessage);
            addToast(successMessage, 'success');
            setTimeout(() => setCurrentPage(PAGES.LOGIN), 1500);
        } catch (err) {
            let errorMessage = 'Registration failed due to server error.';
            if (err.response?.data) {
                const data = err.response.data;
                const detailError = data.detail;
                
                if (detailError) {
                    errorMessage = detailError;
                } else {
                    // Handle DRF validation errors (e.g., username already exists)
                    errorMessage = "Registration failed due to validation errors:";
                    Object.keys(data).forEach(key => {
                        errorMessage += ` ${key}: ${data[key].join(' ')}`;
                    });
                }
            }
            setError(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full p-8 space-y-8 bg-white shadow-2xl rounded-xl">
                <h2 className="text-3xl font-extrabold text-gray-900 text-center">
                    Create New Account
                </h2>
                {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm mb-4">{message}</div>}
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <InputField
                        label="Username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <InputField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <InputField
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <div>
                        <Button type="submit" className="w-full">
                            Register
                        </Button>
                    </div>
                </form>
                <div className="text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <button onClick={() => setCurrentPage(PAGES.LOGIN)} className="text-indigo-600 hover:text-indigo-500 font-medium transition duration-150">
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- CRUD Forms ---

const TenantForm = ({ isLandlord, tenant, onSuccess, onClose, apiClient, addToast }) => {
    const isEditing = !!tenant;
    const initialForm = useMemo(() => tenant || {
        name: '', room_no: '', contact_no: '', joining_date: new Date().toISOString().split('T')[0], leaving_date: '', rent: ''
    }, [tenant]);
    
    // Ensure dates are in YYYY-MM-DD format for input
    const [formData, setFormData] = useState({
        ...initialForm,
        joining_date: initialForm.joining_date ? new Date(initialForm.joining_date).toISOString().split('T')[0] : '',
        leaving_date: initialForm.leaving_date ? new Date(initialForm.leaving_date).toISOString().split('T')[0] : '',
    });
    
    const [error, setError] = useState('');

    const handleChange = (e) => {
        let { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Prepare data for API: clear empty strings for null/blank fields
        const dataToSend = { ...formData };
        if (dataToSend.leaving_date === '') dataToSend.leaving_date = null;
        if (dataToSend.rent === '') dataToSend.rent = 0;

        try {
            if (isEditing) {
                await apiClient.put(`tenants/${tenant.id}/`, dataToSend);
                addToast(`Tenant ${formData.name} updated successfully.`, 'success');
            } else {
                await apiClient.post('tenants/', dataToSend);
                addToast(`New tenant ${formData.name} added successfully.`, 'success');
            }
            onSuccess();
            onClose();
        } catch (err) {
            const validationError = err.response?.data?.name?.[0] || err.response?.data?.room_no?.[0];
            const errorMessage = validationError || 'Failed to save tenant data.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Name" name="name" value={formData.name} onChange={handleChange} required disabled={!isLandlord} />
                <InputField label="Room No" name="room_no" value={formData.room_no} onChange={handleChange} required disabled={!isLandlord} />
                <InputField label="Contact No" name="contact_no" value={formData.contact_no} onChange={handleChange} required disabled={!isLandlord} />
                <InputField label="Rent (₹)" name="rent" type="number" value={formData.rent} onChange={handleChange} required disabled={!isLandlord} />
                <InputField label="Joining Date" name="joining_date" type="date" value={formData.joining_date} onChange={handleChange} required disabled={!isLandlord} />
                <InputField label="Leaving Date" name="leaving_date" type="date" value={formData.leaving_date} onChange={handleChange} disabled={!isLandlord} />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <Button color="gray" onClick={onClose}>Cancel</Button>
                {isLandlord && (
                    <Button type="submit" color="indigo">
                        {isEditing ? 'Update Tenant' : 'Add Tenant'}
                    </Button>
                )}
            </div>
        </form>
    );
};

const ReadingForm = ({ tenants, reading, onSuccess, onClose, apiClient, addToast, isLandlord, defaultTenant }) => {
    const isEditing = !!reading;
    const today = new Date();
    
    const initialForm = useMemo(() => reading || {
        tenant: defaultTenant || '', month: today.getMonth() + 1, year: today.getFullYear(),
        previous_reading: 0, current_reading: '', rate_per_unit: 9.00, is_paid: false
    }, [reading, defaultTenant]);

    const [formData, setFormData] = useState(initialForm);
    const [error, setError] = useState('');
    const [computedBill, setComputedBill] = useState(null);

    const tenantOptions = tenants.map(t => ({ value: t.id, label: `${t.name} (${t.room_no})` }));
    const monthOptions = MONTH_NAMES.map((name, index) => ({ value: index + 1, label: name }));
    const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: today.getFullYear() - 2 + i, label: today.getFullYear() - 2 + i }));

    // --- FIX 1: Use a single fetch function triggered by form changes ---
    const fetchLastReading = useCallback(async (currentTenant, currentMonth, currentYear) => {
        if (isEditing || !currentTenant || !currentMonth || !currentYear) return;
        
        try {
            // NOTE: We pass the CURRENT month/year. The backend logic finds the PRECEDING reading.
            const url = `readings/get_previous_reading/?tenant_id=${currentTenant}&year=${currentYear}&month=${currentMonth}`;
            const response = await apiClient.get(url);
            
            const prevReading = parseFloat(response.data.previous_reading);

            setFormData(prev => ({ 
                ...prev, 
                // Set the previous reading, and keep the current reading if the user has already entered it
                previous_reading: prevReading,
                current_reading: prev.current_reading || '' 
            }));
            
            // Provide feedback if a reading was found
            if (prevReading > 0) {
                 addToast(`Previous reading auto-filled: ${prevReading.toFixed(2)} units.`, 'info');
            } else {
                 addToast('No previous reading found for this period. Defaulting to 0.', 'info');
            }

        } catch (err) {
            console.error("Failed to fetch last reading:", err);
            // Default to 0 on API failure, but don't show an excessive error message
            setFormData(prev => ({ ...prev, previous_reading: 0 }));
            addToast('Error fetching previous reading. Defaulting to 0.', 'error');
        }
    }, [apiClient, isEditing, addToast]);
    // --- END FIX 1 ---

    // --- FIX 2: Trigger fetch on relevant formData changes ---
    useEffect(() => {
        // Only run on creation mode and when all required fields are available
        if (!isEditing && formData.tenant && formData.month && formData.year) {
            fetchLastReading(formData.tenant, formData.month, formData.year);
        }
    }, [formData.tenant, formData.month, formData.year, isEditing, fetchLastReading]);
    // --- END FIX 2 ---


    const handleChange = (e) => {
        let { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Calculate bill locally for display only (the backend handles final calculation)
    useEffect(() => {
        const prev = parseFloat(formData.previous_reading);
        const curr = parseFloat(formData.current_reading);
        const rate = parseFloat(formData.rate_per_unit);

        if (curr >= prev && rate > 0) {
            const units = curr - prev;
            setComputedBill((units * rate).toFixed(2));
        } else {
            setComputedBill(null);
        }
    }, [formData.previous_reading, formData.current_reading, formData.rate_per_unit]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Data cleaning
        const dataToSend = { ...formData };
        dataToSend.previous_reading = parseFloat(dataToSend.previous_reading);
        dataToSend.current_reading = parseFloat(dataToSend.current_reading);
        dataToSend.rate_per_unit = parseFloat(dataToSend.rate_per_unit);
        
        // Simple client-side validation check
        if (dataToSend.current_reading < dataToSend.previous_reading) {
             setError('Current reading cannot be less than the previous reading.');
             addToast('Current reading cannot be less than the previous reading.', 'error');
             return;
        }

        try {
            if (isEditing) {
                await apiClient.put(`readings/${reading.id}/`, dataToSend);
                addToast(`Reading for ${formData.month}/${formData.year} updated.`, 'success');
            } else {
                await apiClient.post('readings/', dataToSend);
                addToast(`New reading recorded successfully.`, 'success');
            }
            onSuccess();
            onClose();
        } catch (err) {
            const validationError = err.response?.data?.non_field_errors?.[0] || 'Check tenant, month, and year uniqueness.';
            const errorMessage = validationError || 'Failed to save electricity reading.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField label="Tenant" name="tenant" value={formData.tenant} onChange={handleChange} options={tenantOptions} required disabled={!isLandlord || isEditing} />
                <SelectField label="Month" name="month" value={formData.month} onChange={handleChange} options={monthOptions} required disabled={!isLandlord || isEditing} />
                <SelectField label="Year" name="year" value={formData.year} onChange={handleChange} options={yearOptions} required disabled={!isLandlord || isEditing} />
                
                <InputField label="Rate per Unit (₹)" name="rate_per_unit" type="number" step="0.01" value={formData.rate_per_unit} onChange={handleChange} required disabled={!isLandlord} />
                <InputField 
                    label="Previous Reading" 
                    name="previous_reading" 
                    type="number" 
                    step="0.01" 
                    value={formData.previous_reading} 
                    onChange={handleChange} 
                    required 
                    disabled={!isLandlord && !isEditing} 
                />
                <InputField label="Current Reading" name="current_reading" type="number" step="0.01" value={formData.current_reading} onChange={handleChange} required disabled={!isLandlord} />
                
                <div className="sm:col-span-2">
                    <p className="text-lg font-semibold text-gray-800 p-3 bg-indigo-50 rounded-lg shadow-sm">
                        Calculated Bill Estimate: {computedBill !== null ? `₹${computedBill}` : 'Enter Readings'}
                    </p>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <Button color="gray" onClick={onClose}>Cancel</Button>
                {isLandlord && (
                    <Button type="submit" color="indigo">
                        {isEditing ? 'Update Reading' : 'Add Reading'}
                    </Button>
                )}
            </div>
        </form>
    );
};

const ExpenseForm = ({ categories, expense, onSuccess, onClose, apiClient, addToast, isLandlord }) => {
    const isEditing = !!expense;
    const initialForm = useMemo(() => expense || {
        category: '', amount: '', date: new Date().toISOString().split('T')[0], description: ''
    }, [expense]);
    
    // Ensure date is in YYYY-MM-DD format for input
    const [formData, setFormData] = useState({
        ...initialForm,
        date: initialForm.date ? new Date(initialForm.date).toISOString().split('T')[0] : '',
    });
    const [error, setError] = useState('');

    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

    const handleChange = (e) => {
        let { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        const dataToSend = { ...formData };
        if (dataToSend.amount === '') dataToSend.amount = 0;
        
        try {
            if (isEditing) {
                await apiClient.put(`expenses/${expense.id}/`, dataToSend);
                addToast(`Expense updated successfully.`, 'success');
            } else {
                await apiClient.post('expenses/', dataToSend);
                addToast(`New expense added successfully.`, 'success');
            }
            onSuccess();
            onClose();
        } catch (err) {
            const errorMessage = 'Failed to save expense. Check data and category.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField label="Category" name="category" value={formData.category} onChange={handleChange} options={categoryOptions} required disabled={!isLandlord} />
                <InputField label="Amount (₹)" name="amount" type="number" step="0.01" value={formData.amount} onChange={handleChange} required disabled={!isLandlord} />
                <InputField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required disabled={!isLandlord} />
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={!isLandlord}
                    className="w-full px-3 py-2 border bg-white border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                ></textarea>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <Button color="gray" onClick={onClose}>Cancel</Button>
                {isLandlord && (
                    <Button type="submit" color="indigo">
                        {isEditing ? 'Update Expense' : 'Add Expense'}
                    </Button>
                )}
            </div>
        </form>
    );
};

// --- Page Implementations ---

const TenantsPage = ({ user, apiClient, addToast }) => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);

    const isLandlord = user.is_superuser;

    const fetchTenants = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('tenants/');
            setTenants(response.data);
        } catch (err) {
            setError('Failed to fetch tenants. Check connection and authentication.');
            addToast('Failed to fetch tenants.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiClient, addToast]);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    const handleEdit = (tenant) => {
        setSelectedTenant(tenant);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedTenant(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!isLandlord || !window.confirm("Are you sure you want to delete this tenant?")) return;
        try {
            await apiClient.delete(`tenants/${id}/`);
            fetchTenants();
            addToast('Tenant deleted successfully.', 'success');
        } catch (err) {
            const errorMessage = 'Failed to delete tenant. Check landlord privileges.';
            alert(errorMessage); // Using alert here for security confirmation flow
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 md:mb-8">Tenant Management</h1>
            
            <div className="mb-6 flex justify-end">
                {isLandlord && (
                    <Button onClick={handleCreate} icon={Plus}>
                        Add New Tenant
                    </Button>
                )}
            </div>

            <Section title="Current Tenants" className="overflow-x-auto">
                {loading && <p className="text-indigo-600">Loading tenants...</p>}
                {error && <p className="text-red-600">{error}</p>}
                
                {!loading && tenants.length > 0 && (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-indigo-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Room No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Rent (₹)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Joining Date</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-indigo-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tenants.map(tenant => (
                                <tr key={tenant.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tenant.room_no}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{parseFloat(tenant.rent).toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{tenant.joining_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center space-x-2">
                                        <Button onClick={() => handleEdit(tenant)} color="gray" className="p-2 h-auto" icon={Edit}>Edit</Button>
                                        {isLandlord && (
                                            <Button onClick={() => handleDelete(tenant.id)} color="red" className="p-2 h-auto" icon={Trash2}>Delete</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && tenants.length === 0 && <p className="text-gray-500">No tenants recorded.</p>}
            </Section>

            <Modal isOpen={isModalOpen} title={selectedTenant ? "Edit Tenant" : "Add New Tenant"} onClose={() => setIsModalOpen(false)}>
                <TenantForm 
                    isLandlord={isLandlord}
                    tenant={selectedTenant}
                    onSuccess={fetchTenants}
                    onClose={() => setIsModalOpen(false)}
                    apiClient={apiClient}
                    addToast={addToast}
                />
            </Modal>
        </div>
    );
};


const ReadingsPage = ({ user, apiClient, addToast }) => {
    const today = new Date();
    const [readings, setReadings] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterMonth, setFilterMonth] = useState(today.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(today.getFullYear());

    const isLandlord = user.is_superuser;

    const fetchReadingsAndTenants = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [readingsRes, tenantsRes] = await Promise.all([
                apiClient.get(`readings/?month=${filterMonth}&year=${filterYear}`),
                apiClient.get('tenants/')
            ]);
            setReadings(readingsRes.data.results || readingsRes.data); // Handle both paginated and non-paginated responses
            setTenants(tenantsRes.data);
        } catch (err) {
            setError('Failed to fetch data. Check connection and authentication.');
            addToast('Failed to fetch data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiClient, addToast, filterMonth, filterYear]);

    useEffect(() => {
        fetchReadingsAndTenants();
    }, [fetchReadingsAndTenants]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === 'month') setFilterMonth(parseInt(value));
        if (name === 'year') setFilterYear(parseInt(value));
    };

    const handleTogglePaid = async (reading) => {
        if (!isLandlord) return;
        try {
            const newStatus = !reading.is_paid;
            await apiClient.patch(`readings/${reading.id}/`, { is_paid: newStatus });
            // Optimistically update the list
            setReadings(prev => prev.map(r => r.id === reading.id ? { ...r, is_paid: newStatus } : r));
            addToast(`Payment status updated to ${newStatus ? 'Paid' : 'Unpaid'}.`, 'success');
        } catch (err) {
            addToast('Failed to update payment status.', 'error');
        }
    };
    
    const handleCreate = () => {
        setIsModalOpen(true);
    };

    const monthOptions = MONTH_NAMES.map((name, index) => ({ value: index + 1, label: name }));
    const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: today.getFullYear() - 2 + i, label: today.getFullYear() - 2 + i }));


    return (
        <div className="p-4 sm:p-6 md:p-8 w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 md:mb-8">Electricity Readings</h1>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div className="flex gap-4">
                    <SelectField 
                        label="Month" name="month" value={filterMonth} onChange={handleFilterChange} 
                        options={monthOptions} required className="w-full sm:w-auto"
                    />
                    <SelectField 
                        label="Year" name="year" value={filterYear} onChange={handleFilterChange} 
                        options={yearOptions} required className="w-full sm:w-auto"
                    />
                </div>
                {isLandlord && (
                    <Button onClick={handleCreate} icon={Plus}>
                        Add New Reading
                    </Button>
                )}
            </div>

            <Section title={`Readings for ${MONTH_NAMES[filterMonth - 1]} ${filterYear}`} className="overflow-x-auto">
                {loading && <p className="text-indigo-600">Loading readings...</p>}
                {error && <p className="text-red-600">{error}</p>}

                {!loading && readings.length > 0 && (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-indigo-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Tenant</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Units</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Bill (₹)</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-indigo-700 uppercase tracking-wider">Paid</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {readings.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.tenant_name} ({r.tenant_room_no})</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{r.total_units}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">₹{parseFloat(r.calculated_bill).toFixed(2)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-center">
                                        {isLandlord ? (
                                            <input
                                                type="checkbox"
                                                checked={r.is_paid}
                                                onChange={() => handleTogglePaid(r)}
                                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${r.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {r.is_paid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && readings.length === 0 && <p className="text-gray-500">No readings found for this period.</p>}
            </Section>

            <Modal isOpen={isModalOpen} title="Add New Electricity Reading" onClose={() => setIsModalOpen(false)}>
                <ReadingForm
                    isLandlord={isLandlord}
                    tenants={tenants}
                    defaultTenant={tenants.length > 0 ? tenants[0].id : ''} // Default to first tenant if available
                    onSuccess={fetchReadingsAndTenants}
                    onClose={() => setIsModalOpen(false)}
                    apiClient={apiClient}
                    addToast={addToast}
                />
            </Modal>
        </div>
    );
};

const ExpensesPage = ({ user, apiClient, addToast }) => {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);

    const isLandlord = user.is_superuser;

    const fetchExpensesAndCategories = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [expensesRes, categoriesRes] = await Promise.all([
                apiClient.get('expenses/'),
                apiClient.get('categories/')
            ]);
            setExpenses(expensesRes.data.results || expensesRes.data);
            setCategories(categoriesRes.data.results || categoriesRes.data);
        } catch (err) {
            setError('Failed to fetch data. Check connection and authentication.');
            addToast('Failed to fetch data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiClient, addToast]);

    useEffect(() => {
        fetchExpensesAndCategories();
    }, [fetchExpensesAndCategories]);

    const handleEdit = (expense) => {
        setSelectedExpense(expense);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedExpense(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!isLandlord || !window.confirm("Are you sure you want to delete this expense?")) return;
        try {
            await apiClient.delete(`expenses/${id}/`);
            fetchExpensesAndCategories();
            addToast('Expense deleted successfully.', 'success');
        } catch (err) {
            const errorMessage = 'Failed to delete expense. Check landlord privileges.';
            alert(errorMessage);
        }
    };


    return (
        <div className="p-4 sm:p-6 md:p-8 w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 md:mb-8">Household Expenses</h1>
            
            <div className="mb-6 flex justify-end">
                {isLandlord && (
                    <Button onClick={handleCreate} icon={Plus}>
                        Add New Expense
                    </Button>
                )}
            </div>

            <Section title="Expense Records" className="overflow-x-auto">
                {loading && <p className="text-indigo-600">Loading expenses...</p>}
                {error && <p className="text-red-600">{error}</p>}
                
                {!loading && expenses.length > 0 && (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-indigo-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Amount (₹)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-indigo-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{expense.category_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{parseFloat(expense.amount).toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">{expense.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center space-x-2">
                                        <Button onClick={() => handleEdit(expense)} color="gray" className="p-2 h-auto" icon={Edit}>Edit</Button>
                                        {isLandlord && (
                                            <Button onClick={() => handleDelete(expense.id)} color="red" className="p-2 h-auto" icon={Trash2}>Delete</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {!loading && expenses.length === 0 && <p className="text-gray-500">No expenses recorded.</p>}
            </Section>

            <Modal isOpen={isModalOpen} title={selectedExpense ? "Edit Expense" : "Add New Expense"} onClose={() => setIsModalOpen(false)}>
                <ExpenseForm 
                    isLandlord={isLandlord}
                    categories={categories}
                    expense={selectedExpense}
                    onSuccess={fetchExpensesAndCategories}
                    onClose={() => setIsModalOpen(false)}
                    apiClient={apiClient}
                    addToast={addToast}
                />
            </Modal>
        </div>
    );
};


const DashboardPage = ({ user, apiClient, addToast }) => {
    const today = new Date();
    const [summary, setSummary] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterMonth, setFilterMonth] = useState(today.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(today.getFullYear());

    const fetchSummaryAndData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [summaryRes, expensesRes, categoriesRes] = await Promise.all([
                apiClient.get(`monthly-summary/?month=${filterMonth}&year=${filterYear}`),
                apiClient.get(`expenses/?month=${filterMonth}&year=${filterYear}`),
                apiClient.get('categories/'),
            ]);
            
            setSummary(summaryRes.data);
            setExpenses(expensesRes.data.results || expensesRes.data);
            setCategories(categoriesRes.data.results || categoriesRes.data);
        } catch (err) {
            setError('Failed to fetch dashboard data. Check connection and filters.');
            addToast('Failed to load dashboard data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiClient, addToast, filterMonth, filterYear]);

    useEffect(() => {
        fetchSummaryAndData();
    }, [fetchSummaryAndData]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        if (name === 'month') setFilterMonth(parseInt(value));
        if (name === 'year') setFilterYear(parseInt(value));
    };

    const monthOptions = MONTH_NAMES.map((name, index) => ({ value: index + 1, label: name }));
    const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: today.getFullYear() - 2 + i, label: today.getFullYear() - 2 + i }));

    const formatCurrency = (amount) => `₹${parseFloat(amount || 0).toFixed(2)}`;

    // Group expenses by category name for breakdown table
    const expenseBreakdown = useMemo(() => {
        const categoryMap = categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {});
        const breakdown = expenses.reduce((acc, expense) => {
            const categoryName = categoryMap[expense.category] || 'Uncategorized';
            acc[categoryName] = (acc[categoryName] || 0) + parseFloat(expense.amount);
            return acc;
        }, {});
        return Object.entries(breakdown).map(([name, total]) => ({ name, total }));
    }, [expenses, categories]);


    if (loading) {
        return <div className="p-8 text-center text-indigo-600">Loading Financial Dashboard...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600 font-medium">{error}</div>;
    }
    
    // Fallback for summary data structure
    const tenantData = summary?.tenants || [];

    return (
        <div className="p-4 sm:p-6 md:p-8 w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 md:mb-8">Financial Dashboard</h1>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <SelectField 
                    label="Month" name="month" value={filterMonth} onChange={handleFilterChange} 
                    options={monthOptions} required className="w-full sm:w-auto"
                />
                <SelectField 
                    label="Year" name="year" value={filterYear} onChange={handleFilterChange} 
                    options={yearOptions} required className="w-full sm:w-auto"
                />
            </div>
            
            {/* Financial Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card 
                    title="Total Rent (Income)" 
                    value={formatCurrency(summary.total_rent)} 
                    icon={DollarSign} 
                    color={{ bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' }}
                />
                <Card 
                    title="Electricity (Cost)" 
                    value={formatCurrency(summary.total_electricity)} 
                    icon={Zap} 
                    color={{ bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-500' }}
                />
                <Card 
                    title="Other Expenses (Cost)" 
                    value={formatCurrency(summary.total_other_expenses)} 
                    icon={Tag} 
                    color={{ bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500' }}
                />
                <Card 
                    title="Net Balance" 
                    value={formatCurrency(summary.net_balance)} 
                    icon={Home} 
                    color={{ bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-500' }}
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Expense Breakdown */}
                <Section title="Expense Breakdown">
                    {expenseBreakdown.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {expenseBreakdown.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-indigo-50 font-semibold">
                                     <td className="px-6 py-3 whitespace-nowrap text-sm text-indigo-700">TOTAL EXPENSES</td>
                                     <td className="px-6 py-3 whitespace-nowrap text-sm text-indigo-700 text-right">{formatCurrency(summary.total_other_expenses)}</td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500">No expenses recorded for this period.</p>
                    )}
                </Section>
                
                {/* Tenant Electricity Bill Status */}
                <Section title="Tenant Electricity Bill Status" className="overflow-x-auto">
                    {tenantData.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bill (₹)</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tenantData.map((tenant, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.name}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{tenant.room_no}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700 text-right">{formatCurrency(tenant.bill)}</td>
                                        <td className="px-6 py-3 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tenant.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {tenant.is_paid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500">No electricity readings found for this period.</p>
                    )}
                </Section>
            </div>
        </div>
    );
};


// --- Main Application Component ---

const App = () => {
    // Inject Tailwind CDN link directly into a style tag
    // This is the most reliable way to ensure Tailwind works in a single-file React Canvas environment
    const styleElement = document.createElement('style');
    styleElement.innerHTML = TAILWIND_CSS;
    document.head.appendChild(styleElement);
    
    const initialToken = localStorage.getItem('authToken');
    const initialUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    const [token, setToken] = useState(initialToken);
    const [user, setUser] = useState(initialUser);
    const [currentPage, setCurrentPage] = useState(
        initialToken ? PAGES.DASHBOARD : PAGES.LOGIN
    );
    const [toasts, setToasts] = useState([]);
    
    // Create API client instance whenever the token changes
    const apiClient = useMemo(() => getApiClient(token), [token]);

    // Toast logic
    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Effect to check auth status and redirect
    useEffect(() => {
        const isAuthPage = currentPage === PAGES.LOGIN || currentPage === PAGES.REGISTER;

        if (token) {
            // User is authenticated: redirect them away from login/register
            if (isAuthPage) {
                setCurrentPage(PAGES.DASHBOARD);
            }
        } else {
            // User is NOT authenticated: redirect them to login ONLY if they are on a protected page.
            if (!isAuthPage) {
                setCurrentPage(PAGES.LOGIN);
            }
        }
    }, [token, currentPage]);

    const handleLogout = async () => {
        try {
            await apiClient.post('logout/');
        } catch (error) {
            // Logout often returns a 404 or 204, but we clear token regardless
            console.warn("Logout endpoint response anomaly, proceeding with client-side cleanup.", error);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            setToken(null);
            setUser(null);
            addToast('Successfully logged out.', 'info');
        }
    };

    const renderPage = () => {
        if (!token) {
            if (currentPage === PAGES.REGISTER) {
                return <RegisterForm setCurrentPage={setCurrentPage} apiClient={apiClient} addToast={addToast} />;
            }
            return <LoginForm setToken={setToken} setUser={setUser} setCurrentPage={setCurrentPage} apiClient={apiClient} addToast={addToast} />;
        }

        switch (currentPage) {
            case PAGES.DASHBOARD:
                return <DashboardPage user={user} apiClient={apiClient} addToast={addToast} />;
            case PAGES.TENANTS:
                return <TenantsPage user={user} apiClient={apiClient} addToast={addToast} />;
            case PAGES.READINGS:
                return <ReadingsPage user={user} apiClient={apiClient} addToast={addToast} />;
            case PAGES.EXPENSES:
                return <ExpensesPage user={user} apiClient={apiClient} addToast={addToast} />;
            default:
                return <DashboardPage user={user} apiClient={apiClient} addToast={addToast} />;
        }
    };

    const NavItem = ({ pageKey, icon: Icon, label }) => (
        <button
            onClick={() => setCurrentPage(pageKey)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition duration-150 ${
                currentPage === pageKey
                    ? 'bg-indigo-700 text-white shadow-md'
                    : 'text-indigo-200 hover:bg-indigo-700 hover:text-white'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
            <style>
                {/* Tailwind CSS CDN Load */}
                {`
                @import url('https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css');
                
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                /* Utility for focus ring on buttons/inputs */
                button:focus:not(:disabled), input:focus:not(:disabled), select:focus:not(:disabled) {
                    outline: 2px solid transparent;
                    outline-offset: 2px;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.4); /* Tailwind indigo-500 shadow */
                }
                /* Ensure tables on mobile are not too cramped */
                @media (max-width: 768px) {
                    th, td {
                        padding-left: 1rem !important;
                        padding-right: 1rem !important;
                    }
                }
                /* Hide default select arrow */
                .appearance-none {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                }
                /* Custom styling for select dropdown to ensure text visibility */
                select.text-black option {
                    color: #1f2937; /* Tailwind gray-800 or similar dark color */
                    background-color: #ffffff;
                }
                `}
            </style>
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {token && (
                <header className="bg-indigo-600 shadow-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
                            <h1 className="text-xl font-extrabold text-white">Home Manager</h1>
                            
                            <nav className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 md:gap-4">
                                <NavItem pageKey={PAGES.DASHBOARD} icon={Home} label="Dashboard" />
                                <NavItem pageKey={PAGES.TENANTS} icon={Users} label="Tenants" />
                                <NavItem pageKey={PAGES.READINGS} icon={Zap} label="Readings" />
                                <NavItem pageKey={PAGES.EXPENSES} icon={DollarSign} label="Expenses" />
                            </nav>
                            
                            <div className="flex items-center space-x-3">
                                {user && (
                                    <span className="text-white text-sm opacity-90 flex items-center space-x-1">
                                        <User className="w-4 h-4" />
                                        <span>{user.username} ({user.is_superuser ? 'Landlord' : 'Tenant'})</span>
                                    </span>
                                )}
                                <Button 
                                    onClick={handleLogout} 
                                    color="red" 
                                    className="p-2 h-auto !bg-red-500 hover:!bg-red-600 focus:ring-red-300" 
                                    icon={LogOut}
                                >
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            <main className="flex-grow max-w-7xl mx-auto w-full">
                {renderPage()}
            </main>
        </div>
    );
};

export default App;
