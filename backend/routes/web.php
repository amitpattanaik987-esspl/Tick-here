<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VenueController;
use Illuminate\Support\Facades\Route;


Route::post('/users', [UserController::class, 'store']);
Route::post('/auth/user/login', [UserController::class, 'login']);

Route::post('/admin', [AdminController::class, 'store']);
Route::post('/auth/admin/login', [AdminController::class, 'login']);

Route::post('/create-event', [EventController::class, 'store']);
Route::get('/events/{event}', [EventController::class, 'getEvent']);
Route::post('/', [EventController::class, 'index']);
Route::delete('/events/{event}', [EventController::class, 'delete']);

Route::post('/cities', [LocationController::class, 'create']);
Route::get('/cities', [LocationController::class, 'index']);

Route::post('/venues', [VenueController::class, 'create']);
