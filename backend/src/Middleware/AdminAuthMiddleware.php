<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Support\Jwt;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;
use Throwable;

/**
 * Chroni trasy api/admin/* - wymaga poprawnego nagłówka
 * "Authorization: Bearer <token>" wydanego przez AuthController::login().
 */
final readonly class AdminAuthMiddleware implements MiddlewareInterface
{
    public function __construct(private Jwt $jwt)
    {
    }

    public function process(Request $request, RequestHandler $handler): Response
    {
        $header = $request->getHeaderLine('Authorization');

        if (! str_starts_with($header, 'Bearer ')) {
            return $this->unauthorized();
        }

        try {
            $claims = $this->jwt->verify(substr($header, 7));
        } catch (Throwable) {
            return $this->unauthorized();
        }

        return $handler->handle($request->withAttribute('authUser', $claims));
    }

    private function unauthorized(): Response
    {
        $response = new SlimResponse(401);
        $response->getBody()->write(json_encode(['error' => 'Brak autoryzacji.'], JSON_THROW_ON_ERROR));

        return $response->withHeader('Content-Type', 'application/json');
    }
}
