"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Avatar, AvatarFallback } from "@/components/ui";
import { Search, Zap, Filter, Star, Clock, Mic } from "lucide-react";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
}

interface Item {
  id: string;
  name: string;
  price: number;
  photo: string | null;
  condition: string;
  aiPriceRating: string;
  category: string;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    photo: string | null;
    verificationStatus: string;
    trustScore: number;
    avgRating: number;
    badges: string[];
    isOnline: boolean;
  };
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Validate user object has required fields
        if (user && typeof user.id === "string" && typeof user.name === "string") {
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        // Invalid JSON in localStorage
        setCurrentUser(null);
      }
    }
  }, []);

  // Fetch items on mount
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/items");
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchItems();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceSearch = () => {
    // Check for browser support
    const windowWithSpeech = window as Window & {
      SpeechRecognition?: new () => {
        lang: string;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
        start: () => void;
      };
    };

    if (!windowWithSpeech.SpeechRecognition && !windowWithSpeech.webkitSpeechRecognition) {
      alert("Voice search is not supported in your browser");
      return;
    }

    const SpeechRecognitionClass = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;
    
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };

    recognition.start();
  };

  const getPriceRatingColor = (rating: string) => {
    switch (rating) {
      case "Great Deal":
        return "success";
      case "Fair":
        return "secondary";
      case "Overpriced":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">QuickGrab</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/list-item">
                <Button>List Item</Button>
              </Link>
              {currentUser ? (
                <Link href={`/profile/${currentUser.id}`}>
                  <Avatar>
                    <AvatarFallback>{currentUser.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Link href="/signin">
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for items... (e.g., 'need iPhone charger urgent')"
                className="pl-10 pr-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`absolute right-3 top-2.5 p-1 rounded-full ${
                  isListening ? "bg-red-100 text-red-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Mic className="h-5 w-5" />
              </button>
            </div>
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button type="button" variant="outline">
              <Filter className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No items found</p>
            <Link href="/list-item">
              <Button>Be the first to list an item</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link key={item.id} href={`/item/${item.id}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  {/* Item Image */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden rounded-t-lg">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    {/* Price Rating Badge */}
                    {item.aiPriceRating && (
                      <Badge
                        variant={getPriceRatingColor(item.aiPriceRating) as "success" | "secondary" | "destructive"}
                        className="absolute top-2 right-2"
                      >
                        {item.aiPriceRating}
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">{item.name}</CardTitle>
                      <span className="text-xl font-bold text-blue-600">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Condition & Category */}
                    <div className="flex gap-2 mb-3">
                      <Badge variant="outline">{item.condition}</Badge>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {item.seller.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium">{item.seller.name}</span>
                            {item.seller.verificationStatus === "VERIFIED" && (
                              <span className="ml-1 text-blue-600">✓</span>
                            )}
                          </div>
                          <div className="flex items-center text-gray-500 text-xs">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {item.seller.avgRating.toFixed(1)}
                          </div>
                        </div>
                      </div>

                      {/* Online Status */}
                      <div className="flex items-center">
                        {item.seller.isOnline ? (
                          <span className="flex items-center text-green-600 text-xs">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            Online
                          </span>
                        ) : (
                          <span className="flex items-center text-gray-400 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Offline
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    {item.seller.badges.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.seller.badges.slice(0, 2).map((badge, i) => (
                          <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
