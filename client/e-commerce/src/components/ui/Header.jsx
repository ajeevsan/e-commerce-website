import "./style.css";
import { RxAvatar } from "react-icons/rx";
import { FaCartShopping } from "react-icons/fa6";
import { FaChevronDown } from "react-icons/fa";
import { FaChevronUp } from "react-icons/fa";
import { useState } from "react";
import Cookies from 'js-cookie';

export const Header = () => {
  const [loginIcon, setLoginIcon] = useState(false);
  const userName = Cookies.get('userName')
  return (
    <>
      <div className="header-container">
        <div className="header-section">
          <span className="img-section">
            <img src="./arti.png" alt="arti-logo" />
          </span>

          <nav>
            <ul>
              <li className={`nav-icons  ${loginIcon ? "icon-bg" : ""}`}>
                <div
                  className={`login-item`}
                  onMouseEnter={() => setLoginIcon(true)}
                  onMouseLeave={() => setLoginIcon(false)}
                >
                  <RxAvatar />
                  <div>{userName.split(" ")[0]}</div>
                  <FaChevronDown
                    className={`chevron-icon ${loginIcon ? "rotate" : ""}`}
                  />
                </div>
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
