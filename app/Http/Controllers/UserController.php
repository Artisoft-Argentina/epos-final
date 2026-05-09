<?php

namespace App\Http\Controllers;

use App\Models\PointOfSale;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        return Inertia::render('Users/Index', [
            'users' => User::with(['role', 'pointOfSale'])->paginate(10),
        ]);
    }

    public function create()
    {
        return Inertia::render('Users/Create', [
            'roles'       => Role::all(),
            'puntosVenta' => PointOfSale::active()->orderBy('is_default', 'desc')->orderBy('pos_number')->get(['id', 'name', 'pos_number', 'is_default']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => 'required|string|email|max:255|unique:users',
            'password'         => 'required|string|min:8',
            'role_id'          => 'nullable|exists:roles,id',
            'point_of_sale_id' => 'nullable|exists:points_of_sale,id',
        ]);

        User::create([
            'name'             => $request->name,
            'email'            => $request->email,
            'password'         => bcrypt($request->password),
            'role_id'          => $request->role_id,
            'point_of_sale_id' => $this->resolvePosId($request),
        ]);

        return redirect()->route('users.index');
    }

    public function edit(User $user)
    {
        return Inertia::render('Users/Edit', [
            'user'        => $user->load('pointOfSale'),
            'roles'       => Role::all(),
            'puntosVenta' => PointOfSale::active()->orderBy('is_default', 'desc')->orderBy('pos_number')->get(['id', 'name', 'pos_number', 'is_default']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role_id'          => 'nullable|exists:roles,id',
            'point_of_sale_id' => 'nullable|exists:points_of_sale,id',
        ]);

        $user->update([
            'name'             => $request->name,
            'email'            => $request->email,
            'role_id'          => $request->role_id,
            'point_of_sale_id' => $this->resolvePosId($request),
        ]);

        return redirect()->route('users.index');
    }

    /**
     * PV asignado solo se persiste para vendedores.
     * Para admin/superadmin/cliente queda null.
     */
    private function resolvePosId(Request $request): ?int
    {
        $role = $request->role_id ? Role::find($request->role_id) : null;
        if ($role?->role === 'vendedor') {
            abort_if(! $request->point_of_sale_id, 422, 'Los vendedores deben tener un punto de venta asignado.');
            return (int) $request->point_of_sale_id;
        }
        return null;
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('users.index');
    }
}
