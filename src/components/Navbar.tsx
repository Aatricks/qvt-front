import { NavLink } from 'react-router-dom';

import { DatasetStatus } from './DatasetStatus';

export function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="nav-title">
          <strong>QVCTi</strong>
          <span className="small">Diagnostics & actions (CSV → FastAPI → Vega-Lite)</span>
        </div>

        <nav className="nav-links" aria-label="Navigation">
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/employee">
            Employé
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/manager">
            Manager
          </NavLink>
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/hr">
            RH
          </NavLink>
        </nav>

        <DatasetStatus />
      </div>
    </header>
  );
}
