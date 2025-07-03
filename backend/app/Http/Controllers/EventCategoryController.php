<?php

namespace App\Http\Controllers;

use App\Models\EventCategory;

class EventCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $category = EventCategory::get();
        return response()->json([
            'success' => true,
            'message' => "Category fetched",
            'data' => $category
        ]);
    }

}
