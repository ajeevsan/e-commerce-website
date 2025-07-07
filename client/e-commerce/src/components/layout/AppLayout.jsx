import { Outlet } from "react-router-dom";
import { Footer } from "../ui/footer/Footer";
import { Header } from "../ui/Header";

export const AppLayout = () => {


  
  return (
    <>
      <Header />
        <Outlet />
      <Footer />
    </>
  );
};
