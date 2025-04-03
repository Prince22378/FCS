export default function DashboardLayout({ children, title }) {
    return (
        <div className="dashboard-container">
            <Navbar />
            <div className="container-fluid" style={{ paddingTop: "100px" }}>
                <div className="row">
                    <Sidebar active="seller" /> {/* Highlight active menu */}
                    <main className="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
                        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pb-2 mb-3 border-bottom">
                            <h1 className="h2">{title}</h1>
                        </div>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}