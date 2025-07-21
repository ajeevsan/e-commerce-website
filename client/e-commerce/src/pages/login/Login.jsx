import { useState } from "react";
import { loginUser, registerUser, sendOtp, verifyOtp } from "../../api/authApi";
import { useNavigate } from "react-router-dom";
import { Notification } from "../../components/Notification";
import { useAuth } from "../../context/AuthContext";
import "./style.css";

export const Login = () => {
  const [isRightPanelActive, setIsRightPanelActie] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Form state for registration
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignUpClick = () => {
    setIsRightPanelActie(true);
  };

  const handleSignInClick = () => {
    setIsRightPanelActie(false);
    // Reset OTP states when switching back to sign in
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setFormData({
      name: "",
      email: "",
      password: "",
      otp: "",
    });
  };

  // Reset OTP process
  const handleResetOtp = () => {
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpTimer(0);
    setFormData(prev => ({
      ...prev,
      otp: "",
    }));
    addNotification(
      "info",
      "Process Reset",
      "You can now modify your details and send OTP again."
    );
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

  // Start timer for OTP resend
  const startOtpTimer = () => {
    setOtpTimer(60);
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle Send OTP
  const handleSendOtp = async (email) => {
    try {
      setIsOtpLoading(true);
      await sendOtp({ email });
      setIsOtpSent(true);
      startOtpTimer();
      addNotification(
        "success",
        "OTP Sent!",
        "Please check your email for the OTP."
      );
    } catch (error) {
      console.error("Error sending OTP:", error);
      addNotification(
        "error",
        "Error!",
        "Failed to send OTP. Please try again."
      );
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (email, otp, name, password) => {
    try {
      setIsOtpLoading(true);
      const response = await verifyOtp({ email, otp, name, password });
      if (response.success) {
        setIsOtpVerified(true);
        addNotification(
          "success",
          "OTP Verified!",
          "Email verification successful."
        );
      } else {
        addNotification("error", "Invalid OTP!", `${response.message}`);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      addNotification(
        "error",
        "Error!",
        "Failed to verify OTP. Please try again."
      );
    } finally {
      setIsOtpLoading(false);
    }
  };

  //! API for the login form
  const handleLoginForm = async (e) => {
    try {
      e.preventDefault();
      const formTData = new FormData(e.target);
      const formData = Object.fromEntries(formTData.entries());

      const data = await loginUser(formData);
      login(data.token, data.name, data.userId);
      addNotification("success", "Success!", "Login Successfull !!!");
      navigate("/");
    } catch (error) {
      console.error("Error while", error);
      addNotification("error", "Error!", `${error.response.data.msg}`);
    }
  };

  //! API for the signin form with OTP verification
  const handleSignForm = async (e) => {
    try {
      e.preventDefault();

      // If OTP not sent, send OTP first
      if (!isOtpSent) {
        await handleSendOtp(formData.email);
        return;
      }

      // If OTP sent but not verified, verify OTP
      if (isOtpSent && !isOtpVerified) {
        await handleVerifyOtp(
          formData.email,
          formData.otp,
          formData.name,
          formData.password
        );
        return;
      }

      // If OTP verified, proceed with registration
      if (isOtpVerified) {
        const res = await registerUser(formData);
        console.log("response_data___", res);
        addNotification("success", "Success!", "Registration Successful !!!");

        // Reset all states
        setIsRightPanelActie(false);
        setIsOtpSent(false);
        setIsOtpVerified(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          otp: "",
        });
      }
    } catch (error) {
      if (error.response?.data === "User exists") {
        addNotification(
          "error",
          "Error!",
          "User Already Exists!!! Please Login."
        );
      } else {
        addNotification(
          "error",
          "Error!",
          "Something went wrong. Please try again."
        );
      }
    }
  };

  const getSignUpButtonText = () => {
    if (isOtpLoading) return "Processing...";
    if (!isOtpSent) return "Send OTP";
    if (isOtpSent && !isOtpVerified) return "Verify OTP";
    return "Sign Up";
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
                placeholder="Name"
                required
                disabled={isOtpSent}
                value={formData.name}
                onChange={handleInputChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                disabled={isOtpSent}
                value={formData.email}
                onChange={handleInputChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                disabled={!isOtpVerified && isOtpSent}
                value={formData.password}
                onChange={handleInputChange}
              />

              {isOtpSent && (
                <div className="otp-section">
                  <div className="otp-input-container">
                    <input
                      type="text"
                      name="otp"
                      placeholder="Enter OTP"
                      required
                      maxLength="6"
                      disabled={isOtpVerified}
                      value={formData.otp}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      className="reset-btn"
                      onClick={handleResetOtp}
                      disabled={isOtpLoading}
                      title="Reset OTP process"
                    >
                      ↻
                    </button>
                  </div>
                  {!isOtpVerified && otpTimer > 0 && (
                    <p className="otp-timer">Resend OTP in {otpTimer}s</p>
                  )}
                  {!isOtpVerified && otpTimer === 0 && (
                    <button
                      type="button"
                      className="resend-otp-btn"
                      onClick={() => handleSendOtp(formData.email)}
                      disabled={isOtpLoading}
                    >
                      Resend OTP
                    </button>
                  )}
                  {isOtpVerified && (
                    <p className="otp-verified">✅ Email Verified</p>
                  )}
                </div>
              )}

              <button
                  className="submitBtn"
                  type="submit"
                  disabled={
                    isOtpLoading ||
                    (isOtpSent && !isOtpVerified && !formData.otp)
                  }
                >
                  {getSignUpButtonText()}
                </button>
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
              <button className="submitBtn" type="submit">
                Sign In
              </button>
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