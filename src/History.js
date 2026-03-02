import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, Button, Spinner } from "react-bootstrap";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

/**
 * HISTORY COMPONENT
 * Displays a list of tickets purchased by the logged-in user.
 */
function History() {
  const { user, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if the user is authenticated and we have an email
    if (isAuthenticated && user?.email) {
      console.log("Fetching tickets for:", user.email);
      
      fetch(`${process.env.REACT_APP_API_URL}/api/Tickets/my-tickets?email=${user.email}`)
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((data) => {
          console.log("History data received:", data);
          // Ensure data is an array before setting state
          setTickets(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Fetch error in History:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Guard clause: If not logged in, send them to Home
  if (!isAuthenticated) return <Navigate to="/" />;

  return (
    <div className="bg-black min-vh-100 text-white py-5">
      <Container>
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
          <div>
            <h1 className="text-warning fw-black mb-0 text-uppercase display-5">My Tickets</h1>
            <p className="text-secondary mb-0 lead">Your digital passes for upcoming events</p>
          </div>
          <Button as={Link} to="/" variant="outline-warning" className="rounded-pill px-4 fw-bold py-2">
            + BUY MORE TICKETS
          </Button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="grow" variant="warning" />
            <p className="mt-3 text-secondary animate__animated animate__pulse animate__infinite">
              Retrieving your ticket wallet...
            </p>
          </div>
        ) : tickets.length > 0 ? (
          <Row className="g-4">
            {tickets.map((t) => (
              <Col key={t.ticketId || t.TicketId || Math.random()} xs={12} lg={6}>
                <Card className="bg-dark border-secondary text-white overflow-hidden shadow-lg h-100 border-opacity-25 hover-shadow-transition">
                  <Row className="g-0 h-100">
                    
                    {/* Left Stub: QR Mockup */}
                    <Col xs={4} className="bg-warning d-flex align-items-center justify-content-center p-3 text-dark">
                      <div className="text-center">
                        <i className="bi bi-qr-code fs-1 d-block mb-1"></i>
                        <div className="fw-bold small text-uppercase" style={{ letterSpacing: '1px' }}>Entry Pass</div>
                        <div className="bg-dark text-warning px-2 py-1 rounded mt-2 small fw-bold">
                          {(t.status || t.Status || "Valid").toUpperCase()}
                        </div>
                      </div>
                    </Col>
                    
                    {/* Right Stub: Ticket Details */}
                    <Col xs={8}>
                      <Card.Body className="d-flex flex-column justify-content-between h-100">
                        <div>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Badge bg="success" className="text-uppercase px-2">
                              {t.status || t.Status || "Confirmed"}
                            </Badge>
                            <small className="text-muted font-monospace">
                              #{(t.ticketId || t.TicketId || "00000000").substring(0, 8)}
                            </small>
                          </div>
                          
                          <Card.Title className="fs-4 fw-bold mb-1 text-truncate">
                            {t.customerName || t.CustomerName || user?.name}
                          </Card.Title>
                          
                          <p className="text-warning mb-0 fw-bold small text-uppercase tracking-wider">
                             {t.concertTitle || t.ConcertTitle || "Ethiopian Concert Series"}
                          </p>
                          
                          <p className="text-secondary x-small mt-2 mb-0 opacity-50">
                            Payment Ref: {t.paymentId || t.PaymentId || "N/A"}
                          </p>
                        </div>
                        
                        <div className="mt-3 pt-3 border-top border-secondary border-opacity-25 d-flex justify-content-between align-items-center">
                          <div>
                            <span className="text-secondary small d-block">Price Paid</span>
                            <span className="fw-bold fs-5 text-white">${t.price || t.Price || "0.00"}</span>
                          </div>
                          <Button variant="link" className="text-warning p-0 text-decoration-none fw-bold small">
                            VIEW TICKET →
                          </Button>
                        </div>
                      </Card.Body>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          /* Empty State */
          <div className="text-center py-5 bg-dark rounded-4 border border-secondary border-dashed border-opacity-25">
            <div className="mb-4 opacity-25">
               <i className="bi bi-ticket-detailed display-1"></i>
            </div>
            <h3 className="text-secondary mt-3 fw-bold">No tickets found</h3>
            <p className="text-muted mb-4">Your ticket wallet is currently empty.</p>
            <Button as={Link} to="/" variant="warning" className="fw-bold px-5 py-2 rounded-pill">
              BROWSE UPCOMING SHOWS
            </Button>
          </div>
        )}
      </Container>
      
      {/* Decorative background glow */}
      <div className="position-fixed top-0 end-0 bg-warning rounded-circle opacity-5" 
           style={{ width: '400px', height: '400px', filter: 'blur(100px)', zIndex: 0 }}></div>
    </div>
  );
}

export default History;