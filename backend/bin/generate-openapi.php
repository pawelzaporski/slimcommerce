<?php

declare(strict_types=1);

use OpenApi\Generator;

require dirname(__DIR__) . '/vendor/autoload.php';

// zircote/swagger-php korzysta wewnętrznie z metod SplObjectStorage
// oznaczonych jako deprecated od PHP 8.5 - wyciszamy to tylko na czas skanowania.
$previousLevel = error_reporting();
error_reporting($previousLevel & ~E_DEPRECATED);

try {
    $openapi = Generator::scan([dirname(__DIR__) . '/src']);
} finally {
    error_reporting($previousLevel);
}

$outputPath = dirname(__DIR__) . '/public/openapi.json';
file_put_contents($outputPath, $openapi->toJson());

echo "Wygenerowano specyfikację OpenAPI: {$outputPath}" . PHP_EOL;
