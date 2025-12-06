import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { registerSchema } from '../../utils/validation';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import type { RegisterFormData } from '../../types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await authAPI.register(data);
      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            EasySchedule
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900">
            Create your account
          </h2>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <Input
              {...register('name')}
              type="text"
              label="Your Name"
              placeholder="John Smith"
              error={errors.name?.message}
              autoComplete="name"
            />

            <Input
              {...register('businessName')}
              type="text"
              label="Business Name"
              placeholder="John's Barber Shop"
              error={errors.businessName?.message}
            />

            <Input
              {...register('slug')}
              type="text"
              label="Booking URL Slug"
              placeholder="johns-barber-shop"
              error={errors.slug?.message}
            />
            <p className="text-xs text-gray-500 -mt-3 mb-4">
              Your booking page will be: /book/your-slug
            </p>

            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="your@email.com"
              error={errors.email?.message}
              autoComplete="email"
            />

            <Input
              {...register('password')}
              type="password"
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
