import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { publicNeon } from "@/integrations/neon/anonymousClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, HelpCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { StatusBadge } from "@/components/StatusBadge";
import { TransferTimeline } from "@/components/TransferTimeline";
import ReviewSection from "@/components/ReviewSection";
import logo from "@/assets/logo.png";

interface TransferPublic {
  public_id: string;
  sender_name: string;
  recipient_name: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  created_at: string;
  updated_at: string;
  fee_amount: number | null;
  fee_btc_address: string | null;
  admin_notes: string | null;
  fee_note: string | null;
  fee_paid: boolean | null;
  fee_paid_at: string | null;
  bank_name: string | null;
  bank_country: string | null;
  crypto_type: string | null;
  network: string | null;
  account_number: string | null;
  account_number_masked: string | null;
  wallet_address: string | null;
}

interface TimelineEvent {
  step_name: string;
  step_order: number;
  status: string;
  completed_at: string | null;
}

const TransferStatus = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const [transfer, setTransfer] = useState<TransferPublic | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const isMobile = useIsMobile();

  const fetchData = useCallback(async () => {
    if (!publicId) return;

     const { data: t } = await publicNeon
       .rpc("get_transfer_by_public_id", { p_public_id: publicId });

    if (!t || t.length === 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setTransfer(t[0] as unknown as TransferPublic);

    // Fetch timeline events via secure RPC function
     const { data: eventsData } = await publicNeon
       .rpc("get_timeline_by_public_id", { p_public_id: publicId });

    setEvents((eventsData || []) as TimelineEvent[]);
    setLoading(false);
  }, [publicId]);

  useEffect(() => {
    fetchData();
    // Auto-poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [publicId, fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading transfer status...</div>
      </div>
    );
  }

  if (notFound || !transfer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <img src={logo} alt="Payment Tracker" className="h-10 mb-6" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Transfer Not Found</h1>
        <p className="text-muted-foreground">This transfer link is invalid or has expired.</p>
      </div>
    );
  }

  const amountDisplay =
    transfer.method === "crypto"
      ? `${Number(transfer.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${transfer.crypto_type || "Crypto"}`
      : `${transfer.currency} ${Number(transfer.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const headline = `${transfer.sender_name} is sending you ${amountDisplay}`;

  return (
    <div className="relative min-h-screen bg-background">
      <div className={`${isMobile ? "hidden" : "block"} pointer-events-none absolute inset-0 overflow-hidden z-[0]`}>
        <div className="absolute -left-40 -bottom-40 h-[360px] w-[360px] rounded-full border-[48px] border-yellow-400/90"></div>
        <div className="absolute left-16 top-[65%] h-14 w-14 rounded-xl border-[7px] border-blue-900 bg-transparent"></div>
        <div className="absolute right-20 bottom-28 h-16 w-16 rounded-full border-[10px] border-blue-300/40"></div>
        <div className="absolute right-[8%] top-[16%] h-20 w-20 rounded-full border-[10px] border-blue-400/70"></div>
      </div>

      <header className="bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-5 flex items-center justify-between">
          <img src={logo} alt="Swift Payment Tracker" className="h-8" />
          <div className="flex items-center gap-3 text-muted-foreground">
            <HelpCircle className="h-5 w-5" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {isMobile ? (
          <div className="grid grid-cols-1 gap-6 items-start">
            <section className="relative">
              <p className="text-base text-muted-foreground">Hey {transfer.recipient_name},</p>
              <h1 className="mt-1 font-bold leading-tight text-3xl">
                <span className="text-blue-600">{transfer.sender_name}</span> is sending you{" "}
                <span className="text-foreground">{amountDisplay}</span>
              </h1>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-2 text-sm">
                  <span className="mr-2 text-muted-foreground">Status</span>
                  <StatusBadge status={transfer.status} />
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-2 text-sm">
                  <span className="mr-2 text-muted-foreground">Amount</span>
                  <span className="font-semibold">{amountDisplay}</span>
                </span>
              </div>

              <div className="mt-5 divide-y divide-border text-sm">
                <div className="py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium">{transfer.sender_name}</span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium">{transfer.recipient_name}</span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium capitalize">
                    {transfer.method === "bank" ? "Bank Transfer" : "Cryptocurrency"}
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">{new Date(transfer.updated_at).toLocaleString()}</span>
                </div>
                {transfer.method === "bank" && transfer.bank_name && (
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">Bank</span>
                    <span className="font-medium">{transfer.bank_name}</span>
                  </div>
                )}
                {transfer.method === "bank" && (transfer.account_number || transfer.account_number_masked) && (
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-medium">
                      {transfer.account_number ?? transfer.account_number_masked}
                    </span>
                  </div>
                )}
                {transfer.method === "crypto" && transfer.network && (
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium">{transfer.network}</span>
                  </div>
                )}
                {transfer.method === "crypto" && transfer.wallet_address && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground">Receiver Address</p>
                      <p
                        className="mt-1 font-mono text-xs truncate cursor-pointer hover:underline"
                        onClick={() => navigator.clipboard.writeText(transfer.wallet_address || "")}
                      >
                        {transfer.wallet_address}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-3 shrink-0"
                      onClick={() => navigator.clipboard.writeText(transfer.wallet_address || "")}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                )}
                {(transfer.fee_note || transfer.fee_amount != null) && (
                  <div className="py-3 flex items-center justify-between">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-medium">
                      {transfer.fee_note
                        ? transfer.fee_note
                        : Number(transfer.fee_amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                    </span>
                  </div>
                )}
                {transfer.fee_btc_address && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground">Fee BTC Address</p>
                      <p
                        className="mt-1 font-mono text-xs truncate cursor-pointer hover:underline"
                        onClick={() => {
                          if (transfer.fee_btc_address) {
                            navigator.clipboard.writeText(transfer.fee_btc_address);
                            toast.success("Address copied");
                          }
                        }}
                      >
                        {transfer.fee_btc_address}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-3 shrink-0"
                      onClick={() => {
                        if (transfer.fee_btc_address) {
                          navigator.clipboard.writeText(transfer.fee_btc_address);
                          toast.success("Address copied");
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                    {!transfer.fee_paid && (
                      <Button
                        size="sm"
                        className="ml-2 shrink-0"
                        onClick={async () => {
                          if (!publicId) return;
                           const { error } = await neon
                             .from("transfers")
                             .update({ fee_paid: true, fee_paid_at: new Date().toISOString() })
                             .eq("public_id", publicId);
                          if (!error) {
                            toast.success("Fee marked as paid");
                            fetchData();
                          } else {
                            toast.error("Failed to confirm fee payment");
                          }
                        }}
                      >
                        Confirm Fee Paid
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-muted-foreground">This page auto-refreshes every 30 seconds.</p>
            </section>

            <section className="relative">
              <h2 className="text-base font-semibold text-foreground mb-4">Transfer Progress</h2>
              <TransferTimeline method={transfer.method} status={transfer.status} events={events} />
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          <section className="relative">
            <p className="text-lg md:text-xl text-muted-foreground">Hey {transfer.recipient_name},</p>
            <h1 className="mt-1 font-bold leading-tight text-3xl sm:text-4xl md:text-5xl">
              <span className="text-blue-600">{transfer.sender_name}</span> is sending you{" "}
              <span className="text-foreground">{amountDisplay}</span>
            </h1>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl p-4">
                <p className="text-muted-foreground">Current Status</p>
                <div className="mt-1">
                  <StatusBadge status={transfer.status} />
                </div>
              </div>
              <div className="rounded-xl p-4">
                <p className="text-muted-foreground">Amount</p>
                <p className="mt-1 text-lg font-semibold">{amountDisplay}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {transfer.method === "bank" && transfer.bank_name && (
                <div className="rounded-xl p-4">
                  <p className="text-muted-foreground">Bank</p>
                  <p className="mt-1 font-medium">{transfer.bank_name}</p>
                </div>
              )}
              {transfer.method === "bank" && (transfer.account_number || transfer.account_number_masked) && (
                <div className="rounded-xl p-4">
                  <p className="text-muted-foreground">Account</p>
                  <p className="mt-1 font-medium">
                    {transfer.account_number ?? transfer.account_number_masked}
                  </p>
                </div>
              )}
              {transfer.method === "crypto" && transfer.network && (
                <div className="rounded-xl p-4">
                  <p className="text-muted-foreground">Network</p>
                  <p className="mt-1 font-medium">{transfer.network}</p>
                </div>
              )}
              {transfer.method === "crypto" && transfer.wallet_address && (
                <div className="sm:col-span-2 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground">Receiver Address</p>
                    <p
                      className="mt-1 font-mono text-xs cursor-pointer hover:underline"
                      onClick={() => {
                        navigator.clipboard.writeText(transfer.wallet_address || "");
                      }}
                    >
                      {transfer.wallet_address}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(transfer.wallet_address || "");
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                </div>
              )}
              {(transfer.fee_note || transfer.fee_amount != null) && (
                <div className="relative z-10 rounded-xl p-6 ring-1 ring-blue-200/60 bg-card/80">
                  <p className="text-base text-muted-foreground">Fee</p>
                  {transfer.fee_note ? (
                    <p className="mt-1 font-semibold text-blue-700">{transfer.fee_note}</p>
                  ) : (
                    <p className="mt-1 font-bold text-2xl text-blue-700">
                      {Number(transfer.fee_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              )}
              {transfer.fee_btc_address && (
                <div className="relative z-10 sm:col-span-2 rounded-xl p-6 ring-1 ring-blue-200/60 bg-card/80 flex items-center justify-between">
                  <div>
                    <p className="text-base text-muted-foreground">Fee BTC Address</p>
                    <p
                      className="mt-1 font-mono text-sm cursor-pointer hover:underline"
                      onClick={() => {
                        if (transfer.fee_btc_address) {
                          navigator.clipboard.writeText(transfer.fee_btc_address);
                          toast.success("Address copied");
                        }
                      }}
                    >
                      {transfer.fee_btc_address}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (transfer.fee_btc_address) {
                        navigator.clipboard.writeText(transfer.fee_btc_address);
                        toast.success("Address copied");
                      }
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </Button>
                  {!transfer.fee_paid && (
                    <Button
                      size="sm"
                      className="ml-2"
                      onClick={async () => {
                        if (!publicId) return;
                        const { error } = await neon
                          .from("transfers")
                          .update({ fee_paid: true, fee_paid_at: new Date().toISOString() })
                          .eq("public_id", publicId);
                        if (!error) {
                          toast.success("Fee marked as paid");
                          fetchData();
                        } else {
                          toast.error("Failed to confirm fee payment");
                        }
                      }}
                    >
                      Confirm Fee Paid
                    </Button>
                  )}
                </div>
              )}
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              This page auto-refreshes every 30 seconds.
            </p>
          </section>

          <section className="relative">
            <div className="rounded-xl p-6">
              <h2 className="text-base md:text-lg font-semibold text-foreground mb-6">Transfer Progress</h2>
              <TransferTimeline method={transfer.method} status={transfer.status} events={events} />
            </div>
          </section>
        </div>
        )}

        <ReviewSection />

        <footer className="mt-12 text-[11px] leading-relaxed text-muted-foreground">
          {transfer.admin_notes && (
            <div className="mt-8 rounded-xl p-4 border bg-card/60">
              <h3 className="text-sm font-semibold text-foreground mb-2">Instructions</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{transfer.admin_notes}</p>
            </div>
          )}
          <p className="mt-6">
            By using this website, you accept our Terms of Use and Privacy Policy.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default TransferStatus;
