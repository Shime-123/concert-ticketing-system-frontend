import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Spinner, InputGroup, Pagination } from 'react-bootstrap';

function AdminDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalTickets: 0 });
  const [concerts, setConcerts] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [concertSearch, setConcertSearch] = useState("");
  const [buyerPage, setBuyerPage] = useState(1);
  const [totalBuyerPages, setTotalBuyerPages] = useState(1);
  const rowsPerPage = 5;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newConcert, setNewConcert] = useState({
    concertTitle: '', venue: '', date: '', imageUrl: '',
    regularPrice: '', regularStripeId: '', vipPrice: '', vipStripeId: '', isSoldOut: false
  });
  const [editingConcert, setEditingConcert] = useState(null);

  const baseUrl = process.env.REACT_APP_API_URL || "https://concert-ticketing-system-backend.onrender.com";

  // --- 1. CORE FETCH LOGIC ---
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, concertRes, usersRes] = await Promise.all([
        fetch(`${baseUrl}/api/Admin/stats?page=${buyerPage}`),
        fetch(`${baseUrl}/api/Concerts`),
        fetch(`${baseUrl}/api/Admin/users`)
      ]);
      const sData = await statsRes.json();
      setStats({ totalRevenue: sData.totalRevenue, totalTickets: sData.totalTickets });
      setBuyers(sData.recentPurchases || []);
      setTotalBuyerPages(sData.totalPages || 1);
      setConcerts(await concertRes.json());
      setUsers(await usersRes.json());
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  }, [baseUrl, buyerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 2. USER MANAGEMENT HANDLERS ---
  const handleToggleSuspension = async (email) => {
    await fetch(`${baseUrl}/api/Admin/toggle-suspension/${email}`, { method: 'PUT' });
    fetchData();
  };

  const handleRoleUpdate = async (email, role) => {
    await fetch(`${baseUrl}/api/Admin/update-role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    });
    fetchData();
  };

  // --- 3. CONCERT CRUD HANDLERS ---
  const handleAddConcert = async (e) => {
    e.preventDefault();
    const res = await fetch(`${baseUrl}/api/Admin/add-concert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newConcert, regularPrice: parseFloat(newConcert.regularPrice), vipPrice: parseFloat(newConcert.vipPrice) })
    });
    if (res.ok) { setShowAddModal(false); fetchData(); }
  };

  const handleUpdateConcert = async (e) => {
    e.preventDefault();
    const res = await fetch(`${baseUrl}/api/Admin/update-concert/${editingConcert.concertId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingConcert)
    });
    if (res.ok) { setShowEditModal(false); fetchData(); }
  };

  const handleDeleteConcert = async (id) => {
    if (window.confirm("Delete this event?")) {
      await fetch(`${baseUrl}/api/Admin/delete-concert/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  if (loading) return <Container className="text-center py-5"><Spinner animation="border" variant="warning" /></Container>;

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h1 className="fw-bold">Admin Panel</h1>
          <Button variant="dark" className="rounded-pill px-4" onClick={() => setShowAddModal(true)}>+ Create Concert</Button>
        </div>

        {/* STATS SECTION */}
        <Row className="mb-5 g-4">
          <Col md={6}><Card className="bg-primary text-white border-0 shadow-sm p-4 rounded-4"><h6>Revenue</h6><h2>${stats.totalRevenue.toLocaleString()}</h2></Card></Col>
          <Col md={6}><Card className="bg-success text-white border-0 shadow-sm p-4 rounded-4"><h6>Tickets Sold</h6><h2>{stats.totalTickets}</h2></Card></Col>
        </Row>

        {/* USER MANAGEMENT SECTION */}
        <h4 className="fw-bold mb-3">User Control</h4>
        <Card className="shadow-sm border-0 mb-5 rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light"><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.email}>
                  <td>{u.name}</td><td>{u.email}</td>
                  <td>
                    <Form.Select size="sm" value={u.role} onChange={(e) => handleRoleUpdate(u.email, e.target.value)}>
                      <option value="Customer">Customer</option><option value="Admin">Admin</option>
                    </Form.Select>
                  </td>
                  <td><Badge bg={u.isSuspended ? 'danger' : 'success'}>{u.isSuspended ? 'Suspended' : 'Active'}</Badge></td>
                  <td><Button size="sm" variant="outline-dark" onClick={() => handleToggleSuspension(u.email)}>Toggle</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* CONCERT MANAGEMENT SECTION */}
        <div className="d-flex justify-content-between mb-3"><h4 className="fw-bold">Live Events</h4>
          <InputGroup style={{maxWidth: '250px'}}><Form.Control placeholder="Search..." onChange={(e) => setConcertSearch(e.target.value)} /></InputGroup>
        </div>
        <Card className="shadow-sm border-0 mb-5 rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0">
            <thead className="table-dark"><tr><th>Status</th><th>Title</th><th>Venue</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {concerts.filter(c => c.concertTitle.toLowerCase().includes(concertSearch.toLowerCase())).map(c => (
                <tr key={c.concertId}>
                  <td>{c.isSoldOut ? <Badge bg="danger">SOLD OUT</Badge> : <Badge bg="success">LIVE</Badge>}</td>
                  <td className="fw-bold">{c.concertTitle}</td><td>{c.venue}</td>
                  <td className="text-end">
                    <Button variant="link" size="sm" onClick={() => { setEditingConcert(c); setShowEditModal(true); }}>Edit</Button>
                    <Button variant="link" size="sm" className="text-danger" onClick={() => handleDeleteConcert(c.concertId)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* TRANSACTIONS SECTION */}
        <h4 className="fw-bold mb-3">Sales History</h4>
        <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0">
            <thead className="table-light"><tr><th>Customer</th><th>Event</th><th>Tier</th><th>Qty</th></tr></thead>
            <tbody>
              {buyers.map((b, i) => (
                <tr key={i}><td>{b.userEmail}</td><td className="small">{b.concertTitle}</td><td>{b.ticketType}</td><td>{b.quantity}</td></tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Pagination className="justify-content-center mt-3">
          {[...Array(totalBuyerPages)].map((_, i) => (
            <Pagination.Item key={i+1} active={i+1 === buyerPage} onClick={() => setBuyerPage(i+1)}>{i+1}</Pagination.Item>
          ))}
        </Pagination>

        {/* ADD CONCERT MODAL */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
          <Form onSubmit={handleAddConcert}>
            <Modal.Header closeButton><Modal.Title>New Event</Modal.Title></Modal.Header>
            <Modal.Body><Row className="g-3">
                <Col md={6}><Form.Label>Title</Form.Label><Form.Control required onChange={e => setNewConcert({...newConcert, concertTitle: e.target.value})} /></Col>
                <Col md={6}><Form.Label>Venue</Form.Label><Form.Control required onChange={e => setNewConcert({...newConcert, venue: e.target.value})} /></Col>
                <Col md={6}><Form.Label>Date</Form.Label><Form.Control type="datetime-local" required onChange={e => setNewConcert({...newConcert, date: e.target.value})} /></Col>
                <Col md={6}><Form.Label>Image URL</Form.Label><Form.Control required onChange={e => setNewConcert({...newConcert, imageUrl: e.target.value})} /></Col>
                <Col md={3}><Form.Label>Reg Price</Form.Label><Form.Control type="number" required onChange={e => setNewConcert({...newConcert, regularPrice: e.target.value})} /></Col>
                <Col md={9}><Form.Label>Reg Stripe ID</Form.Label><Form.Control required onChange={e => setNewConcert({...newConcert, regularStripeId: e.target.value})} /></Col>
                <Col md={3}><Form.Label>VIP Price</Form.Label><Form.Control type="number" required onChange={e => setNewConcert({...newConcert, vipPrice: e.target.value})} /></Col>
                <Col md={9}><Form.Label>VIP Stripe ID</Form.Label><Form.Control required onChange={e => setNewConcert({...newConcert, vipStripeId: e.target.value})} /></Col>
            </Row></Modal.Body>
            <Modal.Footer><Button variant="dark" type="submit">Publish</Button></Modal.Footer>
          </Form>
        </Modal>

        {/* EDIT CONCERT MODAL */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
          {editingConcert && (
            <Form onSubmit={handleUpdateConcert}>
              <Modal.Header closeButton><Modal.Title>Edit Event</Modal.Title></Modal.Header>
              <Modal.Body><Row className="g-3">
                <Col md={6}><Form.Label>Title</Form.Label><Form.Control value={editingConcert.concertTitle} onChange={e => setEditingConcert({...editingConcert, concertTitle: e.target.value})} /></Col>
                <Col md={6}><Form.Label>Venue</Form.Label><Form.Control value={editingConcert.venue} onChange={e => setEditingConcert({...editingConcert, venue: e.target.value})} /></Col>
                <Col md={12}><Form.Check type="switch" label="Mark as Sold Out" checked={editingConcert.isSoldOut} onChange={e => setEditingConcert({...editingConcert, isSoldOut: e.target.checked})} /></Col>
              </Row></Modal.Body>
              <Modal.Footer><Button variant="primary" type="submit">Save Changes</Button></Modal.Footer>
            </Form>
          )}
        </Modal>

      </Container>
    </div>
  );
}

export default AdminDashboard;