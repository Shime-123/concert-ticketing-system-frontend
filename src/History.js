import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Badge, Spinner } from "react-bootstrap";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

function History() {
  const { user, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      fetch(`${process.env.REACT_APP_API_URL}/api/Tickets/my-tickets?email=${user.email}`)
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((data) => {
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

  if (!isAuthenticated) return <Navigate to="/" />;

  return (
    <div className="bg-black min-vh-100 text-white py-5">
      <Container>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
          <div>
            <h1 className="text-warning fw-bold mb-0 text-uppercase display-5">My Tickets</h1>
            <p className="text-light mb-0 lead opacity-75">Your digital passes for upcoming events</p>
          </div>
          <Link to="/">
            <Button variant="warning" className="rounded-pill px-4 fw-bold py-2 shadow-sm">
              + BUY MORE TICKETS
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="grow" variant="warning" />
          </div>
        ) : tickets.length > 0 ? (
          <Row className="g-4">
            {tickets.map((t) => {
              // ✅ ACCURATE TYPE LOGIC: Using the TicketType sent from the backend join
              const typeLabel = t.ticketType || t.TicketType || "Regular";
              const isVip = typeLabel.toUpperCase().includes("VIP");
              const displayType = isVip ? "VIP PASS" : "REGULAR";

              return (
                <Col key={t.ticketId || t.TicketId} xs={12} lg={6}>
                  <Card className="bg-dark border-secondary text-white overflow-hidden shadow-lg h-100 border-opacity-50">
                    <Row className="g-0 h-100">
                      
                      {/* Left Stub - Dynamic Color based on type */}
                      <Col xs={4} className={`${isVip ? 'bg-warning' : 'bg-info'} d-flex align-items-center justify-content-center p-3 text-dark`}>
                        <div className="text-center">
                          <div className="fw-bold h2 mb-0">{t.quantity || 1}</div>
                          <div className="small fw-bold text-uppercase mb-2">Tickets</div>
                          <div className="bg-dark text-white px-2 py-1 rounded x-small fw-bold">
                            VALID
                          </div>
                        </div>
                      </Col>
                      
                      {/* Right Details */}
                      <Col xs={8}>
                        <Card.Body className="d-flex flex-column justify-content-between h-100 bg-secondary bg-opacity-10">
                          <div>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <Badge bg={isVip ? "warning" : "info"} text="dark" className="px-2 shadow-sm">
                                {displayType}
                              </Badge>
                              <small className="text-warning font-monospace small">
                                #{(t.ticketId || "00000000").toString().substring(0, 8)}
                              </small>
                            </div>
                            
                            <Card.Title className="fs-4 fw-bold mb-1 text-white">
                              {t.customerName || user?.name}
                            </Card.Title>
                            
                            <p className="text-warning mb-0 fw-bold">
                               {t.concertTitle}
                            </p>
                            <small className="text-light opacity-75 d-block">
                                {t.venue} | {t.date}
                            </small>
                            
                            <p className="text-light small mt-2 mb-0 opacity-50">
                              Ref: {t.paymentId?.substring(0, 15)}...
                            </p>
                          </div>
                          
                          <div className="mt-3 pt-2 border-top border-secondary d-flex justify-content-between align-items-center">
                            <div>
                              <span className="text-light small d-block opacity-75">Total Paid</span>
                              <span className="fw-bold fs-5 text-warning">${t.price}</span>
                            </div>
                            <span className="text-uppercase text-light opacity-50 small fw-bold font-monospace tracking-wide">
                              Ethio Concert
                            </span>
                          </div>
                        </Card.Body>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <div className="text-center py-5">
            <h3 className="text-secondary">No tickets found</h3>
            <Link to="/">
                <Button variant="outline-warning" className="mt-3">Return to Events</Button>
            </Link>
          </div>
        )}
      </Container>
    </div>
  );
}

export default History;