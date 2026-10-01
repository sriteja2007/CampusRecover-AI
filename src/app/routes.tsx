import { lazy, Suspense } from "react"
import { createBrowserRouter, Navigate } from "react-router"
import { PublicLayout } from "../components/layout/PublicLayout"
import { AppLayout } from "../components/layout/AppLayout"
import { RoleGuard } from "../components/auth/RoleGuard"
import { ProtectedRoute } from "../components/auth/ProtectedRoute"
import { GuestRoute } from "../components/auth/GuestRoute"
import { RouteErrorBoundary } from "../components/common/RouteErrorBoundary"
import { SkeletonDashboard, SkeletonGrid } from "../components/common/Skeleton"
import { LoadingSpinner } from "../components/common/LoadingSpinner"
import { ROLES, ROUTES } from "../config/constants"

// Lazy-loaded Public Pages
const LandingPage = lazy(() => import("../pages/LandingPage"))
const Features = lazy(() => import("../pages/Features"))
const HowItWorks = lazy(() => import("../pages/HowItWorks"))
const About = lazy(() => import("../pages/About"))
const Contact = lazy(() => import("../pages/Contact"))
const Login = lazy(() => import("../pages/Login"))
const SignUp = lazy(() => import("../pages/SignUp"))
const OTPVerification = lazy(() => import("../pages/OTPVerification"))

// Lazy-loaded SaaS App Pages
const Dashboard = lazy(() => import("../pages/Dashboard"))
const BrowseItems = lazy(() => import("../pages/BrowseItems"))
const BrowseLost = lazy(() => import("../pages/BrowseLost"))
const BrowseFound = lazy(() => import("../pages/BrowseFound"))
const ReportLost = lazy(() => import("../pages/ReportLost"))
const ReportFound = lazy(() => import("../pages/ReportFound"))
const ItemDetail = lazy(() => import("../pages/ItemDetail"))
const ReportHistory = lazy(() => import("../pages/ReportHistory"))
const AIMatch = lazy(() => import("../pages/AIMatch"))
const Chat = lazy(() => import("../pages/Chat"))
const QRVerification = lazy(() => import("../pages/QRVerification"))
const ClaimSuccess = lazy(() => import("../pages/ClaimSuccess"))
const Notifications = lazy(() => import("../pages/Notifications"))
const Maps = lazy(() => import("../pages/Maps"))
const CampusOffice = lazy(() => import("../pages/CampusOffice"))
const Profile = lazy(() => import("../pages/Profile"))
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"))
const FraudDetection = lazy(() => import("../pages/FraudDetection"))
const AuditLogs = lazy(() => import("../pages/AuditLogs"))
const NotFound = lazy(() => import("../pages/NotFound"))

