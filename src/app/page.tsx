'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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

export default function HomePage() {
  const features = [
    {
      icon: Shield,
      title: 'Secure Digital Identity',
      description: 'Bank-grade security with biometric verification and encrypted data transmission'
    },
    {
      icon: Zap,
      title: 'Instant Verification',
      description: 'Real-time identity verification using your NatWest mobile app'
    },
    {
      icon: TrendingUp,
      title: 'Smart Credit Assessment',
      description: 'AI-powered credit evaluation for faster application processing'
    },
    {
      icon: CheckCircle,
      title: 'Streamlined Process',
      description: 'Complete your application in minutes, not days'
    }
  ];

  const products = [
    {
      title: 'Credit Cards',
      description: 'Apply for your NatWest credit card with instant verification',
      icon: CreditCard,
      color: 'from-purple-400 to-purple-500'
    },
    {
      title: 'Digital Banking',
      description: 'Secure, convenient banking with digital identity verification',
      icon: Smartphone,
      color: 'from-purple-400 to-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                A little more{' '}
                <span className="px-3 py-2 rounded-md text-white font-bold text-highlight-image">
                  money
                </span>{' '}
                <span className="px-3 py-2 rounded-md text-white font-bold text-highlight-image">
                  confident
                </span>
              </h1>
              
              <p className="text-xl text-purple-100 leading-relaxed">
                From pocket money to pay day, we're helping young people grow their money confidence with secure digital identity verification.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-purple-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-50 transition-colors shadow-lg"
                >
                  Find out more
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-purple-900 transition-colors"
                >
                  Learn more
                </motion.button>
              </div>
            </motion.div>

            {/* Right Content - Hero Image */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="https://www.natwest.com/content/dam/natwest/personal/youth/image.dim.667.nw-pers-hero-bracelet-boy-2160x1176.png"
                  alt="Young person with money confidence - NatWest"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-purple-900 mb-4">
              Explore our products and services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how digital identity verification can enhance your banking experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border border-gray-100"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${product.color} rounded-lg flex items-center justify-center mb-6`}>
                  <product.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{product.title}</h3>
                <p className="text-gray-600 mb-6">{product.description}</p>
                {product.title === 'Credit Cards' ? (
                  <Link href="/credit-card">
                    <button className="text-purple-600 font-semibold hover:text-purple-700 flex items-center space-x-2 group">
                      <span>Apply now</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                ) : (
                  <button className="text-purple-600 font-semibold hover:text-purple-700 flex items-center space-x-2 group">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-purple-900 mb-4">
              Why choose digital verification?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of secure banking with our advanced digital identity solutions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-purple-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-bold">
              Ready to experience the future of banking?
            </h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Apply for your NatWest credit card today with our secure digital identity verification process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/credit-card">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-purple-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-purple-50 transition-colors shadow-lg"
                >
                  Apply for Credit Card
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-purple-900 transition-colors"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/natwest-logo.svg" 
                  alt="NatWest" 
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-400">
                Secure digital banking with advanced identity verification.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Products</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Credit Cards</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Digital Banking</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Loans</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Savings</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">News</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NatWest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}