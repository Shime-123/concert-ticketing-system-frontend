import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Spinner, InputGroup, Pagination } from 'react-bootstrap';

function AdminDashboard() {
  // --- State Management ---
  const [stats, setStats] = useState({ totalRevenue: 0, totalTickets: 0 });
  const [concerts, setConcerts] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [users, setUsers] = useState([]); // ✅ Added users state
  const [loading, setLoading] = useState(true);
  
  // 🔍 Search & Pagination States
  const [concertSearch, setConcertSearch] = useState("");
  const [buyerSearch, setBuyerSearch] = useState("");
  const [userSearch, setUserSearch] = useState(""); // ✅ Added user search state
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
  const baseUrl = process.env.REACT_APP_API_URL || "https://concert-ticketing-system-backend.onrender.com";

  // --- 1. Fetch Logic ---
  const fetchData = useCallback(async () => {
    try {
      // ✅ Fetching stats, concerts, and users in parallel
      const [statsRes, concertRes, userRes] = await Promise.all([
        fetch(`${baseUrl}/api/Admin/stats`),
        fetch(`${baseUrl}/api/Concerts`),
        fetch(`${baseUrl}/api/Admin/users`) 
      ]);
      
      const statsData = await statsRes.json();
      const concertData = await concertRes.json();
      const userData = await userRes.json();

      setStats({
        totalRevenue: statsData.totalRevenue || 0,
        totalTickets: statsData.totalTickets || 0
      });
      setBuyers(statsData.recentPurchases || []);
      setConcerts(concertData);
      setUsers(userData || []); 
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

  // --- Action Handlers ---
  const handleToggleSuspension = async (email) => {
    const res = await fetch(`${baseUrl}/api/Admin/toggle-suspension/${email}`, { method: 'PUT' });
    if (res.ok) fetchData();
    else alert("Failed to update status");
  };

  const handleRoleChange = async (email, currentRole) => {
    const newRole = currentRole === "Admin" ? "Customer" : "Admin";
    const res = await fetch(`${baseUrl}/api/Admin/update-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: newRole })
    });
    if (res.ok) fetchData();
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Delete user ${email}?`)) return;
    const res = await fetch(`${baseUrl}/api/Admin/delete-user/${email}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

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

  // --- Filtering & Pagination Logic ---
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

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  const currentConcerts = paginate(filteredConcerts, concertPage);
  const currentBuyers = paginate(filteredBuyers, buyerPage);

  if (loading) return (
    <Container className="text-center py-5">
      <Spinner animation="border" variant="warning" />
    </Container>
  );

  return (
    <div className="bg-light min-vh-100 py-5 text-dark">
      <Container>
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 className="fw-bold">Admin Panel</h1>
            <p className="text-muted">Manage your concert catalog and sales</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-dark" className="fw-bold px-4 rounded-pill" onClick={exportToCSV}>Export Sales (.CSV)</Button>
            <Button variant="dark" className="fw-bold px-4 rounded-pill" onClick={() => setShowAddModal(true)}>+ Create Concert</Button>
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

        {/* 1. Live Events Table */}
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
        <Card className="shadow-sm border-0 mb-5 rounded-4 overflow-hidden">
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

        {/* 2. User Management Table */}
        <div className="d-flex justify-content-between align-items-center mb-3 mt-5">
          <h4 className="fw-bold mb-0">User Management ({filteredUsers.length})</h4>
          <InputGroup style={{ maxWidth: '300px' }}>
            <Form.Control 
              placeholder="Search users..." 
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="rounded-pill px-3 shadow-sm"
            />
          </InputGroup>
        </div>
        <Card className="shadow-sm border-0 rounded-4 overflow-hidden mb-5">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-warning">
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th className="text-end">Actions</th></tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.email} style={{ opacity: u.isSuspended ? 0.6 : 1 }}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><Badge bg={u.role === "Admin" ? "danger" : "secondary"}>{u.role}</Badge></td>
                  <td>{u.isSuspended ? <Badge bg="danger">SUSPENDED</Badge> : <Badge bg="success">ACTIVE</Badge>}</td>
                  <td className="text-end">
                    <Button variant="outline-dark" size="sm" className="me-2" onClick={() => handleRoleChange(u.email, u.role)}>Role</Button>
                    <Button variant={u.isSuspended ? "success" : "warning"} size="sm" className="me-2" onClick={() => handleToggleSuspension(u.email)}>
                      {u.isSuspended ? "Unsuspend" : "Suspend"}
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteUser(u.email)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        {/* 3. Transactions Table */}
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

        {/* Pagination and Modals remain at the bottom */}
        {/* ... [Modals and Pagination Logic as provided in original] ... */}

      </Container>
    </div>
  );
}

export default AdminDashboard;