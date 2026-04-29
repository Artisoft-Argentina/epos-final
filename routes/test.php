Route::get('/test-csrf', function() { session_start(); return response()->json(['token' => session()->token()]); });
