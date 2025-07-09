import { useState, useEffect } from "react";
import "./style.css";

export const ProductList = ({ config }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setItemsPerView(1);
      } else if (width < 768) {
        setItemsPerView(2);
      } else if (width < 1024) {
        setItemsPerView(3);
      } else {
        setItemsPerView(4);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  //! Error Handeling
  if (!config || !config.data || !Array.isArray(config.data)) {
    console.error("ProductList: Invalid config or data structure");
    return <div>No products to display</div>;
  }

  //! Calculate total pages
  const totalPages = Math.ceil(config.data.length / itemsPerView);
  const maxIndex = totalPages - 1;

  //! Navigations
  const goPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  //! Get curretn items to display
  const startIndex = currentIndex * itemsPerView;
  const currentItems = config.data.slice(startIndex, startIndex + itemsPerView);

  return (
    <div className="product-container">
      <div className="product-card">
        <div className="product-card-header">{config.title}</div>

        <div className="product-carousel">
          <button
            className={`nav-button nav-button-left ${
              currentIndex === 0 ? "disabled" : ""
            }`}
            onClick={goPrevious}
            disabled={currentIndex === 0}
            aria-label="Previous Products"
          >
            &#8249;
          </button>

          <div className="main-product">
            {/* Dynamic Rendering */}
            {currentItems.map((productData, index) => (
              <div
                key={`${productData.title}-${startIndex + index}`}
                className="product-content"
              >
                <div className="item-card">
                  <div className="item-img">
                    <img
                      src={productData.img || "/placeholder.jpg"}
                      alt={productData.title || "Product image"}
                    />
                  </div>
                  <div className="item-title">
                    <div className="title">
                      {productData.title.length > 20
                        ? productData.title.slice(0, 15) + "..."
                        : productData.title}
                    </div>
                    <div className="offer-title">{productData.msg}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className={`nav-button nav-button-right ${
              currentIndex === maxIndex ? "disabled" : ""
            }`}
            onClick={goToNext}
            disabled={currentIndex === maxIndex}
            aria-label="Next Products"
          >
            &#8250;
          </button>
        </div>
      </div>
    </div>
  );
};
