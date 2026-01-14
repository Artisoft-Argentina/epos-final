<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\OllamaService;

class ChatController extends Controller
{
    private OllamaService $ollama;

    public function __construct(OllamaService $ollama)
    {
        $this->ollama = $ollama;
    }

    public function index()
    {
        return Inertia::render('Chat/Index');
    }

    public function send(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'array',
        ]);

        $messages = $request->input('history', []);
        $messages[] = [
            'role' => 'user',
            'content' => $request->input('message'),
        ];

        $response = $this->ollama->chat($messages);

        return response()->json([
            'response' => $response,
        ]);
    }
}
