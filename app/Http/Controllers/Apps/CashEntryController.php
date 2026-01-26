<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\CashEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CashEntryController extends Controller
{
    /**
     * Display the cash entry form.
     */
    public function index()
    {
        return Inertia::render('Dashboard/Transactions/CashEntry');
    }

    /**
     * Store a newly created cash entry.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|in:in,out',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
        ]);

        CashEntry::create([
            'cashier_id' => $request->user()->id,
            'category' => $validated['category'],
            'description' => $validated['description'],
            'amount' => (int) $validated['amount'],
        ]);

        return to_route('transactions.cash.index');
    }
}
