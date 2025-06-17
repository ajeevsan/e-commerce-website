import React, { useState, useEffect, useCallback } from "react";

export const Notification = ({
  type = "info",
  title,
  message,
  duration = 3000,
  onClose,
  autoClose = true,
  position = "top-right",
  index = 0,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [handleClose, autoClose, duration]);

  if (!isVisible) return null;

  const getNotificationStyle = () => {
    const notificationHeight = 80; // Approximate height of each notification
    const gap = 10; // Gap between notifications
    const offset = index * (notificationHeight + gap);

    const baseStyle = {
      position: "fixed",
      zIndex: 1000 + index,
      minWidth: "300px",
      maxWidth: "400px",
      padding: "16px",
      borderRadius: "8px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "14px",
      lineHeight: "1.4",
      transition: "all 0.3s ease",
      transform: isAnimating ? "translateX(100%)" : "translateX(0)",
      opacity: isAnimating ? 0 : 1,
    };

    // Position styles with stacking
    const positions = {
      "top-right": {
        top: `${20 + offset}px`,
        right: "20px",
      },
      "top-left": {
        top: `${20 + offset}px`,
        left: "20px",
      },
      "bottom-right": {
        bottom: `${20 + offset}px`,
        right: "20px",
      },
      "bottom-left": {
        bottom: `${20 + offset}px`,
        left: "20px",
      },
      "top-center": {
        top: `${20 + offset}px`,
        left: "50%",
        transform: `translateX(-50%) ${
          isAnimating ? "translateY(-100%)" : "translateY(0)"
        }`,
      },
      "bottom-center": {
        bottom: `${20 + offset}px`,
        left: "50%",
        transform: `translateX(-50%) ${
          isAnimating ? "translateY(100%)" : "translateY(0)"
        }`,
      },
    };

    // Type-specific colors
    const typeStyles = {
      success: {
        backgroundColor: "#d4edda",
        color: "#155724",
        borderLeft: "4px solid #28a745",
      },
      error: {
        backgroundColor: "#f8d7da",
        color: "#721c24",
        borderLeft: "4px solid #dc3545",
      },
      warning: {
        backgroundColor: "#fff3cd",
        color: "#856404",
        borderLeft: "4px solid #ffc107",
      },
      info: {
        backgroundColor: "#d1ecf1",
        color: "#0c5460",
        borderLeft: "4px solid #17a2b8",
      },
    };

    return {
      ...baseStyle,
      ...positions[position],
      ...typeStyles[type],
    };
  };

  const getIcon = () => {
    const iconStyle = {
      fontSize: "18px",
      fontWeight: "bold",
      minWidth: "18px",
      marginTop: "2px",
    };

    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };

    return <span style={iconStyle}>{icons[type]}</span>;
  };

  const contentStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  };

  const titleStyle = {
    fontWeight: "600",
    fontSize: "15px",
    margin: 0,
  };

  const messageStyle = {
    margin: 0,
    opacity: 0.9,
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
    transition: "opacity 0.2s ease",
    color: "inherit",
  };

  return (
    <div style={getNotificationStyle()}>
      {getIcon()}
      <div style={contentStyle}>
        {title && <h4 style={titleStyle}>{title}</h4>}
        <p style={messageStyle}>{message}</p>
      </div>
      <button
        style={closeButtonStyle}
        onClick={handleClose}
        onMouseEnter={(e) => (e.target.style.opacity = "1")}
        onMouseLeave={(e) => (e.target.style.opacity = "0.7")}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  );
};

export default Notification;