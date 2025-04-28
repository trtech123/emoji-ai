import { CheckoutButton } from '@/components/checkout-button';

const PRICING_TIERS = [
  {
    name: 'Basic',
    price: '$9.99',
    description: 'Perfect for getting started',
    features: [
      'Up to 100 emoji generations per month',
      'Basic emoji customization',
      'Email support',
    ],
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_BASIC_VARIANT_ID,
  },
  {
    name: 'Pro',
    price: '$19.99',
    description: 'Best for professionals',
    features: [
      'Unlimited emoji generations',
      'Advanced emoji customization',
      'Priority support',
      'Custom emoji collections',
    ],
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRO_VARIANT_ID,
  },
  {
    name: 'Enterprise',
    price: '$49.99',
    description: 'For large teams',
    features: [
      'Everything in Pro',
      'Team collaboration features',
      'API access',
      'Dedicated support',
      'Custom integrations',
    ],
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_ENTERPRISE_VARIANT_ID,
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold text-center mb-2">
        Choose Your Plan
      </h1>
      <p className="text-xl text-center text-gray-600 mb-8">
        Select the perfect plan for your needs
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PRICING_TIERS.map((tier) => (
          <div
            key={tier.name}
            className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-2xl font-bold mb-2">
              {tier.name}
            </h2>
            <div className="text-3xl font-bold mb-2">
              {tier.price}
              <span className="text-sm text-gray-500 font-normal">/month</span>
            </div>
            <p className="text-gray-600 mb-4">{tier.description}</p>
            <ul className="space-y-2 mb-6">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <CheckoutButton
              variantId={tier.variantId!}
              customData={{ plan: tier.name.toLowerCase() }}
            >
              Get Started
            </CheckoutButton>
          </div>
        ))}
      </div>
    </div>
  );
} 