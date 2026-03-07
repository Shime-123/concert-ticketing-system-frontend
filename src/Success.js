import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext"; // Your logged-in user
import { Container, Spinner, Button } from "react-bootstrap";
import Confetti from "react-confetti";

function Success() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { user } = useAuth(); // The BUYER (logged-in)
    
    const [isProcessing, setIsProcessing] = useState(true);
    
    // This state will hold the STRIPE FORM DATA (The actual recipient)
    const [recipientInfo, setRecipientInfo] = useState({ name: "", email: "" });

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
            .then(data => {
                // UPDATE STATE WITH STRIPE DATA FROM BACKEND
                setRecipientInfo({
                    name: data.recipientName, 
                    email: data.recipientEmail
                });
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
                <Spinner animation="border" variant="warning" className="mb-3" />
                <h2>Finalizing your order...</h2>
            </div>
        );
    }

    return (
        <div className="bg-black min-vh-100 d-flex align-items-center justify-content-center text-white text-center">
            <Confetti recycle={false} numberOfPieces={500} />
            <Container>
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "5rem" }}></i>
                
                <h1 className="display-3 fw-bold mt-4">Success!</h1>
                
                {/* CRITICAL FIX: 
                   We use recipientInfo.name (from Stripe) 
                   NOT user.name (from Login)
                */}
                <h2 className="text-warning">
                    You're going to the show, {recipientInfo.name || "Guest"}!
                </h2>

                <p className="lead mt-4">
                    A confirmation email has been sent to: <br />
                    <strong className="fs-4 text-info">{recipientInfo.email}</strong>
                </p>

                <div className="mt-5 d-flex gap-3 justify-content-center">
                    <Button as={Link} to="/history" variant="warning" size="lg">
                        View Purchase History
                    </Button>
                    <Button as={Link} to="/" variant="outline-light" size="lg">
                        Home
                    </Button>
                </div>
            </Container>
        </div>
    );
}

export default Success;