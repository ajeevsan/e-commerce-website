import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, MapPin, Edit2, Camera, Package, Heart, CreditCard, Gift, Settings, LogOut, Bell, Shield, HelpCircle, Star, Calendar, Truck } from 'lucide-react';
import './style.css'

const MyProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+91 9876543210',
    gender: 'Male',
    dateOfBirth: '1990-01-15',
    alternatePhone: '+91 9876543211'
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Handle URL parameters for direct navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section) {
      setActiveTab(section);
    }
  }, [location]);

  const sidebarItems = [
    { id: 'profile', icon: User, label: 'My Profile', badge: null },
    { id: 'orders', icon: Package, label: 'My Orders', badge: '3' },
    { id: 'wishlist', icon: Heart, label: 'My Wishlist', badge: '12' },
    { id: 'rewards', icon: Gift, label: 'My Rewards', badge: 'New' },
    { id: 'cards', icon: CreditCard, label: 'Saved Cards', badge: null },
    { id: 'addresses', icon: MapPin, label: 'My Addresses', badge: null },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: '5' },
    { id: 'settings', icon: Settings, label: 'Account Settings', badge: null },
    { id: 'help', icon: HelpCircle, label: 'Help & Support', badge: null },
  ];

  const recentOrders = [
    {
      id: 'ORD001',
      product: 'Samsung Galaxy S23',
      image: '/api/placeholder/60/60',
      status: 'Delivered',
      date: '2024-01-15',
      amount: '₹75,999'
    },
    {
      id: 'ORD002',
      product: 'Nike Air Max 270',
      image: '/api/placeholder/60/60',
      status: 'Shipped',
      date: '2024-01-20',
      amount: '₹12,995'
    },
    {
      id: 'ORD003',
      product: 'Apple MacBook Pro',
      image: '/api/placeholder/60/60',
      status: 'Processing',
      date: '2024-01-22',
      amount: '₹1,99,999'
    }
  ];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle sidebar navigation and update URL
  const handleSidebarNavigation = (tabId) => {
    setActiveTab(tabId);
    navigate(`/profile?section=${tabId}`);
  };

  const renderProfileContent = () => {
    switch(activeTab) {
      case 'profile':
        return (
          <div className="profile-content">
            <div className="profile-header">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  <User size={40} />
                </div>
                <button className="avatar-edit">
                  <Camera size={16} />
                </button>
              </div>
              <div className="profile-info">
                <h2>{profileData.name}</h2>
                <p>{profileData.email}</p>
                <div className="profile-badges">
                  <span className="badge verified">
                    <Shield size={14} />
                    Verified
                  </span>
                  <span className="badge premium">
                    <Star size={14} />
                    Premium
                  </span>
                </div>
              </div>
              <button 
                className="edit-profile-btn"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 size={16} />
                {isEditing ? 'Save' : 'Edit Profile'}
              </button>
            </div>

            <div className="profile-details">
              <h3>Personal Information</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  ) : (
                    <span>{profileData.name}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Email Address</label>
                  {isEditing ? (
                    <input 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  ) : (
                    <span>{profileData.email}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Phone Number</label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  ) : (
                    <span>{profileData.phone}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Gender</label>
                  {isEditing ? (
                    <select 
                      value={profileData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <span>{profileData.gender}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Date of Birth</label>
                  {isEditing ? (
                    <input 
                      type="date" 
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  ) : (
                    <span>{new Date(profileData.dateOfBirth).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="detail-item">
                  <label>Alternate Phone</label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      value={profileData.alternatePhone}
                      onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                    />
                  ) : (
                    <span>{profileData.alternatePhone}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="orders-content">
            <div className="orders-header">
              <h3>My Orders</h3>
              <div className="orders-filter">
                <select>
                  <option>All Orders</option>
                  <option>Delivered</option>
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>
            <div className="orders-list">
              {recentOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-image">
                    <img src={order.image} alt={order.product} />
                  </div>
                  <div className="order-details">
                    <h4>{order.product}</h4>
                    <p className="order-id">Order #{order.id}</p>
                    <p className="order-date">
                      <Calendar size={14} />
                      {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="order-status">
                    <span className={`status ${order.status.toLowerCase()}`}>
                      {order.status === 'Delivered' && <Truck size={14} />}
                      {order.status === 'Shipped' && <Package size={14} />}
                      {order.status === 'Processing' && <Settings size={14} />}
                      {order.status}
                    </span>
                    <p className="order-amount">{order.amount}</p>
                  </div>
                  <div className="order-actions">
                    <button className="btn-secondary">Track Order</button>
                    <button className="btn-primary">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'wishlist':
        return (
          <div className="wishlist-content">
            <div className="content-header">
              <h3>My Wishlist</h3>
              <p>12 items saved</p>
            </div>
            <div className="wishlist-grid">
              {[1, 2, 3, 4, 5, 6].map(item => (
                <div key={item} className="wishlist-item">
                  <div className="wishlist-image">
                    <img src="/api/placeholder/150/150" alt="Product" />
                    <button className="remove-wishlist">
                      <Heart size={16} fill="red" />
                    </button>
                  </div>
                  <div className="wishlist-info">
                    <h4>Product Name {item}</h4>
                    <p className="price">₹{(item * 1000).toLocaleString()}</p>
                    <button className="btn-primary">Add to Cart</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="notifications-content">
            <div className="content-header">
              <h3>Notifications</h3>
              <button className="btn-secondary">Mark all as read</button>
            </div>
            <div className="notifications-list">
              {[1, 2, 3, 4, 5].map(notification => (
                <div key={notification} className="notification-item">
                  <div className="notification-icon">
                    <Bell size={16} />
                  </div>
                  <div className="notification-content">
                    <h4>Order Update</h4>
                    <p>Your order #ORD00{notification} has been shipped and is on its way.</p>
                    <span className="notification-time">2 hours ago</span>
                  </div>
                  <div className="notification-status">
                    <span className="unread-dot"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="default-content">
            <div className="content-header">
              <h3>{sidebarItems.find(item => item.id === activeTab)?.label}</h3>
            </div>
            <div className="coming-soon">
              <h4>Coming Soon</h4>
              <p>This section is under development. Stay tuned for updates!</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="myprofile-container">
      <div className="profile-sidebar">
        <div className="sidebar-header">
          <div className="user-info">
            <div className="user-avatar">
              <User size={24} />
            </div>
            <div>
              <h4>Hello,</h4>
              <p>{profileData.name}</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleSidebarNavigation(item.id)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`badge ${item.badge === 'New' ? 'new' : 'count'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <button className="nav-item logout">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      <div className="profile-main">
        {renderProfileContent()}
      </div>
    </div>
  );
};

export default MyProfile;