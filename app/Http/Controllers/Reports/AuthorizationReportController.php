<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuthorizationReportController extends Controller
{
    /**
     * Display authorization report.
     */
    public function index(Request $request)
    {
        $defaultDate = Carbon::today()->toDateString();
        $filters = [
            'start_date' => $request->input('start_date') ?: $defaultDate,
            'end_date' => $request->input('end_date') ?: $defaultDate,
        ];

        $transactions = $this->applyFilters(
            Transaction::query()
                ->whereNotNull('canceled_at')
                ->with(['cashier:id,name', 'customer:id,name']),
            $filters
        )
            ->orderByDesc('canceled_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Dashboard/Reports/Authorization', [
            'transactions' => $transactions,
            'filters' => $filters,
        ]);
    }

    protected function applyFilters($query, array $filters)
    {
        return $query
            ->when($filters['start_date'] ?? null, fn ($q, $start) => $q->whereDate('canceled_at', '>=', $start))
            ->when($filters['end_date'] ?? null, fn ($q, $end) => $q->whereDate('canceled_at', '<=', $end));
    }
}
