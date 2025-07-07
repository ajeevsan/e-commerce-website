import { NavLink, useRouteError } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

export const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  return (
    <div>
      <h1>Oops! An error occured.</h1>
      {error && <p>{error.data}</p>}
      <NavLink to="/">
        <button onClick={ () => navigate('/')}>Go Home</button>
      </NavLink>
    </div>
  );
};
