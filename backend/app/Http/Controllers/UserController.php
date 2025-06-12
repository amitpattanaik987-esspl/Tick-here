<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Throwable;

class UserController extends Controller
{
    //For Authentication of a user
    public function login()
    {
        try {
            $data = request()->validate([
                'email' => 'required|email',
                'password' => 'required|min:8'
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }

        $user = User::where('email', $data['email'])->first();

        if (!$user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['Invalid credentials']]);
        } else {
            return response()->json([
                'success' => true,
                'message' => 'Authentication Successful',
                'data' => $user,
                'token' => $user->createToken('user-token')->plainTextToken
            ], 200);
        }
    }

    //For Registering a new User
    public function store()
    {
        try {
            $data = request()->validate([
                'name' => 'required|min:8',
                'phone' => ['required', 'digits:10', Rule::unique('users', 'phone')],
                'email' => ['required', 'email', Rule::unique('users', 'email')],
                'password' => 'required|min:8'
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }

        $data['username'] = substr($data['email'], 0, strpos($data['email'], '@'));

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        $user->sendEmailVerificationNotification(); //to send verification email

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
            'token' => $user->createToken('user-token')->plainTextToken
        ], 201);
    }

    //For Resending verification email
    public function resendVerificationEmail(Request $request)
{
    if ($request->user()->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email already verified.'], 400);
    }

    $request->user()->sendEmailVerificationNotification();

    return response()->json(['message' => 'Verification email resent.']);
}

    //For logging out a user
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out'], 200);
    }

    //For getting current user profile
    public function profile(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ], 200);
    }

    //For updating user profile
    public function update(Request $request)
    {
        try {
            $user = $request->user();

            $data = request()->validate([
                'name' => 'required|min:8',
                'username' => ['required', 'min:8', Rule::unique('users', 'username')->ignore($request->user()->id)],
                'phone' => ['required', 'digits:10', Rule::unique('users', 'phone')->ignore($request->user()->id)],
                'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($request->user()->id)],
                'password' => 'required|min:8',
            ]);

            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            $user->update($data);

            return response()->json(['message' => 'Profile updated']);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }
}
