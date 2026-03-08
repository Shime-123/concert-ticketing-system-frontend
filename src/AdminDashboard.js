import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Spinner, InputGroup, Pagination } from 'react-bootstrap';

function AdminDashboard() {
  // --- State Management ---
  const [stats, setStats] = useState({ 
    totalRevenue: 0, totalTickets: 0, recentPurchases: [], totalPages: 1, currentPage: 1 
  });
  const [concerts, setConcerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔍 Search & Pagination States
  const [concertSearch, setConcertSearch] = useState("");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  
  const [concertPage, setConcertPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
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
  const baseUrl = process.env.REACT_APP_API_URL || "https://concert-ticketing-system-backend.onrender.com";

  // --- 1. Fetch Logic ---
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, concertRes, userRes] = await Promise.all([
        fetch(`${baseUrl}/api/Admin/stats?page=${buyerPage}`),
        fetch(`${baseUrl}/api/Concerts`),
        fetch(`${baseUrl}/api/Admin/users`) 
      ]);
      
      const statsData = await statsRes.json();
      const concertData = await concertRes.json();
      const userData = await userRes.json();

      setStats(statsData);
      setConcerts(concertData);
      setUsers(userData || []); 
      setLoading(false);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setLoading(false);
    }
  }, [baseUrl, buyerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 📥 Export Logic ---
  const exportToCSV = () => {
    if (!stats.recentPurchases || stats.recentPurchases.length === 0) return alert("No data to export");
    const headers = ["Customer Email", "Concert Title", "Ticket Type", "Quantity", "Purchase Date"];
    const csvContent = [
      headers.join(","),
      ...stats.recentPurchases.map(b => [
        `"${b.userEmail}"`, `"${b.concertTitle}"`, `"${b.ticketType}"`, b.quantity, new Date(b.createdAt).toLocaleDateString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Sales_Export.csv`;
    link.click();
  };

  // --- Concert Handlers (The part that was missing) ---
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
    const res = await fetch(`${baseUrl}/api/Admin/update-concert/${editingConcert.concertId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editingConcert,
        regularPrice: parseFloat(editingConcert.regularPrice),
        vipPrice: parseFloat(editingConcert.vipPrice)
      })
    });
    if (res.ok) { setShowEditModal(false); fetchData(); }
  };

  const handleDeleteConcert = async (id) => {
    if (window.confirm("Delete this concert?")) {
      await fetch(`${baseUrl}/api/Admin/delete-concert/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // --- User Handlers ---
  const handleToggleSuspension = async (email) => {
    const res = await fetch(`${baseUrl}/api/Admin/toggle-suspension/${email}`, { method: 'PUT' });
    if (res.ok) fetchData();
  };

  const handleRoleChange = async (email, currentRole) => {
    const newRole = currentRole === "Admin" ? "Customer" : "Admin";
    await fetch(`${baseUrl}/api/Admin/update-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: newRole })
    });
    fetchData();
  };

  // --- 🔍 Pagination & Filter Logic ---
  const paginate = (items, page) => {
    const startIndex = (page - 1) * rowsPerPage;
    return items.slice(startIndex, startIndex + rowsPerPage);
  };

  const filteredConcerts = concerts.filter(c => 
    c.concertTitle.toLowerCase().includes(concertSearch.toLowerCase()) ||
    c.venue.toLowerCase().includes(concertSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredBuyers = (stats.recentPurchases || []).filter(b =>
    b.userEmail.toLowerCase().includes(buyerSearch.toLowerCase()) ||
    b.concertTitle.toLowerCase().includes(buyerSearch.toLowerCase())
  );

  if (loading) return <Container className="text-center py-5"><Spinner animation="border" variant="warning" /></Container>;

  return (
    <div className="bg-light min-vh-100 py-5 text-dark">
      <Container>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div><h1 className="fw-bold">Admin Panel</h1><p className="text-muted">Global Console</p></div>
          <div className="d-flex gap-2">
            <Button variant="outline-dark" className="rounded-pill px-4" onClick={exportToCSV}>Export CSV</Button>
            <Button variant="dark" className="rounded-pill px-4" onClick={() => setShowAddModal(true)}>+ Create Concert</Button>
          </div>
        </div>

        {/* 1. Live Events */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold">Live Events ({filteredConcerts.length})</h4>
          <Form.Control placeholder="Search events..." className="w-25 rounded-pill shadow-sm" onChange={e => setConcertSearch(e.target.value)} />
        </div>
        <Card className="shadow-sm border-0 mb-4 rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-dark"><tr><th>Status</th><th>Title</th><th>Venue</th><th>Date</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {paginate(filteredConcerts, concertPage).map(c => (
                <tr key={c.concertId}>
                  <td><Badge bg={c.isSoldOut ? "danger" : "success"}>{c.isSoldOut ? "SOLD OUT" : "LIVE"}</Badge></td>
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

        {/* 2. User Management */}
        <div className="d-flex justify-content-between align-items-center mb-3 mt-5">
          <h4 className="fw-bold">User Management</h4>
          <Form.Control placeholder="Search name, email, or role..." className="w-25 rounded-pill border-primary" onChange={e => setUserSearch(e.target.value)} />
        </div>
        <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4">
          <Table responsive hover className="mb-0">
            <thead className="table-warning"><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
            <tbody>
              {paginate(filteredUsers, userPage).map(u => (
                <tr key={u.email} style={{ opacity: u.isSuspended ? 0.5 : 1 }}>
                  <td>{u.name}</td><td>{u.email}</td>
                  <td><Badge bg={u.role === "Admin" ? "danger" : "secondary"}>{u.role}</Badge></td>
                  <td><Badge bg={u.isSuspended ? "danger" : "success"}>{u.isSuspended ? "SUSPENDED" : "ACTIVE"}</Badge></td>
                  <td className="text-end">
                    <Button variant="outline-dark" size="sm" className="me-2" onClick={() => handleRoleChange(u.email, u.role)}>Role</Button>
                    <Button variant={u.isSuspended ? "success" : "warning"} size="sm" onClick={() => handleToggleSuspension(u.email)}>{u.isSuspended ? "Unsuspend" : "Suspend"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* 3. Recent Transactions */}
        <h4 className="fw-bold mt-5 mb-3">Recent Transactions</h4>
        <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-4">
          <Table responsive className="mb-0">
            <thead className="table-light"><tr><th>Customer</th><th>Concert</th><th>Tier</th><th>Qty</th><th>Date</th></tr></thead>
            <tbody>
              {filteredBuyers.map((b, idx) => (
                <tr key={idx}>
                  <td>{b.userEmail}</td><td className="fw-bold">{b.concertTitle}</td>
                  <td><Badge bg="info" text="dark">{b.ticketType}</Badge></td>
                  <td>{b.quantity}</td><td>{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* --- MODALS --- */}
        {/* Add Modal */}
        <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered>
          <Form onSubmit={handleAddConcert}>
            <Modal.Header closeButton><Modal.Title className="fw-bold">Create New Event</Modal.Title></Modal.Header>
            <Modal.Body className="p-4 bg-light">
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
            <Modal.Footer><Button variant="dark" type="submit" className="w-100 fw-bold">Publish Event</Button></Modal.Footer>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
          {editingConcert && (
            <Form onSubmit={handleUpdateConcert}>
              <Modal.Header closeButton><Modal.Title className="fw-bold">Edit: {editingConcert.concertTitle}</Modal.Title></Modal.Header>
              <Modal.Body className="p-4 bg-light">
                <Row className="g-3">
                  <Col md={6}><Form.Label>Venue</Form.Label><Form.Control value={editingConcert.venue} onChange={e => setEditingConcert({...editingConcert, venue: e.target.value})} /></Col>
                  <Col md={6}><Form.Label>Date</Form.Label><Form.Control type="datetime-local" value={editingConcert.date?.substring(0, 16)} onChange={e => setEditingConcert({...editingConcert, date: e.target.value})} /></Col>
                  <Col md={3}><Form.Label>Reg Price</Form.Label><Form.Control type="number" value={editingConcert.regularPrice} onChange={e => setEditingConcert({...editingConcert, regularPrice: e.target.value})} /></Col>
                  <Col md={9}><Form.Label>Reg Stripe ID</Form.Label><Form.Control value={editingConcert.regularStripeId} onChange={e => setEditingConcert({...editingConcert, regularStripeId: e.target.value})} /></Col>
                  <Col md={3}><Form.Label>VIP Price</Form.Label><Form.Control type="number" value={editingConcert.vipPrice} onChange={e => setEditingConcert({...editingConcert, vipPrice: e.target.value})} /></Col>
                  <Col md={9}><Form.Label>VIP Stripe ID</Form.Label><Form.Control value={editingConcert.vipStripeId} onChange={e => setEditingConcert({...editingConcert, vipStripeId: e.target.value})} /></Col>
                </Row>
                <div className="mt-4 p-3 border rounded-3 bg-white">
                  <Form.Check type="switch" label={editingConcert.isSoldOut ? "EVENT IS SOLD OUT" : "EVENT IS ACTIVE"} checked={editingConcert.isSoldOut} onChange={e => setEditingConcert({...editingConcert, isSoldOut: e.target.checked})} />
                </div>
              </Modal.Body>
              <Modal.Footer><Button variant="primary" type="submit" className="w-100 fw-bold">Save All Changes</Button></Modal.Footer>
            </Form>
          )}
        </Modal>
      </Container>
    </div>
  );
}

export default AdminDashboard;