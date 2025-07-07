// ProfileWrapper.jsx - Create this new component
import { useSearchParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import MyProfile from './MyProfile';

const ProfileWrapper = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const section = searchParams.get('section') || 'profile';

  useEffect(() => {
    console.log('ProfileWrapper: Location changed', location);
    console.log('ProfileWrapper: Section from URL:', section);
  }, [location, section]);

  // Force re-render when section changes by using key prop
  return <MyProfile initialSection={section} />;
};

export default ProfileWrapper;