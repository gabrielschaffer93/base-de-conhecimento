import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { HomePage } from '@/pages/public/HomePage'
import { PostDetailPage } from '@/pages/public/PostDetailPage'
import { CategoryPage } from '@/pages/public/CategoryPage'
import { SearchPage } from '@/pages/public/SearchPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { LoginPage } from '@/pages/admin/LoginPage'
import { ForgotPasswordPage } from '@/pages/admin/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/admin/ResetPasswordPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { PostsListPage } from '@/pages/admin/PostsListPage'
import { PostEditPage } from '@/pages/admin/PostEditPage'
import { CategoriesPage } from '@/pages/admin/CategoriesPage'
import { TagsPage } from '@/pages/admin/TagsPage'
import { UsersPage } from '@/pages/admin/UsersPage'
import { MediaPage } from '@/pages/admin/MediaPage'
import { ProfilePage } from '@/pages/admin/ProfilePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'artigos/:slug', element: <PostDetailPage /> },
      { path: 'categorias/:slug', element: <CategoryPage /> },
      { path: 'busca', element: <SearchPage /> },
    ],
  },
  {
    path: '/admin/login',
    element: <LoginPage />,
  },
  {
    path: '/admin/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/admin/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/admin',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'posts', element: <PostsListPage /> },
          { path: 'posts/new', element: <PostEditPage /> },
          { path: 'posts/:id', element: <PostEditPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'tags', element: <TagsPage /> },
          { path: 'media', element: <MediaPage /> },
          { path: 'profile', element: <ProfilePage /> },
          {
            path: 'users',
            element: <ProtectedRoute allowedRoles={['super_admin']} />,
            children: [{ index: true, element: <UsersPage /> }],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
