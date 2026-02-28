import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTicketsSold: 0
  });
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  // 1. Ensure this variable matches what is in your .env (e.g., http://localhost:5000)
  const baseUrl = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL;

  fetch(`${baseUrl}/api/Admin/stats`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    })
    .then((data) => {
      console.log("Verified Data from Backend:", data);
      
      // 2. Use PascalCase to match your C# return object
      setStats({
        totalRevenue: data.TotalRevenue || 0,
        totalTicketsSold: data.TotalTicketsSold || 0
      });
      
      setBuyers(data.RecentPurchases || []);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Dashboard Fetch Error:", err);
      setLoading(false);
    });
}, []);

  if (loading) return <div className="text-center py-5">Loading Dashboard...</div>;

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h1 className="fw-bold">Sales Dashboard</h1>
            <p className="text-muted">Real-time ticket monitoring</p>
          </div>
<Button 
  variant="dark" 
  onClick={() => {
    // Fallback to localhost:5000 if the env variable is missing
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
    window.open(`${backendUrl}/api/Admin/export`, "_blank");
  }}
>
  Export Report
</Button>
        </div>

        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm border-0 bg-primary text-white p-3">
              <h6>Total Revenue</h6>
              <h2 className="fw-bold">${stats.totalRevenue.toLocaleString()}</h2>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm border-0 bg-success text-white p-3">
              <h6>Tickets Sold</h6>
              <h2 className="fw-bold">{stats.totalTicketsSold}</h2>
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm border-0">
          <Card.Header className="bg-white py-3">
            <h5 className="mb-0 fw-bold">Recent Transactions</h5>
          </Card.Header>
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-dark">
              <tr>
                <th>Payment ID</th>
                <th>Email</th>
                <th>Ticket Type</th>
                <th className="text-center">Qty</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {buyers.length > 0 ? (
buyers.map((b) => (
  <tr key={b.PaymentId}> {/* Use PaymentId, not paymentId */}
    <td className="small text-muted">{b.PaymentId?.substring(0, 12)}...</td>
    <td className="fw-bold">{b.UserEmail}</td> {/* Use UserEmail, not userEmail */}
    <td><Badge bg="info" text="dark">{b.TicketType}</Badge></td>
    <td className="text-center">{b.Quantity}</td>
    <td className="small text-muted">{new Date(b.CreatedAt).toLocaleDateString()}</td>
  </tr>
))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">No recent purchases found.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </Container>
    </div>
  );
}

export default AdminDashboard;