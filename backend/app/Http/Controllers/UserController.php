<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\EmailValidationService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;

class UserController extends Controller
{
    //For Authentication of a user
    public function login(Request $request)
    {
        try {
            $data = $request->validate([
                'email' => 'required|email',
                'password' => 'required|min:8'
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                "success" => false,
                "message" => "Invalid email or password format",
                "errors" => $e->errors()
            ], 422);
        }

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Please verify your email before logging in.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Authentication Successful',
            'data' => $user,
            'token' => $user->createToken('user-token')->plainTextToken
        ], 200);
    }

    //For Registering a new User
    public function store(EmailValidationService $hunter)
    {
        try {
            $data = request()->validate([
                'name' => 'required',
                'email' => ['required', 'email', Rule::unique('users', 'email')],
                'password' => 'required|min:8'
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }

        $verification = $hunter->verify($data['email']);

        if (!$verification || $verification['result'] === 'undeliverable') {
            return response()->json(['error' => 'This email address cannot receive emails.'], 422);
        }

        $data['username'] = substr($data['email'], 0, strpos($data['email'], '@'));
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'User created successfully. Please verify your email before logging in.'
        ], 201);
    }

    //For verifying email
    public function verify(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid hash.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return redirect(env('FRONTEND_URL', 'http://localhost:8080') . '/verified');
        }

        $user->markEmailAsVerified();

        event(new Verified($user));

        return redirect(env('FRONTEND_URL', 'http://localhost:8080') . '/verified');
    }

    //For Resending verification email
    public function resendVerificationEmail(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified']);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent!']);
    }

    //For logging out a user
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out'], 200);
    }

    //For getting current user profile
    public function profile()
    {
        try {
            $data = request()->validate([
                'username' => ['required', Rule::exists('users', 'username')]
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'error' => $e->errors()
            ]);
        }

        $user = User::where('username', $data['username'])->first();
        return response()->json([
            'user' => $user
        ], 200);
    }

    //For updating user profile
    public function update(Request $request)
    {
        $request->validate([
            'username' => 'required|exists:users,username',
            'name' => 'required|string',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'new_username' => 'required|string'
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->name = $request->name;
        $user->email = $request->email;
        $user->phone = $request->phone;
        $user->username = $request->new_username;
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
            'confirm_password' => 'required|string|same:new_password',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 403);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password updated successfully']);
    }

    public function subscribe(Request $request)
    {
        $user_email = $request->input('email');
        $user = User::where('email', $user_email)->first();
        if (!$user) {
            return response()->json(['message' => ' Please Create an Account to continue .'], 404);
        }
        $user->is_subscribed = true;
        $user->save();
        return response()->json(['message' => 'Subscription successful']);
    }
}
