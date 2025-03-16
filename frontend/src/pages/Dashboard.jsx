// import { useState, useEffect } from "react";
// import api from "../api"; // Import API instance
// import {jwtDecode} from "jwt-decode";
// import { ACCESS_TOKEN } from "../constants";

// function Dashboard() {
//   const [user, setUser] = useState(null);
//   const [res, setRes] = useState("");

//   useEffect(() => {
//     const token = localStorage.getItem(ACCESS_TOKEN);
//     if (token) {
//       try {
//         const decoded = jwtDecode(token);
//         setUser({
//           id: decoded.user_id,
//           username: decoded.username,
//           fullName: decoded.full_name,
//           image: decoded.image,
//         });
//       } catch (error) {
//         console.error("Error decoding token:", error);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await api.get("/test/");
//         setRes(response.data.response);
//       } catch (error) {
//         console.error(error);
//         setRes("Something went wrong");
//       }
//     };
//     fetchData();
//   }, []);

//   return (
//     <div>
//       <div className="container-fluid" style={{ paddingTop: "100px" }}>
//         <div className="row">
//           <nav className="col-md-2 d-none d-md-block bg-light sidebar mt-4">
//             <div className="sidebar-sticky">
//               <ul className="nav flex-column">
//                 <li className="nav-item">
//                   <a className="nav-link active" href="#">
//                     Dashboard <span className="sr-only">(current)</span>
//                   </a>
//                 </li>
//                 <li className="nav-item">
//                   <a className="nav-link" href="#">Orders</a>
//                 </li>
//                 <li className="nav-item">
//                   <a className="nav-link" href="#">Products</a>
//                 </li>
//                 <li className="nav-item">
//                   <a className="nav-link" href="#">Customers</a>
//                 </li>
//                 <li className="nav-item">
//                   <a className="nav-link" href="#">Reports</a>
//                 </li>
//                 <li className="nav-item">
//                   <a className="nav-link" href="#">Integrations</a>
//                 </li>
//               </ul>
//             </div>
//           </nav>
//           <main role="main" className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
//             <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
//               <h1 className="h2">My Dashboard</h1>
//               <span>Hello {user?.username || "Guest"}!</span>
//             </div>
//             <div className="alert alert-success">
//               <strong>{res}</strong>
//             </div>
//             <h2>Section title</h2>
//             <div className="table-responsive">
//               <table className="table table-striped table-sm">
//                 <thead>
//                   <tr>
//                     <th>#</th>
//                     <th>Header</th>
//                     <th>Header</th>
//                     <th>Header</th>
//                     <th>Header</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {[...Array(10)].map((_, index) => (
//                     <tr key={index}>
//                       <td>{1000 + index}</td>
//                       <td>Sample</td>
//                       <td>Data</td>
//                       <td>For</td>
//                       <td>Table</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </main>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;



import { useState, useEffect } from "react";
import api from "../api"; // Import API instance
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";
import Navbar from "./Navbar"; // Import Navbar component
import LoadingIndicator from "./LoadingIndicator"; // Import LoadingIndicator component

function Dashboard() {
  const [user, setUser] = useState(null);
  const [res, setRes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser({
          id: decoded.user_id,
          username: decoded.username,
          fullName: decoded.full_name,
          image: decoded.image,
        });
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/test/");
        setRes(response.data.response);
      } catch (error) {
        console.error(error);
        setRes("Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="container-fluid" style={{ paddingTop: "100px" }}>
        <div className="row">
          <nav className="col-md-2 d-none d-md-block bg-light sidebar mt-4">
            <div className="sidebar-sticky">
              <ul className="nav flex-column">
                <li className="nav-item">
                  <a className="nav-link active" href="#">
                    Dashboard <span className="sr-only">(current)</span>
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">Orders</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">Products</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">Customers</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">Reports</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">Integrations</a>
                </li>
              </ul>
            </div>
          </nav>
          <main role="main" className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
              <h1 className="h2">My Dashboard</h1>
              <span>Hello {user?.username || "Guest"}!</span>
            </div>
            <div className="alert alert-success">
              <strong>{res}</strong>
            </div>
            <h2>Section title</h2>
            <div className="table-responsive">
              <table className="table table-striped table-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Header</th>
                    <th>Header</th>
                    <th>Header</th>
                    <th>Header</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(10)].map((_, index) => (
                    <tr key={index}>
                      <td>{1000 + index}</td>
                      <td>Sample</td>
                      <td>Data</td>
                      <td>For</td>
                      <td>Table</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;