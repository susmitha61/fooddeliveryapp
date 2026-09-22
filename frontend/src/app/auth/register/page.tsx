'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRegisterMutation } from '@/store/api/authApi';
import { UserRole } from '@/types';
import { ROUTES } from '@/lib/constants';
import { UserPlus, Mail, Lock, User, Phone, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER' as UserRole,
  });

  const [registerUser, { isLoading }] = useRegisterMutation();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    // Backend validation: Indian 10-digit mobile number starting with 6-9
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit mobile number (starting with 6-9)');
      return;
    }

    // Backend validation: Min 8 chars with letters & numbers
    if (!/^(?=.*[0-9])(?=.*[a-zA-Z]).{8,}$/.test(formData.password)) {
      toast.error('Password must be at least 8 characters and contain both letters and numbers');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const res = await registerUser({
        name: formData.name.trim(),  // backend RegisterRequest.name
        email: formData.email,
        phone: cleanPhone,
        password: formData.password,
        role: formData.role,
      }).unwrap();

      toast.success('Account created! Please sign in.');
      router.push(ROUTES.LOGIN);
    } catch (err: any) {
      // Backend returns validation errors in data object: { fieldName: 'message' }
      const fieldErrors = err?.data?.data;
      if (fieldErrors && typeof fieldErrors === 'object') {
        const firstError = Object.values(fieldErrors)[0] as string;
        toast.error(firstError || 'Validation error');
      } else {
        toast.error(err?.data?.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
      {/* Minimal Auth Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--surface-color)]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[var(--primary-color)] flex items-center justify-center text-white shadow-md shadow-[var(--primary-color)]/20">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="font-outfit font-extrabold text-xl tracking-tight text-[var(--text-primary)]">
            Bite<span className="text-[var(--primary-color)]">Rush</span>
          </span>
        </Link>
        <Link
          href="/auth/login"
          className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--primary-color)] transition-colors"
        >
          Already have an account? Log In →
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[var(--surface-color)] border border-[var(--border-color)] p-8 rounded-3xl shadow-2xl"
        >
          <div className="text-center mb-6">
            <h1 className="font-outfit text-2xl font-bold">Create an Account</h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Join BiteRush as a Customer, Owner, Driver, or Admin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Phone Number (10 digits)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Account Role</label>
              <div className="relative">
                <Shield className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                >
                  <option value="CUSTOMER">Customer (Order Food)</option>
                  <option value="RESTAURANT_OWNER">Restaurant Owner (Manage Store)</option>
                  <option value="DELIVERY_DRIVER">Delivery Driver (Deliver Orders)</option>
                  <option value="MANAGER">Manager (Operations & Support)</option>
                  <option value="ADMIN">System Administrator (Full Access)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Password (min 8 chars, letters & numbers)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span>Registering...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-xs text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link href={ROUTES.LOGIN} className="text-[var(--primary-color)] font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
