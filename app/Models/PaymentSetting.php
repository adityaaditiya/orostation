<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    use HasFactory;

    public const GATEWAY_MIDTRANS = 'midtrans';
    public const GATEWAY_XENDIT = 'xendit';
    public const GATEWAY_QRIS = 'qris';
    public const GATEWAY_BANK_TRANSFER = 'bank_transfer';
    public const GATEWAY_AYO = 'ayo';
    public const GATEWAY_CREDIT_CARD = 'credit_card';

    protected $fillable = [
        'default_gateway',
        'midtrans_enabled',
        'midtrans_server_key',
        'midtrans_client_key',
        'midtrans_production',
        'xendit_enabled',
        'xendit_secret_key',
        'xendit_public_key',
        'xendit_production',
        'qris_enabled',
        'bank_transfer_enabled',
        'ayo_enabled',
        'credit_card_enabled',
    ];

    protected $casts = [
        'midtrans_enabled' => 'boolean',
        'midtrans_production' => 'boolean',
        'xendit_enabled' => 'boolean',
        'xendit_production' => 'boolean',
        'qris_enabled' => 'boolean',
        'bank_transfer_enabled' => 'boolean',
        'ayo_enabled' => 'boolean',
        'credit_card_enabled' => 'boolean',
    ];

    public function enabledGateways(): array
    {
        $gateways = [];

        if ($this->isGatewayReady(self::GATEWAY_QRIS)) {
            $gateways[] = [
                'value' => self::GATEWAY_QRIS,
                'label' => 'QRIS',
                'description' => 'Pembayaran QRIS yang dikonfirmasi manual oleh kasir.',
            ];
        }

        if ($this->isGatewayReady(self::GATEWAY_BANK_TRANSFER)) {
            $gateways[] = [
                'value' => self::GATEWAY_BANK_TRANSFER,
                'label' => 'Transfer Bank',
                'description' => 'Pembayaran transfer bank yang dicatat manual.',
            ];
        }

        if ($this->isGatewayReady(self::GATEWAY_AYO)) {
            $gateways[] = [
                'value' => self::GATEWAY_AYO,
                'label' => 'AYO',
                'description' => 'Pembayaran AYO yang dikonfirmasi manual.',
            ];
        }

        if ($this->isGatewayReady(self::GATEWAY_CREDIT_CARD)) {
            $gateways[] = [
                'value' => self::GATEWAY_CREDIT_CARD,
                'label' => 'Credit Card',
                'description' => 'Pembayaran kartu kredit yang dicatat manual.',
            ];
        }

        if ($this->isGatewayReady(self::GATEWAY_MIDTRANS)) {
            $gateways[] = [
                'value' => self::GATEWAY_MIDTRANS,
                'label' => 'Midtrans',
                'description' => 'Bagikan tautan pembayaran Snap Midtrans ke pelanggan.',
            ];
        }

        if ($this->isGatewayReady(self::GATEWAY_XENDIT)) {
            $gateways[] = [
                'value' => self::GATEWAY_XENDIT,
                'label' => 'Xendit',
                'description' => 'Buat invoice otomatis menggunakan Xendit.',
            ];
        }

        return $gateways;
    }

    public function isGatewayReady(string $gateway): bool
    {
        return match ($gateway) {
            self::GATEWAY_MIDTRANS => $this->midtrans_enabled
                && filled($this->midtrans_server_key)
                && filled($this->midtrans_client_key),
            self::GATEWAY_XENDIT => $this->xendit_enabled
                && filled($this->xendit_secret_key)
                && filled($this->xendit_public_key),
            self::GATEWAY_QRIS => $this->qris_enabled,
            self::GATEWAY_BANK_TRANSFER => $this->bank_transfer_enabled,
            self::GATEWAY_AYO => $this->ayo_enabled,
            self::GATEWAY_CREDIT_CARD => $this->credit_card_enabled,
            default => false,
        };
    }

    public function midtransConfig(): array
    {
        return [
            'enabled' => $this->isGatewayReady(self::GATEWAY_MIDTRANS),
            'server_key' => $this->midtrans_server_key,
            'client_key' => $this->midtrans_client_key,
            'is_production' => $this->midtrans_production,
        ];
    }

    public function xenditConfig(): array
    {
        return [
            'enabled' => $this->isGatewayReady(self::GATEWAY_XENDIT),
            'secret_key' => $this->xendit_secret_key,
            'public_key' => $this->xendit_public_key,
            'is_production' => $this->xendit_production,
        ];
    }
}
