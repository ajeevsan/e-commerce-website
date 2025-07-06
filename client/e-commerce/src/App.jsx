import { useAuth } from "./context/AuthContext";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoutes";
import { ErrorPage } from "./pages/error/ErrorPage";
import { AppLayout } from "./components/layout/AppLayout";
import "./App.css";

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
      ],
    },
    {
      path: "login",
      element: <Login />,
    },
    {
      path: "*",
      element: <Login />,
    },
  ]);

  return <RouterProvider router={router}></RouterProvider>;
};

export default App;
