import { useState } from "react";
import "./style.css";
import { loginUser, registerUser } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { Notification } from "../../components/Notification";
import { useAuth } from "../../context/AuthContext";

export const Login = () => {
  const [isRightPanelActive, setIsRightPanelActie] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignUpClick = () => {
    setIsRightPanelActie(true);
  };

  const handleSignInClick = () => {
    setIsRightPanelActie(false);
  };

  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, title, message) => {
    const id = Date.now();

    const newNotification = {
      id,
      type,
      title,
      message,
      onClose: () => removeNotification(id),
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  //! API for the login form
  const handleLoginForm = async (e) => {
    try {
      e.preventDefault();
      const formTData = new FormData(e.target);
      const formData = Object.fromEntries(formTData.entries()); 

      const data = await loginUser(formData);
      login(data.token, data.name);
      navigate("/");
      addNotification("success", "Success!", "Login Successfull !!!");
    } catch (error) {
      console.error("Error while", error);
    }
  };

  //! API for the signin form
  const handleSignForm = async (e) => {
    try {
      e.preventDefault();
      const data = new FormData(e.target);
      const formData = Object.fromEntries(data.entries());

      const res = await registerUser(formData);

      console.log("response_data___", res);
      localStorage.setItem("token", res.token);
      addNotification("success", "Success!", "Registeration Successfull !!!");
      setIsRightPanelActie(false);
    } catch (error) {
      if (error.response.data === "User exists") {
        addNotification(
          "error",
          "Error!",
          "User Already Exists!!! Please Login."
        );
      }
    }
  };

  return (
    <>
      <div className="body-container">
        <div
          className={`container ${
            isRightPanelActive ? "right-panel-active" : ""
          }`}
          id="container"
        >
          <div className="form-container sign-up-container">
            <form onSubmit={handleSignForm}>
              <h1>Create Account</h1>
              <input
                type="text"
                name="name"
                id=""
                placeholder="Name"
                required
              />
              <input type="email" name="email" placeholder="Email" required />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
              />
              <button className="submitBtn" type="submit">Sign Up</button>
            </form>
          </div>

          <div className="form-container sign-in-container">
            <form onSubmit={handleLoginForm}>
              <h1>Sign in</h1>
              <input type="email" name="email" placeholder="Email" required />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
              />
              <a href="/forgot">Forgot you password</a>
              <button className='submitBtn' type="submit">Sign In</button>
            </form>
          </div>

          <div className="overlay-container">
            <div className="overlay">
              <div className="overlay-panel overlay-left">
                <h1>Welcome Back!</h1>
                <p>Already, have an account !!!</p>
                <button
                  className=" submitBtn"
                  onClick={handleSignInClick}
                  id="signIn"
                >
                  Sign In
                </button>
              </div>
              <div className="overlay-panel overlay-right">
                <h1>Hey, are you a new user?</h1>
                <p>
                  Then enter your personal detials and start shopping with us
                </p>
                <button
                  className=" submitBtn"
                  onClick={handleSignUpClick}
                  id="signUp"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
        <footer>
          <p>
            Created with ❤️ by
            <a
              target="_blank"
              href="https://www.linkedin.com/in/sanjeev-majhi-4305b6a2/"
            >
              {" "}
              Sanjeev Majhi
            </a>
          </p>
        </footer>

        {notifications.map((notification, index) => (
          <Notification
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={notification.onClose}
            duration={4000}
            position="top-right"
            index={index}
          />
        ))}
      </div>
    </>
  );
};

export default Login;
