<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->timestamp('canceled_at')->nullable()->after('payment_url');
            $table->text('cancellation_note')->nullable()->after('canceled_at');
            $table->string('canceled_by_email')->nullable()->after('cancellation_note');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['canceled_at', 'cancellation_note', 'canceled_by_email']);
        });
    }
};
