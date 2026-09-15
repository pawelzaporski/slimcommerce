<?php

declare(strict_types=1);

use OpenApi\Generator;

require dirname(__DIR__) . '/vendor/autoload.php';

$openapi = Generator::scan([dirname(__DIR__) . '/src']);

$outputPath = dirname(__DIR__) . '/public/openapi.json';
file_put_contents($outputPath, $openapi->toJson());

echo "Wygenerowano specyfikację OpenAPI: {$outputPath}" . PHP_EOL;
