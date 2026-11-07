import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, RequireAuth, RequirePermission, ToastProvider } from '@/context/AppContext'
import { useGlobalTheme } from '@/hooks/useGlobalTheme'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import UsersPage from '@/pages/users/UsersPage'
import RolesPage from '@/pages/roles/RolesPage'
import IngredientsPage from '@/pages/ingredients/IngredientsPage'
import RecipesPage from '@/pages/recipes/RecipesPage'
import MealsPage from '@/pages/meals/MealsPage'
import HealthPage from '@/pages/health/HealthPage'
import ChronicPage from '@/pages/chronic/ChronicPage'
import AuditPage from '@/pages/audit/AuditPage'
import SettingsPage from '@/pages/settings/SettingsPage'

export default function App() {
  useGlobalTheme()
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route element={<RequirePermission code="user:view" />}>
                <Route path="/users" element={<UsersPage />} />
              </Route>
              <Route element={<RequirePermission code="role:manage" />}>
                <Route path="/roles" element={<RolesPage />} />
              </Route>

              <Route element={<RequirePermission code="ingredient:view" />}>
                <Route path="/ingredients" element={<IngredientsPage />} />
              </Route>
              <Route element={<RequirePermission code="recipe:view" />}>
                <Route path="/recipes" element={<RecipesPage />} />
              </Route>

              <Route element={<RequirePermission code="meal:view" />}>
                <Route path="/meals" element={<MealsPage />} />
              </Route>
              <Route element={<RequirePermission code="health:view" />}>
                <Route path="/health" element={<HealthPage />} />
              </Route>
              <Route element={<RequirePermission code="plan:manage" />}>
                <Route path="/chronic" element={<ChronicPage />} />
              </Route>

              <Route element={<RequirePermission code="role:manage" />}>
                <Route path="/audit" element={<AuditPage />} />
              </Route>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
