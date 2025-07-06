import "./style.css";
import { RxAvatar } from "react-icons/rx";
import { FaCartShopping } from "react-icons/fa6";
import { FaChevronDown } from "react-icons/fa";
import { FaBox } from "react-icons/fa";
import { FaRegHeart } from "react-icons/fa";
import { IoMdNotifications } from "react-icons/io";
import { IoExit } from "react-icons/io5";
import { useState, useRef } from "react";
import Cookies from "js-cookie";

const dropdownOptions = [
  {
    title: "My Profile",
    icon: RxAvatar,
  },
  {
    title: "Orders",
    icon: FaBox,
  },
  {
    title: "Wishlist",
    icon: FaRegHeart,
  },
  {
    title: "Notifications",
    icon: IoMdNotifications,
  },
  {
    title: "Logout",
    icon: IoExit,
  },
];

export const Header = () => {
  const [loginIcon, setLoginIcon] = useState(false);
  const userName = Cookies.get("userName");
  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoginIcon(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setLoginIcon(false);
    }, 150);
  };

  return (
    <>
      <div className="header-container">
        <div className="header-section">
          <span className="img-section">
            <img src="./arti.png" alt="arti-logo" />
          </span>
          <nav>
            <ul>
              <li
                className={`nav-icons ${loginIcon ? "icon-bg" : ""}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ position: "relative" }}
              >
                <div className="login-item">
                  <RxAvatar />
                  <div>{userName.split(" ")[0]}</div>
                  <FaChevronDown
                    className={`chevron-icon ${loginIcon ? "rotate" : ""}`}
                  />
                </div>
                <ul className={`dropdown ${loginIcon ? "show" : ""}`}>
                  {dropdownOptions.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <li key={index}>
                        <Icon />
                        <span className="drop-down-title">{item.title}</span>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="nav-icons">
                <FaCartShopping />
                Cart
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};