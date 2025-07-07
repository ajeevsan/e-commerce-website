import "./style.css";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCreditCard,
  FaShieldAlt,
  FaTruck,
  FaHeadset,
} from "react-icons/fa";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Press", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Investor Relations", href: "#" },
      ],
    },
    {
      title: "Customer Service",
      links: [
        { name: "Help Center", href: "#" },
        { name: "Contact Us", href: "#" },
        { name: "Return Policy", href: "#" },
        { name: "Shipping Info", href: "#" },
        { name: "Size Guide", href: "#" },
      ],
    },
    {
      title: "Quick Links",
      links: [
        { name: "Track Your Order", href: "#" },
        { name: "Wishlist", href: "#" },
        { name: "Gift Cards", href: "#" },
        { name: "Store Locator", href: "#" },
        { name: "Bulk Orders", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "#" },
        { name: "Terms of Service", href: "#" },
        { name: "Cookie Policy", href: "#" },
        { name: "Accessibility", href: "#" },
        { name: "Site Map", href: "#" },
      ],
    },
  ];

  const socialLinks = [
    { icon: FaFacebook, href: "#", color: "#1877F2" },
    { icon: FaTwitter, href: "#", color: "#1DA1F2" },
    { icon: FaInstagram, href: "#", color: "#E4405F" },
    { icon: FaLinkedin, href: "#", color: "#0A66C2" },
    { icon: FaYoutube, href: "#", color: "#FF0000" },
  ];

  return (
    <div className="footer">        

      {/* Main Footer Content */}
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Company Info */}
            <div className="footer-section footer-about">
              <div className="footer-logo">
                <img src="./arti.png" alt="Arti Logo" />
              </div>
              <p className="footer-description">
                Your one-stop destination for quality products and exceptional
                service. We're committed to bringing you the best shopping
                experience.
              </p>
              <div className="footer-contact">
                <div className="contact-item">
                  <FaMapMarkerAlt />
                  <span>123 Commerce Street, City, State 12345</span>
                </div>
                <div className="contact-item">
                  <FaPhone />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="contact-item">
                  <FaEnvelope />
                  <span>support@arti.com</span>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            {footerSections.map((section, index) => (
              <div key={index} className="footer-section">
                <h4 className="footer-title">{section.title}</h4>
                <ul className="footer-links">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href={link.href}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-content">
            <div className="footer-copyright">
              <p>&copy; {currentYear} Arti. All rights reserved.</p>
            </div>
            <div className="footer-social">
              <span>Follow us:</span>
              <div className="social-links">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      className="social-link"
                      style={{ "--social-color": social.color }}
                    >
                      <Icon />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
