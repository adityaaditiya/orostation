<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashReportController extends Controller
{
    /**
     * Display the cash flow report.
     */
    public function index(Request $request)
    {
        $filters = [
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'invoice' => $request->input('invoice'),
            'cashier_id' => $request->input('cashier_id'),
            'customer_id' => $request->input('customer_id'),
        ];

        $baseListQuery = $this->applyFilters(
            Transaction::query()
                ->with(['cashier:id,name', 'customer:id,name']),
            $filters
        )->orderByDesc('created_at');

        $transactions = (clone $baseListQuery)
            ->paginate(10)
            ->withQueryString();

        $totals = $this->applyFilters(Transaction::query(), $filters)
            ->selectRaw('COALESCE(SUM(grand_total), 0) as cash_in_total')
            ->first();

        $summary = [
            'cash_in_total' => (int) ($totals->cash_in_total ?? 0),
            'cash_out_total' => 0,
            'net_total' => (int) ($totals->cash_in_total ?? 0),
        ];

        return Inertia::render('Dashboard/Reports/Cash', [
            'transactions' => $transactions,
            'summary' => $summary,
            'filters' => $filters,
            'cashiers' => User::select('id', 'name')->orderBy('name')->get(),
            'customers' => Customer::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    /**
     * Apply table filters.
     */
    protected function applyFilters($query, array $filters)
    {
        return $query
            ->when($filters['invoice'] ?? null, fn ($q, $invoice) => $q->where('invoice', 'like', '%' . $invoice . '%'))
            ->when($filters['cashier_id'] ?? null, fn ($q, $cashier) => $q->where('cashier_id', $cashier))
            ->when($filters['customer_id'] ?? null, fn ($q, $customer) => $q->where('customer_id', $customer))
            ->when($filters['start_date'] ?? null, fn ($q, $start) => $q->whereDate('created_at', '>=', $start))
            ->when($filters['end_date'] ?? null, fn ($q, $end) => $q->whereDate('created_at', '<=', $end));
    }
}
