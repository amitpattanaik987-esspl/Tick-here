<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    public function __invoke(EmailVerificationRequest $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect('http://localhost:8080/verified'); //todo your frontend URL
        }

        $request->fulfill();

        return redirect('http://localhost:8080/verified'); //todo redirect here after successful verification
    }
}
