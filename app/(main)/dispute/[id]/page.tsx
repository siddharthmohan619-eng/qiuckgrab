"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Textarea } from "@/components/ui";
import { ArrowLeft, Zap, AlertTriangle, Upload, MessageCircle, CheckCircle, Clock } from "lucide-react";

interface Dispute {
  id: string;
  transactionId: string;
  evidenceText: string | null;
  photos: string[];
  decision: string;
  confidence: number | null;
  aiSummary: string | null;
  createdAt: string;
  resolvedAt: string | null;
  transaction: {
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
  };
}

export default function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [evidenceText, setEvidenceText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isNewDispute, setIsNewDispute] = useState(false);

  useEffect(() => {
    // Check if this is a transaction ID (new dispute) or dispute ID (existing)
    if (id.startsWith("new-")) {
      setIsNewDispute(true);
      setLoading(false);
    } else {
      fetchDispute();
    }
  }, [id]);

  const fetchDispute = async () => {
    // Mock data for demo
    setDispute({
      id: id,
      transactionId: "tx-123",
      evidenceText: "The item I received was not as described. The charger has visible damage and doesn't work properly.",
      photos: [],
      decision: "PENDING",
      confidence: null,
      aiSummary: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      transaction: {
        item: { name: "iPhone Charger", price: 25 },
        buyer: { name: "John Doe" },
        seller: { name: "Jane Smith" },
      },
    });
    setLoading(false);
  };

  const handleSubmitDispute = async () => {
    if (!evidenceText.trim()) {
      alert("Please provide details about the issue");
      return;
    }

    setSubmitting(true);

    try {
      const transactionId = id.replace("new-", "");
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        body: JSON.stringify({
          transactionId,
          evidenceText,
          photos: [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit dispute");
      }

      alert(data.message);
      window.location.href = `/dispute/${data.dispute.id}`;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "PENDING":
        return <Badge variant="warning">Pending Review</Badge>;
      case "BUYER_FAVOR":
        return <Badge variant="success">Resolved - Buyer Favor</Badge>;
      case "SELLER_FAVOR":
        return <Badge className="bg-purple-100 text-purple-800">Resolved - Seller Favor</Badge>;
      case "SPLIT":
        return <Badge variant="secondary">Resolved - Split Decision</Badge>;
      case "DISMISSED":
        return <Badge variant="outline">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{decision}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link href="/home" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
            <span className="font-bold">Dispute Center</span>
          </div>
          <div className="w-5"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {isNewDispute ? (
          /* New Dispute Form */
          <Card>
            <CardHeader>
              <CardTitle>Open a Dispute</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Before opening a dispute</p>
                    <p className="text-yellow-700 mt-1">
                      Try to resolve the issue with the other party through chat first. 
                      Disputes should be a last resort.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Describe the Issue *</label>
                <Textarea
                  placeholder="Explain what went wrong in detail. Include relevant information about the item, meetup, and any communication."
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Evidence (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Upload photos or screenshots</p>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleSubmitDispute}
                disabled={submitting || !evidenceText.trim()}
              >
                {submitting ? "Submitting..." : "Submit Dispute"}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Our AI will analyze your dispute and attempt to resolve it automatically.
                If needed, it will be escalated for manual review.
              </p>
            </CardContent>
          </Card>
        ) : dispute ? (
          /* Existing Dispute View */
          <>
            {/* Dispute Status */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">Dispute #{dispute.id.slice(-6)}</h2>
                    <p className="text-sm text-gray-500">
                      {dispute.transaction.item.name} - ${dispute.transaction.item.price}
                    </p>
                  </div>
                  {getDecisionBadge(dispute.decision)}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  Opened: {new Date(dispute.createdAt).toLocaleDateString()}
                  {dispute.resolvedAt && (
                    <span className="ml-4">
                      Resolved: {new Date(dispute.resolvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Parties */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Parties Involved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase mb-1">Buyer</p>
                    <p className="font-medium">{dispute.transaction.buyer.name}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase mb-1">Seller</p>
                    <p className="font-medium">{dispute.transaction.seller.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Evidence */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Evidence Submitted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{dispute.evidenceText || "No evidence text provided"}</p>
                {dispute.photos.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {dispute.photos.map((photo, i) => (
                      <div key={i} className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        <img src={photo} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Analysis */}
            {dispute.aiSummary && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Zap className="h-5 w-5 text-blue-600 mr-2" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{dispute.aiSummary}</p>
                  {dispute.confidence && (
                    <p className="text-sm text-gray-500 mt-2">
                      Confidence: {dispute.confidence}%
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Decision */}
            {dispute.decision !== "PENDING" && (
              <Card className="mb-6 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <h3 className="font-semibold text-green-800">Resolution</h3>
                      <p className="text-green-700 mt-1">
                        {dispute.decision === "BUYER_FAVOR" &&
                          "This dispute has been resolved in favor of the buyer. A refund has been processed."}
                        {dispute.decision === "SELLER_FAVOR" &&
                          "This dispute has been resolved in favor of the seller. The payment has been released."}
                        {dispute.decision === "SPLIT" &&
                          "This dispute has been resolved with a split decision. Both parties will receive a partial amount."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Link href={`/chat/${dispute.transactionId}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View Chat History
                </Button>
              </Link>
              <Link href="/home" className="flex-1">
                <Button className="w-full">Back to Home</Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500">Dispute not found</p>
          </div>
        )}
      </main>
    </div>
  );
}
