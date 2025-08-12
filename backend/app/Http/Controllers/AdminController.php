<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\EventCategory;
use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    //register an admin
    public function store()
    {
        try {
            $data = request()->validate([
                'name' => 'required | min:8',
                'phone' => ['digits:10', Rule::unique('admins', 'phone')],
                'email' => ['required', 'email', Rule::unique('admins', 'email')],
                'password' => [
                    'required',
                    'string',
                    'min:8',
                    function ($attribute, $value, $fail) {
                        $hasUpper = preg_match('/[A-Z]/', $value);
                        $hasLower = preg_match('/[a-z]/', $value);
                        $hasNumber = preg_match('/[0-9]/', $value);
                        $hasSymbol = preg_match('/[\W_]/', $value);

                        $score = $hasUpper + $hasLower + $hasNumber + $hasSymbol;

                        if ($score < 3) {
                            $fail('The ' . $attribute . ' must contain any three: uppercase letter, lowercase letter, number, and special character.');
                        }
                    }
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }

        $data['username'] = substr($data['email'], 0, strpos($data['email'], '@'));

        $data['password'] = Hash::make($data['password']);

        $admin = Admin::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Admin created successfully',
            'user' => $admin,
            'token' => $admin->createToken('admin-token')->plainTextToken
        ], 201);
    }

    //login an admin
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

        $admin = Admin::where('email', $data['email'])->first();

        if (!$admin || !Hash::check($data['password'], $admin->password)) {
            throw ValidationException::withMessages(['email' => ['Invalid credentials']]);
        }

        // Create a Sanctum token
        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Authentication Successful',
            'token' => $token,
            'data' => $admin
        ]);
    }

    //For logging out an admin(who is also a user)
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out'], 200);
    }

    //For getting current user profile
    public function profile(Request $request)
    {
        return response()->json([
            'admin' => $request->user()
        ], 200);
    }

    //For updating user profile
    public function edit(Request $request, $id)
    {
        $admin = Admin::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|unique:admins,username|max:255',
            'email' => 'required|email|unique:admins,email,' . $admin->id,
            'phone' => 'required|nullable|string|max:15',
        ]);

        $admin->name = $request->name;
        $admin->username = $request->username;
        $admin->email = $request->email;
        $admin->phone = $request->phone;
        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Admin profile updated successfully.',
            'data' => $admin,
        ]);
    }

    public function update(Request $request)
    {
        $admin = auth()->user();

        Log::info('Admin ID:', ['id' => $admin->id]);
        Log::info('Checking username existence:', [
            'exists' => DB::table('admins')->where('username', $request->username)->where('id', '!=', $admin->id)->exists(),
        ]);

        $request->validate([
            'full_name' => 'required|string|max:255',
            'username' => ['required', 'string', 'max:255', Rule::unique('admins')->ignore($admin->id, 'id'),],
            'email' => ['required', 'email', Rule::unique('admins')->ignore($admin->id, 'id'),],
            'phone' => 'nullable|string|max:10',
        ]);

        $admin->name = $request->input('full_name');
        $admin->username = $request->input('username');
        $admin->email = $request->input('email');
        $admin->phone = $request->input('phone');
        $admin->save();

        return response()->json([
            'success' => true,
            'message' => 'Admin profile updated successfully.',
            'data' => $admin,
        ]);
    }



    public function delete($id)
    {
        $admin = Admin::findOrFail($id);
        $admin->delete();
        return response()->json([
            'success' => true,
            'message' => 'Admin deleted successfully.',
        ]);
    }

    public function getEventStats(Request $request)
    {
        try {
            $admin = auth()->user();

            if (!$admin) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            $today = Carbon::now();
            $startOfThisWeek = $today->copy()->startOfWeek();
            $endOfThisWeek = $today->copy()->endOfWeek();

            // Get all categories along with an array of events with a nested array of venues for each event
            $categories = EventCategory::with(['events.eventVenue'])->get();
            $result = [];

            foreach ($categories as $category) {
                $totalEvents = $category->events->count();

                // Filter events that contains any event venue scheduled this week
                $thisWeek = $category->events->filter(function ($event) use ($startOfThisWeek, $endOfThisWeek) {
                    return $event->eventVenue->contains(function ($venue) use ($startOfThisWeek, $endOfThisWeek) {
                        return Carbon::parse($venue->start_datetime)->between($startOfThisWeek, $endOfThisWeek);
                    });
                })->count();

                $growthPercentage = $totalEvents === 0 ? ($thisWeek === 0 ? 0 : 100) : round(($thisWeek / $totalEvents) * 100);

                $result[] = [
                    'category' => $category->name,
                    'total_events' => $totalEvents,
                    'this_week_events' => $thisWeek,
                    'growth_percentage' => $growthPercentage,

                ];
            }


            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Throwable $e) {
            Log::error('Crash in getEventStats', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'error' => 'Internal Server Error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function getTicketStats()
    {
        // $startOfWeek = Carbon::now()->copy()->startOfWeek();
        // $endOfWeek = Carbon::now()->copy()->endOfWeek();

        $categories = EventCategory::all();
        $result = [];

        foreach ($categories as $category) {
            $ticketsSold = Ticket::whereHas('eventVenue.event', function ($q) use ($category) {
                $q->where('category_id', $category->id);
            })->where('status', 'booked')->count();

            $result[] = [
                'category' => $category->name,
                'tickets_sold' => $ticketsSold
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $result
        ]);
    }

    public function getActiveUsers()
    {
        $admins = Admin::select('id', 'name', 'email', 'phone', 'username')->get();
        return response()->json([
            'success' => true,
            'data' => $admins
        ]);
    }
}
