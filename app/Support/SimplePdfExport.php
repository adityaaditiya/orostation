<?php

namespace App\Support;

class SimplePdfExport
{
    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, mixed>>  $rows
     */
    public static function make(string $title, array $headers, array $rows): string
    {
        $lines = [
            $title,
            'Dibuat: ' . now()->format('Y-m-d H:i:s'),
            str_repeat('-', 140),
            self::rowToLine($headers),
            str_repeat('-', 140),
        ];

        foreach ($rows as $row) {
            $lines[] = self::rowToLine(array_map(fn ($cell) => (string) $cell, $row));
        }

        if (count($rows) === 0) {
            $lines[] = 'Tidak ada data.';
        }

        return self::buildPdfFromLines($lines);
    }

    /**
     * @param  array<int, string>  $cells
     */
    protected static function rowToLine(array $cells): string
    {
        $normalized = array_map(function (string $value) {
            $value = preg_replace('/\s+/', ' ', trim($value)) ?? '';

            return mb_strimwidth($value, 0, 55, '...');
        }, $cells);

        return implode(' | ', $normalized);
    }

    /**
     * @param  array<int, string>  $lines
     */
    protected static function buildPdfFromLines(array $lines): string
    {
        $maxLinesPerPage = 42;
        $lineHeight = 16;

        $pages = array_chunk($lines, $maxLinesPerPage);
        $objects = [];

        $fontObjectId = 1;
        $pagesObjectId = 2;
        $nextObjectId = 3;

        $objects[$fontObjectId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

        $pageObjectIds = [];

        foreach ($pages as $pageLines) {
            $content = "BT\n/F1 10 Tf\n1 0 0 1 40 810 Tm\n{$lineHeight} TL\n";

            foreach ($pageLines as $line) {
                $content .= '(' . self::escapePdfText(self::normalizeText($line)) . ") Tj\nT*\n";
            }

            $content .= 'ET';

            $contentObjectId = $nextObjectId++;
            $objects[$contentObjectId] = "<< /Length " . strlen($content) . " >>\nstream\n{$content}\nendstream";

            $pageObjectId = $nextObjectId++;
            $pageObjectIds[] = $pageObjectId;
            $objects[$pageObjectId] = "<< /Type /Page /Parent {$pagesObjectId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 {$fontObjectId} 0 R >> >> /Contents {$contentObjectId} 0 R >>";
        }

        $kids = implode(' ', array_map(fn ($id) => "{$id} 0 R", $pageObjectIds));
        $objects[$pagesObjectId] = "<< /Type /Pages /Kids [{$kids}] /Count " . count($pageObjectIds) . ' >>';

        $catalogObjectId = $nextObjectId++;
        $objects[$catalogObjectId] = "<< /Type /Catalog /Pages {$pagesObjectId} 0 R >>";

        ksort($objects);

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $id => $body) {
            $offsets[$id] = strlen($pdf);
            $pdf .= "{$id} 0 obj\n{$body}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";

        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= sprintf('%010d 00000 n ', $offsets[$i]) . "\n";
        }

        $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root {$catalogObjectId} 0 R >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }

    protected static function escapePdfText(string $text): string
    {
        return str_replace(
            ['\\', '(', ')'],
            ['\\\\', '\\(', '\\)'],
            $text
        );
    }

    protected static function normalizeText(string $text): string
    {
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);

        return $ascii !== false ? $ascii : $text;
    }
}
