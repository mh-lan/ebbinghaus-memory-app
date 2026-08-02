import { NavLink } from 'react-router-dom';
import { FiBookOpen, FiList, FiSettings } from 'react-icons/fi';
import './BottomNav.css';

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <FiBookOpen />
        <span>复习</span>
      </NavLink>
      <NavLink to="/list" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <FiList />
        <span>知识点</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <FiSettings />
        <span>设置</span>
      </NavLink>
    </nav>
  );
}
