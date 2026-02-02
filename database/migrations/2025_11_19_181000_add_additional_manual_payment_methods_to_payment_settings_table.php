<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payment_settings', function (Blueprint $table) {
            $table->boolean('ayo_enabled')->default(false)->after('bank_transfer_enabled');
            $table->boolean('credit_card_enabled')->default(false)->after('ayo_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_settings', function (Blueprint $table) {
            $table->dropColumn(['ayo_enabled', 'credit_card_enabled']);
        });
    }
};
