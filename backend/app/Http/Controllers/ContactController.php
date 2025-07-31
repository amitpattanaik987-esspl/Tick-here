<?php

namespace App\Http\Controllers;

use App\Mail\ContactConfirmationMail;
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

        Mail::to($validated['email'])->send(new ContactConfirmationMail($validated));

        return response()->json(['message' => 'Email sent successfully.']);
    }
}
