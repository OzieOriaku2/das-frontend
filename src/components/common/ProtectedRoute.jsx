import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
// import { selectIsAuthenticated, selectCurrentUser } from '../slices/authSlice'
import { selectIsAuthenticated, selectCurrentUser } from '../../slices/authSlice'


const ProtectedRoute = ({ children, roles }) => {
  const isAuth = useSelector(selectIsAuthenticated)
  const user = useSelector(selectCurrentUser)
  const location = useLocation()

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard/archive" replace />
  }

  return children
}

export default ProtectedRoute
