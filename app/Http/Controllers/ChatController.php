<?php

namespace App\Http\Controllers;

use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ChatController extends Controller
{
    private Client $client;
    private string $apiUrl;

    public function __construct()
    {
        $this->apiUrl = env('CUSTOM_API_URL', 'http://localhost:3000');
        $this->client = new Client([
            'timeout' => 300,
            'connect_timeout' => 30,
        ]);
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

        $message = $request->input('message');
        $history = $request->input('history', []);

        try {
            $messages = $history;
            $messages[] = [
                'role' => 'user',
                'content' => $message,
            ];

            $response = $this->client->post($this->apiUrl . '/chat', [
                'json' => ['messages' => $messages],
            ]);

            $content = $response->getBody()->getContents();
            
            return response()->json([
                'response' => $content,
            ]);
        } catch (\Exception $e) {
            Log::error('Error en chat: ' . $e->getMessage());
            return response()->json([
                'response' => 'Error al procesar tu mensaje. Intenta nuevamente.',
            ], 500);
        }
    }
}
