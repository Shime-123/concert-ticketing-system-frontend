import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Navbar, Nav, Dropdown } from 'react-bootstrap';
import { useAuth } from './context/AuthContext';

const AboutUs = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="bg-black text-white min-vh-100">
      {/* --- Simple Navbar for Navigation Consistency --- */}
      <Navbar variant="dark" expand="lg" className="border-bottom border-secondary py-3">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold fs-3">
            ETHIO <span className="text-warning">CONCERT</span>
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav className="gap-4 align-items-center">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/about" className="text-warning">About Us</Nav.Link>
              {!isAuthenticated ? (
                <Button as={Link} to="/" variant="outline-warning" className="rounded-pill px-4 fw-bold">Login</Button>
              ) : (
                <Dropdown align="end">
                  <Dropdown.Toggle variant="warning" className="rounded-pill px-4 fw-bold">
                    {user?.name?.split(' ')[0]}
                  </Dropdown.Toggle>
                  <Dropdown.Menu variant="dark" className="border-secondary">
                    <Dropdown.Item as={Link} to="/history">History</Dropdown.Item>
                    <Dropdown.Item onClick={logout} className="text-danger">Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* --- Hero Section --- */}
      <section className="py-5 text-center bg-dark bg-opacity-25">
        <Container className="py-5">
          <Badge bg="warning" text="dark" className="mb-3 px-3 py-2 text-uppercase fw-bold">Our Mission</Badge>
          <h1 className="display-3 fw-black text-uppercase mb-3">Connecting Fans to <span className="text-warning">Legends</span></h1>
          <p className="lead text-secondary mx-auto fs-4" style={{ maxWidth: '800px' }}>
            Ethio Concert is Ethiopia's premier digital ticketing destination, 
            designed to bring the magic of live music to your fingertips with 
            security and speed.
          </p>
        </Container>
      </section>

      {/* --- Main Content --- */}
      <Container className="py-5">
        <Row className="align-items-center g-5">
          <Col lg={6}>
            <div className="position-relative">
               <img 
                 src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80" 
                 alt="Concert Crowd" 
                 className="img-fluid rounded-4 shadow-lg border border-secondary"
               />
               <div className="position-absolute bottom-0 start-0 p-4 bg-warning text-dark fw-bold rounded-end m-3">
                 EST. 2026
               </div>
            </div>
          </Col>
          <Col lg={6}>
            <h2 className="display-5 fw-bold mb-4">Why Choose <span className="text-warning">Ethio Concert?</span></h2>
            <div className="mb-4">
              <h5 className="text-warning fw-bold">Verified Authenticity</h5>
              <p className="text-secondary">Every ticket issued through our platform is 100% authentic and comes with a unique, encrypted QR code for secure entry.</p>
            </div>
            <div className="mb-4">
              <h5 className="text-warning fw-bold">Seamless Experience</h5>
              <p className="text-secondary">From browsing your favorite artist like Teddy Afro to receiving your PDF ticket via email, we make the process frictionless.</p>
            </div>
            <div className="mb-4">
              <h5 className="text-warning fw-bold">Local Support, Global Tech</h5>
              <p className="text-secondary">We combine world-class payment security (Stripe) with a deep understanding of the Ethiopian music scene.</p>
            </div>
            <Button as={Link} to="/" variant="warning" size="lg" className="fw-bold px-5 mt-2 shadow">
              EXPLORE EVENTS
            </Button>
          </Col>
        </Row>
      </Container>

      {/* --- Footer Statistics --- */}
      <div className="py-5 border-top border-secondary bg-dark bg-opacity-10 mt-5">
        <Container>
          <Row className="text-center g-4">
            <Col md={3}>
              <h2 className="text-warning fw-black mb-0">20+</h2>
              <p className="text-secondary text-uppercase small">Iconic Artists</p>
            </Col>
            <Col md={3}>
              <h2 className="text-warning fw-black mb-0">50+</h2>
              <p className="text-secondary text-uppercase small">Venues Covered</p>
            </Col>
            <Col md={3}>
              <h2 className="text-warning fw-black mb-0">100k+</h2>
              <p className="text-secondary text-uppercase small">Happy Fans</p>
            </Col>
            <Col md={3}>
              <h2 className="text-warning fw-black mb-0">24/7</h2>
              <p className="text-secondary text-uppercase small">Customer Care</p>
            </Col>
          </Row>
        </Container>
      </div>

      <footer className="py-4 text-center text-secondary border-top border-secondary">
        <p className="small mb-0">© 2026 Ethio Concert Event Organization. All Rights Reserved.</p>
      </footer>

      <style>{`
        .fw-black { font-weight: 900; }
        .bg-dark { background-color: #121212 !important; }
      `}</style>
    </div>
  );
};

// Internal Badge helper for About page
const Badge = ({ children, bg, text, className }) => (
    <span className={`badge bg-${bg} text-${text} ${className}`}>{children}</span>
);

export default AboutUs;