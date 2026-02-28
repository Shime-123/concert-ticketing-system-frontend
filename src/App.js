import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Confetti from "react-confetti";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Button, Card, Badge, Navbar, Nav, Form, Modal, InputGroup } from "react-bootstrap";
import Admin from './Admin';

// --- 1. Mock Data for Concerts ---
const concerts = [
  {
    id: "teddy-afro",
    artist: "Teddy Afro",
    city: "Addis Ababa",
    venue: "Ghion Hotel",
    date: "Mar 25, 2026",
    image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80",
    description: "The return of the King of Ethiopian Pop. A night of history and unity."
  },
  {
    id: "rophnan",
    artist: "Rophnan",
    city: "Hawassa",
    venue: "Millennium Hall",
    date: "April 12, 2026",
    image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=800&q=80",
    description: "A journey through electronic sounds and Ethiopian heritage."
  },
  {
    id: "aster-aweke",
    artist: "Aster Aweke",
    city: "Addis Ababa",
    venue: "Hilton Hotel",
    date: "May 05, 2026",
    image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=800&q=80",
    description: "An intimate evening with the legendary diva."
  }
];

// --- 2. Ticket Options ---
const ticketTypes = [
  { id: "price_1Sb2qGAHsf5qLygtX9usvGhK", name: "Regular Pass", price: 20 },
  { id: "price_1Sb2qGAHsf5qLygtkdLVegxh", name: "VIP Experience", price: 50 }
];

function Home() {
  const [showModal, setShowModal] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(ticketTypes[0]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // Function to open popup
  const handleOpenModal = (concert) => {
    setActiveEvent(concert);
    setShowModal(true);
  };

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Stripe/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedTicket.id,
          quantity: quantity,
          ticketType: selectedTicket.name,
          artist: activeEvent.artist, 
          venue: activeEvent.venue
        }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      alert("Error connecting to server.");
    }
    setLoading(false);
  };

  return (
    <div className="bg-black text-white min-vh-100">
      {/* 1. Hero Section & Navbar */}
      <div style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,1)), url('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: 'cover', backgroundPosition: 'center', height: '60vh'
      }}>
        <Navbar variant="dark" expand="lg" className="pt-4">
          <Container>
            <Navbar.Brand className="fw-bold fs-3">
              ETHIO <span className="text-warning">CONCERT</span>
            </Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Nav className="gap-4 align-items-center">
                <Nav.Link href="#events">Home</Nav.Link>
                <Nav.Link href="/admin">Admin</Nav.Link>
                <Button variant="outline-warning" className="rounded-pill px-4 text-uppercase fw-bold">Login</Button>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <Container className="h-100 d-flex flex-column justify-content-center text-center">
          <h1 className="display-1 fw-black text-uppercase mb-0">Experience the Rhythm</h1>
          <p className="lead fs-3 opacity-75">Official tickets for Ethiopia's biggest artists.</p>
          <div className="mx-auto mt-4" style={{ maxWidth: '600px', width: '90%' }}>
            <Form.Control 
                className="rounded-pill py-3 px-4 bg-white bg-opacity-10 text-white border-secondary" 
                placeholder="Search by Artist or City..." 
            />
          </div>
        </Container>
      </div>

      {/* 2. Event Grid */}
      <Container id="events" className="py-5" style={{ marginTop: '-80px' }}>
        <h2 className="mb-4 fw-bold">Upcoming Concerts</h2>
        <Row className="g-4">
          {concerts.map((c) => (
            <Col key={c.id} xs={12} sm={6} lg={4}>
              <Card 
                className="bg-dark text-white border-0 shadow-lg h-100 overflow-hidden artist-card"
                onClick={() => handleOpenModal(c)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ height: '250px', overflow: 'hidden' }}>
                  <Card.Img variant="top" src={c.image} className="h-100 w-100 object-fit-cover" />
                </div>
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge bg="warning" text="dark">{c.city}</Badge>
                    <span className="small text-secondary">{c.date}</span>
                  </div>
                  <Card.Title className="fs-3 fw-bold">{c.artist}</Card.Title>
                  <Card.Text className="text-secondary small mb-3">{c.venue}</Card.Text>
                  <Button variant="outline-light" className="w-100 fw-bold">GET TICKETS</Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* 3. Selection Modal (The Popup) */}
      <Modal 
        show={showModal} 
        onHide={() => setShowModal(false)} 
        centered 
        contentClassName="bg-dark text-white border-secondary shadow-lg"
      >
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fw-bold">{activeEvent?.artist} - Tickets</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-secondary mb-4">{activeEvent?.description}</p>
          
          <h6 className="text-uppercase small fw-bold text-warning mb-3">1. Select Ticket Type</h6>
          <Row className="g-2 mb-4">
            {ticketTypes.map((t) => (
              <Col key={t.id} xs={6}>
                <div 
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3 rounded-3 border text-center transition-all ${selectedTicket.id === t.id ? 'border-warning bg-warning bg-opacity-10' : 'border-secondary'}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="fw-bold">{t.name}</div>
                  <div className="fs-5">${t.price}</div>
                </div>
              </Col>
            ))}
          </Row>

          <h6 className="text-uppercase small fw-bold text-warning mb-3">2. Quantity</h6>
          <InputGroup className="mb-4">
            <Button variant="outline-light" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
            <Form.Control className="bg-transparent text-white text-center fw-bold" value={quantity} readOnly />
            <Button variant="outline-light" onClick={() => setQuantity(q => q + 1)}>+</Button>
          </InputGroup>

          <hr className="border-secondary" />
          
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              <div className="text-secondary small">Total Payment</div>
              <div className="fs-3 fw-bold text-warning">${selectedTicket.price * quantity}</div>
            </div>
            <Button 
              variant="warning" 
              size="lg" 
              className="fw-bold px-4" 
              disabled={loading}
              onClick={handleBuy}
            >
              {loading ? "Loading..." : "BUY NOW"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <footer className="py-5 border-top border-secondary mt-5 text-center text-secondary">
        <p>© 2026 Ethio Concert Event Organization. All Rights Reserved.</p>
      </footer>

      <style>{`
        .artist-card { transition: transform 0.3s ease, border 0.3s ease; }
        .artist-card:hover { transform: translateY(-10px); border: 1px solid rgba(255,193,7,0.5) !important; }
        .fw-black { font-weight: 900; }
        .transition-all { transition: all 0.2s ease; }
      `}</style>
    </div>
  );
}

// Success/Cancel Components
function Success() { return <div className="vh-100 d-flex flex-column justify-content-center align-items-center bg-success text-white"> <Confetti /> <h1>Payment Successful! 🎉</h1> <Link to="/" className="btn btn-outline-light mt-3">Back to Home</Link> </div>; }
function Cancel() { return <div className="vh-100 d-flex flex-column justify-content-center align-items-center bg-danger text-white"> <h1>Payment Cancelled ❌</h1> <Link to="/" className="btn btn-outline-light mt-3">Try Again</Link> </div>; }

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;