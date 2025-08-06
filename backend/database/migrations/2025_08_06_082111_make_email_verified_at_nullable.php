<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class MakeEmailVerifiedAtNullable extends Migration
{
    public function up()
    {
        DB::statement('ALTER TABLE users MODIFY email_verified_at TIMESTAMP NULL DEFAULT NULL');
    }

    public function down()
    {
        DB::statement('ALTER TABLE users MODIFY email_verified_at TIMESTAMP NOT NULL');
    }
}
