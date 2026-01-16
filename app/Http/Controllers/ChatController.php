<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\OllamaService;
use App\Services\TextToSqlService;

class ChatController extends Controller
{
    private OllamaService $ollama;
    private TextToSqlService $textToSql;

    public function __construct(OllamaService $ollama, TextToSqlService $textToSql)
    {
        $this->ollama = $ollama;
        $this->textToSql = $textToSql;
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

        // Si es pregunta de datos, usar SQL directamente
        if ($this->shouldUseSqlMode($message)) {
            $sqlResult = $this->textToSql->generateAndExecuteQuery($message, $history);
            $response = $this->textToSql->formatResults($sqlResult);
        } else {
            // Preguntas generales con Ollama
            $messages = $history;
            $messages[] = [
                'role' => 'user',
                'content' => $message,
            ];
            $response = $this->ollama->chat($messages);
        }

        return response()->json([
            'response' => $response,
        ]);
    }

    private function shouldUseSqlMode(string $message): bool
    {
        $messageLower = mb_strtolower($message);
        
        // Palabras que indican consulta de datos
        $dataKeywords = [
            'cuántos', 'cuántas', 'cuantos', 'cuantas',
            'listar', 'mostrar', 'buscar', 'encontrar',
            'dame', 'dime', 'ver',
            'qué', 'que', 'quién', 'quien', 'cuál', 'cual',
            'total', 'suma', 'cantidad', 'tengo'
        ];
        
        // Entidades de la BD
        $entities = [
            'cliente', 'clientes',
            'producto', 'productos', 'artículo', 'articulo', 'articulos',
            'factura', 'facturas', 'venta', 'ventas',
            'inventario', 'stock',
            'categoría', 'categoria', 'marca'
        ];
        
        // Verificar si tiene palabra clave + entidad
        foreach ($dataKeywords as $keyword) {
            if (str_contains($messageLower, $keyword)) {
                foreach ($entities as $entity) {
                    if (str_contains($messageLower, $entity)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
}
