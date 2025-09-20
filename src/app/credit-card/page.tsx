import CreditCardApplication from '@/components/credit-card/CreditCardApplication';
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  Zap, 
  Globe,
  TrendingUp,
  UserCheck,
  FileText,
  Smartphone,
  Menu
} from 'lucide-react';

export default function CreditCardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200">
      {/* Header */}
      <header className="bg-purple-900 text-white">
        {/* Top Navigation */}
        <div className="border-b border-purple-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-2 text-sm">
              <div className="flex space-x-6">
                <a href="#" className="text-purple-200 hover:text-white font-medium">Personal</a>
                <a href="#" className="text-purple-200 hover:text-white">Premier</a>
                <a href="#" className="text-purple-200 hover:text-white">Business</a>
                <a href="#" className="text-purple-200 hover:text-white">Corporates & Institutions</a>
                <a href="#" className="text-purple-200 hover:text-white">NatWest Group</a>
              </div>
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 px-4 py-2 border border-white rounded-md hover:bg-white hover:text-purple-900 transition-colors">
                  <Lock className="w-4 h-4" />
                  <span>Log in</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <img 
                  src="/natwest-logo.svg" 
                  alt="NatWest" 
                  className="h-8 w-auto"
                />
              </div>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-white hover:text-purple-200 transition-colors">Products</a>
                <a href="#" className="text-white hover:text-purple-200 transition-colors">Help and support</a>
                <a href="#" className="text-white hover:text-purple-200 transition-colors">You and your money</a>
                <a href="#" className="text-white hover:text-purple-200 transition-colors">Banking with us</a>
                <a href="#" className="text-white hover:text-purple-200 transition-colors">Security and fraud</a>
                <a href="#" className="text-white hover:text-purple-200 transition-colors">Climate</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="md:hidden">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <CreditCardApplication />
    </div>
  );
}
