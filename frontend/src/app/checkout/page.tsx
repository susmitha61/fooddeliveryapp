'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCart } from '@/store/slices/cartSlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { usePlaceOrderMutation, useAddToCartMutation, useClearCartApiMutation } from '@/store/api/orderApi';
import { useInitiatePaymentMutation, useProcessMockPaymentMutation } from '@/store/api/paymentApi';
import { useGetAddressesQuery, useAddAddressMutation } from '@/store/api/userApi';
import { AddressForm, AddressFormData } from '@/components/user/AddressForm';
import { formatCurrency } from '@/lib/utils';
import { ROUTES, DELIVERY_FEE, TAX_RATE } from '@/lib/constants';
import {
  MapPin, CreditCard, ShieldCheck, CheckCircle2,
  ShoppingBag, ArrowRight, Home, Briefcase, Plus, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

type PaymentMethod = 'CARD' | 'UPI' | 'CASH_ON_DELIVERY' | 'NET_BANKING' | 'WALLET';

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id || (user as any)?.userId || '';

  const cart = useAppSelector((state) => state.cart);

  const { data: addressesRes, isLoading: isLoadingAddresses } = useGetAddressesQuery(userId, {
    skip: !userId,
  });
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    return [];
  };

  const savedAddresses = extractArray(addressesRes);

  // Selected address ID or 'custom'
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Delivery address fields matching backend PlaceOrderRequest
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-select default or first address once loaded
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      selectAddress(defaultAddr);
    }
  }, [savedAddresses, selectedAddressId]);

  const selectAddress = (addr: any) => {
    if (!addr) return;
    setSelectedAddressId(addr.id || addr.addressId || 'custom');
    setDeliveryAddress(addr.streetAddress || addr.address || '');
    setDeliveryCity(addr.city || '');
    setDeliveryArea(addr.area || addr.landmark || '');
    setDeliveryPincode(addr.pincode || '');
  };

  const handleCustomAddressSubmit = async (data: AddressFormData) => {
    setDeliveryAddress(data.streetAddress);
    setDeliveryCity(data.city);
    setDeliveryArea(data.landmark || '');
    setDeliveryPincode(data.pincode);
    setSelectedAddressId('custom');
    setShowNewAddressForm(false);

    // Save to user address book in background
    if (userId) {
      try {
        await addAddress({
          userId,
          body: {
            label: data.label,
            streetAddress: data.streetAddress,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            landmark: data.landmark,
            isDefault: data.isDefault,
          },
        }).unwrap();
        toast.success('Address saved to your address book');
      } catch {
        // Continue with checkout even if address book save fails
      }
    }
  };

  const [placeOrder] = usePlaceOrderMutation();
  const [addToCart] = useAddToCartMutation();
  const [clearCartApi] = useClearCartApiMutation();
  const [initiatePayment] = useInitiatePaymentMutation();
  const [processMockPayment] = useProcessMockPaymentMutation();

  const deliveryFee = cart.items.length > 0 ? DELIVERY_FEE : 0;
  const tax = cart.totalAmount * TAX_RATE;
  const grandTotal = cart.totalAmount + deliveryFee + tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.items.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }

    if (!deliveryAddress.trim() || !deliveryCity.trim()) {
      toast.error('Please specify a delivery address and city');
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(deliveryPincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Mirror local cart to backend: clear first to prevent double-quantity accumulation
      try {
        await clearCartApi().unwrap();
      } catch (clearErr) {
        console.warn('Server cart clear warning:', clearErr);
      }

      for (const item of cart.items) {
        await addToCart({
          restaurantId: cart.restaurantId || item.restaurantId || '',
          restaurantName: cart.restaurantName || (item as any).restaurantName || 'Restaurant',
          itemId: item.menuItemId || item.id,
          itemName: item.menuItemName || item.name || 'Food Item',
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        }).unwrap();
      }
    } catch (syncErr: any) {
      toast.error('Could not prepare your order cart with the kitchen. Please retry.');
      setIsProcessing(false);
      return;
    }

    try {
      // Step 1: Place order
      const orderRes = await placeOrder({
        deliveryAddress,
        deliveryCity,
        deliveryArea: deliveryArea || deliveryCity,
        deliveryPincode,
        paymentMethod,
        specialInstructions: specialInstructions || undefined,
      }).unwrap();

      const orderData = orderRes?.data || orderRes;
      const orderId = orderData?.orderId || orderData?.id || `ORD-${Date.now()}`;
      const officialAmount = Number(orderData?.totalAmount ?? orderData?.subtotal ?? grandTotal);

      if (Math.abs(officialAmount - grandTotal) > 0.01) {
        toast(`Final total confirmed at ${formatCurrency(officialAmount)}`, { icon: 'ℹ️' });
      }

      // Step 2: Initiate payment
      const payRes = await initiatePayment({
        orderId,
        amount: officialAmount,
        paymentMethod: paymentMethod as any,
      }).unwrap();

      const paymentId = (payRes?.data as any)?.paymentId || payRes?.data?.id || `PAY-${Date.now()}`;

      // Step 3: Confirm mock payment (only for non-COD orders; COD remains PENDING until delivery)
      if (paymentMethod !== 'CASH_ON_DELIVERY') {
        await processMockPayment({
          paymentId,
          status: 'SUCCESS',
        }).unwrap();
      }

      // Step 4: Clear local cart state
      dispatch(clearCart());
      dispatch(addNotification({
        title: 'Order Placed Successfully!',
        message: `Order #${String(orderId).slice(-8)} from ${cart.restaurantName || 'Restaurant'} has been placed.`,
        type: 'order',
        link: ROUTES.TRACKING(orderId),
      }));
      toast.success(
        paymentMethod === 'CASH_ON_DELIVERY'
          ? '🎉 Order placed with Cash on Delivery!'
          : '🎉 Payment confirmed & order placed!'
      );
      router.push(ROUTES.TRACKING(orderId));
    } catch (err: any) {
      const fieldError = Object.values(err?.data?.data || {})[0] as string | undefined;
      const msg = err?.data?.message || fieldError || 'Failed to place order. Please try again.';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['CUSTOMER', 'ADMIN']}>
      <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
        <Header />

        <div className="flex-1 flex">
          <RoleSidebar role={user?.role} />

          <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
            {cart.items.length === 0 ? (
              <div className="text-center p-8 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-3xl max-w-md mx-auto my-12">
                <ShoppingBag className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                <h2 className="font-outfit text-xl font-bold">Your Cart is Empty</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1 mb-6">
                  Add some delicious food from restaurants before checking out.
                </p>
                <button
                  onClick={() => router.push(ROUTES.BROWSE)}
                  className="w-full py-3 bg-[var(--primary-color)] text-white font-semibold text-sm rounded-xl"
                >
                  Browse Restaurants
                </button>
              </div>
            ) : (
              <>
                <PageHeader
                  title="Checkout"
                  subtitle={`Complete your order from ${cart.restaurantName || 'Restaurant'}`}
                />
                <div className="h-6" />

                <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Delivery + Payment */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Delivery Address Section */}
                    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[var(--primary-color)] font-bold text-sm">
                          <MapPin className="w-4 h-4" />
                          <span>Delivery Address</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                          className="text-xs font-bold text-[var(--primary-color)] hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{showNewAddressForm ? 'Cancel' : 'Add New Address'}</span>
                        </button>
                      </div>

                      {/* Saved addresses selector */}
                      {savedAddresses.length > 0 && !showNewAddressForm && (
                        <div className="mb-4">
                          <label className="text-xs font-semibold text-[var(--text-secondary)] mb-2 block">
                            Select from Saved Addresses
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {savedAddresses.map((addr) => {
                              const isSelected = selectedAddressId === addr.id;
                              return (
                                <div
                                  key={addr.id}
                                  onClick={() => selectAddress(addr)}
                                  className={`p-3.5 rounded-xl border cursor-pointer transition-all relative ${
                                    isSelected
                                      ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10 ring-1 ring-[var(--primary-color)]'
                                      : 'border-[var(--border-color)] bg-[var(--background-color)] hover:border-[var(--primary-color)]/50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary-color)] flex items-center gap-1">
                                      {addr.label === 'WORK' ? <Briefcase className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                                      {addr.label || 'HOME'}
                                    </span>
                                    {isSelected && (
                                      <div className="w-4 h-4 rounded-full bg-[var(--primary-color)] text-white flex items-center justify-center">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                                    {addr.streetAddress}
                                  </p>
                                  <p className="text-[11px] text-[var(--text-muted)]">
                                    {addr.city}, {addr.pincode}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Add new address inline form */}
                      {showNewAddressForm && (
                        <div className="mb-6">
                          <AddressForm
                            userId={userId}
                            onSave={handleCustomAddressSubmit}
                            onCancel={() => setShowNewAddressForm(false)}
                            isLoading={isAddingAddress}
                          />
                        </div>
                      )}

                      {/* Active Delivery Details Fields */}
                      <div className="border-t border-[var(--border-color)] pt-4 mt-2">
                        <p className="text-xs font-bold text-[var(--text-secondary)] mb-3">
                          Confirm Delivery Details
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">Street Address *</label>
                            <input
                              value={deliveryAddress}
                              onChange={(e) => {
                                setDeliveryAddress(e.target.value);
                                setSelectedAddressId('custom');
                              }}
                              placeholder="House/Flat/Block No, Street Name"
                              className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">Area</label>
                            <input
                              value={deliveryArea}
                              onChange={(e) => {
                                setDeliveryArea(e.target.value);
                                setSelectedAddressId('custom');
                              }}
                              placeholder="Area / Locality"
                              className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">City *</label>
                            <input
                              value={deliveryCity}
                              onChange={(e) => {
                                setDeliveryCity(e.target.value);
                                setSelectedAddressId('custom');
                              }}
                              placeholder="City"
                              className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">Pincode * (6 digits)</label>
                            <input
                              value={deliveryPincode}
                              onChange={(e) => {
                                setDeliveryPincode(e.target.value);
                                setSelectedAddressId('custom');
                              }}
                              placeholder="400001"
                              maxLength={6}
                              pattern="[1-9][0-9]{5}"
                              className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                              required
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">Special Instructions</label>
                            <input
                              value={specialInstructions}
                              onChange={(e) => setSpecialInstructions(e.target.value)}
                              placeholder="e.g. Leave at front door, extra spicy, no cutlery"
                              className="w-full p-3 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl">
                      <div className="flex items-center gap-2 mb-4 text-[var(--primary-color)] font-bold text-sm">
                        <CreditCard className="w-4 h-4" />
                        <span>Payment Method</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {([
                          { value: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
                          { value: 'UPI', label: 'UPI Payment', icon: ShieldCheck },
                          { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', icon: CheckCircle2 },
                          { value: 'NET_BANKING', label: 'Net Banking', icon: Home },
                        ] as const).map(({ value, label, icon: Icon }) => (
                          <div
                            key={value}
                            onClick={() => setPaymentMethod(value)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                              paymentMethod === value
                                ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/10'
                                : 'border-[var(--border-color)] bg-[var(--background-color)] hover:border-[var(--primary-color)]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-xs">{label}</span>
                              <Icon className="w-4 h-4 text-[var(--primary-color)]" />
                            </div>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              {value === 'CASH_ON_DELIVERY' ? 'Pay when your order arrives' : 'Instant secure payment'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Order Summary */}
                  <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-6 rounded-2xl h-fit sticky top-24">
                    <h3 className="font-outfit font-bold text-lg mb-4 border-b border-[var(--border-color)] pb-3">
                      Order Summary
                    </h3>

                    <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-1">
                      {cart.items.map((item) => (
                        <div key={item.menuItemId || item.id} className="flex justify-between text-xs">
                          <div>
                            <span className="font-semibold text-[var(--text-primary)]">
                              {item.menuItemName || item.name}
                            </span>
                            <span className="text-[var(--text-muted)] ml-1">×{item.quantity}</span>
                          </div>
                          <span className="font-mono text-[var(--text-primary)]">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 border-t border-[var(--border-color)] pt-4 text-xs">
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>Subtotal</span>
                        <span>{formatCurrency(cart.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>Delivery Fee</span>
                        <span>{formatCurrency(deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>Est. Tax (8%)</span>
                        <span>{formatCurrency(tax)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base text-[var(--text-primary)] border-t border-[var(--border-color)] pt-3 mt-2">
                        <span>Total</span>
                        <span className="text-[var(--primary-color)]">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full mt-6 py-3.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <span>Processing...</span>
                      ) : (
                        <>
                          <span>Confirm & Pay {formatCurrency(grandTotal)}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
