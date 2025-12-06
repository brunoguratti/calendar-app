import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy via-blue to-navy-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNC40MTggMy41ODItOCA4LThzOCAzLjU4MiA4IDgtMy41ODIgOC04IDgtOC0zLjU4Mi04LTh6bTAgMzJjMC00LjQxOCAzLjU4Mi04IDgtOHM4IDMuNTgyIDggOC0zLjU4MiA4LTggOC04LTMuNTgyLTgtOHptMCAwYzAtNC40MTggMy41ODItOCA4LThzOCAzLjU4MiA4IDgtMy41ODIgOC04IDgtOC0zLjU4Mi04LTh6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
              <span className="block">Welcome to</span>
              <span className="block text-champagne mt-2">EasySchedule</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Professional appointment scheduling made simple. Perfect for hairdressers,
              personal trainers, tutors, and service professionals.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-champagne hover:bg-champagne-600 text-carafe border-0 shadow-2xl">
                  ✨ Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-champagne text-white hover:bg-champagne hover:text-carafe">
                  Sign In →
                </Button>
              </Link>
            </div>

            <div className="flex justify-center gap-8 text-champagne-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
                Setup in 5 minutes
              </div>
            </div>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600">Powerful features designed for busy professionals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="stat-card border-navy">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-navy mb-3">24/7 Booking</h3>
              <p className="text-gray-600 leading-relaxed">
                Your customers can book appointments anytime, anywhere through your personalized booking page. Never miss a booking opportunity again.
              </p>
            </div>

            <div className="stat-card border-blue">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-navy mb-3">Smart Scheduling</h3>
              <p className="text-gray-600 leading-relaxed">
                Intelligent slot management prevents double-bookings and optimizes your schedule automatically based on service duration.
              </p>
            </div>

            <div className="stat-card border-champagne-700">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-navy mb-3">Insightful Dashboard</h3>
              <p className="text-gray-600 leading-relaxed">
                Beautiful calendar view and analytics help you track appointments, manage bookings, and grow your business effortlessly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in just 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: 1, title: 'Create Account', desc: 'Sign up free in under 2 minutes. No credit card needed.', icon: '👤' },
              { num: 2, title: 'Add Services', desc: 'Configure your services with pricing and duration.', icon: '✂️' },
              { num: 3, title: 'Set Availability', desc: 'Define your working hours for each day of the week.', icon: '🕐' },
              { num: 4, title: 'Start Booking', desc: 'Share your link and start accepting bookings!', icon: '🚀' },
            ].map((step) => (
              <div key={step.num} className="relative">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-navy to-blue text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl font-bold shadow-xl transform hover:scale-110 transition-transform">
                    {step.num}
                  </div>
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h4 className="text-xl font-bold text-navy mb-2">{step.title}</h4>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
                {step.num < 4 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-navy to-blue opacity-20" style={{ width: 'calc(100% - 5rem)', left: 'calc(50% + 2.5rem)' }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-br from-champagne-50 to-champagne-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-navy mb-6">
                Why Professionals Love EasySchedule
              </h2>
              <div className="space-y-6">
                {[
                  { icon: '⚡', title: 'Save Time', desc: 'Eliminate back-and-forth phone calls and messages' },
                  { icon: '💰', title: 'Reduce No-Shows', desc: 'Automated email confirmations keep customers informed' },
                  { icon: '📱', title: 'Mobile Friendly', desc: 'Works perfectly on all devices - desktop, tablet, and mobile' },
                  { icon: '🔒', title: 'Secure & Reliable', desc: 'Your data is protected with enterprise-grade security' },
                ].map((benefit) => (
                  <div key={benefit.title} className="flex gap-4 items-start">
                    <div className="text-4xl">{benefit.icon}</div>
                    <div>
                      <h4 className="text-xl font-bold text-navy mb-1">{benefit.title}</h4>
                      <p className="text-gray-700">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-gradient">
              <div className="text-6xl mb-6 text-center">📈</div>
              <h3 className="text-2xl font-bold text-navy text-center mb-4">
                Join Growing Professionals
              </h3>
              <p className="text-gray-700 text-center mb-6">
                Thousands of service professionals trust EasySchedule to manage their appointments and grow their business.
              </p>
              <div className="flex justify-center">
                <Link to="/register">
                  <Button size="lg">Start Your Free Trial</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-navy via-blue to-navy-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Scheduling?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of professionals who have simplified their appointment booking with EasySchedule.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-champagne hover:bg-champagne-600 text-carafe border-0 shadow-2xl">
              🎉 Create Your Free Account
            </Button>
          </Link>
          <p className="text-champagne-200 mt-6 text-sm">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-navy-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2024 EasySchedule. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
