"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Avatar, AvatarFallback, Textarea } from "@/components/ui";
import { ArrowLeft, Star, Shield, Clock, MapPin, MessageCircle, AlertTriangle, Zap, CheckCircle } from "lucide-react";

interface ItemDetails {
  id: string;
  name: string;
  description: string | null;
  price: number;
  photo: string | null;
  photos: string[];
  condition: string;
  category: string;
  aiPriceRating: string;
  avgCampusPrice: number;
  priceExplanation: string;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    photo: string | null;
    verificationStatus: string;
    trustScore: number;
    avgRating: number;
    badges: string[];
    college: string | null;
    isOnline: boolean;
    lastSeen: string;
    completedDeals: number;
  };
}

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const res = await fetch(`/api/items/${id}`);
      const data = await res.json();
      setItem(data.item);
    } catch (error) {
      console.error("Failed to fetch item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    setRequesting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/signin";
        return;
      }

      const res = await fetch("/api/transactions/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemId: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to request item");
        return;
      }

      alert("Request sent! Wait for seller to accept.");
      // Redirect to chat/transaction page
      window.location.href = `/chat/${data.transaction.id}`;
    } catch (error) {
      console.error("Request failed:", error);
      alert("Something went wrong");
    } finally {
      setRequesting(false);
    }
  };

  const getPriceRatingColor = (rating: string) => {
    switch (rating) {
      case "Great Deal":
        return "bg-green-100 text-green-800";
      case "Fair":
        return "bg-blue-100 text-blue-800";
      case "Overpriced":
        return "bg-red-100 text-red-800";
      case "Underpriced":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Item Not Found</h1>
          <Link href="/home">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href="/home" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Link>
          <div className="flex-1 flex items-center justify-center">
            <Zap className="h-6 w-6 text-blue-600 mr-2" />
            <span className="font-bold">QuickGrab</span>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Image & Description */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              {item.photo ? (
                <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
            </div>

            {/* Additional Photos */}
            {item.photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.photos.map((photo, i) => (
                  <div key={i} className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0">
                    <img src={photo} alt={`${item.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {item.description || "No description provided."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Details & Actions */}
          <div className="space-y-6">
            {/* Title & Price */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">{item.name}</h1>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{item.condition}</Badge>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">₹{item.price.toFixed(2)}</p>
                    <Badge className={getPriceRatingColor(item.aiPriceRating)}>
                      {item.aiPriceRating}
                    </Badge>
                  </div>
                </div>

                {/* Price Analysis */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Campus Average:</span>
                    <span className="font-medium">₹{item.avgCampusPrice?.toFixed(2) || "N/A"}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{item.priceExplanation}</p>
                </div>

                {/* Request Button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleRequest}
                  disabled={requesting}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  {requesting ? "Sending Request..." : "Request Item"}
                </Button>
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle>Seller</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/profile/${item.seller.id}`}>
                  <div className="flex items-center space-x-4 hover:bg-gray-50 p-2 rounded-2xl -m-2">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {item.seller.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-semibold text-lg">{item.seller.name}</span>
                        {item.seller.verificationStatus === "VERIFIED" && (
                          <Badge variant="verified" className="ml-2">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {item.seller.college && (
                        <p className="text-sm text-gray-500">{item.seller.college}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          {item.seller.avgRating.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          {item.seller.completedDeals} deals
                        </span>
                        <span className="text-gray-500">
                          Trust: {item.seller.trustScore}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.seller.isOnline ? (
                        <span className="flex items-center text-green-600 text-sm">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center text-gray-400 text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          Offline
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Seller Badges */}
                {item.seller.badges.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.seller.badges.map((badge, i) => (
                      <Badge key={i} variant="secondary">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Safety Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Meet in public, well-lit campus locations
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Use escrow payment for protection
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    Inspect item before confirming receipt
                  </li>
                  <li className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    Never pay outside the platform
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
