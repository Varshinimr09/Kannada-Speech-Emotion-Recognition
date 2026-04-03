import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';

const Home = lazy(() => import('../pages/home/page'));
const Dashboard = lazy(() => import('../pages/dashboard/page'));
const LiveDetection = lazy(() => import('../pages/live-detection/page'));
const Login = lazy(() => import('../pages/login/page'));
const Register = lazy(() => import('../pages/register/page'));
const UploadAudio = lazy(() => import('../pages/upload-audio/page'));
const Visualization = lazy(() => import('../pages/visualization/page'));
const PredictionHistory = lazy(() => import('../pages/prediction-history/page'));
const ModelPerformance = lazy(() => import('../pages/model-performance/page'));
const DatasetInfo = lazy(() => import('../pages/dataset-info/page'));
const About = lazy(() => import('../pages/about/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>
  },
  {
    path: '/live-detection',
    element: <ProtectedRoute><LiveDetection /></ProtectedRoute>
  },
  {
    path: '/upload-audio',
    element: <ProtectedRoute><UploadAudio /></ProtectedRoute>
  },
  {
    path: '/visualization',
    element: <ProtectedRoute><Visualization /></ProtectedRoute>
  },
  {
    path: '/prediction-history',
    element: <ProtectedRoute><PredictionHistory /></ProtectedRoute>
  },
  {
    path: '/model-performance',
    element: <ProtectedRoute><ModelPerformance /></ProtectedRoute>
  },
  {
    path: '/dataset-info',
    element: <ProtectedRoute><DatasetInfo /></ProtectedRoute>
  },
  {
    path: '/about',
    element: <ProtectedRoute><About /></ProtectedRoute>
  },
  {
    path: '*',
    element: <NotFound />
  }
];

export default routes;