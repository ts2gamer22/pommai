'use client';

import { Button, Card } from '@pommai/ui';
import Link from "next/link";

export default function PricingPage() {
  const plans = [
    {
      name: "Hobbyist",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "Create up to 2 AI Toys",
        "200 conversations/month",
        "Basic voices",
        "Web simulator access"
      ],
      cta: "Start Free",
      bg: "#ffffff",
      shadow: "#000000",
      textColor: "black",
      buttonBg: "#c381b5",
      buttonText: "white"
    },
    {
      name: "Pro",
      price: "$19/mo",
      description: "For serious creators",
      features: [
        "Unlimited AI Toys",
        "Unlimited conversations",
        "Premium voices",
        "Advanced personality tools",
        "Priority support"
      ],
      cta: "Go Pro",
      bg: "#c381b5",
      shadow: "#8b5fa3",
      textColor: "white",
      buttonBg: "#ffffff",
      buttonText: "black",
      popular: true
    },
    {
      name: "Guardian Family",
      price: "$29/mo",
      description: "Complete family protection",
      features: [
        "Everything in Pro",
        "Guardian Dashboard",
        "Monitor 5 kids' toys",
        "Extended analytics",
        "Family device management"
      ],
      cta: "Protect Your Family",
      bg: "#92cd41",
      shadow: "#76a83a",
      textColor: "white",
      buttonBg: "#ffffff",
      buttonText: "black"
    }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fefcd0' }}>
      {/* Header Navigation */}
      <header className="border-b-4 border-black bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src="/pommaiicon.png" alt="Pommai Logo" className="h-10 w-10" />
            <img src="/pommaitext.png" alt="Pommai" className="h-8" />
          </Link>
          <nav className="flex gap-4 items-center">
            <Link href="/" className="text-black hover:text-gray-700 font-medium">
              Home
            </Link>
            <Link href="/auth">
              <Button 
                bg="#ffffff"
                textColor="black"
                borderColor="black"
                shadow="#e0e0e0"
                size="small"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button 
                bg="#c381b5"
                textColor="white"
                borderColor="black"
                shadow="#8b5fa3"
                size="small"
              >
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 retro-text text-black">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Choose the perfect plan for your creative journey. Start free and upgrade as you grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {plans.map((plan, index) => (
            <div key={index} className="relative">
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-[#f7931e] text-white px-4 py-2 text-sm font-bold border-2 border-black retro-text">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <Card 
                bg={plan.bg}
                borderColor="black" 
                shadowColor={plan.shadow}
                className={`p-8 h-full ${plan.popular ? 'border-4' : ''} ${plan.popular ? 'transform scale-105' : ''}`}
                style={plan.popular ? { borderColor: '#f7931e' } : {}}
              >
                <div className="text-center">
                  <h3 className="text-3xl font-bold mb-2 retro-text" style={{ color: plan.textColor }}>
                    {plan.name}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: plan.textColor, opacity: 0.8 }}>
                    {plan.description}
                  </p>
                  <p className="text-5xl font-bold mb-8" style={{ color: plan.textColor }}>
                    {plan.price}
                  </p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <span className="font-bold mr-2 text-xl" style={{ color: plan.textColor }}>✓</span>
                      <span style={{ color: plan.textColor }}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth" className="block">
                  <Button 
                    bg={plan.buttonBg}
                    textColor={plan.buttonText}
                    borderColor="black"
                    shadow={plan.shadow}
                    className="w-full py-3 text-lg font-bold"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </Card>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 retro-text text-black">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card bg="#ffffff" borderColor="black" shadowColor="#000000" className="p-6">
              <h4 className="text-xl font-bold mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-700">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </Card>
            <Card bg="#ffffff" borderColor="black" shadowColor="#000000" className="p-6">
              <h4 className="text-xl font-bold mb-2">What happens to my toys if I downgrade?</h4>
              <p className="text-gray-700">Your existing toys remain safe. You just won&apos;t be able to create new ones beyond your plan limit.</p>
            </Card>
            <Card bg="#ffffff" borderColor="black" shadowColor="#000000" className="p-6">
              <h4 className="text-xl font-bold mb-2">Do I need technical skills?</h4>
              <p className="text-gray-700">Not at all! Our platform is designed for everyone. We provide step-by-step guides for hardware setup.</p>
            </Card>
            <Card bg="#ffffff" borderColor="black" shadowColor="#000000" className="p-6">
              <h4 className="text-xl font-bold mb-2">Is there a student discount?</h4>
              <p className="text-gray-700">Yes! Students get 50% off Pro and Guardian plans. Contact us with your .edu email.</p>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mt-20">
          <Card bg="#e8f4fd" borderColor="black" shadowColor="#92cd41" className="p-10 max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold mb-4 retro-text">Ready to start?</h3>
            <p className="text-lg mb-6">Join thousands of creators bringing toys to life!</p>
            <Link href="/auth">
              <Button 
                bg="#c381b5"
                textColor="white"
                borderColor="black"
                shadow="#8b5fa3"
                className="px-8 py-4 text-lg font-bold"
              >
                Start Your Free Plan
              </Button>
            </Link>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-8 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <img src="/pommaiicon.png" alt="Pommai Logo" className="h-6 w-6" />
                <h4 className="text-xl font-bold">Pommai.co</h4>
              </div>
              <p className="text-gray-400">Bringing toys to life, safely.</p>
            </div>
            <nav className="flex gap-6 text-gray-400">
              <Link href="/about" className="hover:text-white">About</Link>
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/docs" className="hover:text-white">Docs</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </nav>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2024 Pommai. Made with ❤️ for parents and kids.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
