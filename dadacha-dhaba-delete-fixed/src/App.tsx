import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BrandingProvider } from './context/BrandingContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { NotificationToast } from './components/NotificationToast';

// Pages
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { VideosPage } from './pages/VideosPage';
import { GalleryPage } from './pages/GalleryPage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';
import { RecipesPage } from './pages/RecipesPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { WishlistPage } from './pages/WishlistPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PolicyPages } from './pages/PolicyPages';
import { NotFoundPage } from './pages/NotFoundPage';

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
          {renderPage()}
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
