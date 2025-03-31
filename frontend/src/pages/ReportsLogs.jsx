import React, { useEffect, useState } from "react";
import api from "../api"; // Ensure you have the correct API import
import "../styles/ReportsLogs.css"; // Reusing styles

const ReportsLogs = () => {
  const [reports, setReports] = useState([]);  // For active reports
  const [resolvedReports, setResolvedReports] = useState([]);  // For resolved reports
  const [takedownReports, setTakedownReports] = useState([]);  // For taken down reports
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null); // To store the selected report for the overlay
  const [overlayVisible, setOverlayVisible] = useState(false); // To toggle the overlay visibility
  const [resolveMessage, setResolveMessage] = useState(""); // To show resolve success message

  useEffect(() => {
    fetchReports();
  }, []);

  // Fetch reports from the backend
  const fetchReports = () => {
    api.get("/api/admin/reports/") // Your endpoint for fetching reports
      .then((response) => {
        // Filter reports into pending, resolved, and taken_down
        setReports(response.data);
        // const activeReports = response.data.filter(report => report.status === "pending");
        const resolvedReports = response.data.filter(report => report.status === "resolved");
        const takedownReports = response.data.filter(report => report.status === "taken_down");

        // Set the reports into their respective categories
        // setReports(activeReports); // Set active reports
        setResolvedReports(resolvedReports); // Set resolved reports
        setTakedownReports(takedownReports); // Set taken down reports
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching reports:", error);
        setLoading(false);
      });
  };

  // Handle resolving a report
  const handleResolve = (reportId) => {
    api.post(`/api/admin/resolve-report/${reportId}/`)  // Endpoint for Resolve
      .then(() => {
        setResolveMessage("Report resolved successfully!");

        // Remove resolved report from active list
        setReports((prevReports) => prevReports.filter((report) => report.id !== reportId));

        // Optionally, you could fetch the resolved report and add it to resolvedReports
        const resolvedReport = reports.find((report) => report.id === reportId);
        setResolvedReports((prevResolved) => [...prevResolved, resolvedReport]);

        setOverlayVisible(false); // Close the overlay after action
      })
      .catch((error) => {
        console.error("Error resolving the report:", error);
        alert("Something went wrong. Please try again.");
      });
  };

  // Handle taking down a report
  const handleTakeDown = (reportId) => {
    api.post(`/api/admin/take-down-post/${reportId}/`)  // Endpoint for Take Down
      .then((response) => {
        alert(response.data.message); // Display success message from the API
        fetchReports(); // Refresh the reports list
        setOverlayVisible(false); // Close the overlay after action
      })
      .catch((error) => {
        console.error("Error taking down the post:", error);
        alert("Something went wrong. Please try again.");
      });
  };

  // Handle report click to view details
  const handleReportClick = (reportId) => {
    const selected = reports.find((report) => report.id === reportId);
    setSelectedReport(selected);
    setOverlayVisible(true); // Show the overlay when a report is clicked
  };

  // Close the overlay
  const handleCloseOverlay = () => {
    setOverlayVisible(false); // Close the overlay
  };

  return (
    <div className="admin-container">
      <div className="sidebar">
        <ul>
          <li><a href="/admin_dashboard">Dashboard</a></li>
          <li><a href="/user_management">User Management</a></li>
          <li><a href="/admin_moderation">Moderation</a></li>
          <li><a href="/security_audits">Security Audits</a></li>
          <li><a href="/reports_logs">Reports & Logs</a></li>
          <li><a href="/">Logout</a></li>
        </ul>
      </div>

      <div className="main-content">
        <div className="container">
          <h2>Reports & Logs</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <div>
              {/* Active Reports Section */}
              <h3>Active Reports</h3>
              {reports.length > 0 ? (
                <ul className="user-list">
                  {reports.map((report) => (
                    <li key={report.id}>
                      <div>
                        <strong>Reported Post:</strong>
                        <br />
                        <em>{report.post.caption}</em>
                        <br />
                        <strong>Reported by:</strong> {report.user.username}
                        <br />
                        <strong>Reason:</strong> {report.reason}
                        <br />
                        <small>{new Date(report.created_at).toLocaleString()}</small>
                      </div>
                      <button className="btn view-post-btn" onClick={() => handleReportClick(report.id)}>
                        View Post
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No active reports found.</p>
              )}

              {/* Resolved Reports Section */}
              <h3>Resolved Reports</h3>
              {resolvedReports.length > 0 ? (
                <ul className="user-list">
                  {resolvedReports.map((report) => (
                    <li key={report.id}>
                      <strong>{report.post.caption}</strong>
                      <span> - Resolved</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No resolved reports found.</p>
              )}

              {/* Take Down Reports Section */}
              <h3>Take Down Reports</h3>
              {takedownReports.length > 0 ? (
                <ul className="user-list">
                  {takedownReports.map((report) => (
                    <li key={report.id}>
                      <strong>{report.post.caption}</strong>
                      <span> - Taken Down</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No taken down reports found.</p>
              )}

              {/* Resolve Success Message */}
              {resolveMessage && <div className="resolve-message">{resolveMessage}</div>}
            </div>
          )}

          {/* Overlay for viewing the report */}
          {overlayVisible && selectedReport && (
            <div className="overlay">
              <div className="overlay-content">
                <button className="close-btn" onClick={handleCloseOverlay}>❌ Close</button>
                <h3>Reported Post Details</h3>
                <div className="post-details">
                  <h4>{selectedReport.post.caption}</h4>
                  {selectedReport.post.image && (
                    <img
                      src={`${api.defaults.baseURL}/api${selectedReport.post.image}`}
                      alt="Reported Post"
                      className="post-image"
                    />
                  )}
                  <p>{selectedReport.post.caption}</p>
                </div>
                {/* Action Buttons */}
                <div className="actions">
                  <button onClick={() => handleTakeDown(selectedReport.id)} className="btn take-down-btn">Take Down Post</button>
                  <button onClick={() => handleResolve(selectedReport.id)} className="btn resolve-btn">Resolve Report</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsLogs;
