"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { ArrowLeft, Zap, MapPin, Clock, DollarSign, CheckCircle, AlertTriangle, Navigation } from "lucide-react";

interface MeetupLocation {
  name: string;
  address: string;
  type: string;
  distance: number;
  safetyRating: number;
  reasoning: string;
}

interface Transaction {
  id: string;
  status: string;
  escrowAmount: number;
  meetupLocation: string | null;
  countdownEnd: string | null;
  item: {
    name: string;
    price: number;
  };
  buyer: {
    name: string;
  };
  seller: {
    name: string;
  };
}

export default function MeetupPage({ params }: { params: Promise<{ transactionId: string }> }) {
  const { transactionId } = use(params);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [suggestedLocations, setSuggestedLocations] = useState<MeetupLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MeetupLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    // Mock data
    setTransaction({
      id: transactionId,
      status: "ACCEPTED",
      escrowAmount: 25.00,
      meetupLocation: null,
      countdownEnd: null,
      item: {
        name: "iPhone Charger",
        price: 25.00,
      },
      buyer: { name: "John Doe" },
      seller: { name: "Jane Smith" },
    });

    setSuggestedLocations([
      {
        name: "Main Library Entrance",
        address: "123 Campus Drive",
        type: "library",
        distance: 150,
        safetyRating: 5,
        reasoning: "Well-lit, security cameras, high foot traffic",
      },
      {
        name: "Student Union Building",
        address: "456 University Ave",
        type: "student_center",
        distance: 200,
        safetyRating: 5,
        reasoning: "Open late, cafeteria, security desk",
      },
      {
        name: "Campus Coffee Shop",
        address: "789 College Blvd",
        type: "cafe",
        distance: 100,
        safetyRating: 4,
        reasoning: "Public seating, staff present, busy area",
      },
    ]);

    setLoading(false);
  }, [transactionId]);

  // Countdown timer
  useEffect(() => {
    if (!transaction?.countdownEnd) return;

    const interval = setInterval(() => {
      const end = new Date(transaction.countdownEnd!);
      const now = new Date();
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Expired");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h ${minutes}m remaining`);
    }, 1000);

    return () => clearInterval(interval);
  }, [transaction?.countdownEnd]);

  const handlePay = async () => {
    if (!selectedLocation) {
      alert("Please select a meetup location first");
      return;
    }

    setPaying(true);

    try {
      // In real app, integrate with Razorpay
      const mockPaymentId = `pay_${Date.now()}`;

      const res = await fetch("/api/transactions/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        body: JSON.stringify({
          transactionId,
          paymentId: mockPaymentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment failed");
      }

      alert("Payment secured! Meet the seller at the selected location.");
      window.location.href = `/chat/${transactionId}`;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPaying(false);
    }
  };

  const handleConfirmReceipt = async () => {
    try {
      const res = await fetch("/api/transactions/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        body: JSON.stringify({ transactionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Confirmation failed");
      }

      alert("Transaction completed! Please rate the seller.");
      window.location.href = `/profile/${transaction?.seller}`;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Transaction not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href={`/chat/${transactionId}`} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5 mr-2" />
          </Link>
          <div className="flex-1 text-center">
            <h1 className="font-bold">Meetup Coordination</h1>
            <p className="text-sm text-gray-500">{transaction.item.name}</p>
          </div>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Transaction Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-2xl font-bold">${transaction.escrowAmount.toFixed(2)}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {transaction.status === "ACCEPTED" ? "Ready to Pay" : transaction.status}
              </Badge>
            </div>
            {countdown && (
              <div className="mt-4 flex items-center text-yellow-600">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">{countdown}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI-Suggested Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              AI-Suggested Meetup Spots
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestedLocations.map((location, index) => (
              <div
                key={index}
                onClick={() => setSelectedLocation(location)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedLocation?.name === location.name
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{location.name}</h3>
                    <p className="text-sm text-gray-500">{location.address}</p>
                    <p className="text-xs text-gray-400 mt-1">{location.reasoning}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < location.safetyRating ? "text-yellow-400" : "text-gray-200"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">{location.distance}m away</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Safety Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Safety Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Meet during daylight hours
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Inspect the item before confirming
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Tell a friend about your meetup
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Use the app chat for communication
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          {transaction.status === "ACCEPTED" && (
            <Button
              size="lg"
              className="w-full"
              onClick={handlePay}
              disabled={paying || !selectedLocation}
            >
              <DollarSign className="h-5 w-5 mr-2" />
              {paying ? "Processing..." : `Pay $${transaction.escrowAmount.toFixed(2)} (Escrow)`}
            </Button>
          )}

          {(transaction.status === "PAID" || transaction.status === "MEETING") && (
            <Button
              size="lg"
              variant="success"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handleConfirmReceipt}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Confirm Item Received
            </Button>
          )}

          <Link href={`/chat/${transactionId}`}>
            <Button size="lg" variant="outline" className="w-full">
              Back to Chat
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
