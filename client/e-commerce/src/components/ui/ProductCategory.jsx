import "./style.css";
import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const categories = [
  { name: "Fashion", icons: "/fashion.png", sub: ["Men", "Women", "Unisex"] },
  {
    name: "Electronics",
    icons: "/electronics.png",
    sub: ["Smartphones", "Laptops", "Tablets", "Mobile Accessories"],
  },
  {
    name: "Home & Living",
    icons: "/furniture.png",
    sub: ["Furniture", "Home Decoration", "Kitchen Accessories"],
  },
  {
    name: "Groceries & Essentials",
    icons: "/groceries.png",
    sub: ["Groceries", "Skin Care", "Beauty", "Fragrances"],
  },
  {
    name: "Automotive",
    icons: "/automotive.png",
    sub: ["Motorcycle", "Vehicle"],
  },
  {
    name: "Sports & Outdoors",
    icons: "/sports.png",
    sub: ["Sports Accessories"],
  },
];

export const ProductCategory = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleMouseEnter = (index) => {
    clearTimeout(timeoutId);
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    const id = setTimeout(() => setActiveIndex(null), 300);
    setTimeoutId(id);
  };
  return (
    <div className="category-container">
      {categories.map((category, index) => (
        <div
          className="category-card"
          key={index}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
        >
          <img src={category.icons} alt={category.name} className="category-icon" />
          <div className="category-title">
            <h4>{category.name}</h4>
            <FiChevronDown
              className={`chevron-icon ${activeIndex === index ? "rotate" : ""}`}
            />
          </div>
          <ul className={`dropdown ${activeIndex === index ? "show" : ""}`}>
            {category.sub.map((subItem, subIndex) => (
              <li key={subIndex}>{subItem}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
