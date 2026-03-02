import Confetti from "react-confetti";
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { Container, Button, Spinner } from "react-bootstrap";

function Success() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const sessionId = searchParams.get('session_id');
  const [isProcessing, setIsProcessing] = useState(true);

  // Manual window size state to avoid 'react-use' error
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);

    if (sessionId && user?.email) {
      fetch(`${process.env.REACT_APP_API_URL}/api/Stripe/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId,
          userEmail: user.email,
          userName: user.name
        })
      })
      .then(res => { if (res.ok) setIsProcessing(false); })
      .catch(() => setIsProcessing(false));
    } else {
      setTimeout(() => setIsProcessing(false), 2000);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [sessionId, user]);

  return (
    <div className="bg-black min-vh-100 w-100 d-flex flex-column align-items-center justify-content-center text-white position-relative overflow-hidden">
      <Confetti 
        width={dimensions.width} 
        height={dimensions.height} 
        numberOfPieces={isProcessing ? 0 : 300} 
        recycle={false}
        gravity={0.2}
        colors={['#ffc107', '#ffffff']} 
      />
      
      <Container className="text-center position-relative" style={{ zIndex: 2 }}>
        {isProcessing ? (
          <div className="py-5">
            <Spinner animation="grow" variant="warning" size="xl" className="mb-4" />
            <h1 className="display-4 fw-bold text-warning">Verifying Payment...</h1>
            <p className="lead text-secondary">Hang tight, we're generating your tickets.</p>
          </div>
        ) : (
          <div className="animate__animated animate__fadeIn">
            <div className="mb-4">
              <i className="bi bi-ticket-perforated text-warning" style={{ fontSize: "5rem" }}></i>
            </div>
            <h1 className="display-2 fw-black text-uppercase mb-2">Success!</h1>
            <h2 className="h3 text-warning mb-4">You're going to the show, {user?.name?.split(' ')[0]}!</h2>
            
            <p className="lead text-secondary mx-auto mb-5" style={{ maxWidth: "700px" }}>
              A confirmation email has been sent to <strong>{user?.email}</strong>. 
              You can find your QR-coded tickets in your purchase history.
            </p>

            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center align-items-center">
              <Button 
                as={Link} 
                to="/history" 
                variant="warning" 
                className="btn-lg fw-bold px-5 py-3 rounded-pill shadow-lg hover-scale"
              >
                VIEW MY TICKETS
              </Button>
              <Button 
                as={Link} 
                to="/" 
                variant="outline-light" 
                className="btn-lg px-5 py-3 rounded-pill"
              >
                BACK HOME
              </Button>
            </div>
          </div>
        )}
      </Container>

      {/* Background Glow Effect */}
      <div className="position-absolute top-50 start-50 translate-middle bg-warning rounded-circle opacity-10" 
           style={{ width: '500px', height: '500px', filter: 'blur(100px)' }}></div>
    </div>
  );
}

export default Success;