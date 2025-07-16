import { useAuth } from "./context/AuthContext";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoutes";
import { ErrorPage } from "./pages/error/ErrorPage";
import { AppLayout } from "./components/layout/AppLayout";
import "./App.css";
import ProfileWrapper from "./pages/profile/ProfileWrapper";
import { ProductDetailed } from "./pages/product-detailed/ProductDetailed";
import { ProductDetail } from "./pages/product-detail/ProductDetail";
import { Payment } from "./pages/payment/Payment";

const App = () => {
  const { isAuthenticated } = useAuth();

  const router = createBrowserRouter([
    {
      path: "/",
      element: <AppLayout />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: "/",
          element: (
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Home />
            </ProtectedRoute>
          ),
        },
        {
        path: "/profile", 
        element: (
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ProfileWrapper />
          </ProtectedRoute>
        ),
      },
      {
        path: '/products/category/:category',
        element: (
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ProductDetailed />
          </ProtectedRoute>
        )
      },
      {
        path: '/cart/:id',
        element: (
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ProductDetail/>
          </ProtectedRoute>
        )
      },
      {
        path: '/payment',
        element: (
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Payment/>
          </ProtectedRoute>
        )
      }
      ],
    },
    {
      path: "login",
      element: <Login />,
    },
    {
      path: "*",
      element: <Login />,
    }
  ]);

  return <RouterProvider router={router}></RouterProvider>;
};

export default App;
