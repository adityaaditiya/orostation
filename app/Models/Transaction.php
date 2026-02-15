<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Transaction extends Model
{
    use HasFactory;

    protected $casts = [
        'canceled_at' => 'datetime',
    ];
    
    /**
     * fillable
     *
     * @var array
     */
    protected $fillable = [
        'cashier_id',
        'customer_id',
        'invoice',
        'cash',
        'change',
        'discount',
        'grand_total',
        'tax',
        'payment_method',
        'payment_status',
        'payment_reference',
        'payment_url',
        'canceled_at',
        'cancellation_note',
        'canceled_by_email',
    ];

    public function scopeNotCanceled($query)
    {
        return $query->whereNull('canceled_at');
    }

    /**
     * details
     *
     * @return void
     */
    public function details()
    {
        return $this->hasMany(TransactionDetail::class);
    }

    /**
     * customer
     *
     * @return void
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * cashier
     *
     * @return void
     */
    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    /**
     * profits
     *
     * @return void
     */
    public function profits()
    {
        return $this->hasMany(Profit::class);
    }

    /**
     * createdAt
     *
     * @return Attribute
     */

    protected function canceledAt(): Attribute
{
    return Attribute::make(
        get: fn ($value) => $value
            ? Carbon::parse($value)
                ->timezone(config('app.timezone'))
                ->format('Y-m-d H:i:s')
            : null,
    );
}

    protected function createdAt(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => Carbon::parse($value)
                ->timezone(config('app.timezone'))
                ->format('Y-m-d H:i:s'),
        );
    }
}
