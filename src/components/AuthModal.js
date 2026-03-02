import { Modal, Button, Form, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AuthModal({ show, onHide }) {
    const { login } = useAuth();
    const navigate = useNavigate();
    
    // UI States
    const [view, setView] = useState('login'); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [timer, setTimer] = useState(0); // For Resend Code cooldown

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        resetCode: '',
        newPassword: ''
    });

    // Handle timer countdown
    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(""); 
        setSuccess("");
    };

    const handleSwitchView = (newView) => {
        setError("");
        setSuccess("");
        setView(newView);
    };

    // --- PASSWORD STRENGTH LOGIC ---
    const getStrength = (password) => {
        if (!password) return 0;
        let points = 0;
        if (password.length > 7) points += 25;
        if (/[A-Z]/.test(password)) points += 25;
        if (/[0-9]/.test(password)) points += 25;
        if (/[^A-Za-z0-9]/.test(password)) points += 25;
        return points;
    };

    const strength = view === 'register' ? getStrength(formData.password) : getStrength(formData.newPassword);
    const strengthColor = strength < 50 ? 'danger' : strength < 100 ? 'warning' : 'success';

    // --- 1. LOGIN ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, password: formData.password }),
            });
            const data = await res.json();
            if (res.ok) {
                login(data);
                onHide();
                if (data.role === 'Admin') navigate("/");
            } else {
                setError(data.message || "Invalid credentials");
            }
        } catch (err) { setError("Server connection failed."); }
        finally { setLoading(false); }
    };

    // --- 2. REGISTER ---
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (strength < 50) return setError("Password is too weak.");
        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password
                }),
            });
            if (res.ok) {
                handleSwitchView('login');
                alert("Account created! Please login.");
            } else {
                const data = await res.json();
                setError(data.message || "Registration failed");
            }
        } catch (err) { setError("Connection failed."); }
        finally { setLoading(false); }
    };

    // --- 3. FORGOT (Request Code) ---
    const handleForgotSubmit = async (e) => {
        if (e) e.preventDefault();
        if (timer > 0) return;
        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
            });
            if (res.ok) {
                setSuccess("Code sent to your email!");
                setView('reset');
                setTimer(60); // Start 60s cooldown
            } else {
                const data = await res.json();
                setError(data.message || "Email not found.");
            }
        } catch (err) { setError("Failed to send code."); }
        finally { setLoading(false); }
    };

    // --- 4. RESET (New Password) ---
    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (strength < 50) return setError("New password is too weak.");
        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    code: formData.resetCode,
                    newPassword: formData.newPassword
                }),
            });
            if (res.ok) {
                alert("Password updated!");
                handleSwitchView('login');
            } else {
                const data = await res.json();
                setError(data.message || "Invalid code.");
            }
        } catch (err) { setError("Reset failed."); }
        finally { setLoading(false); }
    };

    return (
        <Modal show={show} onHide={onHide} centered contentClassName="bg-dark text-white border-secondary shadow-lg">
            <Modal.Header closeButton closeVariant="white" className="border-secondary">
                <Modal.Title className="text-warning fw-bold">
                    {view === 'login' && "Welcome Back"}
                    {view === 'register' && "Join Ethio Concert"}
                    {view === 'forgot' && "Reset Password"}
                    {view === 'reset' && "Set New Password"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4 py-4">
                
                {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                {success && <Alert variant="success" className="py-2 small">{success}</Alert>}

                {/* LOGIN */}
                {view === 'login' && (
                    <Form onSubmit={handleLoginSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold opacity-75">EMAIL</Form.Label>
                            <Form.Control required name="email" type="email" placeholder="name@example.com" className="bg-transparent text-white border-secondary" onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold opacity-75">PASSWORD</Form.Label>
                            <Form.Control required name="password" type="password" placeholder="••••••••" className="bg-transparent text-white border-secondary" onChange={handleChange} />
                        </Form.Group>
                        <Button variant="warning" type="submit" className="w-100 fw-bold py-2" disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : "LOGIN"}
                        </Button>
                        <div className="d-flex justify-content-between mt-4 small">
                            <span onClick={() => handleSwitchView('register')} className="text-secondary" style={{ cursor: 'pointer' }}>New fan? Sign up</span>
                            <span onClick={() => handleSwitchView('forgot')} className="text-warning" style={{ cursor: 'pointer' }}>Forgot Password?</span>
                        </div>
                    </Form>
                )}

                {/* REGISTER */}
                {view === 'register' && (
                    <Form onSubmit={handleRegisterSubmit}>
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold opacity-75">FULL NAME</Form.Label>
                            <Form.Control required name="fullName" type="text" className="bg-transparent text-white border-secondary" onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold opacity-75">EMAIL</Form.Label>
                            <Form.Control required name="email" type="email" className="bg-transparent text-white border-secondary" onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold opacity-75">PHONE</Form.Label>
                            <Form.Control required name="phone" type="tel" className="bg-transparent text-white border-secondary" onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label className="small fw-bold opacity-75">PASSWORD</Form.Label>
                            <Form.Control required name="password" type="password" className="bg-transparent text-white border-secondary" onChange={handleChange} />
                            <ProgressBar now={strength} variant={strengthColor} className="mt-2" style={{ height: '5px' }} />
                            <small className="text-secondary">Strength: {strength}%</small>
                        </Form.Group>
                        <Button variant="warning" type="submit" className="w-100 fw-bold py-2 mt-3" disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : "CREATE ACCOUNT"}
                        </Button>
                        <div className="mt-3 text-center small text-secondary" onClick={() => handleSwitchView('login')} style={{ cursor: 'pointer' }}>
                            Already a member? <span className="text-warning">Login</span>
                        </div>
                    </Form>
                )}

                {/* FORGOT STEP 1 */}
                {view === 'forgot' && (
                    <Form onSubmit={handleForgotSubmit}>
                        <p className="text-secondary small mb-4">Enter your email to receive a 6-digit reset code.</p>
                        <Form.Group className="mb-4">
                            <Form.Control required name="email" type="email" placeholder="Email Address" className="bg-transparent text-white border-secondary" onChange={handleChange} />
                        </Form.Group>
                        <Button variant="warning" type="submit" className="w-100 fw-bold py-2" disabled={loading || timer > 0}>
                            {loading ? <Spinner animation="border" size="sm" /> : "SEND CODE"}
                        </Button>
                        <div className="mt-3 text-center small text-secondary" style={{ cursor: 'pointer' }} onClick={() => handleSwitchView('login')}>Back to Login</div>
                    </Form>
                )}

                {/* RESET STEP 2 */}
                {view === 'reset' && (
                    <Form onSubmit={handleResetSubmit}>
                        <Form.Group className="mb-3 text-center">
                            <Form.Label className="small fw-bold opacity-75">VERIFICATION CODE</Form.Label>
                            <Form.Control required name="resetCode" type="text" maxLength="6" className="bg-transparent text-white border-secondary text-center fw-bold fs-4" placeholder="000000" onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="small fw-bold opacity-75">NEW PASSWORD</Form.Label>
                            <Form.Control required name="newPassword" type="password" className="bg-transparent text-white border-secondary" onChange={handleChange} />
                            <ProgressBar now={strength} variant={strengthColor} className="mt-2" style={{ height: '5px' }} />
                        </Form.Group>
                        <Button variant="warning" type="submit" className="w-100 fw-bold py-2" disabled={loading}>
                            {loading ? <Spinner animation="border" size="sm" /> : "UPDATE PASSWORD"}
                        </Button>
                        <div className="mt-4 text-center small">
                            {timer > 0 ? (
                                <span className="text-secondary">Resend code in {timer}s</span>
                            ) : (
                                <span className="text-warning fw-bold" style={{ cursor: 'pointer' }} onClick={handleForgotSubmit}>Resend Code</span>
                            )}
                        </div>
                    </Form>
                )}
            </Modal.Body>
        </Modal>
    );
}

export default AuthModal;