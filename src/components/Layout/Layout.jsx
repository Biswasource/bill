import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FaBars, FaServicestack, FaTruck } from "react-icons/fa";
import { HiOutlineHome, HiUser } from "react-icons/hi";
import { RiCarLine, RiFileListLine } from "react-icons/ri";
import { BsChatDots } from "react-icons/bs";
import { IoSettings } from "react-icons/io5";
import logo from "../../assets/react.svg";
import { useNavigate } from "react-router-dom";
export default function SidebarLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-collapse after 0.5 second on desktop
  useEffect(() => {
    if (isOpen && !isHovered) {
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isHovered]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("supabase_user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  const isStaff = user?.user_metadata?.role === "user";

  const navigate = React.useMemo(() => {
    // This is just to satisfy the rule, but actually we can just use useNavigate()
    return null;
  }, []);
  const realNavigate = useNavigate();

  useEffect(() => {
    if (isStaff) {
      const currentPath = window.location.pathname;
      const allowedPath = "/dashboard/quotation";
      if (!currentPath.includes(allowedPath)) {
        realNavigate(allowedPath);
      }
    }
  }, [isStaff, realNavigate]);

  const menuItems = [
    {
      path: "/dashboard/dashboard",
      label: "Dashboard",
      icon: <HiOutlineHome />,
      show: !isStaff,
    },
    {
      path: "/dashboard/services",
      label: "Services",
      icon: <FaServicestack />,
      show: !isStaff,
    },
    {
      path: "/dashboard/clients",
      label: "Clients",
      icon: <HiUser />,
      show: !isStaff,
    },
    {
      path: "/dashboard/quotation",
      label: "Quotation",
      icon: <RiFileListLine />,
      show: true,
    },
    {
      path: "/dashboard/quotations",
      label: "All Quotations",
      icon: <RiFileListLine />,
      show: !isStaff,
    },
    {
      path: "/dashboard/users",
      label: "Users",
      icon: <HiUser />,
      show: !isStaff,
    },
    {
      path: "/dashboard/settings",
      label: "Settings",
      icon: <IoSettings />,
      show: !isStaff,
    },
  ].filter((item) => item.show);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:block fixed top-0 left-0 h-full bg-white shadow-sm transition-all duration-500 ease-in-out z-50 ${
          isOpen ? "w-54" : "w-17"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-20 overflow-hidden">
          <img
            src={"https://hyperdigitech.com/wp-content/uploads/2025/08/1-3.png"}
            alt="Logo"
            className={`transition-all duration-500 bg-black scale-125 ${
              isOpen ? "w-32" : "w-12"
            }`}
          />
        </div>

        <nav className="flex flex-col px-3 mt-6 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-full text-sm font-medium transition-all duration-300 relative group
                ${
                  isActive
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-900 hover:bg-gray-100"
                }`
              }
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span
                className={`whitespace-nowrap transition-all duration-500 ${
                  isOpen
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2 absolute left-full"
                }`}
              >
                {item.label}
              </span>

              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed lg:hidden top-0 left-0 h-full bg-white shadow-lg transition-transform duration-300 z-50 w-54 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-20">
          <img src={logo} alt="Logo" className="w-32" />
        </div>

        <nav className="flex flex-col px-4 mt-6 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-full text-sm font-medium transition-all duration-300
                ${
                  isActive
                    ? "bg-black text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex flex-col flex-1 transition-all duration-500 ${
          isOpen ? "lg:ml-54" : "lg:ml-17"
        }`}
      >
        {/* Top Navbar (mobile) */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white lg:hidden">
          <img src={logo} alt="Logo" className="h-12 w-auto" />
          <button
            onClick={toggleMobileSidebar}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <FaBars className="text-xl" />
          </button>
        </div>

        {/* Main Outlet Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
