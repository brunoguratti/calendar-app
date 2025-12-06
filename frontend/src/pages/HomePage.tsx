import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center py-20">
          <h1 className="text-6xl font-bold text-primary-600 mb-4">
            EasySchedule
          </h1>
          <p className="text-2xl text-gray-700 mb-8">
            Online Scheduling Made Simple for Micro-Businesses
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Streamline your appointment booking process. Perfect for hairdressers,
            personal trainers, tutors, and more.
          </p>

          <div className="flex justify-center space-x-4">
            <Link to="/register">
              <Button variant="primary" className="text-lg px-8 py-3">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
            <p className="text-gray-600">
              Customers can book appointments 24/7 through your personalized booking
              page
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-5xl mb-4">⏰</div>
            <h3 className="text-xl font-semibold mb-2">Manage Availability</h3>
            <p className="text-gray-600">
              Set your working hours and let the system handle the rest
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">Track Appointments</h3>
            <p className="text-gray-600">
              View all your bookings in a beautiful calendar interface
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-12 my-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Sign Up</h4>
              <p className="text-sm text-gray-600">
                Create your free account in minutes
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Set Up Services</h4>
              <p className="text-sm text-gray-600">
                Add your services and availability
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Share Your Link</h4>
              <p className="text-sm text-gray-600">
                Send your booking page to customers
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">Get Booked</h4>
              <p className="text-sm text-gray-600">
                Accept bookings and grow your business
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to simplify your scheduling?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join hundreds of professionals using EasySchedule
          </p>
          <Link to="/register">
            <Button variant="primary" className="text-lg px-8 py-3">
              Start Free Today
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
