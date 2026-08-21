import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BrandingProvider } from './context/BrandingContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { NotificationToast } from './components/NotificationToast';

// HomePage is directly imported for immediate zero-lag first paint
import { HomePage } from './pages/HomePage';

// Lazy-loaded secondary and admin pages
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const VideosPage = lazy(() => import('./pages/VideosPage').then((m) => ({ default: m.VideosPage })));
const GalleryPage = lazy(() => import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const RecipesPage = lazy(() => import('./pages/RecipesPage').then((m) => ({ default: m.RecipesPage })));
const RecipeDetailPage = lazy(() => import('./pages/RecipeDetailPage').then((m) => ({ default: m.RecipeDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((m) => ({ default: m.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage').then((m) => ({ default: m.UserDashboardPage })));
const TrackOrderPage = lazy(() => import('./pages/TrackOrderPage').then((m) => ({ default: m.TrackOrderPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const PolicyPages = lazy(() => import('./pages/PolicyPages').then((m) => ({ default: m.PolicyPages })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 py-16">
    <div className="w-9 h-9 border-3 border-[#F4B400] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-zinc-400 font-marathi">लोड होत आहे...</span>
  </div>
);

const MainContent: React.FC = () => {
  const { currentPage } = useApp();

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'shop':
        return <ShopPage />;
      case 'product-detail':
        return <ProductDetailPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'videos':
        return <VideosPage />;
      case 'gallery':
        return <GalleryPage />;
      case 'contact':
        return <ContactPage />;
      case 'about':
        return <AboutPage />;
      case 'recipes':
        return <RecipesPage />;
      case 'recipe-detail':
        return <RecipeDetailPage />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'account':
      case 'orders':
        return <UserDashboardPage />;
      case 'track-order':
        return <TrackOrderPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;
      case 'admin-login':
      case 'admin-secret-login':
        return <AdminLoginPage />;
      case 'admin-dashboard':
      case 'admin-branding':
      case 'admin-media':
        return <AdminDashboardPage defaultTab={currentPage === 'admin-media' ? 'media' : currentPage === 'admin-branding' ? 'branding' : undefined} />;
      case 'privacy':
      case 'privacy-policy':
        return <PolicyPages type="privacy" />;
      case 'terms':
        return <PolicyPages type="terms" />;
      case 'shipping-policy':
        return <PolicyPages type="shipping" />;
      case 'refund-policy':
      case 'return-policy':
        return <PolicyPages type="returns" />;
      case 'faqs':
        return <PolicyPages type="faqs" />;
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-sans antialiased flex flex-col justify-between selection:bg-[#F4B400] selection:text-[#111111]">
      <div>
        <Header />
        <main className="transition-all duration-300">
          <Suspense fallback={<PageLoadingFallback />}>
            {renderPage()}
          </Suspense>
        </main>
      </div>

      <Footer />
      <WhatsAppButton />
      <NotificationToast />
    </div>
  );
};

export function App() {
  return (
    <BrandingProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </BrandingProvider>
  );
}

export default App;
