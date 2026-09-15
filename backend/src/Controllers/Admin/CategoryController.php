<?php

declare(strict_types=1);

namespace App\Controllers\Admin;

use App\Models\Category;
use OpenApi\Attributes as OA;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class CategoryController
{
    #[OA\Get(
        path: '/api/admin/categories',
        summary: 'Lista kategorii',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Categories'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista kategorii',
                content: new OA\JsonContent(type: 'array', items: new OA\Items(ref: '#/components/schemas/Category'))
            ),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
        ]
    )]
    public function list(Request $request, Response $response): Response
    {
        $categories = Category::query()->orderBy('name')->get();

        return $this->json($response, $categories->toArray());
    }

    #[OA\Post(
        path: '/api/admin/categories',
        summary: 'Dodanie kategorii',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Categories'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string', example: 'Koszulki'),
                    new OA\Property(property: 'slug', type: 'string', nullable: true, description: 'Generowany automatycznie z nazwy, jeśli pominięty'),
                    new OA\Property(property: 'parent_id', type: 'integer', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utworzono kategorię', content: new OA\JsonContent(ref: '#/components/schemas/Category')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function create(Request $request, Response $response): Response
    {
        $data = (array) $request->getParsedBody();

        $errors = $this->validate($data);
        $slug = $this->resolveSlug($data);

        if ($errors === [] && Category::query()->where('slug', $slug)->exists()) {
            $errors['slug'] = 'Kategoria z takim slugiem już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $category = Category::query()->create([
            'external_id' => $data['external_id'] ?? null,
            'name' => $data['name'],
            'slug' => $slug,
            'parent_id' => $data['parent_id'] ?? null,
        ]);

        return $this->json($response, $category->toArray(), 201);
    }

    #[OA\Put(
        path: '/api/admin/categories/{id}',
        summary: 'Edycja kategorii',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Categories'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'external_id', type: 'string', nullable: true),
                    new OA\Property(property: 'name', type: 'string'),
                    new OA\Property(property: 'slug', type: 'string'),
                    new OA\Property(property: 'parent_id', type: 'integer', nullable: true),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Zaktualizowano kategorię', content: new OA\JsonContent(ref: '#/components/schemas/Category')),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Kategoria nie istnieje'),
            new OA\Response(response: 422, description: 'Błędy walidacji'),
        ]
    )]
    public function update(Request $request, Response $response, array $args): Response
    {
        $category = Category::query()->find((int) $args['id']);

        if (! $category) {
            return $this->json($response, ['error' => 'Kategoria nie istnieje.'], 404);
        }

        $data = (array) $request->getParsedBody();

        $errors = $this->validate($data, partial: true);

        if (array_key_exists('parent_id', $data) && (int) $data['parent_id'] === $category->id) {
            $errors['parent_id'] = 'Kategoria nie może być swoim własnym rodzicem.';
        }

        if (
            $errors === []
            && array_key_exists('slug', $data)
            && Category::query()->where('slug', $data['slug'])->where('id', '!=', $category->id)->exists()
        ) {
            $errors['slug'] = 'Kategoria z takim slugiem już istnieje.';
        }

        if ($errors !== []) {
            return $this->json($response, ['errors' => $errors], 422);
        }

        $category->fill(array_intersect_key($data, array_flip(['external_id', 'name', 'slug', 'parent_id'])));
        $category->save();

        return $this->json($response, $category->toArray());
    }

    #[OA\Delete(
        path: '/api/admin/categories/{id}',
        summary: 'Usunięcie kategorii',
        security: [['bearerAuth' => []]],
        tags: ['Admin - Categories'],
        parameters: [new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer'))],
        responses: [
            new OA\Response(response: 204, description: 'Usunięto'),
            new OA\Response(response: 401, description: 'Brak autoryzacji'),
            new OA\Response(response: 404, description: 'Kategoria nie istnieje'),
        ]
    )]
    public function delete(Request $request, Response $response, array $args): Response
    {
        $category = Category::query()->find((int) $args['id']);

        if (! $category) {
            return $this->json($response, ['error' => 'Kategoria nie istnieje.'], 404);
        }

        Category::query()->where('parent_id', $category->id)->update(['parent_id' => null]);
        $category->delete();

        return $response->withStatus(204);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, string>
     */
    private function validate(array $data, bool $partial = false): array
    {
        $errors = [];

        if (! $partial || array_key_exists('name', $data)) {
            if (empty($data['name']) || ! is_string($data['name'])) {
                $errors['name'] = 'Pole name jest wymagane.';
            }
        }

        if (array_key_exists('parent_id', $data) && $data['parent_id'] !== null && ! Category::query()->where('id', $data['parent_id'])->exists()) {
            $errors['parent_id'] = 'Wskazana kategoria nadrzędna nie istnieje.';
        }

        return $errors;
    }

    /**
     * @param array<string, mixed> $data
     */
    private function resolveSlug(array $data): string
    {
        if (! empty($data['slug']) && is_string($data['slug'])) {
            return $data['slug'];
        }

        $base = is_string($data['name'] ?? null) ? $data['name'] : '';
        $slug = strtolower(trim((string) preg_replace('/[^a-zA-Z0-9]+/', '-', $base), '-'));

        return $slug !== '' ? $slug : 'kategoria';
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function json(Response $response, array $payload, int $status = 200): Response
    {
        $response->getBody()->write(json_encode($payload, JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
