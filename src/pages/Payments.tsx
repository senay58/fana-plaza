import { useState } from "react";
import { usePayments, Payment } from "@/hooks/usePayments";
import { useTenants } from "@/hooks/useTenants";
import { useBuilding } from "@/hooks/useBuilding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Wallet,
  CheckCircle2,
  Clock,
  Trash2,
  TrendingUp,
  Sparkles,
  DollarSign,
  Calendar,
  User,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Payments() {
  const { payments, updatePaymentStatus, generateMonthlyPayments, deletePayment } = usePayments();
  const { tenants } = useTenants();
  const { rooms } = useBuilding();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [reconcileData, setReconcileData] = useState({
    method: "Bank Transfer",
    staff: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Sync / Auto-generate monthly payments
  const handleGeneratePayments = async () => {
    setIsGenerating(true);
    try {
      const result = await generateMonthlyPayments.mutateAsync();
      toast.success(result.message || "Ledger synchronized successfully.");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate invoices.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReconcileSubmit = async () => {
    if (!selectedPayment) return;
    try {
      await updatePaymentStatus.mutateAsync({
        id: selectedPayment.id,
        status: "paid",
        method: reconcileData.method,
        staff: reconcileData.staff || undefined,
      });
      toast.success("Payment successfully reconciled.");
      setIsReconcileOpen(false);
      setSelectedPayment(null);
      setReconcileData({ method: "Bank Transfer", staff: "" });
    } catch (error: any) {
      toast.error(error.message || "Reconciliation failed.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this payment record? This cannot be undone.")) {
      try {
        await deletePayment.mutateAsync(id);
        toast.success("Payment record deleted.");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete record.");
      }
    }
  };

  const getTenantRoomInfo = (tenantId: string) => {
    const tenant = tenants.data?.find((t) => t.id === tenantId);
    if (!tenant) return { name: "Unknown Tenant", roomNumber: "N/A" };
    const room = rooms.data?.find((r) => r.id === tenant.room_id);
    return {
      name: tenant.name,
      roomNumber: room ? room.number : "Unassigned",
    };
  };

  // Calculations
  const paymentList = payments.data || [];
  const paidPayments = paymentList.filter((p) => p.status === "paid");
  const pendingPayments = paymentList.filter((p) => p.status === "pending");

  const totalCollected = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const collectionRate =
    totalCollected + totalPending > 0
      ? Math.round((totalCollected / (totalCollected + totalPending)) * 100)
      : 0;

  // Filter lists
  const filteredPayments = paymentList.filter((p) => {
    const tenantInfo = getTenantRoomInfo(p.tenant_id);
    const matchesSearch =
      tenantInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenantInfo.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === "all" ? true : p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (payments.isLoading || tenants.isLoading || rooms.isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">
        Retrieving Payment Ledgers...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 px-1">Payments & Billing</h2>
          <p className="text-sm text-slate-500 px-1">
            Track rental invoices, process receipts and manage financial transactions
          </p>
        </div>

        <Button
          onClick={handleGeneratePayments}
          disabled={isGenerating}
          className="h-10 px-4 bg-black text-white hover:bg-slate-800 rounded-lg font-bold text-xs flex gap-2 shadow-lg transition-all"
        >
          <Sparkles className="w-4 h-4" />
          {isGenerating ? "Syncing Registry..." : "Generate Monthly Invoices"}
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-professional p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collected</p>
            <h2 className="text-2xl font-bold text-slate-900">
              ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-[10px] font-bold text-emerald-600 uppercase">Settled Invoices</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="card-professional p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Receivables</p>
            <h2 className="text-2xl font-bold text-rose-600">
              ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-[10px] font-bold text-rose-500 uppercase">Outstanding Balance</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="card-professional p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collection Rate</p>
            <h2 className="text-2xl font-bold text-slate-900">{collectionRate}%</h2>
            <p className="text-[10px] font-bold text-indigo-600 uppercase">Invoiced vs Received</p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card-professional p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by tenant name or unit number..."
              className="pl-9 h-10 bg-white border-border rounded-lg text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status:</span>
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="h-10 w-36 rounded-lg text-xs font-semibold bg-white border-border">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-border">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="mt-6 border border-border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-border">
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 pl-6">Tenant</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Unit</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Due Date</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Amount</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Status</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Settlement Details</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const tenantInfo = getTenantRoomInfo(payment.tenant_id);
                return (
                  <TableRow key={payment.id} className="border-b border-border hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-900 py-4 pl-6 text-sm">
                      {tenantInfo.name}
                    </TableCell>
                    <TableCell className="text-slate-600 font-semibold text-xs py-4">
                      Unit {tenantInfo.roomNumber}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs py-4">
                      {payment.due_date ? format(new Date(payment.due_date), "MMM dd, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 py-4 text-sm">
                      ${Number(payment.amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="py-4">
                      {payment.status === "paid" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 text-amber-700 border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs py-4">
                      {payment.status === "paid" ? (
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800 text-[11px]">
                            {payment.payment_method || "Bank Transfer"}
                          </p>
                          {payment.paid_at && (
                            <p className="text-[10px] text-slate-400">
                              Received {format(new Date(payment.paid_at), "MMM dd, yyyy")}
                            </p>
                          )}
                          {payment.staff_responsible && (
                            <p className="text-[9px] uppercase tracking-wider text-slate-400">
                              By: {payment.staff_responsible}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="italic text-slate-400 text-[11px]">Unsettled Ledger</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {payment.status === "pending" && (
                          <Button
                            size="sm"
                            className="bg-primary text-white font-bold text-xs h-8 px-3 rounded-lg hover:bg-primary/95 transition-all"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsReconcileOpen(true);
                            }}
                          >
                            Reconcile
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          onClick={() => handleDelete(payment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 font-medium italic text-xs">
                    No payment records found matching criteria
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Reconcile Modal */}
      <Dialog open={isReconcileOpen} onOpenChange={setIsReconcileOpen}>
        <DialogContent className="rounded-xl border-border bg-white sm:max-w-md p-6 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" /> Reconcile Receipt
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mark invoice for {selectedPayment && getTenantRoomInfo(selectedPayment.tenant_id).name} as Paid
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-border flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-500">Invoice Amount</span>
              <span className="font-bold text-slate-900 text-sm">
                ${selectedPayment && Number(selectedPayment.amount).toFixed(2)}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Method</Label>
              <Select
                value={reconcileData.method}
                onValueChange={(val) => setReconcileData({ ...reconcileData, method: val })}
              >
                <SelectTrigger className="h-10 rounded-lg text-xs font-semibold bg-white border-border">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-border">
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Staff Responsible</Label>
              <Input
                placeholder="Receiver name or initials..."
                value={reconcileData.staff}
                onChange={(e) => setReconcileData({ ...reconcileData, staff: e.target.value })}
                className="h-10 rounded-lg text-sm bg-white border-border"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex gap-2">
            <Button
              variant="outline"
              className="h-10 text-xs font-bold border-border rounded-lg"
              onClick={() => {
                setIsReconcileOpen(false);
                setSelectedPayment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-10 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/95"
              onClick={handleReconcileSubmit}
            >
              Confirm Reconciliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
