"use client";

import Link from "next/link";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@/components/ui";
import { Search, Shield, MessageCircle, Star, Zap, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">QuickGrab</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/home" className="text-gray-600 hover:text-gray-900">Browse</Link>
            <Link href="/list-item" className="text-gray-600 hover:text-gray-900">Sell</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/signup">
              <Button variant="outline">Sign Up</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-4">
          🎓 Verified Students Only
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          The <span className="text-blue-600">AI-Powered</span> Campus
          <br />Marketplace
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Find, meet, and grab everyday items from verified students on your campus.
          Smart search, safe payments, and real-time coordination.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Trading
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/home">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Browse Items
              <Search className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why QuickGrab?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-blue-600" />}
            title="AI Verified Students"
            description="Every user is verified with their student ID using AI technology. Trade with confidence."
          />
          <FeatureCard
            icon={<Search className="h-10 w-10 text-blue-600" />}
            title="Smart Search"
            description="AI-powered search understands what you need. Just describe it naturally."
          />
          <FeatureCard
            icon={<MessageCircle className="h-10 w-10 text-blue-600" />}
            title="Real-Time Chat"
            description="Coordinate instantly with sellers. AI suggests safe meetup spots on campus."
          />
          <FeatureCard
            icon={<Zap className="h-10 w-10 text-blue-600" />}
            title="Escrow Payments"
            description="Secure payments held until you confirm receipt. Full protection for buyers."
          />
          <FeatureCard
            icon={<Star className="h-10 w-10 text-blue-600" />}
            title="Trust Network"
            description="Ratings, badges, and trust scores help you find reliable traders."
          />
          <FeatureCard
            icon={<Users className="h-10 w-10 text-blue-600" />}
            title="AI Moderation"
            description="Automatic scam detection and fair dispute resolution powered by AI."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <Step number={1} title="Sign Up & Verify" description="Register with your college email and verify your student ID." />
            <Step number={2} title="Search or List" description="Find items with AI search or list your own for sale." />
            <Step number={3} title="Chat & Meet" description="Connect with verified students and meet safely on campus." />
            <Step number={4} title="Pay & Rate" description="Secure escrow payment and build your trust score." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to QuickGrab?</h2>
        <p className="text-gray-600 mb-8">Join thousands of verified students trading safely on campus.</p>
        <Link href="/signup">
          <Button size="lg" className="text-lg px-12">
            Create Your Account
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Zap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">QuickGrab</span>
          </div>
          <p>&copy; {new Date().getFullYear()} QuickGrab. AI-Powered Campus Marketplace.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
