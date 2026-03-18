<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class CashEntry extends Model
{
    public const TYPE_IN = 'in';
    public const TYPE_OUT = 'out';

    public const TYPES = [
        self::TYPE_IN,
        self::TYPE_OUT,
    ];

    public const CATEGORY_OPTIONS = [
        'BAYAR BUNGA BANK',
        'BON OPERASIONAL',
        'BON PRIBADI OWNER',
        'BON TRANSFER BANK',
        'DEBIT CREDIT CARD',
        'KURANG MODAL',
        'TAMBAH MODAL',
        'SETOR KE OWNER',
        'SETOR KE BANK',
        'UANG LAIN LAIN',
    ];

    protected $fillable = [
        'cashier_id',
        'type',
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
