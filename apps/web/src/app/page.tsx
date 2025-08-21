'use client';

import { Button, Card } from "@/components";
import Link from "next/link";
import { useState } from 'react';

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

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
            <Link href="/pricing" className="text-black hover:text-gray-700 font-medium">
              Pricing
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

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-5xl md:text-7xl font-bold mb-6 retro-text text-black">
                Bring Your Toys to Life
              </h2>
              <div className="text-6xl mb-8">🧸</div>
              <p className="text-xl md:text-2xl mb-10 text-gray-800 max-w-2xl mx-auto leading-relaxed">
                Create unique AI personalities for your plushies and toys.
                Safe, magical, and completely under your control.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/auth">
                  <Button 
                    bg="#c381b5"
                    textColor="white"
                    borderColor="black"
                    shadow="#8b5fa3"
                    className="px-10 py-5 text-xl font-bold"
                  >
                    Start Creating
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button 
                    bg="#ffffff"
                    textColor="black"
                    borderColor="black"
                    shadow="#d0d0d0"
                    className="px-10 py-5 text-xl font-bold"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Toy Preview */}
          <div className="container mx-auto px-4 pb-20">
            <div className="max-w-3xl mx-auto">
              <Card 
                bg="#ffffff" 
                borderColor="black" 
                shadowColor="#000000"
                className="p-8"
              >
                <div className="text-center mb-6">
                  <span className="text-sm font-bold uppercase tracking-wider text-gray-600">Your toy is saying</span>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="text-8xl flex-shrink-0">🐻</div>
                  <div className="flex-1">
                    <Card 
                      bg="#e8f4fd" 
                      borderColor="black" 
                      shadowColor="#92cd41"
                      className="p-4 mb-4"
                    >
                      <p className="text-lg font-medium text-black" style={{ fontFamily: 'Georgia, serif' }}>
                        &quot;Hello! I&apos;m Teddy! Want to hear a story about magical forests?&quot;
                      </p>
                    </Card>
                    <div className="flex gap-3 items-center justify-center md:justify-start">
                      <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm font-bold uppercase tracking-wider text-gray-600">Active</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-white border-y-4 border-black py-20">
          <div className="container mx-auto px-4">
            <h3 className="text-5xl font-bold text-center mb-16 retro-text text-black">
              How It Works
            </h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: "🎨",
                  title: "Design Your Toy",
                  description: "Create a unique personality with our intuitive builder. Choose traits, voice, and knowledge.",
                  color: "#c381b5"
                },
                {
                  icon: "🔌",
                  title: "Connect Hardware",
                  description: "Easy setup with Raspberry Pi or Arduino. We'll guide you through every step.",
                  color: "#92cd41"
                },
                {
                  icon: "💬",
                  title: "Start Talking",
                  description: "Your toy comes to life! Safe, monitored conversations that spark imagination.",
                  color: "#f7931e"
                }
              ].map((feature, index) => (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <Card 
                    bg={hoveredCard === index ? '#f0f0f0' : '#ffffff'}
                    borderColor="black" 
                    shadowColor={hoveredCard === index ? feature.color : '#000000'}
                    className="p-8 cursor-pointer transition-all hover:translate-y-[-4px] h-full"
                  >
                    <div className="text-6xl mb-6 text-center">{feature.icon}</div>
                    <h4 className="text-2xl font-bold mb-3 text-black retro-text text-center">{feature.title}</h4>
                    <p className="text-gray-700 text-center leading-relaxed">{feature.description}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Safety Section */}
        <section className="py-20" style={{ backgroundColor: '#ffe4e1' }}>
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-5xl font-bold text-center mb-16 retro-text text-black">
                Safety First, Always
              </h3>
              <div className="text-center text-6xl mb-12">🛡️</div>
              <div className="grid md:grid-cols-2 gap-8">
                <Card 
                  bg="#ffffff" 
                  borderColor="black" 
                  shadowColor="#000000"
                  className="p-8"
                >
                  <h4 className="text-2xl font-bold mb-6 text-black retro-text">For Parents</h4>
                  <ul className="space-y-4 text-lg">
                    <li className="flex items-start">
                      <span className="text-green-600 font-bold mr-3 text-xl">✓</span>
                      <span className="text-gray-700">Real-time conversation monitoring</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 font-bold mr-3 text-xl">✓</span>
                      <span className="text-gray-700">Content filtering & safety controls</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 font-bold mr-3 text-xl">✓</span>
                      <span className="text-gray-700">Emergency stop button</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 font-bold mr-3 text-xl">✓</span>
                      <span className="text-gray-700">Complete privacy - your data stays yours</span>
                    </li>
                  </ul>
                </Card>
                <Card 
                  bg="#ffffff" 
                  borderColor="black" 
                  shadowColor="#000000"
                  className="p-8"
                >
                  <h4 className="text-2xl font-bold mb-6 text-black retro-text">For Kids</h4>
                  <ul className="space-y-4 text-lg">
                    <li className="flex items-start">
                      <span className="text-green-600 font-bold mr-3 text-xl">✓</span>
                      <span className="text-gray-700">Age-appropriate responses only</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 font-bold mr-3 text-xl">✓</span>
                      <span className="text-gray-700">No data collection from children</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 font-bold mr-3 text-xl">✓</span>
                      <span className="text-gray-700">Push-to-talk (not always listening)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 font-bold mr-3 text-xl">✓</span>
                      <span className="text-gray-700">LED indicators show when active</span>
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="border-t-4 border-black py-20">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-5xl font-bold mb-8 retro-text text-black">
              Ready to Create Magic?
            </h3>
            <p className="text-xl mb-10 text-gray-800 max-w-2xl mx-auto leading-relaxed">
              Join thousands of creators bringing joy to children through safe, intelligent toys.
            </p>
            <Link href="/auth">
              <Button 
                bg="#c381b5"
                textColor="white"
                borderColor="black"
                shadow="#8b5fa3"
                className="px-10 py-5 text-xl font-bold"
              >
                Start Creating Your First Toy
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-black text-white py-8">
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
