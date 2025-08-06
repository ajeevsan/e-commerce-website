import { lazy, Suspense } from "react";
// import { ProductCategory } from "../../components/ui/ProductCategory";
const ProductCategory = lazy(() =>
  import("../../components/ui/ProductCategory")
);
import { Carousel } from "../../components/ui/carousel/Carousel";
import { ProductList } from "../../components/home-show-products/ProductList";
import {
  SkeletonLoader,
  GradientSpinner,
  DotsLoader,
  SimpleLoader,
} from "../../components/ui/LoadingComponents";
import "./style.css";

export const Home = () => {
  const productCategories = [
    {
      title: "Best of Electronics",
      data: [
        {
          title: "Best Headphones",
          img: "https://rukminim2.flixcart.com/image/120/120/l58iaa80/headphone/k/z/m/nord-buds-ce-oneplus-original-imagfyk4hyvgg6ze.jpeg?q=80",
          msg: "Grab Now",
        },
        {
          title: "Top Mirrorless Cameras",
          img: "https://rukminim2.flixcart.com/image/120/120/xif0q/dslr-camera/u/q/3/autofocus-16x-digital-zoom-rechargeable-camera-48-dc306-4k-hd-original-imahdyhqyyaxgnmj.jpeg?q=80",
          msg: "Shop Now!",
        },
        {
          title: "Printers",
          img: "https://rukminim2.flixcart.com/image/120/120/xif0q/printer/s/8/d/-original-imafkykednshkhx5.jpeg?q=80",
          msg: "From ₹2336",
        },
        {
          title: "Moniters",
          img: "https://rukminim2.flixcart.com/image/120/120/xif0q/monitor/i/q/k/-original-imahbzhcdvc6gkhu.jpeg?q=80",
          msg: "From ₹6599",
        },
        {
          title: "Speakers",
          img: "https://rukminim2.flixcart.com/image/120/120/kcf4lu80/speaker/mobile-tablet-speaker/h/u/f/srs-xb23-sony-original-imaftk66vjxp86h5.jpeg?q=80",
          msg: "From ₹499*",
        },
        {
          title: "Projector",
          img: "https://rukminim2.flixcart.com/image/120/120/xif0q/projector/q/7/6/i9-pro-10-ei9027-led-projector-egate-original-imah5e3bggu5qcgp.jpeg?q=80",
          msg: "From ₹6990*",
        },
        {
          title: "Instax Cameras",
          img: "https://rukminim2.flixcart.com/image/120/120/kbzergw0/instant-camera/m/h/u/instax-instant-camera-mini-11-fujifilm-original-imaft7fpfzkcsequ.jpeg?q=80",
          msg: "From ₹3999*",
        },
        {
          title: "Laptop",
          img: "https://rukminim2.flixcart.com/image/210/210/xif0q/computer/p/z/p/-original-imahdhc7tygd5ntz.jpeg?q=80",
          msg: "Best Picks",
        },
      ],
    },
    {
      title: "Fashion & Accessories",
      data: [
        {
          title: "Trending Shirts",
          img: "https://rukminim2.flixcart.com/image/210/210/xif0q/t-shirt/v/9/e/xl-723-2-3-5-7-ftx-original-imah9mfwyyzbrffu.jpeg?q=80",
          msg: "Limited Time!",
        },
        {
          title: "Designer Watches",
          img: "https://rukminim2.flixcart.com/image/210/210/xif0q/watch/h/q/4/1-sk-pg-4075-blk-slvr-basic-analog-watch-for-men-with-day-and-original-imah5f9wfqgpfeyw.jpeg?q=80",
          msg: "Exclusive Deal",
        },
        {
          title: "Top Selling Stationery",
          img: "https://rukminim2.flixcart.com/image/120/120/kx50gi80/pen/h/z/k/119766-flair-original-imag9nzubznagufg.jpeg?q=80",
          msg: "From ₹49",
        },
        {
          title: "Men And Women Raincoats",
          img: "https://rukminim2.flixcart.com/image/210/210/xif0q/raincoat/n/z/o/3xl-crre01-black-citizen-original-imahfuyjdcs55rgy.jpeg?q=80",
          msg: "Special Offer",
        },
        {
          title: `Women's Kurtas`,
          img: "https://rukminim2.flixcart.com/image/210/210/xif0q/kurta/c/6/g/3xl-sayyara-pure-cotton-kurta-for-women-sayyara-store-original-imahdn3w2peu58rh.jpeg?q=80",
          msg: "Grab Now",
        },
      ],
    },
    {
      title: "Home & Kitchen",
      data: [
        {
          title: "Home Appliances",
          img: "https://rukminim2.flixcart.com/image/210/210/xif0q/washing-machine-new/0/s/j/-original-imahaygbg5t9dpff.jpeg?q=80",
          msg: "Save Big!",
        },
        {
          title: "Furniture",
          img: "https://rukminim2.flixcart.com/image/210/210/xif0q/collapsible-wardrobe/m/0/m/45-carbon-steel-1700-3-5-dew-3-door-grey-dewberries-grey-1300-original-imagg7hwj9vgrtvg.jpeg?q=80",
          msg: "Best Price",
        },
        {
          title: "Coffee Tables",
          img: "https://rukminim2.flixcart.com/image/210/210/xif0q/coffee-table/v/c/0/92-mdf-46-7-hd-566-heritagedesigns-46-2t-white-original-imah8nwfwsjchrvj.jpeg?q=80",
          msg: "Min. 50% Off",
        },
        {
          title: "Air Conditioners",
          img: "https://rukminim2.flixcart.com/image/210/210/xif0q/air-conditioner-new/u/0/s/-original-imahcbstjragqhnj.jpeg?q=80",
          msg: "Min 50% Off",
        },
        {
          title: "Office Study Chairs",
          img: "https://rukminim2.flixcart.com/image/210/210/xif0q/office-study-chair/p/r/x/-original-imah8j62gusy7r6f.jpeg?q=80",
          msg: "Min 50% Off",
        },
      ],
    },
  ];

  return (
    <div>
      <Suspense fallback={<SkeletonLoader />}>
        <ProductCategory />
      </Suspense>

      <Carousel />

      {/* Render multiple product lists dynamically */}
      {productCategories.map((category, index) => (
        <ProductList key={`category-${index}`} config={category} />
      ))}
    </div>
  );
};

export default Home;
