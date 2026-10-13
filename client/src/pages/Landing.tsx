import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { heroImage } from '../assets/hero.jpg';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏡</span>
          <span className="font-bold text-lg text-brand-800">RentEase Kenya</span>
        </div>
        <div className="flex gap-3">
          {user ? (
            <Link to={`/${user.role.toLowerCase()}`} className="btn-primary text-sm">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
              <Link to="/register" className="btn-primary text-sm">Register</Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <img src={heroImage} alt="Modern apartment building" className="w-full h-[420px] object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-center">
          <div className="max-w-3xl mx-auto px-6 text-center text-white">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Rental Property Management, Built for Kenya
            </h1>
            <p className="text-lg text-gray-100 mb-6">
              Track rent payments, manage tenants, and handle maintenance requests all in one place, with M-Pesa built in.
            </p>
            {!user && (
              <Link to="/register" className="btn-primary inline-block">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16 grid sm:grid-cols-3 gap-8">
        <div>
          <h3 className="font-semibold text-lg text-brand-800 mb-2">For Landlords</h3>
          <p className="text-gray-600 text-sm">
            Manage properties and units, track rent collection, assign caretakers, and view revenue and occupancy reports at a glance.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-brand-800 mb-2">For Tenants</h3>
          <p className="text-gray-600 text-sm">
            View your payment history, download receipts instantly, and submit maintenance requests with photos.
          </p>
        </div>
        <div>
          <h3 className="font-semibold text-lg text-brand-800 mb-2">For Caretakers</h3>
          <p className="text-gray-600 text-sm">
            Log payments on behalf of tenants and keep maintenance requests moving for the property you manage.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="bg-brand-50 py-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-xl font-bold text-brand-800 mb-3">Get in Touch</h2>
          <p className="text-gray-600 text-sm mb-1">Email: support@rentease.co.ke</p>
          <p className="text-gray-600 text-sm">Phone: +254 700 000 000</p>
        </div>
      </section>

      <footer className="text-center text-xs text-gray-400 py-6">
        © {new Date().getFullYear()} RentEase Kenya
      </footer>
    </div>
  );
}