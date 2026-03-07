import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Container, Spinner, Button } from "react-bootstrap";
import Confetti from "react-confetti";

function Success() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        if (sessionId) {
            fetch(`${process.env.REACT_APP_API_URL}/api/Stripe/finalize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: sessionId,
                    userEmail: user?.email || "",
                    userName: user?.name || ""
                })
            })
            .then(res => res.json())
            .then(() => {
                setIsProcessing(false);
            })
            .catch(err => {
                console.error("Error:", err);
                setIsProcessing(false);
            });
        }
    }, [sessionId, user]);

    if (isProcessing) {
        return (
            <div className="bg-black min-vh-100 d-flex flex-column align-items-center justify-content-center text-white">
                <Spinner animation="grow" variant="warning" className="mb-4" />
                <h2 className="text-uppercase tracking-widest">Securing Your Tickets...</h2>
            </div>
        );
    }

    return (
        <div className="bg-black min-vh-100 d-flex align-items-center justify-content-center text-white text-center">
            <Confetti recycle={false} numberOfPieces={400} gravity={0.1} />
            
            <Container className="animate__animated animate__fadeIn">
                <div className="mb-4">
                    <i className="bi bi-shield-check text-warning" style={{ fontSize: "6rem" }}></i>
                </div>
                
                <h1 className="display-2 fw-black text-uppercase mb-3">Order Confirmed</h1>
                
                <div className="mx-auto bg-dark p-4 rounded-4 border border-secondary border-opacity-25" style={{ maxWidth: "600px" }}>
                    <p className="lead mb-4">
                        Your transaction was successful. We’ve sent a confirmation email with your digital tickets to the address provided during checkout.
                    </p>
                    
                    <p className="text-secondary small text-uppercase tracking-tighter">
                        Please check your inbox (and spam folder) for your QR-coded entry passes.
                    </p>
                </div>

                <div className="mt-5 d-flex flex-column flex-md-row gap-3 justify-content-center">
                    <Button 
                        as={Link} 
                        to="/history" 
                        variant="warning" 
                        className="btn-lg px-5 py-3 fw-bold rounded-pill text-uppercase"
                    >
                        View My History
                    </Button>
                    <Button 
                        as={Link} 
                        to="/" 
                        variant="outline-light" 
                        className="btn-lg px-5 py-3 rounded-pill text-uppercase"
                    >
                        Return Home
                    </Button>
                </div>
            </Container>
        </div>
    );
}

export default Success;