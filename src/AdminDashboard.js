import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Spinner, InputGroup, Pagination } from 'react-bootstrap';

function AdminDashboard() {
  // --- State Management ---
  const [stats, setStats] = useState({ totalRevenue: 0, totalTickets: 0 });
  const [concerts, setConcerts] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔍 Search & Pagination States
  const [concertSearch, setConcertSearch] = useState("");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [concertPage, setConcertPage] = useState(1);
  const [buyerPage, setBuyerPage] = useState(1);
  const rowsPerPage = 5;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [newConcert, setNewConcert] = useState({
    concertTitle: '', venue: '', date: '', imageUrl: '',
    regularPrice: '', regularStripeId: '', vipPrice: '', vipStripeId: '',
    isSoldOut: false
  });

  const [editingConcert, setEditingConcert] = useState(null);
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // --- 1. Fixed Fetch Logic with useCallback ---
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, concertRes] = await Promise.all([
        fetch(`${baseUrl}/api/Admin/stats`),
        fetch(`${baseUrl}/api/Concerts`)
      ]);
      const statsData = await statsRes.json();
      const concertData = await concertRes.json();

      setStats({
        totalRevenue: statsData.totalRevenue || 0,
        totalTickets: statsData.totalTickets || 0
      });
      setBuyers(statsData.recentPurchases || []);
      setConcerts(concertData);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // --- 📥 Export Logic ---
  const exportToCSV = () => {
    if (buyers.length === 0) return alert("No data to export");
    const headers = ["Customer Email", "Concert Title", "Ticket Type", "Quantity", "Purchase Date"];
    const csvContent = [
      headers.join(","),
      ...buyers.map(b => [
        `"${b.userEmail}"`, `"${b.concertTitle}"`, `"${b.ticketType}"`, b.quantity, new Date(b.createdAt).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EthioConcert_Sales_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  // --- 🔢 Pagination Logic ---
  const paginate = (items, page) => {
    const startIndex = (page - 1) * rowsPerPage;
    return items.slice(startIndex, startIndex + rowsPerPage);
  };

  const filteredConcerts = concerts.filter(c => 
    c.concertTitle.toLowerCase().includes(concertSearch.toLowerCase()) ||
    c.venue.toLowerCase().includes(concertSearch.toLowerCase())
  );

  const filteredBuyers = buyers.filter(b => 
    b.userEmail.toLowerCase().includes(buyerSearch.toLowerCase()) ||
    (b.concertTitle && b.concertTitle.toLowerCase().includes(buyerSearch.toLowerCase()))
  );

  const currentConcerts = paginate(filteredConcerts, concertPage);
  const currentBuyers = paginate(filteredBuyers, buyerPage);

  // --- Action Handlers ---
  const handleAddConcert = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseUrl}/api/Admin/add-concert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newConcert,
          regularPrice: parseFloat(newConcert.regularPrice),
          vipPrice: parseFloat(newConcert.vipPrice),
          isSoldOut: Boolean(newConcert.isSoldOut)
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewConcert({ concertTitle: '', venue: '', date: '', imageUrl: '', regularPrice: '', regularStripeId: '', vipPrice: '', vipStripeId: '', isSoldOut: false });
        fetchData(); 
      }
    } catch (err) { alert("Error adding concert"); }
  };

  const handleUpdateConcert = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseUrl}/api/Admin/update-concert/${editingConcert.concertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingConcert,
          regularPrice: parseFloat(editingConcert.regularPrice),
          vipPrice: parseFloat(editingConcert.vipPrice),
          isSoldOut: Boolean(editingConcert.isSoldOut)
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchData();
      }
    } catch (err) { alert("Error updating concert"); }
  };

  const handleDeleteConcert = async (id) => {
    if (window.confirm("Delete this concert? Sales history remains in DB.")) {
      try {
        const res = await fetch(`${baseUrl}/api/Admin/delete-concert/${id}`, { method: 'DELETE' });
        if (res.ok) fetchData();
      } catch (err) { alert("Error deleting concert"); }
    }
  };

  if (loading) return (
    <Container className="text-center py-5">
      <Spinner animation="border" variant="warning" />
    </Container>
  );

  return (
    <div className="bg-light min-vh-100 py-5 text-dark">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 className="fw-bold">Admin Panel</h1>
            <p className="text-muted">Manage your concert catalog and sales</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-dark" className="fw-bold px-4 rounded-pill" onClick={exportToCSV}>
              Export Sales (.CSV)
            </Button>
            <Button variant="dark" className="fw-bold px-4 rounded-pill" onClick={() => setShowAddModal(true)}>
              + Create Concert
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <Row className="mb-5 g-4 text-white">
          <Col md={6}><Card className="shadow-sm border-0 bg-primary p-4 rounded-4">
            <h6 className="text-uppercase opacity-75 small fw-bold">Gross Revenue</h6>
            <h2 className="fw-bold mb-0">${stats.totalRevenue.toLocaleString()}</h2>
          </Card></Col>
          <Col md={6}><Card className="shadow-sm border-0 bg-success p-4 rounded-4">
            <h6 className="text-uppercase opacity-75 small fw-bold">Tickets Sold</h6>
            <h2 className="fw-bold mb-0">{stats.totalTickets}</h2>
          </Card></Col>
        </Row>

        {/* Live Events Table */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">Live Events ({filteredConcerts.length})</h4>
          <InputGroup style={{ maxWidth: '300px' }}>
            <Form.Control 
              placeholder="Search events..." 
              value={concertSearch}
              onChange={(e) => {setConcertSearch(e.target.value); setConcertPage(1);}}
              className="rounded-pill px-3 shadow-sm"
            />
          </InputGroup>
        </div>

        <Card className="shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-dark">
              <tr><th>Status</th><th>Title</th><th>Venue</th><th>Date</th><th className="text-end">Actions</th></tr>
            </thead>
            <tbody>
              {currentConcerts.map(c => (
                <tr key={c.concertId}>
                  <td>{c.isSoldOut ? <Badge bg="danger">SOLD OUT</Badge> : <Badge bg="success">LIVE</Badge>}</td>
                  <td className="fw-bold">{c.concertTitle}</td>
                  <td>{c.venue}</td>
                  <td>{new Date(c.date).toLocaleDateString()}</td>
                  <td className="text-end">
                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => { setEditingConcert(c); setShowEditModal(true); }}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteConcert(c.concertId)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        
        {/* Events Pagination */}
        {filteredConcerts.length > rowsPerPage && (
          <div className="d-flex justify-content-center mb-5">
            <Pagination>
              {[...Array(Math.ceil(filteredConcerts.length / rowsPerPage))].map((_, i) => (
                <Pagination.Item key={i+1} active={i+1 === concertPage} onClick={() => setConcertPage(i+1)}>
                  {i+1}
                </Pagination.Item>
              ))}
            </Pagination>
          </div>
        )}

        {/* Transactions Table */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">Recent Transactions ({filteredBuyers.length})</h4>
          <InputGroup style={{ maxWidth: '300px' }}>
            <Form.Control 
              placeholder="Search by email..." 
              value={buyerSearch}
              onChange={(e) => {setBuyerSearch(e.target.value); setBuyerPage(1);}}
              className="rounded-pill px-3 shadow-sm"
            />
          </InputGroup>
        </div>

        <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4">
          <Table responsive className="mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Customer</th><th>Concert</th><th>Tier</th><th>Qty</th><th>Date</th></tr>
            </thead>
            <tbody>
              {currentBuyers.map((b, idx) => (
                <tr key={idx}>
                  <td>{b.userEmail}</td>
                  <td className="small fw-bold">{b.concertTitle}</td>
                  <td><Badge bg="info" text="dark">{b.ticketType}</Badge></td>
                  <td>{b.quantity}</td>
                  <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* Buyers Pagination */}
        {filteredBuyers.length > rowsPerPage && (
          <div className="d-flex justify-content-center">
            <Pagination>
              {[...Array(Math.ceil(filteredBuyers.length / rowsPerPage))].map((_, i) => (
                <Pagination.Item key={i+1} active={i+1 === buyerPage} onClick={() => setBuyerPage(i+1)}>
                  {i+1}
                </Pagination.Item>
              ))}
            </Pagination>
          </div>
        )}

        {/* --- MODALS (Edit & Add) remain the same as your code --- */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
          {editingConcert && (
            <Form onSubmit={handleUpdateConcert}>
              <Modal.Header closeButton><Modal.Title className="fw-bold">Update Event</Modal.Title></Modal.Header>
              <Modal.Body className="p-4">
                <Row className="g-3 mb-3">
                  <Col md={6}><Form.Label className="small fw-bold">Title</Form.Label><Form.Control value={editingConcert.concertTitle} onChange={e => setEditingConcert({...editingConcert, concertTitle: e.target.value})} /></Col>
                  <Col md={6}><Form.Label className="small fw-bold">Venue</Form.Label><Form.Control value={editingConcert.venue} onChange={e => setEditingConcert({...editingConcert, venue: e.target.value})} /></Col>
                  <Col md={6}><Form.Label className="small fw-bold">Date</Form.Label><Form.Control type="datetime-local" value={editingConcert.date?.substring(0, 16)} onChange={e => setEditingConcert({...editingConcert, date: e.target.value})} /></Col>
                  <Col md={6}><Form.Label className="small fw-bold">Poster URL</Form.Label><Form.Control value={editingConcert.imageUrl} onChange={e => setEditingConcert({...editingConcert, imageUrl: e.target.value})} /></Col>
                </Row>
                <hr />
                <Row className="g-3 mb-3">
                  <Col md={6}><Form.Label className="small fw-bold text-primary">Regular Price ($)</Form.Label><Form.Control type="number" value={editingConcert.regularPrice} onChange={e => setEditingConcert({...editingConcert, regularPrice: e.target.value})} /></Col>
                  <Col md={6}><Form.Label className="small fw-bold text-primary">Regular Stripe Price ID</Form.Label><Form.Control value={editingConcert.regularStripeId} onChange={e => setEditingConcert({...editingConcert, regularStripeId: e.target.value})} /></Col>
                  <Col md={6}><Form.Label className="small fw-bold text-info">VIP Price ($)</Form.Label><Form.Control type="number" value={editingConcert.vipPrice} onChange={e => setEditingConcert({...editingConcert, vipPrice: e.target.value})} /></Col>
                  <Col md={6}><Form.Label className="small fw-bold text-info">VIP Stripe Price ID</Form.Label><Form.Control value={editingConcert.vipStripeId} onChange={e => setEditingConcert({...editingConcert, vipStripeId: e.target.value})} /></Col>
                </Row>
                <div className={`p-3 rounded-3 border ${editingConcert.isSoldOut ? 'bg-danger-subtle' : 'bg-success-subtle'}`}>
                  <Form.Check type="switch" label={editingConcert.isSoldOut ? "CONCERT IS SOLD OUT" : "CONCERT IS ACTIVE"} checked={editingConcert.isSoldOut} className="fw-bold" onChange={e => setEditingConcert({...editingConcert, isSoldOut: e.target.checked})} />
                </div>
              </Modal.Body>
              <Modal.Footer><Button variant="primary" type="submit" className="px-5 fw-bold">Update Everything</Button></Modal.Footer>
            </Form>
          )}
        </Modal>

        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
           <Form onSubmit={handleAddConcert}>
            <Modal.Header closeButton><Modal.Title className="fw-bold">Create New Event</Modal.Title></Modal.Header>
            <Modal.Body className="p-4">
              <Row className="g-3">
                <Col md={6}><Form.Label>Title</Form.Label><Form.Control required onChange={e => setNewConcert({...newConcert, concertTitle: e.target.value})} /></Col>
                <Col md={6}><Form.Label>Venue</Form.Label><Form.Control required onChange={e => setNewConcert({...newConcert, venue: e.target.value})} /></Col>
                <Col md={6}><Form.Label>Date</Form.Label><Form.Control type="datetime-local" required onChange={e => setNewConcert({...newConcert, date: e.target.value})} /></Col>
                <Col md={6}><Form.Label>Poster URL</Form.Label><Form.Control required onChange={e => setNewConcert({...newConcert, imageUrl: e.target.value})} /></Col>
                <Col md={3}><Form.Label>Reg Price</Form.Label><Form.Control type="number" required onChange={e => setNewConcert({...newConcert, regularPrice: e.target.value})} /></Col>
                <Col md={9}><Form.Label>Reg Stripe Price ID</Form.Label><Form.Control required onChange={e => setNewConcert({...newConcert, regularStripeId: e.target.value})} /></Col>
                <Col md={3}><Form.Label>VIP Price</Form.Label><Form.Control type="number" required onChange={e => setNewConcert({...newConcert, vipPrice: e.target.value})} /></Col>
                <Col md={9}><Form.Label>VIP Stripe Price ID</Form.Label><Form.Control required onChange={e => setNewConcert({...newConcert, vipStripeId: e.target.value})} /></Col>
              </Row>
            </Modal.Body>
            <Modal.Footer><Button variant="dark" type="submit">Publish Event</Button></Modal.Footer>
          </Form>
        </Modal>

      </Container>
    </div>
  );
}

export default AdminDashboard;