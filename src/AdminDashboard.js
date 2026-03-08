import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Spinner, InputGroup, Pagination } from 'react-bootstrap';

function AdminDashboard() {
  const [stats, setStats] = useState({ totalRevenue: 0, totalTickets: 0 });
  const [concerts, setConcerts] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search States
  const [concertSearch, setConcertSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [salesSearch, setSalesSearch] = useState("");

  // Pagination States
  const [buyerPage, setBuyerPage] = useState(1);
  const [totalBuyerPages, setTotalBuyerPages] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const itemsPerPage = 5;

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    concertId: 0,
    concertTitle: '',
    venue: '',
    date: new Date().toISOString().slice(0, 16),
    imageUrl: '',
    regularPrice: 0,
    regularStripeId: '',
    vipPrice: 0,
    vipStripeId: '',
    isSoldOut: false
  });

  const baseUrl = process.env.REACT_APP_API_URL || "https://concert-ticketing-system-backend.onrender.com";

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

  // --- 📥 Export Logic ---
  const exportToCSV = () => {
    if (buyers.length === 0) return alert("No data to export");
    const headers = ["Customer Email", "Concert Title", "Ticket Type", "Quantity", "Purchase Date"];
    const csvContent = [
      headers.join(","),
      ...buyers.map(b => [
        `"${b.userEmail}"`, `"${b.concertTitle}"`, `"${b.ticketType}"`, b.quantity, `"${new Date(b.createdAt || Date.now()).toLocaleDateString()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EthioConcert_Sales_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

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

  const handleOpenModal = (concert = null) => {
    if (concert) {
      setIsEditMode(true);
      setFormData({ ...concert, date: concert.date ? concert.date.substring(0, 16) : "" });
    } else {
      setIsEditMode(false);
      setFormData({ concertId: 0, concertTitle: '', venue: '', date: new Date().toISOString().slice(0, 16), imageUrl: '', regularPrice: 0, regularStripeId: '', vipPrice: 0, vipStripeId: '', isSoldOut: false });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isEditMode ? `${baseUrl}/api/Admin/update-concert/${formData.concertId}` : `${baseUrl}/api/Admin/add-concert`;
    const payload = { ...formData, Date: new Date(formData.date).toISOString() };
    const res = await fetch(endpoint, {
      method: isEditMode ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) { setShowModal(false); fetchData(); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this event?")) {
      await fetch(`${baseUrl}/api/Admin/delete-concert/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  // --- Search & Frontend Pagination Logic ---
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);

  const filteredSales = buyers.filter(b => 
    b.userEmail.toLowerCase().includes(salesSearch.toLowerCase()) || 
    b.concertTitle.toLowerCase().includes(salesSearch.toLowerCase())
  );

  if (loading) return <Container className="text-center py-5"><Spinner animation="border" variant="warning" /></Container>;

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold text-dark">Admin Dashboard</h1>
          <div className="d-flex gap-2">
            <Button variant="outline-success" className="rounded-pill px-4" onClick={exportToCSV}>Export CSV</Button>
            <Button variant="dark" className="rounded-pill px-4 shadow-sm" onClick={() => handleOpenModal()}>+ Create Concert</Button>
          </div>
        </div>

        {/* METRICS */}
        <Row className="mb-5 g-4">
          <Col md={6}><Card className="bg-primary text-white border-0 shadow-sm p-4 rounded-4"><h6>Total Revenue</h6><h2>${stats.totalRevenue.toLocaleString()}</h2></Card></Col>
          <Col md={6}><Card className="bg-success text-white border-0 shadow-sm p-4 rounded-4"><h6>Tickets Sold</h6><h2>{stats.totalTickets}</h2></Card></Col>
        </Row>

        {/* CONCERTS */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">Live Events</h4>
          <InputGroup style={{ maxWidth: '300px' }}>
            <Form.Control placeholder="Search events..." value={concertSearch} onChange={(e) => setConcertSearch(e.target.value)} className="rounded-pill shadow-sm" />
          </InputGroup>
        </div>
        <Card className="shadow-sm border-0 mb-5 rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-dark"><tr><th>Status</th><th>Title</th><th>Venue</th><th>Date</th><th className="text-end px-4">Actions</th></tr></thead>
            <tbody>
              {concerts.filter(c => c.concertTitle.toLowerCase().includes(concertSearch.toLowerCase()))
                .sort((a, b) => new Date(a.date) - new Date(b.date)).map(c => (
                  <tr key={c.concertId}>
                    <td>{c.isSoldOut ? <Badge bg="danger">SOLD OUT</Badge> : <Badge bg="success">LIVE</Badge>}</td>
                    <td className="fw-bold">{c.concertTitle}</td><td>{c.venue}</td>
                    <td className="small text-muted">{new Date(c.date).toLocaleDateString()}</td>
                    <td className="text-end px-4">
                      <Button variant="link" onClick={() => handleOpenModal(c)}>Edit</Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleDelete(c.concertId)}>Delete</Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </Card>

        {/* USER CONTROL */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">User Control</h4>
          <InputGroup style={{ maxWidth: '300px' }}>
            <Form.Control placeholder="Search users..." value={userSearch} onChange={(e) => {setUserSearch(e.target.value); setUserPage(1);}} className="rounded-pill shadow-sm" />
          </InputGroup>
        </div>
        <Card className="shadow-sm border-0 mb-5 rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light"><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {paginatedUsers.map(u => (
                <tr key={u.email}>
                  <td>{u.name}</td><td>{u.email}</td>
                  <td>
                    <Form.Select size="sm" value={u.role} onChange={(e) => handleRoleUpdate(u.email, e.target.value)}>
                      <option value="Customer">Customer</option><option value="Admin">Admin</option>
                    </Form.Select>
                  </td>
                  <td><Badge bg={u.isSuspended ? 'danger' : 'success'}>{u.isSuspended ? 'Suspended' : 'Active'}</Badge></td>
                  <td><Button size="sm" variant="outline-dark" onClick={() => handleToggleSuspension(u.email)}>Suspend</Button></td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination className="justify-content-center p-3 mb-0 border-top">
            {[...Array(Math.ceil(filteredUsers.length / itemsPerPage))].map((_, i) => (
              <Pagination.Item key={i+1} active={i+1 === userPage} onClick={() => setUserPage(i+1)}>{i+1}</Pagination.Item>
            ))}
          </Pagination>
        </Card>

        {/* SALES HISTORY */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold mb-0">Sales History</h4>
          <InputGroup style={{ maxWidth: '300px' }}>
            <Form.Control placeholder="Search sales..." value={salesSearch} onChange={(e) => setSalesSearch(e.target.value)} className="rounded-pill shadow-sm" />
          </InputGroup>
        </div>
        <Card className="shadow-sm border-0 rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light"><tr><th>Customer</th><th>Event</th><th>Tier</th><th>Qty</th></tr></thead>
            <tbody>
              {filteredSales.map((b, i) => (
                <tr key={i}><td>{b.userEmail}</td><td className="small">{b.concertTitle}</td><td>{b.ticketType}</td><td>{b.quantity}</td></tr>
              ))}
            </tbody>
          </Table>
          <Pagination className="justify-content-center p-3 mb-0 border-top">
            {[...Array(totalBuyerPages)].map((_, i) => (
              <Pagination.Item key={i+1} active={i+1 === buyerPage} onClick={() => setBuyerPage(i+1)}>{i+1}</Pagination.Item>
            ))}
          </Pagination>
        </Card>

        {/* MODAL IS NOW OUTSIDE OF ALL CARDS TO PREVENT BLUR ISSUE */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered animation={false}>
          <Form onSubmit={handleSubmit}>
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="fw-bold">{isEditMode ? 'Edit Concert' : 'New Concert'}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <Row className="g-3">
                <Col md={6}><Form.Label className="small fw-bold">Title</Form.Label><Form.Control required value={formData.concertTitle} onChange={e => setFormData({...formData, concertTitle: e.target.value})} /></Col>
                <Col md={6}><Form.Label className="small fw-bold">Venue</Form.Label><Form.Control required value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} /></Col>
                <Col md={6}><Form.Label className="small fw-bold">Date</Form.Label><Form.Control type="datetime-local" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></Col>
                <Col md={6}><Form.Label className="small fw-bold">Image URL</Form.Label><Form.Control required value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} /></Col>
                <Col md={3}><Form.Label className="small fw-bold text-primary">Reg $</Form.Label><Form.Control type="number" step="0.01" required value={formData.regularPrice} onChange={e => setFormData({...formData, regularPrice: e.target.value})} /></Col>
                <Col md={9}><Form.Label className="small fw-bold text-primary">Reg Stripe ID</Form.Label><Form.Control required value={formData.regularStripeId} onChange={e => setFormData({...formData, regularStripeId: e.target.value})} /></Col>
                <Col md={3}><Form.Label className="small fw-bold text-info">VIP $</Form.Label><Form.Control type="number" step="0.01" required value={formData.vipPrice} onChange={e => setFormData({...formData, vipPrice: e.target.value})} /></Col>
                <Col md={9}><Form.Label className="small fw-bold text-info">VIP Stripe ID</Form.Label><Form.Control required value={formData.vipStripeId} onChange={e => setFormData({...formData, vipStripeId: e.target.value})} /></Col>
                <Col md={12}><Form.Check type="switch" label="Sold Out?" checked={formData.isSoldOut} onChange={e => setFormData({...formData, isSoldOut: e.target.checked})} /></Col>
              </Row>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="dark" type="submit">Save</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
}

export default AdminDashboard;