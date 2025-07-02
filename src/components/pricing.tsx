import React, { useState, useEffect } from 'react';
import { useUser, PricingTable } from '@clerk/clerk-react';
import { Button } from '@/components/ui/Button';
import { Check, Star, CreditCard, Smartphone, ToggleLeft, ToggleRight } from 'lucide-react';
import SubscriptionCheckout from './payment/SubscriptionCheckout';
import { paymentService } from '../services/paymentService';
import { SubscriptionPlan, UserSubscription } from '../types/payment';

export default function Pricing() {
    const { user, isSignedIn } = useUser();
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [useClerkPricing, setUseClerkPricing] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const plansData = await paymentService.getSubscriptionPlans();
                setPlans(plansData);

                if (isSignedIn && user) {
                    const subscription = await paymentService.getUserSubscription(user.id);
                    setUserSubscription(subscription);
                }
            } catch (error) {
                console.error('Error loading pricing data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isSignedIn, user]);

    const handleSubscribe = (planId: string) => {
        if (!isSignedIn) {
            // Redirect to sign in
            window.location.href = '/sign-in';
            return;
        }

        setSelectedPlanId(planId);
        setShowCheckout(true);
    };

    const handleSubscriptionSuccess = (subscription: UserSubscription) => {
        setUserSubscription(subscription);
        setShowCheckout(false);
        // Show success message or redirect
        alert('Subscription activated successfully!');
    };

    const isCurrentPlan = (planId: string) => {
        return userSubscription?.planId === planId && userSubscription?.status === 'active';
    };

    const getButtonText = (plan: SubscriptionPlan) => {
        if (isCurrentPlan(plan.id)) {
            return 'Current Plan';
        }
        if (plan.id === 'free') {
            return 'Get Started';
        }
        return 'Subscribe Now';
    };

    const getButtonVariant = (plan: SubscriptionPlan) => {
        if (isCurrentPlan(plan.id)) {
            return 'outline';
        }
        if (plan.id === 'free') {
            return 'outline';
        }
        return 'default';
    };

    if (showCheckout) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                <SubscriptionCheckout
                    planId={selectedPlanId}
                    onSuccess={handleSubscriptionSuccess}
                    onCancel={() => setShowCheckout(false)}
                    className="px-6"
                />
            </div>
        );
    }

    return (
        <section className="pt-8 md:pt-16">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">Pricing that Scales with You</h1>
                    <p>Choose the perfect plan for your journaling journey. Upgrade or downgrade at any time.</p>
                    
                    {/* Pricing Mode Toggle */}
                    <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <CreditCard className="w-4 h-4" />
                            <span className={`text-sm ${!useClerkPricing ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                                Custom Payment
                            </span>
                        </div>
                        <button
                            onClick={() => setUseClerkPricing(!useClerkPricing)}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            {useClerkPricing ? (
                                <ToggleRight className="w-6 h-6 text-blue-600" />
                            ) : (
                                <ToggleLeft className="w-6 h-6 text-gray-400" />
                            )}
                        </button>
                        <div className="flex items-center space-x-2">
                            <Smartphone className="w-4 h-4" />
                            <span className={`text-sm ${useClerkPricing ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                                Clerk Billing
                            </span>
                        </div>
                    </div>
                    
                    {userSubscription && (
                        <div className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm">
                            <Check className="w-4 h-4 mr-2" />
                            You're currently on the {plans.find(p => p.id === userSubscription.planId)?.name || 'Unknown'} plan
                        </div>
                    )}
                </div>

                {/* Conditional Pricing Display */}
                {useClerkPricing ? (
                    <div className="mt-8 md:mt-20">
                        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">Clerk Integrated Billing</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                This pricing table is powered by Clerk's billing system, providing seamless integration with your account management.
                            </p>
                        </div>
                        <PricingTable
                            appearance={{
                                elements: {
                                    pricingTable: "bg-white dark:bg-gray-900 rounded-lg shadow-lg",
                                    pricingTableHeader: "text-center mb-8",
                                    pricingTableTitle: "text-3xl font-bold text-gray-900 dark:text-white",
                                    pricingTableSubtitle: "text-gray-600 dark:text-gray-400 mt-2",
                                    pricingTablePlan: "border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow",
                                    pricingTablePlanName: "text-xl font-semibold text-gray-900 dark:text-white",
                                    pricingTablePlanPrice: "text-2xl font-bold text-blue-600 dark:text-blue-400",
                                    pricingTablePlanDescription: "text-gray-600 dark:text-gray-400 mt-2",
                                    pricingTablePlanFeatures: "mt-4 space-y-2",
                                    pricingTablePlanFeature: "flex items-center text-sm text-gray-700 dark:text-gray-300",
                                    pricingTablePlanButton: "w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                }
                            }}
                            ctaPosition="bottom"
                            newSubscriptionRedirectUrl={window.location.origin + "/dashboard"}
                            fallback={
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-3 text-gray-600 dark:text-gray-400">Loading pricing...</span>
                                </div>
                            }
                        />
                    </div>
                ) : (
                    <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-5 md:gap-0">
                    {/* Free Plan */}
                    <div className="rounded-(--radius) flex flex-col justify-between space-y-8 border p-6 md:col-span-2 md:my-2 md:rounded-r-none md:border-r-0 lg:p-10">
                        <div className="space-y-4">
                            <div>
                                <h2 className="font-medium">Free</h2>
                                <span className="my-3 block text-2xl font-semibold">$0 / mo</span>
                                <p className="text-muted-foreground text-sm">Perfect for getting started</p>
                            </div>

                            <Button 
                                variant={getButtonVariant({ id: 'free' } as SubscriptionPlan)} 
                                className="w-full"
                                disabled={isCurrentPlan('free')}
                                onClick={() => handleSubscribe('free')}
                            >
                                {getButtonText({ id: 'free' } as SubscriptionPlan)}
                            </Button>

                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {['Up to 10 journal entries', 'Basic analytics', 'Mobile app access'].map((item, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <Check className="size-3" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Pro Plan */}
                    <div className="dark:bg-muted rounded-(--radius) border p-6 shadow-lg shadow-gray-950/5 md:col-span-3 lg:p-10 dark:[--color-muted:var(--color-zinc-900)] relative">
                        {/* Popular badge */}
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <div className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                                <Star className="w-3 h-3 mr-1" />
                                Most Popular
                            </div>
                        </div>
                        
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <h2 className="font-medium">Pro</h2>
                                    <span className="my-3 block text-2xl font-semibold">$19 / mo</span>
                                    <p className="text-muted-foreground text-sm">For serious journaling enthusiasts</p>
                                </div>

                                <Button 
                                    variant={getButtonVariant({ id: 'pro' } as SubscriptionPlan)} 
                                    className="w-full"
                                    disabled={isCurrentPlan('pro')}
                                    onClick={() => handleSubscribe('pro')}
                                >
                                    {getButtonText({ id: 'pro' } as SubscriptionPlan)}
                                </Button>
                                
                                {/* Payment methods */}
                                <div className="text-xs text-muted-foreground text-center">
                                    <p>Supports Credit Card & MoMo Wallet</p>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium">Everything in free plus:</div>

                                <ul className="mt-4 list-outside space-y-3 text-sm">
                                    {[
                                        'Unlimited journal entries', 
                                        'Advanced analytics', 
                                        'Export capabilities', 
                                        'Priority support', 
                                        'Custom themes',
                                        'Cloud backup',
                                        'Collaboration features',
                                        'Advanced search',
                                        'Monthly insights report',
                                        'Premium templates'
                                    ].map((item, index) => (
                                        <li key={index} className="flex items-center gap-2">
                                            <Check className="size-3" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                )}
                
                {/* Payment methods info - only show for custom pricing */}
                {!useClerkPricing && (
                    <div className="mt-12 text-center">
                        <p className="text-sm text-muted-foreground mb-4">We support multiple payment methods:</p>
                        <div className="flex justify-center items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">💳</span>
                                </div>
                                <span className="text-sm">Credit/Debit Cards</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">M</span>
                                </div>
                                <span className="text-sm">MoMo Wallet (Vietnam)</span>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* FAQ or additional info */}
                <div className="mt-16 text-center">
                    <p className="text-sm text-muted-foreground">
                        Questions about pricing? <a href="/contact" className="text-blue-500 hover:underline">Contact our support team</a>
                    </p>
                    {useClerkPricing && (
                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                💡 <strong>Note:</strong> Clerk billing provides built-in subscription management, invoicing, and customer portal access.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
