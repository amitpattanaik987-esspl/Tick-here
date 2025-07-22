<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\EventCategoryController;
use App\Http\Controllers\VerifyEmailController;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\VenueController;
use App\Http\Controllers\EventVenuesController;
use App\Http\Controllers\StripeController;
use App\Http\Controllers\TicketController;
use App\Models\Seat;
use App\Models\Venue;
use Illuminate\Support\Facades\Log;

// User registration, verification & login
Route::post('/users', [UserController::class, 'store']);
Route::post('/auth/user/login', [UserController::class, 'login']);
Route::post('/email/resend', [UserController::class, 'resendVerificationEmail'])->middleware('auth:sanctum');

// Admin registration & login
Route::post('/admin', [AdminController::class, 'store']);
Route::post('/auth/admin/login', [AdminController::class, 'login']);

// Public Data
Route::get('/events/{event}', [EventController::class, 'getEvent']); // Get event details
Route::get('/events/{event}/venues', [EventVenuesController::class, 'getVenuesByEvent']); // Venues for an event

Route::get('/locations', [LocationController::class, 'index']); // Get all locations
Route::get('/events/locations/{location}', [EventController::class, 'getEventsByLocation']); // all Events for a location
Route::get('/categories', [EventCategoryController::class, 'index']);


// Seats data
Route::get('/venues/{id}/seats', [VenueController::class, 'seats']);




// Verify email
Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = User::findOrFail($id);

    if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return response()->json(['message' => 'Invalid verification link'], 403);
    }

    if ($user->hasVerifiedEmail()) {
        return redirect(env('FRONTEND_URL', 'http://localhost:8080') . '/verified');
    }

    $user->markEmailAsVerified();
    event(new Verified($user));

    return redirect(env('FRONTEND_URL', 'http://localhost:8080') . '/verified');
})->middleware('signed')->name('verification.verify');


/**
 * PROTECTED ROUTES
 * Require authentication using Sanctum
 */

/**
 * USER ROUTES
 */

Route::post('/bookseat', function () {
    try {
        $venueid = request('venue_id');
        $booked_seats = request('seats');

        if (!is_array($booked_seats)) {
            $booked_seats = json_decode($booked_seats, true);
            if (!is_array($booked_seats)) {
                return response()->json(['success' => false, 'error' => 'Invalid seat format'], 400);
            }
        }

        $venue = Venue::where("id", $venueid)->first();

        if (!$venue) {
            return response()->json(['success' => false, 'error' => 'Venue not found'], 404);
        }

        $seats = Seat::where("venue_id", $venue->id)->get();

        foreach ($seats as $seat) {
            if (in_array($seat->label, $booked_seats)) {
                $seat->is_booked = 1;
                $seat->save();
            }
        }

        return response()->json(['success' => true, 'message' => 'Seats booked successfully']);
    } catch (\Exception $e) {
        Log::error('Booking error', ['exception' => $e]);
        return response()->json(['success' => false, 'error' => 'Internal Server Error'], 500);
    }
});


//   'verified' i have commented this middle ware from the below routes because it is not properly implemented

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/auth/user/profile', [UserController::class, 'profile']);
    Route::put('/auth/user/profile', [UserController::class, 'update']);
    Route::post('/auth/user/logout', [UserController::class, 'logout']);
    Route::post('/auth/user/change-password', [UserController::class, 'changePassword']);

    Route::post('/create-checkout-session', [StripeController::class, 'createCheckoutSession']);


    Route::post('/create-ticket', [TicketController::class, 'store']);
    Route::post('/gettickets', [TicketController::class, 'getTicketsByUser']);
    Route::post('/getEventByTicketId', [TicketController::class, 'getEventByTicketId']);
    Route::post('/cancel-ticket', [TicketController::class, 'cancelticket']);
});

/**
 * ADMIN ROUTES
 */

Route::middleware(['auth:sanctum', 'admin', 'verified'])->group(function () {
    Route::post('/auth/admin/logout', [AdminController::class, 'logout']);
    Route::get('/auth/admin/profile', [AdminController::class, 'profile']);
    Route::put('/auth/admin/profile', [AdminController::class, 'update']);

    Route::prefix('admin/dashboard')->group(function () {
        Route::get('/event-stats', [AdminDashboardController::class, 'getEventStats']);
        Route::get('/ticket-stats', [AdminDashboardController::class, 'getTicketStats']);
    });

    // Events
    Route::post('/', [EventController::class, 'index']); // Get all events
    Route::post('/create-event', [EventController::class, 'create']);
    Route::delete('/events/{event}', [EventController::class, 'delete']);
    Route::put('/events/{event}', [EventController::class, 'update']);
    Route::get('/events/{eventId}/tickets', [EventVenuesController::class, 'getTicketsByEvent']);

    // Locations
    Route::post('/admin/locations', [LocationController::class, 'create']);
    Route::delete('/admin/locations/{location}', [LocationController::class, 'delete']);
    Route::put('/admin/locations/{location}', [LocationController::class, 'update']);
    Route::get('/admin/locations', [LocationController::class, 'index']);

    // Venues
    Route::post('/admin/venues', [VenueController::class, 'create']);
    Route::get('/admin/venues', [VenueController::class, 'index']);
    Route::delete('/admin/venues/{venue}', [VenueController::class, 'delete']);
    Route::put('/admin/venues/{venue}', [VenueController::class, 'update']);

    //Categories
    Route::post('/admin/categories', [EventCategoryController::class, 'create']);
    Route::delete('/admin/categories/{category}', [EventCategoryController::class, 'delete']);
    Route::put('/admin/categories/{category}', [EventCategoryController::class, 'update']);
    Route::get('/admin/events-search', [EventController::class, 'linearSearch']);
    Route::get('/admin/events-all', [EventController::class, 'allEvents']);
});
