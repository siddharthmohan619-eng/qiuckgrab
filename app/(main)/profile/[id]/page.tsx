"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Badge, Avatar, AvatarFallback } from "@/components/ui";
import { ArrowLeft, Zap, Star, Shield, Package } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  photo: string | null;
  college: string | null;
  verificationStatus: string;
  trustScore: number;
  badges: string[];
  avgRating: number;
  completedDeals: number;
  cancellationRate: number;
  createdAt: string;
}

interface Rating {
  id: string;
  stars: number;
  comment: string | null;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    photo: string | null;
  };
}

interface Item {
  id: string;
  name: string;
  price: number;
  photo: string | null;
  condition: string;
  availabilityStatus: string;
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");
  const [loading, setLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    // Mock data for demo - in production, fetch from API
    const mockUser: UserProfile = {
      id: id,
      name: "Jane Smith",
      photo: null,
      college: "State University",
      verificationStatus: "VERIFIED",
      trustScore: 85,
      badges: ["🏆 Trusted Seller", "⚡ Quick Responder", "💎 Fair Pricer"],
      avgRating: 4.8,
      completedDeals: 47,
      cancellationRate: 0.02,
      createdAt: "2024-01-15",
    };

    const mockRatings: Rating[] = [
      {
        id: "1",
        stars: 5,
        comment: "Great seller! Fast response and item was exactly as described.",
        createdAt: "2024-11-20",
        fromUser: { id: "u1", name: "John Doe", photo: null },
      },
      {
        id: "2",
        stars: 5,
        comment: "Super smooth transaction. Would buy again!",
        createdAt: "2024-11-18",
        fromUser: { id: "u2", name: "Alex Johnson", photo: null },
      },
      {
        id: "3",
        stars: 4,
        comment: "Good experience overall. Item was in good condition.",
        createdAt: "2024-11-15",
        fromUser: { id: "u3", name: "Sam Wilson", photo: null },
      },
    ];

    const mockItems: Item[] = [
      {
        id: "i1",
        name: "iPhone 13 Charger",
        price: 25,
        photo: null,
        condition: "NEW",
        availabilityStatus: "AVAILABLE",
      },
      {
        id: "i2",
        name: "Calculus Textbook",
        price: 40,
        photo: null,
        condition: "GOOD",
        availabilityStatus: "AVAILABLE",
      },
    ];

    setUser(mockUser);
    setRatings(mockRatings);
    setItems(mockItems);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const getTrustLevel = (score: number) => {
    if (score >= 90) return { level: "Exceptional", color: "text-green-600" };
    if (score >= 70) return { level: "Trusted", color: "text-blue-600" };
    if (score >= 50) return { level: "Established", color: "text-yellow-600" };
    if (score >= 20) return { level: "New", color: "text-gray-500" };
    return { level: "Unverified", color: "text-red-500" };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>User not found</p>
      </div>
    );
  }

  const trustLevel = getTrustLevel(user.trustScore);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href="/home" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 flex items-center justify-center">
            <Zap className="h-6 w-6 text-blue-600 mr-2" />
            <span className="font-bold">QuickGrab</span>
          </div>
          <div className="w-5"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h1 className="text-2xl font-bold mr-3">{user.name}</h1>
                  {user.verificationStatus === "VERIFIED" && (
                    <Badge variant="verified">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                {user.college && (
                  <p className="text-gray-600 mb-3">{user.college}</p>
                )}
                
                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-semibold">{user.avgRating.toFixed(1)}</span>
                    <span className="text-gray-500 ml-1">({ratings.length} reviews)</span>
                  </div>
                  <div>
                    <span className="font-semibold">{user.completedDeals}</span>
                    <span className="text-gray-500 ml-1">deals</span>
                  </div>
                  <div className={trustLevel.color}>
                    <span className="font-semibold">{user.trustScore}</span>
                    <span className="text-gray-500 ml-1">trust score</span>
                  </div>
                </div>

                {/* Badges */}
                {user.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {user.badges.map((badge, i) => (
                      <Badge key={i} variant="secondary">{badge}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Score Breakdown */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Trust Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-2xl font-bold ${trustLevel.color}`}>
                {user.trustScore}/100
              </span>
              <Badge className={trustLevel.color}>{trustLevel.level}</Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Verification</span>
                <span className="font-medium">20/20</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Ratings</span>
                <span className="font-medium">{Math.round((user.avgRating / 5) * 40)}/40</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(user.avgRating / 5) * 100}%` }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Deal Volume</span>
                <span className="font-medium">{Math.min(20, Math.round((user.completedDeals / 100) * 20))}/20</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min(100, user.completedDeals)}%` }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Reliability</span>
                <span className="font-medium">{Math.round((1 - user.cancellationRate) * 20)}/20</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(1 - user.cancellationRate) * 100}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "listings"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("listings")}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Listings ({items.length})
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "reviews"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("reviews")}
          >
            <Star className="h-4 w-4 inline mr-2" />
            Reviews ({ratings.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "listings" && (
          <div className="grid gap-4">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No active listings</p>
            ) : (
              items.map((item) => (
                <Link key={item.id} href={`/item/${item.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          {item.photo ? (
                            <img src={item.photo} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Badge variant="outline">{item.condition}</Badge>
                            <Badge
                              className={
                                item.availabilityStatus === "AVAILABLE"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {item.availabilityStatus}
                            </Badge>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-blue-600">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-4">
            {ratings.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No reviews yet</p>
            ) : (
              ratings.map((rating) => (
                <Card key={rating.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarFallback>{rating.fromUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{rating.fromUser.name}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating.stars
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        {rating.comment && (
                          <p className="text-gray-600 text-sm">{rating.comment}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
