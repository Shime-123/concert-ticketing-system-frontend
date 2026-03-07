import Confetti from "react-confetti";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Container, Button, Spinner } from "react-bootstrap";

function Success() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth(); // Logged-in Buyer
  const sessionId = searchParams.get('session_id');
  const [isProcessing, setIsProcessing] = useState(true);
  
  // State to hold the data returned from the API
  const [recipientInfo, setRecipientInfo] = useState({ name: "", email: "" });

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);

    if (sessionId) {
      // 1. Call the Finalize API to process the transaction and get recipient details
      fetch(`${process.env.REACT_APP_API_URL}/api/Stripe/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          userEmail: user?.email || "", 
          userName: user?.name || ""
        })
      })
      .then(res => {
        if (!res.ok) throw new Error("Failed to finalize");
        return res.json();
      })
      .then(data => {
        // 2. Set the recipient details from the BACKEND response
        setRecipientInfo({
          name: data.recipientName || "Valued Guest",
          email: data.recipientEmail || "your email"
        });
        setIsProcessing(false);
      })
      .catch((err) => {
        console.error("Finalization error:", err);
        setIsProcessing(false);
      });
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [sessionId, user]);

  return (
    <div className="bg-black min-vh-100 w-100 d-flex flex-column align-items-center justify-content-center text-white position-relative overflow-hidden">
      {/* Confetti effect fires once processing is done */}
      {!isProcessing && (
        <Confetti 
          width={dimensions.width} 
          height={dimensions.height} 
          numberOfPieces={300} 
          recycle={false}
          gravity={0.15}
          colors={['#ffc107', '#ffffff', '#ffeb3b']} 
        />
      )}
      
      <Container className="text-center position-relative" style={{ zIndex: 2 }}>
        {isProcessing ? (
          <div className="py-5">
            <Spinner animation="border" variant="warning" style={{ width: '4rem', height: '4rem' }} className="mb-4" />
            <h1 className="display-5 fw-bold text-warning animate__animated animate__pulse animate__infinite">
              Generating Your Tickets...
            </h1>
            <p className="lead text-secondary">Securing your spot at the event.</p>
          </div>
        ) : (
          <div className="animate__animated animate__fadeInUp">
            <div className="mb-4">
              <div className="d-inline-block p-4 rounded-circle bg-warning bg-opacity-10 mb-3">
                <i className="bi bi-check2-circle text-warning" style={{ fontSize: "5rem" }}></i>
              </div>
            </div>
            
            <h1 className="display-2 fw-black text-uppercase mb-2">Order Confirmed!</h1>
            
            <h2 className="h3 text-warning mb-4">
              {/* Uses Recipient Name from Backend */}
              The show is ready for you, {recipientInfo.name.split(' ')[0]}!
            </h2>
            
            <div className="bg-dark bg-opacity-50 p-4 rounded-4 mx-auto mb-5 border border-secondary border-opacity-25" style={{ maxWidth: "600px" }}>
              <p className="lead text-white mb-0">
                A confirmation email with the ticket has been sent to:
                <br />
                <strong className="text-warning">{recipientInfo.email}</strong>
              </p>
              
              <hr className="my-3 opacity-25" />
              
              <small className="text-secondary">
                {user?.email === recipientInfo.email 
                  ? "Since this is your account, you can also view and download your tickets in the History section."
                  : `Your gift for ${recipientInfo.name} has been processed successfully!`}
              </small>
            </div>

            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center align-items-center">
              {/* Only show History button if the buyer is the recipient */}
              {user?.email === recipientInfo.email && (
                <Button 
                  as={Link} 
                  to="/history" 
                  variant="warning" 
                  className="btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg"
                >
                  VIEW MY TICKETS
                </Button>
              )}
              
              <Button 
                as={Link} 
                to="/" 
                variant="outline-light" 
                className="btn-lg px-5 py-3 rounded-pill"
              >
                GO TO HOME
              </Button>
            </div>
          </div>
        )}
      </Container>

      {/* Aesthetic Background Glow */}
      <div className="position-absolute top-50 start-50 translate-middle bg-warning rounded-circle opacity-10" 
           style={{ width: '600px', height: '600px', filter: 'blur(120px)' }}></div>
    </div>
  );
}

export default Success;