<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class CashEntry extends Model
{
    protected $fillable = [
        'cashier_id',
        'category',
        'description',
        'amount',
    ];

    protected $casts = [
        'amount' => 'integer',
    ];

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }
}
