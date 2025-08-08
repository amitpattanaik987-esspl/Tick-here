<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class EmailValidationService
{
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.hunter.api_key');
    }

    public function verify(string $email) // remove : array|null
    {
        $response = Http::get('https://api.hunter.io/v2/email-verifier', [
            'email' => $email,
            'api_key' => $this->apiKey,
        ]);

        if ($response->successful()) {
            return $response->json()['data'];
        }

        return null;
    }
}
