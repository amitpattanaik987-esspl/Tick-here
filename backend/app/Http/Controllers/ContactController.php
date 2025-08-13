<?php

namespace App\Http\Controllers;

use App\Mail\ContactConfirmationMail;
use App\Mail\UserQueryMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    //
    public function sendMail(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'email' => 'required|email',
            'country_code' => 'required|string',
            'phone' => 'required|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'description' => 'required|string',
        ]);

        Mail::to("amitpattanaik987@gmail.com")->send(new UserQueryMail($validated));

        Mail::to($validated['email'])->send(new ContactConfirmationMail($validated));

        return response()->json(['message' => 'Email sent successfully.']);
    }
}
