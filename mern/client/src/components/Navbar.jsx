/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Activity, BarChart2, MapIcon, GemIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const NavItem = ({ to, children, icon: Icon }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink to={to}>
      <motion.div
        className="relative px-4 py-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="flex items-center gap-2 text-white"
          initial={false}
          animate={{ color: isActive ? "#22c55e" : "#ffffff" }}
        >
          <Icon className="w-4 h-4" />
          <span>{children}</span>
        </motion.div>
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-white/10 rounded-lg"
            layoutId="navbar-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </motion.div>
    </NavLink>
  );
};

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/predict", label: "Predictions", icon: Activity },
    { to: "/map", label: "3d Map", icon: MapIcon },
    { to: "/analytics", label: "Analytics", icon: BarChart2 },
    { to:  "/chrome-canary", label: "Gemini nano", icon:  GemIcon},
  ];

  return (
    <motion.nav
      className={`fixed w-full top-0 z-50 px-6 py-4 transition-all ${
        isScrolled ? "bg-black/80 backdrop-blur-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              
              
            </motion.div>
          </NavLink>

          {/* Desktop Navigation as a Dropdown */}
<div className="hidden md:block relative">
  <button
    onClick={() => setIsDropdownOpen((prev) => !prev)}
    className="text-white flex items-center gap-2 focus:outline-none"
  >
    <Menu className="w-6 h-6" />
    <span className="hidden lg:inline">Menu</span>
  </button>

  {/* Dropdown Menu */}
  {isDropdownOpen && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 mt-2 w-48 bg-black border border-gray-700 rounded-lg shadow-lg"
    >
      <ul className="flex flex-col divide-y divide-gray-700">
        {navLinks.map((link) => (
          <li key={link.to}>
            <NavItem
              to={link.to}
              icon={link.icon}
              className="px-4 py-2 hover:bg-gray-800 text-white flex items-center gap-2"
            >
              {link.label}
            </NavItem>
          </li>
        ))}
        <li>
          <Button className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white border-none">
            Get Started
          </Button>
        </li>
      </ul>
    </motion.div>
  )}
</div>


          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4"
            >
              <div className="bg-black/95 backdrop-blur-lg rounded-lg p-4 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <NavItem key={link.to} to={link.to} icon={link.icon}>
                    {link.label}
                  </NavItem>
                ))}
                <Button className="mt-2 bg-gradient-to-r from-green-400 to-green-600 text-white border-none">
                  Get Started
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
