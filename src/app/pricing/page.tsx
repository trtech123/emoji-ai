import { Stack, Text, XStack, YStack } from 'tamagui';
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
    <YStack padding="$4" space="$4">
      <Text fontSize="$8" fontWeight="bold" textAlign="center">
        Choose Your Plan
      </Text>
      <Text fontSize="$5" textAlign="center" color="$gray11">
        Select the perfect plan for your needs
      </Text>
      <XStack flexWrap="wrap" justifyContent="center" gap="$4" paddingVertical="$4">
        {PRICING_TIERS.map((tier) => (
          <Stack
            key={tier.name}
            width={300}
            padding="$4"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$gray5"
            space="$4"
          >
            <Text fontSize="$6" fontWeight="bold">
              {tier.name}
            </Text>
            <Text fontSize="$8" fontWeight="bold">
              {tier.price}
              <Text fontSize="$4" color="$gray11">/month</Text>
            </Text>
            <Text color="$gray11">{tier.description}</Text>
            <YStack space="$2">
              {tier.features.map((feature) => (
                <Text key={feature} color="$gray12">
                  ✓ {feature}
                </Text>
              ))}
            </YStack>
            <CheckoutButton
              variantId={tier.variantId!}
              customData={{ plan: tier.name.toLowerCase() }}
            >
              Get Started
            </CheckoutButton>
          </Stack>
        ))}
      </XStack>
    </YStack>
  );
} 