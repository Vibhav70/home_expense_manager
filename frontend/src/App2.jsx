
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';


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
const Check = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const Minus = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/></svg>;

// --- Global Constants and API Setup ---
const API_BASE_URL = "http://localhost:8000/api/";
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
 * This simulates the logic of /src/api.js.
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
                console.error("401 Unauthorized - Token expired or invalid. Forcing logout.");
                // Forcing reload will trigger the App component to detect null token and show login
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.reload(); 
            }
            return Promise.reject(error);
        }
    );

    return client;
};


// --- Toast Notification System ---

const Toast = ({ message, type, id, onClose }) => {
    const baseClasses = "flex items-center w-full max-w-xs p-4 mb-4 text-gray-900 bg-white rounded-lg shadow-lg transition-transform transform duration-300 ease-out";
    let icon, colorClasses;

    switch (type) {
        case 'success':
            icon = <CheckCircle className="w-5 h-5" />;
            colorClasses = 'text-green-500 bg-green-100';
            break;
        case 'error':
            icon = <AlertTriangle className="w-5 h-5" />;
            colorClasses = 'text-red-500 bg-red-100';
            break;
        case 'info':
        default:
            icon = <AlertTriangle className="w-5 h-5" />;
            colorClasses = 'text-blue-500 bg-blue-100';
            break;
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    return (
        <div className={`${baseClasses} translate-x-0 opacity-100`}>
            <div className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full ${colorClasses}`}>
                {icon}
            </div>
            <div className="ml-3 text-sm font-normal flex-grow">{message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8"
                onClick={() => onClose(id)}
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

const ToastContainer = ({ toasts, removeToast }) => (
    <div className="fixed top-4 right-4 z-50">
        {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
    </div>
);


// --- Custom Components (Shared UI) ---

const Card = ({ title, value, icon: Icon, color }) => (
    <div className={`p-6 rounded-xl shadow-xl border-b-4 ${color.border} bg-white transition duration-300 hover:shadow-2xl`}>
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <div className={`p-4 rounded-full ${color.bg} ${color.text}`}>
                <Icon className="w-7 h-7" />
            </div>
        </div>
    </div>
);

const Section = ({ title, children, className = '' }) => (
    <div className={`bg-white p-6 md:p-7 rounded-xl shadow-xl mb-6 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h2>
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
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
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
            value={value || ''}
            onChange={onChange}
            required={required}
            disabled={disabled}
            // FIX: Added text-black and appearance-none for consistent styling and text visibility
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white disabled:bg-gray-100 appearance-none text-black"
        >
            <option value="" disabled>Select {label}</option>
            {options.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    </div>
);

const Button = ({ onClick, children, className = '', color = 'indigo', disabled = false, type = 'button' }) => {
    const baseClasses = "px-5 py-2.5 text-sm font-medium rounded-lg shadow-md transition duration-150 ease-in-out";
    let colorClasses = '';

    switch (color) {
        case 'red':
            colorClasses = 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
            break;
        case 'green':
            colorClasses = 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500';
            break;
        case 'gray':
            colorClasses = 'bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-400';
            break;
        case 'indigo':
        default:
            colorClasses = 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500';
            break;
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${colorClasses} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {children}
        </button>
    );
};

const Modal = ({ isOpen, title, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 sm:p-6">
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
            const errorMessage = err.response?.data?.detail || 'Login failed. Check username and password.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full p-8 space-y-8 bg-white shadow-2xl rounded-xl">
                <h2 className="text-2xl font-extrabold text-gray-900 text-center">
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
                        <button onClick={() => setCurrentPage(PAGES.REGISTER)} className="text-indigo-600 hover:text-indigo-500 font-medium">
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
            console.error("Registration failed:", err.response?.data);
            
            let errorMessage = 'Registration failed due to validation errors.';
            if (err.response?.data) {
                // Handle DRF validation errors (e.g., username already exists)
                const errors = [];
                Object.keys(err.response.data).forEach(key => {
                    errors.push(`${key}: ${err.response.data[key].join(' ')}`);
                });
                errorMessage = `Registration failed: ${errors.join('; ')}`;
            } else if (err.response?.data?.detail) {
                 errorMessage = err.response.data.detail;
            } else {
                 errorMessage = 'Registration failed. Check network connection.';
            }

            setError(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full p-8 space-y-8 bg-white shadow-2xl rounded-xl">
                <h2 className="text-2xl font-extrabold text-gray-900 text-center">
                    Create Tenant Account
                </h2>
                {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-sm">{message}</div>}
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
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
                        <button onClick={() => setCurrentPage(PAGES.LOGIN)} className="text-indigo-600 hover:text-indigo-500 font-medium">
                            Sign In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

const TenantForm = ({ isLandlord, tenant, onSuccess, onClose, apiClient, addToast }) => {
    const isEditing = !!tenant;
    const initialForm = tenant || {
        name: '', room_no: '', contact_no: '', joining_date: '', leaving_date: '', rent: ''
    };
    const [formData, setFormData] = useState(initialForm);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        let { name, value } = e.target;
        // Simple type conversion for rent
        if (name === 'rent') {
            value = value.replace(/[^0-9.]/g, '');
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isEditing) {
                await apiClient.put(`tenants/${tenant.id}/`, formData);
                addToast(`Tenant ${formData.name} updated successfully.`, 'success');
            } else {
                await apiClient.post('tenants/', formData);
                addToast(`New tenant ${formData.name} added successfully.`, 'success');
            }
            onSuccess();
            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.name || 'Failed to save tenant data. Check inputs.';
            setError(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            alert(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
                <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
                {isLandlord && (
                    <Button onClick={handleCreate} color="indigo">
                        Add New Tenant
                    </Button>
                )}
            </div>

            {loading && <div className="text-center text-indigo-600">Loading tenants...</div>}
            {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

            <div className="overflow-x-auto bg-white rounded-xl shadow-xl">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-indigo-50">
                        <tr>
                            {['Name', 'Room', 'Contact', 'Rent (₹)', 'Joined', 'Left', 'Actions'].map(header => (
                                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider md:px-6 md:py-4">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {tenants.map((tenant) => (
                            <tr key={tenant.id} className="hover:bg-indigo-50 transition duration-100">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 md:px-6 md:py-4">{tenant.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 md:px-6 md:py-4">{tenant.room_no}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 md:px-6 md:py-4">{tenant.contact_no}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-green-700 font-bold md:px-6 md:py-4">{tenant.rent}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 md:px-6 md:py-4">{tenant.joining_date}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 md:px-6 md:py-4">{tenant.leaving_date || 'N/A'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium md:px-6 md:py-4">
                                    <div className="flex space-x-2">
                                        <Button onClick={() => handleEdit(tenant)} color="gray">View/Edit</Button>
                                        {isLandlord && (
                                            <Button onClick={() => handleDelete(tenant.id)} color="red">Delete</Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                title={selectedTenant ? 'Edit Tenant' : 'Add New Tenant'}
                onClose={() => setIsModalOpen(false)}
            >
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
    const [readings, setReadings] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReading, setSelectedReading] = useState(null);

    const isLandlord = user.is_superuser;

    const fetchReadings = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const readingsResp = await apiClient.get('readings/');
            const tenantsResp = await apiClient.get('tenants/');
            setReadings(readingsResp.data);
            setTenants(tenantsResp.data);
        } catch (err) {
            setError('Failed to fetch data. Please check connection and permissions.');
            addToast('Failed to fetch readings.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiClient, addToast]);

    useEffect(() => {
        fetchReadings();
    }, [fetchReadings]);

    const tenantOptions = useMemo(() => tenants.map(t => ({ value: t.id, label: `${t.name} (${t.room_no})` })), [tenants]);

    const handleCreate = () => {
        setSelectedReading(null);
        setIsModalOpen(true);
    };

    const handleEdit = (reading) => {
        setSelectedReading(reading);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!isLandlord || !window.confirm("Confirm deletion of this reading?")) return;
        try {
            await apiClient.delete(`readings/${id}/`);
            fetchReadings();
            addToast('Reading deleted successfully.', 'success');
        } catch (err) {
            const errorMessage = 'Failed to delete reading. Check landlord privileges.';
            alert(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    const handleTogglePaid = async (reading) => {
        if (!isLandlord) {
            addToast("Only the landlord can update payment status.", 'error');
            return;
        }

        const newStatus = !reading.is_paid;
        try {
            // Only update the is_paid field
            await apiClient.patch(`readings/${reading.id}/`, { is_paid: newStatus });
            
            // Optimistically update UI before full fetch to improve responsiveness
            setReadings(prev => prev.map(r => r.id === reading.id ? { ...r, is_paid: newStatus } : r));
            
            addToast(`Bill for ${reading.tenant_name} marked as ${newStatus ? 'Paid' : 'Unpaid'}.`, 'success');
        } catch (err) {
            addToast('Failed to update payment status.', 'error');
            // Re-fetch on failure to correct optimistic update
            fetchReadings();
        }
    };

    const ReadingForm = ({ reading, onSuccess, onClose }) => {
        const isEditing = !!reading;
        // Ensure month and year are stored as numbers for proper comparison
        const initialForm = reading ? { ...reading, tenant: reading.tenant.id } : {
            tenant: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
            previous_reading: '', current_reading: '', rate_per_unit: '', is_paid: false
        };
        const [formData, setFormData] = useState(initialForm);
        const [formError, setFormError] = useState('');

        const totalUnits = (parseFloat(formData.current_reading) || 0) - (parseFloat(formData.previous_reading) || 0);
        const estimatedBill = totalUnits > 0 ? totalUnits * (parseFloat(formData.rate_per_unit) || 0) : 0;


        const handleChange = (e) => {
            const { name, value, type, checked } = e.target;
            let finalValue = value;
            if (type === 'number') finalValue = parseFloat(value) || '';

            setFormData({ ...formData, [name]: type === 'checkbox' ? checked : finalValue });
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            setFormError('');
            try {
                // Prepare submission data, ensure month/year are numbers if they came from select
                const submissionData = {
                    ...formData,
                    month: parseInt(formData.month),
                    year: parseInt(formData.year),
                    tenant: formData.tenant,
                };
                
                if (isEditing) {
                    await apiClient.put(`readings/${reading.id}/`, submissionData);
                    addToast('Electricity reading updated.', 'success');
                } else {
                    await apiClient.post('readings/', submissionData);
                    addToast('New electricity reading added.', 'success');
                }
                onSuccess();
                onClose();
            } catch (err) {
                let errorMessage = 'Failed to save reading.';
                if (err.response?.data?.non_field_errors) {
                    // Unique constraint error from backend
                    errorMessage = err.response.data.non_field_errors[0];
                } else if (err.response?.data) {
                    errorMessage += ': ' + Object.values(err.response.data).map(e => e.join(' ')).join('; ');
                }
                setFormError(errorMessage);
                addToast(errorMessage, 'error');
            }
        };

        const monthOptions = MONTH_NAMES.map((name, index) => ({ value: index + 1, label: name }));
        const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: new Date().getFullYear() - 2 + i, label: String(new Date().getFullYear() - 2 + i) }));

        return (
            <form onSubmit={handleSubmit}>
                {formError && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{formError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField label="Tenant" name="tenant" value={formData.tenant} onChange={handleChange} required options={tenantOptions} disabled={isEditing || !isLandlord} />
                    <SelectField label="Month" name="month" value={formData.month} onChange={handleChange} required options={monthOptions} disabled={!isLandlord} />
                    <SelectField label="Year" name="year" value={formData.year} onChange={handleChange} required options={yearOptions} disabled={!isLandlord} />
                    <InputField label="Rate per Unit (₹)" name="rate_per_unit" type="number" value={formData.rate_per_unit} onChange={handleChange} required disabled={!isLandlord} />
                    <InputField label="Previous Reading" name="previous_reading" type="number" value={formData.previous_reading} onChange={handleChange} required disabled={!isLandlord} />
                    <InputField label="Current Reading" name="current_reading" type="number" value={formData.current_reading} onChange={handleChange} required disabled={!isLandlord} />
                </div>

                <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Calculated Units: <span className="font-bold text-indigo-700">{totalUnits.toFixed(2)}</span></p>
                    <p className="text-sm font-medium text-gray-700">Estimated Bill: <span className="font-bold text-red-700">₹{estimatedBill.toFixed(2)}</span></p>
                </div>

                <div className="flex items-center mt-4">
                    <input id="is_paid" name="is_paid" type="checkbox" checked={formData.is_paid} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" disabled={!isLandlord} />
                    <label htmlFor="is_paid" className="ml-2 block text-sm text-gray-900 font-medium">
                        Mark as Paid
                    </label>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <Button color="gray" onClick={onClose}>Close</Button>
                    {isLandlord && (
                        <Button type="submit" color="indigo">
                            {isEditing ? 'Update Reading' : 'Add Reading'}
                        </Button>
                    )}
                </div>
            </form>
        );
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
                <h1 className="text-2xl font-bold text-gray-900">Electricity Readings</h1>
                {isLandlord && (
                    <Button onClick={handleCreate} color="indigo">
                        Add New Reading
                    </Button>
                )}
            </div>

            {loading && <div className="text-center text-indigo-600">Loading readings...</div>}
            {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

            <div className="overflow-x-auto bg-white rounded-xl shadow-xl">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-indigo-50">
                        <tr>
                            {['Tenant', 'Month/Year', 'Units', 'Bill (₹)', 'Paid', 'Actions'].map(header => (
                                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider md:px-6 md:py-4">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {readings.map((reading) => (
                            <tr key={reading.id} className="hover:bg-indigo-50 transition duration-100">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 md:px-6 md:py-4">{reading.tenant_name} ({reading.tenant_room_no})</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 md:px-6 md:py-4">{reading.month}/{reading.year}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-700 font-semibold md:px-6 md:py-4">{reading.total_units}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-red-700 font-semibold md:px-6 md:py-4">{reading.calculated_bill}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm md:px-6 md:py-4">
                                    <input
                                        type="checkbox"
                                        checked={reading.is_paid}
                                        onChange={() => handleTogglePaid(reading)}
                                        className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        disabled={!isLandlord}
                                    />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium md:px-6 md:py-4">
                                    <div className="flex space-x-2">
                                        <Button onClick={() => handleEdit(reading)} color="gray">View/Edit</Button>
                                        {isLandlord && (
                                            <Button onClick={() => handleDelete(reading.id)} color="red">Delete</Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                title={selectedReading ? 'Edit Electricity Reading' : 'Add New Reading'}
                onClose={() => setIsModalOpen(false)}
            >
                <ReadingForm
                    reading={selectedReading}
                    onSuccess={fetchReadings}
                    onClose={() => setIsModalOpen(false)}
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
    const [filter, setFilter] = useState({ month: '', year: '' });

    const isLandlord = user.is_superuser;

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const expenseResp = await apiClient.get('expenses/', { params: filter });
            const categoryResp = await apiClient.get('categories/');
            setExpenses(expenseResp.data);
            setCategories(categoryResp.data);
        } catch (err) {
            setError('Failed to fetch expenses or categories. Please check connection and permissions.');
            addToast('Failed to fetch expenses.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiClient, filter, addToast]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
    };

    const handleEdit = (expense) => {
        setSelectedExpense(expense);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedExpense(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!isLandlord || !window.confirm("Confirm deletion of this expense?")) return;
        try {
            await apiClient.delete(`expenses/${id}/`);
            fetchExpenses();
            addToast('Expense deleted successfully.', 'success');
        } catch (err) {
            const errorMessage = 'Failed to delete expense. Check landlord privileges.';
            alert(errorMessage);
            addToast(errorMessage, 'error');
        }
    };

    const categoryOptions = useMemo(() => categories.map(c => ({ value: c.id, label: c.name })), [categories]);
    const monthOptions = MONTH_NAMES.map((name, index) => ({ value: index + 1, label: name }));
    const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: new Date().getFullYear() - 2 + i, label: String(new Date().getFullYear() - 2 + i) }));

    const ExpenseForm = ({ expense, onSuccess, onClose }) => {
        const isEditing = !!expense;
        const initialForm = expense ? { ...expense, category: expense.category || '' } : {
            category: '', amount: '', date: new Date().toISOString().substring(0, 10), description: '', month: new Date().getMonth() + 1, year: new Date().getFullYear()
        };
        const [formData, setFormData] = useState(initialForm);
        const [formError, setFormError] = useState('');

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData({ ...formData, [name]: value });
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            setFormError('');

            // Automatically derive month/year from date
            const dateParts = formData.date.split('-');
            const submissionData = {
                ...formData,
                year: parseInt(dateParts[0]),
                month: parseInt(dateParts[1]),
                category: formData.category || null, // Ensure empty string goes as null
            };

            try {
                if (isEditing) {
                    await apiClient.put(`expenses/${expense.id}/`, submissionData);
                    addToast('Expense updated successfully.', 'success');
                } else {
                    await apiClient.post('expenses/', submissionData);
                    addToast('New expense recorded successfully.', 'success');
                }
                onSuccess();
                onClose();
            } catch (err) {
                 let errorMessage = 'Failed to save expense.';
                if (err.response?.data) {
                    errorMessage += ': ' + Object.values(err.response.data).map(e => e.join(' ')).join('; ');
                } else if (err.response?.data?.detail) {
                     errorMessage = err.response.data.detail;
                }
                setFormError(errorMessage);
                addToast(errorMessage, 'error');
            }
        };

        return (
            <form onSubmit={handleSubmit}>
                {formError && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm mb-4">{formError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField label="Category" name="category" value={formData.category} onChange={handleChange} required options={categoryOptions} disabled={!isLandlord} />
                    <InputField label="Amount (₹)" name="amount" type="number" value={formData.amount} onChange={handleChange} required disabled={!isLandlord} />
                    <InputField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required disabled={!isLandlord} />
                </div>
                <InputField label="Description" name="description" type="text" value={formData.description} onChange={handleChange} required disabled={!isLandlord} />

                <div className="mt-6 flex justify-end space-x-3">
                    <Button color="gray" onClick={onClose}>Close</Button>
                    {isLandlord && (
                        <Button type="submit" color="indigo">
                            {isEditing ? 'Update Expense' : 'Add Expense'}
                        </Button>
                    )}
                </div>
            </form>
        );
    };

    return (
        <div className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
                <h1 className="text-2xl font-bold text-gray-900">Household Expenses</h1>
                {isLandlord && (
                    <Button onClick={handleCreate} color="indigo">
                        Record New Expense
                    </Button>
                )}
            </div>

            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 bg-white p-6 rounded-xl shadow-md mb-8">
                <SelectField
                    label="Filter Month"
                    name="month"
                    value={filter.month}
                    onChange={handleFilterChange}
                    options={[{ value: '', label: 'All Months' }, ...monthOptions]}
                />
                <SelectField
                    label="Filter Year"
                    name="year"
                    value={filter.year}
                    onChange={handleFilterChange}
                    options={[{ value: '', label: 'All Years' }, ...yearOptions]}
                />
            </div>

            {loading && <div className="text-center text-indigo-600">Loading expenses...</div>}
            {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

            <div className="overflow-x-auto bg-white rounded-xl shadow-xl">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-indigo-50">
                        <tr>
                            {['Date', 'Category', 'Description', 'Amount (₹)', 'Month/Year', 'Actions'].map(header => (
                                <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider md:px-6 md:py-4">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {expenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-indigo-50 transition duration-100">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 md:px-6 md:py-4">{expense.date}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-indigo-700 font-medium md:px-6 md:py-4">{expense.category_name || 'N/A'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 max-w-xs truncate md:px-6 md:py-4">{expense.description}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-red-700 font-bold md:px-6 md:py-4">{expense.amount}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 md:px-6 md:py-4">{expense.month}/{expense.year}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium md:px-6 md:py-4">
                                    <div className="flex space-x-2">
                                        <Button onClick={() => handleEdit(expense)} color="gray">View/Edit</Button>
                                        {isLandlord && (
                                            <Button onClick={() => handleDelete(expense.id)} color="red">Delete</Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                title={selectedExpense ? 'Edit Expense' : 'Record New Expense'}
                onClose={() => setIsModalOpen(false)}
            >
                <ExpenseForm
                    expense={selectedExpense}
                    onSuccess={fetchExpenses}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};


const DashboardPage = ({ apiClient, addToast }) => {
    const [summary, setSummary] = useState(null);
    const [expenses, setExpenses] = useState([]); 
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Default filter to current month/year, but use 10/2025 to test with dummy data
    const [filter, setFilter] = useState({ month: 10, year: 2025 }); 

    const fetchSummaryAndData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [summaryResp, expensesResp, categoriesResp] = await Promise.all([
                apiClient.get('monthly-summary/', { params: filter }),
                apiClient.get('expenses/', { params: filter }),
                apiClient.get('categories/'),
            ]);
            setSummary(summaryResp.data);
            setExpenses(expensesResp.data);
            setCategories(categoriesResp.data);
        } catch (err) {
            setError(`Failed to fetch summary. Please ensure data exists for ${MONTH_NAMES[filter.month - 1]} ${filter.year}.`);
            addToast('Failed to load dashboard data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [apiClient, filter, addToast]);

    useEffect(() => {
        // Ensure month and year are valid before fetching
        if (filter.month && filter.year) {
            fetchSummaryAndData();
        }
    }, [fetchSummaryAndData]);

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: parseInt(e.target.value) || e.target.value });
    };

    const monthOptions = MONTH_NAMES.map((name, index) => ({ value: index + 1, label: name }));
    const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: new Date().getFullYear() - 2 + i, label: String(new Date().getFullYear() - 2 + i) }));

    const categoryMap = useMemo(() => {
        return categories.reduce((map, cat) => {
            map[cat.id] = cat.name;
            return map;
        }, {});
    }, [categories]);
    
    // --- Data Processors for Display (Non-Chart) ---

    const expenseCategoryTotals = useMemo(() => {
        if (expenses.length === 0) return [];

        const totals = expenses.reduce((acc, expense) => {
            const categoryName = categoryMap[expense.category] || 'Uncategorized';
            const amount = parseFloat(expense.amount);
            acc[categoryName] = (acc[categoryName] || 0) + amount;
            return acc;
        }, {});

        return Object.entries(totals).map(([category, amount]) => ({
            category,
            amount: amount.toFixed(2),
        })).sort((a, b) => b.amount - a.amount);
    }, [expenses, categoryMap]);
    
    
    return (
        <div className="p-4 sm:p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Financial Dashboard</h1>

            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 bg-white p-6 rounded-xl shadow-xl mb-10 max-w-md">
                <SelectField
                    label="Month"
                    name="month"
                    value={filter.month}
                    onChange={handleFilterChange}
                    options={monthOptions}
                />
                <SelectField
                    label="Year"
                    name="year"
                    value={filter.year}
                    onChange={handleFilterChange}
                    options={yearOptions}
                />
            </div>

            {loading && <div className="text-center text-indigo-600 py-10">Loading financial data for {MONTH_NAMES[filter.month - 1]} {filter.year}...</div>}
            {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

            {summary && (
                <>
                    {/* Key Metrics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-10">
                        <Card
                            title="Total Rent (Income)"
                            value={`₹${summary.total_rent.toFixed(2)}`}
                            icon={DollarSign}
                            color={{ border: 'border-green-600', bg: 'bg-green-100', text: 'text-green-700' }}
                        />
                        <Card
                            title="Electricity Total"
                            value={`₹${summary.total_electricity.toFixed(2)}`}
                            icon={Zap}
                            color={{ border: 'border-red-600', bg: 'bg-red-100', text: 'text-red-700' }}
                        />
                        <Card
                            title="Other Expenses"
                            value={`₹${summary.total_other_expenses.toFixed(2)}`}
                            icon={DollarSign}
                            color={{ border: 'border-yellow-600', bg: 'bg-yellow-100', text: 'text-yellow-700' }}
                        />
                        <Card
                            title="Net Balance"
                            value={`₹${summary.net_balance.toFixed(2)}`}
                            icon={DollarSign}
                            color={{ border: summary.net_balance >= 0 ? 'border-indigo-600' : 'border-red-600', bg: summary.net_balance >= 0 ? 'bg-indigo-100' : 'bg-red-100', text: summary.net_balance >= 0 ? 'text-indigo-700' : 'text-red-700' }}
                        />
                    </div>

                    {/* Financial Summary Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-10">
                        
                        {/* Overall Financial Flow Table */}
                        <Section title="Financial Snapshot" className="lg:col-span-2">
                            <table className="w-full text-sm text-left text-gray-600">
                                <tbody>
                                    <tr className="border-b bg-green-50/50">
                                        <th className="py-3 font-medium text-gray-700">Total Rent (Income)</th>
                                        <td className="text-right font-bold text-green-700">₹{summary.total_rent.toFixed(2)}</td>
                                    </tr>
                                    <tr className="border-b bg-red-50/50">
                                        <th className="py-3 font-medium text-gray-700">Electricity (Cost)</th>
                                        <td className="text-right font-bold text-red-700">₹{summary.total_electricity.toFixed(2)}</td>
                                    </tr>
                                    <tr className="border-b bg-yellow-50/50">
                                        <th className="py-3 font-medium text-gray-700">Other Expenses (Cost)</th>
                                        <td className="text-right font-bold text-red-700">₹{summary.total_other_expenses.toFixed(2)}</td>
                                    </tr>
                                    <tr className={`border-t-4 ${summary.net_balance >= 0 ? 'border-indigo-600 bg-indigo-100/70' : 'border-red-600 bg-red-100/70'}`}>
                                        <th className="py-3 font-extrabold text-gray-900 text-lg">Net Balance</th>
                                        <td className={`text-right font-extrabold text-lg ${summary.net_balance >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                                            ₹{summary.net_balance.toFixed(2)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Section>

                        {/* Expense Breakdown */}
                         <Section title="Expense Breakdown" className="col-span-1">
                            <ul className="divide-y divide-gray-200">
                                {expenseCategoryTotals.length > 0 ? (
                                    expenseCategoryTotals.map((item, index) => (
                                        <li key={item.category} className="flex justify-between items-center py-3">
                                            <span className="font-medium text-gray-700">{item.category}</span>
                                            <span className="font-semibold text-red-700">₹{item.amount}</span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-center text-gray-500 py-4">No expenses recorded.</li>
                                )}
                            </ul>
                        </Section>
                    </div>

                    {/* Tenant Status Table */}
                    <Section title="Tenant Electricity Bill Status" className="col-span-3">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-indigo-50">
                                    <tr>
                                        {['Tenant', 'Room', 'Electricity Bill (₹)', 'Payment Status'].map(header => (
                                            <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider md:px-6 md:py-4">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {summary.tenants.length > 0 ? summary.tenants.map(t => (
                                        <tr key={t.name} className="hover:bg-indigo-50 transition duration-100">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 md:px-6 md:py-4">{t.name}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 md:px-6 md:py-4">{t.room_no}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-red-700 md:px-6 md:py-4">₹{t.bill.toFixed(2)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm md:px-6 md:py-4">
                                                {t.is_paid ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 shadow-sm">
                                                        <Check className="w-3 h-3 mr-1" /> Paid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 shadow-sm">
                                                        <Minus className="w-3 h-3 mr-1" /> Unpaid
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No tenant data found for this period.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Section>
                </>
            )}
        </div>
    );
};


// --- Main Application Component ---

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser')) || {});
    const [currentPage, setCurrentPage] = useState(token ? PAGES.DASHBOARD : PAGES.LOGIN);
    const [toasts, setToasts] = useState([]);


    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);


    // Memoize the API client to ensure it updates when the token changes
    const apiClient = useMemo(() => getApiClient(token), [token]);

    const handleLogout = async () => {
        try {
            await apiClient.post('logout/');
        } catch (e) {
            // Log error but proceed with local logout anyway
            console.error("Logout API call failed, but clearing local session.", e);
        }
        setToken(null);
        setUser({});
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        setCurrentPage(PAGES.LOGIN);
        addToast("Logged out successfully.", 'info');
    };

    const navItems = [
        { name: PAGES.DASHBOARD, icon: Home, allowed: !!token },
        { name: PAGES.TENANTS, icon: Users, allowed: !!token },
        { name: PAGES.READINGS, icon: Zap, allowed: !!token },
        { name: PAGES.EXPENSES, icon: DollarSign, allowed: !!token },
    ].filter(item => item.allowed);

    const renderPage = () => {
        if (!token) {
            return currentPage === PAGES.REGISTER ? (
                <RegisterForm setCurrentPage={setCurrentPage} apiClient={apiClient} addToast={addToast} />
            ) : (
                <LoginForm setToken={setToken} setUser={setUser} setCurrentPage={setCurrentPage} apiClient={apiClient} addToast={addToast} />
            );
        }

        switch (currentPage) {
            case PAGES.TENANTS:
                return <TenantsPage user={user} apiClient={apiClient} addToast={addToast} />;
            case PAGES.READINGS:
                return <ReadingsPage user={user} apiClient={apiClient} addToast={addToast} />;
            case PAGES.EXPENSES:
                return <ExpensesPage user={user} apiClient={apiClient} addToast={addToast} />;
            case PAGES.DASHBOARD:
            default:
                return <DashboardPage apiClient={apiClient} addToast={addToast} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
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
                <header className="bg-white shadow-lg sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Modified header container to allow navigation to wrap on mobile */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between h-auto md:h-16 py-3 md:py-0">
                            
                            <div className="flex items-center justify-between w-full md:w-auto mb-3 md:mb-0">
                                <h1 className="text-xl font-extrabold text-indigo-700 mr-8">
                                    Home Manager
                                </h1>
                                {/* Removed unnecessary elements for space */}
                            </div>
                            
                            {/* Navigation container: Now uses flex-wrap and justify-between on mobile */}
                            <nav className="flex flex-wrap gap-2 justify-between w-full md:w-auto md:flex-row md:space-x-2 lg:space-x-4">
                                {navItems.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => setCurrentPage(item.name)}
                                        className={`flex items-center px-3 py-2 text-sm rounded-lg font-semibold transition duration-150 flex-grow justify-center ${
                                            currentPage === item.name
                                                ? 'bg-indigo-600 text-white shadow-md' // Enhanced active state
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-indigo-700'
                                        } md:text-base md:flex-grow-0`}
                                    >
                                        <item.icon className="w-5 h-5 mr-1 md:mr-2" />
                                        {item.name}
                                    </button>
                                ))}
                            </nav>
                            
                            <div className="flex items-center space-x-4 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-200 w-full md:w-auto justify-between md:justify-start">
                                <div className="text-sm text-gray-700 font-medium">
                                    {user.username} (<span className="font-semibold text-indigo-600">{user.is_superuser ? 'Landlord' : 'Tenant'}</span>)
                                </div>
                                <Button onClick={handleLogout} color="red" className="flex items-center">
                                    <LogOut className="w-4 h-4 mr-1" /> Logout
                                </Button>
                            </div>

                        </div>
                    </div>
                </header>
            )}

            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {renderPage()}
            </main>
        </div>
    );
};

export default App;
