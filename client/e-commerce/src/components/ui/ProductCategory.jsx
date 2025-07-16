import "./style.css";
import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { FaShirt } from "react-icons/fa6";
import { IoTvSharp } from "react-icons/io5";
import { FaKitchenSet } from "react-icons/fa6";
import { GiFruitBowl } from "react-icons/gi";
import { FaCar } from "react-icons/fa";
import { FaDumbbell } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const categories = [
  {
    name: "Fashion",
    // icons: "/fashion.png",
    icon: FaShirt,
    sub: ["Men", "Women", "Unisex"],
  },
  {
    name: "Electronics",
    // icons: "/electronics.png",
    icon: IoTvSharp,
    sub: ["Smartphones", "Laptops", "Tablets", "Mobile Accessories"],
  },
  {
    name: "Home & Living",
    // icons: "/furniture.png",
    icon: FaKitchenSet,
    sub: ["Furniture", "Home Decoration", "Kitchen Accessories"],
  },
  {
    name: "Groceries & Essentials",
    // icons: "/groceries.png",
    icon: GiFruitBowl,
    sub: ["Groceries", "Skin Care", "Beauty", "Fragrances"],
  },
  {
    name: "Automotive",
    // icons: "/automotive.png",
    icon: FaCar,
    sub: ["Motorcycle", "Vehicle"],
  },
  {
    name: "Sports & Outdoors",
    // icons: "/sports.png",
    icon: FaDumbbell,
    sub: ["Sports Accessories"],
  },
];

export const ProductCategory = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const navigate = useNavigate()

  const handleMouseEnter = (index) => {
    clearTimeout(timeoutId);
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    const id = setTimeout(() => setActiveIndex(null), 300);
    setTimeoutId(id);
  };

  const handleSubItemClick = (subItem) => {
    // Convert subItem to URL-friendly format
    const categoryParam = subItem.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
    console.log('categoryParam___',categoryParam)
    navigate(`/products/category/${categoryParam}`);
  };

  return (
    <div className="category-container">
      {categories.map((category, index) => {
        const Icon = category.icon
        return (
          <div
            className="category-card"
            key={index}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {/* <img
            src={category.icons}
            alt={category.name}
            className="category-icon"
          /> */}
            
            <Icon className="category-icon"/>
            <div className="category-title">
              <h4>{category.name}</h4>
              <FiChevronDown
                className={`chevron-icon ${
                  activeIndex === index ? "rotate" : ""
                }`}
              />
            </div>
            <ul className={`dropdown ${activeIndex === index ? "show" : ""}`}>
              {category.sub.map((subItem, subIndex) => (
                <li key={subIndex} onClick={() => handleSubItemClick(subItem)}
                  className="dropdown-item">{subItem}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};
