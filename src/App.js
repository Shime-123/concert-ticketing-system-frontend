import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Button, Card, Badge, Navbar, Nav, Form, Modal, InputGroup, Dropdown } from "react-bootstrap";
import AdminDashboard from './AdminDashboard';
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthModal from "./components/AuthModal";
import AboutUs from './AboutUs';
import Cancel from './Cancel';
import History from './History';
import Success from './Success';

function Home() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  
  const [concerts, setConcerts] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [showModal, setShowModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConcerts = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Concerts`);
        const data = await res.json();
        setConcerts(data);
      } catch (err) {
        console.error("Failed to fetch concerts", err);
      }
    };
    fetchConcerts();
  }, []);

  const filteredConcerts = concerts.filter(c => 
    c.concertTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.venue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (concert) => {
    if (concert.isSoldOut) return; 
    setActiveEvent(concert);
    setSelectedTicket({
      id: concert.regularStripeId,
      name: "Regular Pass",
      price: concert.regularPrice
    });
    setQuantity(1);
    setShowModal(true);
  };

const handleBuy = async () => {
  if (!isAuthenticated) {
    setShowModal(false);
    setShowAuthModal(true);
    return;
  }

  setLoading(true);
  try {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/Stripe/create-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: selectedTicket.id,
        quantity: quantity,
        ticketType: selectedTicket.name,
        concertId: activeEvent.concertId,
        concertTitle: activeEvent.concertTitle,
        venue: activeEvent.venue,
        userEmail: user.email // Ensure this is definitely user.email
      }),
    });

    // 🚀 NEW: Check for the 403 Forbidden status (Suspended)
    if (res.status === 403) {
      const data = await res.json();
      alert(data.message || "Your account is suspended. Purchase denied.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    if (data.url) window.location.href = data.url;
  } catch (err) {
    alert("Error connecting to server.");
  }
  setLoading(false);
};

  const getAvailableTickets = () => {
    if (!activeEvent) return [];
    return [
      { id: activeEvent.regularStripeId, name: "Regular Pass", price: activeEvent.regularPrice },
      { id: activeEvent.vipStripeId, name: "VIP Experience", price: activeEvent.vipPrice }
    ];
  };

  return (
    <div className="bg-black text-white min-vh-100">
      <div style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,1)), url('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1920&q=80')`,
        backgroundSize: 'cover', backgroundPosition: 'center', height: '60vh'
      }}>
        <Navbar variant="dark" expand="lg" className="pt-4">
          <Container>
            <Navbar.Brand className="fw-bold fs-3">ETHIO <span className="text-warning">CONCERT</span></Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Nav className="gap-4 align-items-center">
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                <Nav.Link as={Link} to="/about">About Us</Nav.Link>
                {!isAuthenticated ? (
                  <Button variant="outline-warning" className="rounded-pill px-4 fw-bold" onClick={() => setShowAuthModal(true)}>Login</Button>
                ) : (
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="warning" className="rounded-pill px-4 fw-bold">
                      {user.name?.split(' ')[0]}
                    </Dropdown.Toggle>
                    <Dropdown.Menu variant="dark" className="border-secondary shadow-lg">
                      {isAdmin && <Dropdown.Item as={Link} to="/admin" className="text-warning fw-bold">Admin Dashboard</Dropdown.Item>}
                      <Dropdown.Item as={Link} to="/history">Purchase History</Dropdown.Item>
                      <Dropdown.Divider className="bg-secondary" />
                      <Dropdown.Item onClick={logout} className="text-danger">Logout</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Container className="h-100 d-flex flex-column justify-content-center text-center">
          <h1 className="display-1 fw-black text-uppercase mb-0">Experience the Rhythm</h1>
          <p className="lead fs-3 opacity-75">Official tickets for Ethiopia's biggest events.</p>
        </Container>
      </div>

      <Container id="events" className="py-5" style={{ marginTop: '-80px' }}>
        <div className="d-md-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-3 mb-md-0">Upcoming Concerts</h2>
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <Form.Control 
              type="text" 
              placeholder="Search by artist or venue..." 
              className="bg-dark text-white border-secondary rounded-pill px-4 py-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Row className="g-4">
          {filteredConcerts.length > 0 ? (
            filteredConcerts.map((c) => (
              <Col key={c.concertId} xs={12} sm={6} lg={4}>
                <Card 
                  className={`bg-dark text-white border-0 shadow-lg h-100 ${c.isSoldOut ? 'opacity-75' : ''}`} 
                  onClick={() => handleOpenModal(c)} 
                  style={{cursor: c.isSoldOut ? 'not-allowed' : 'pointer'}}
                >
                  <div className="position-relative">
                    <Card.Img variant="top" src={c.imageUrl} style={{ height: '250px', objectFit: 'cover' }} />
                    {c.isSoldOut && (
                      <div className="position-absolute top-50 start-50 translate-middle w-100 text-center">
                        <Badge bg="danger" className="fs-4 px-4 py-2 shadow-lg">SOLD OUT</Badge>
                      </div>
                    )}
                  </div>
                  <Card.Body className="p-4">
                    <Badge bg="warning" text="dark" className="mb-2">{c.venue}</Badge>
                    <Card.Title className="fs-3 fw-bold">{c.concertTitle}</Card.Title>
                    <Button 
                      variant={c.isSoldOut ? "secondary" : "outline-light"} 
                      className="w-100 fw-bold mt-3"
                      disabled={c.isSoldOut}
                    >
                      {c.isSoldOut ? "NO TICKETS LEFT" : "GET TICKETS"}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col className="text-center py-5">
              <h4 className="text-secondary">No concerts found matching "{searchTerm}"</h4>
            </Col>
          )}
        </Row>
      </Container>
      
      {/* 🎫 TICKET SELECTION MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered contentClassName="bg-dark text-white border-secondary shadow-lg">
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title className="fw-bold">{activeEvent?.concertTitle} - Tickets</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-secondary mb-4">{activeEvent?.venue} | {activeEvent?.date && new Date(activeEvent.date).toLocaleDateString()}</p>
          
          <h6 className="text-uppercase small fw-bold text-warning mb-3">1. Select Ticket Type</h6>
          <Row className="g-2 mb-4">
            {getAvailableTickets().map((t) => (
              <Col key={t.id} xs={6}>
                <div 
                  onClick={() => setSelectedTicket(t)}
                  className={`p-3 rounded-3 border text-center ${selectedTicket?.id === t.id ? 'border-warning bg-warning bg-opacity-10' : 'border-secondary'}`}
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
            <Form.Control className="bg-transparent text-white text-center fw-bold shadow-none" value={quantity} readOnly />
            <Button variant="outline-light" onClick={() => setQuantity(q => q + 1)}>+</Button>
          </InputGroup>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              <div className="text-secondary small">Total Payment</div>
              <div className="fs-3 fw-bold text-warning">${(selectedTicket?.price || 0) * quantity}</div>
            </div>
<Button 
  variant="warning" 
  size="lg" 
  className="fw-bold px-4" 
  onClick={handleBuy} 
  // 🚀 Disable button if loading, no ticket, OR user is suspended
  disabled={loading || !selectedTicket || (user && user.isSuspended)}
>
  {loading ? "Loading..." : 
   (user && user.isSuspended) ? "ACCOUNT SUSPENDED" : 
   isAuthenticated ? "BUY NOW" : "LOGIN TO PURCHASE"}
</Button>
          </div>
        </Modal.Body>
      </Modal>

      <AuthModal show={showAuthModal} onHide={() => setShowAuthModal(false)} />
      
      <footer className="py-5 border-top border-secondary mt-5 text-center text-secondary">
        <p>© 2026 Ethio Concert Organization.</p>
      </footer>
    </div>
  );
}

function AppContent() {
  const { isAdmin } = useAuth();
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/history" element={<History />} />
        <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;









/*const concerts = [

  { id: "teddy-afro", concertTitle: "Teddy Afro", city: "Addis Ababa", venue: "Ghion Hotel", date: "Mar 25, 2026", image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80", description: "The return of the King of Ethiopian Pop. A night of history and unity." },

  { id: "rophnan", concertTitle: "Rophnan", city: "Hawassa", venue: "Millennium Hall", date: "April 12, 2026", image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=800&q=80", description: "A journey through electronic sounds and Ethiopian heritage." },

  { id: "aster-aweke", concertTitle: "Aster Aweke", city: "Addis Ababa", venue: "Hilton Hotel", date: "May 05, 2026", image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=800&q=80", description: "An intimate evening with the legendary diva." }

]; 



// Ticket types remain static as they are usually defined by Stripe

const ticketTypes = [

  { id: "price_1Sb2qGAHsf5qLygtX9usvGhK", name: "Regular Pass", price: 20 },

  { id: "price_1Sb2qGAHsf5qLygtkdLVegxh", name: "VIP Experience", price: 50 }

];*/