const suspenseWrap = (
  Component: React.ComponentType,
  fallback: React.ReactNode = (
    <LoadingSpinner fullScreen={false} message="Loading module..." />
  ),
) => (
  <Suspense fallback={fallback}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLayout,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: suspenseWrap(LandingPage) },
      { path: "features", element: suspenseWrap(Features) },
      { path: "how-it-works", element: suspenseWrap(HowItWorks) },
      { path: "about", element: suspenseWrap(About) },
      { path: "contact", element: suspenseWrap(Contact) },
      {
        path: ROUTES.LOGIN,
        element: <GuestRoute>{suspenseWrap(Login)}</GuestRoute>,
      },
      {
        path: ROUTES.SIGNUP,
        element: <GuestRoute>{suspenseWrap(SignUp)}</GuestRoute>,
      },
      {
        path: "otp",
        element: <GuestRoute>{suspenseWrap(OTPVerification)}</GuestRoute>,
      },
    ],
  },
  // Redirect legacy /app paths & direct top-level convenience routes
  {
    path: "/app/*",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/app",
    element: <Navigate to="/dashboard" replace />,
  },
  { path: "/search", element: <Navigate to="/dashboard/search" replace /> },
  { path: "/my-reports", element: <Navigate to="/dashboard/my-reports" replace /> },
  { path: "/my-entries", element: <Navigate to="/dashboard/my-reports" replace /> },
  { path: "/report-lost", element: <Navigate to="/dashboard/report-lost" replace /> },
  { path: "/report-found", element: <Navigate to="/dashboard/report-found" replace /> },
  { path: "/ai-match", element: <Navigate to="/dashboard/ai-match" replace /> },
  { path: "/matches", element: <Navigate to="/dashboard/ai-match" replace /> },
  { path: "/verify", element: <Navigate to="/dashboard/scan-qr" replace /> },
  {
    path: "/dashboard",
    errorElement: <RouteErrorBoundary />,
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: suspenseWrap(Dashboard, <SkeletonDashboard />) },
      { path: "profile", element: suspenseWrap(Profile) },
      {
        path: "search",
        element: suspenseWrap(BrowseItems, <SkeletonGrid count={6} />),
      },
      {
        path: "lost",
        element: suspenseWrap(BrowseLost, <SkeletonGrid count={6} />),
      },
      {
        path: "found",
        element: suspenseWrap(BrowseFound, <SkeletonGrid count={6} />),
      },
      { path: "report-lost", element: suspenseWrap(ReportLost) },
      { path: "report-found", element: suspenseWrap(ReportFound) },
      { path: "item/:type/:id", element: suspenseWrap(ItemDetail) },
      { path: "my-reports", element: suspenseWrap(ReportHistory) },
      { path: "notifications", element: suspenseWrap(Notifications) },
      { path: "map", element: suspenseWrap(Maps) },
      { path: "messages", element: suspenseWrap(Chat) },
      { path: "ai-match", element: suspenseWrap(AIMatch) },
      { path: "campus-office", element: suspenseWrap(CampusOffice) },
      { path: "claim-success", element: suspenseWrap(ClaimSuccess) },
      { path: "scan-qr", element: suspenseWrap(QRVerification) },
      { path: "verify", element: suspenseWrap(QRVerification) },
      { path: "generate-otp", element: suspenseWrap(QRVerification) },
      { path: "approve-handover", element: suspenseWrap(QRVerification) },

      // Faculty & Security Specific
      {
        path: "department-items",
        element: (
          <RoleGuard
            allowedRoles={[ROLES.FACULTY, ROLES.ADMIN, ROLES.SUPERADMIN]}
          >
            {suspenseWrap(BrowseItems, <SkeletonGrid count={6} />)}
          </RoleGuard>
        ),
      },
      {
        path: "student-reports",
        element: (
          <RoleGuard
            allowedRoles={[
              ROLES.FACULTY,
              ROLES.SECURITY,
              ROLES.ADMIN,
              ROLES.SUPERADMIN,
            ]}
          >
            {suspenseWrap(BrowseItems, <SkeletonGrid count={6} />)}
          </RoleGuard>
        ),
      },
      {
        path: "inventory",
        element: (
          <RoleGuard
            allowedRoles={[ROLES.SECURITY, ROLES.ADMIN, ROLES.SUPERADMIN]}
          >
            {suspenseWrap(BrowseItems, <SkeletonGrid count={6} />)}
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: "/admin",
    errorElement: <RouteErrorBoundary />,
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPERADMIN]}>
          <AppLayout />
        </RoleGuard>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: suspenseWrap(AdminDashboard, <SkeletonDashboard />),
      },
      { path: "fraud-detection", element: suspenseWrap(FraudDetection) },
      { path: "audit-logs", element: suspenseWrap(AuditLogs) },
      {
        path: "users",
        element: suspenseWrap(AdminDashboard, <SkeletonDashboard />),
      },
      {
        path: "campuses",
        element: suspenseWrap(AdminDashboard, <SkeletonDashboard />),
      },
      {
        path: "statistics",
        element: suspenseWrap(AdminDashboard, <SkeletonDashboard />),
      },
      {
        path: "manage-reports",
        element: suspenseWrap(AdminDashboard, <SkeletonDashboard />),
      },
      {
        path: "approve-claims",
        element: suspenseWrap(AdminDashboard, <SkeletonDashboard />),
      },
      { path: "heatmaps", element: suspenseWrap(Maps) },
      { path: "settings", element: suspenseWrap(Profile) },
    ],
  },
  { path: "*", element: suspenseWrap(NotFound) },
])

export default router
