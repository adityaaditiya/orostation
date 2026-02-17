<?php

namespace App\Support;

class SimplePdfExport
{
    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array<int, mixed>>  $rows
     * @param  array<int, array{title?:string,rows?:array<int, array<int, mixed>>,footer_lines?:array<int,string>,column_widths?:array<int,float|int>}>  $sections
     */
    public static function make(string $title, string $period, array $headers, array $rows, array $sections = [], string $orientation = 'portrait'): string
    {
        $headers = array_values(array_map(fn ($header) => self::normalizeCell((string) $header), $headers));

        $normalizedSections = count($sections) > 0
            ? array_values(array_map(fn ($section) => self::normalizeSection($section), $sections))
            : [[
                'title' => '',
                'rows' => array_map(fn ($row) => self::normalizeRow((array) $row), $rows),
                'footer_lines' => [],
                'column_widths' => [],
            ]];

        return self::buildPdf($title, $period, $headers, $normalizedSections, $orientation);
    }

    /**
     * @param  array{title?:string,rows?:array<int, array<int, mixed>>,footer_lines?:array<int,string>,column_widths?:array<int,float|int>}  $section
     * @return array{title:string,rows:array<int, array<int, string>>,footer_lines:array<int,string>,column_widths:array<int,float>}
     */
    protected static function normalizeSection(array $section): array
    {
        $rows = array_map(fn ($row) => self::normalizeRow((array) $row), (array) ($section['rows'] ?? []));
        $footerLines = array_values(array_map(fn ($line) => self::normalizeCell((string) $line), (array) ($section['footer_lines'] ?? [])));
        $columnWidths = array_values(array_map(fn ($width) => max((float) $width, 0.0), (array) ($section['column_widths'] ?? [])));

        return [
            'title' => self::normalizeCell((string) ($section['title'] ?? '')),
            'rows' => $rows,
            'footer_lines' => $footerLines,
            'column_widths' => $columnWidths,
        ];
    }

    /**
     * @param  array<int, mixed>  $row
     * @return array<int, string>
     */
    protected static function normalizeRow(array $row): array
    {
        return array_values(array_map(fn ($cell) => self::normalizeCell((string) $cell), $row));
    }

    /**
     * @param  array<int, string>  $headers
     * @param  array<int, array{title:string,rows:array<int, array<int, string>>,footer_lines:array<int,string>,column_widths:array<int,float>}>  $sections
     */
    protected static function buildPdf(string $title, string $period, array $headers, array $sections, string $orientation): string
    {
        $isLandscape = strtolower($orientation) === 'landscape';
        $pageWidth = $isLandscape ? 842.0 : 612.0;
        $pageHeight = $isLandscape ? 612.0 : 842.0;
        $marginLeft = 40.0;
        $marginRight = 40.0;
        $marginTop = 40.0;
        $marginBottom = 40.0;
        $tableWidth = $pageWidth - $marginLeft - $marginRight;

        $titleGap = 22.0;
        $periodGap = 18.0;
        $sectionGap = 18.0;
        $sectionTitleGap = 16.0;
        $rowHeight = 22.0;
        $footerGap = 14.0;

        $colCount = max(count($headers), 1);

        $pages = [];
        $content = '';
        $currentY = $pageHeight - $marginTop;

        $appendPageHeader = function () use (&$content, &$currentY, $title, $period, $marginLeft, $titleGap, $periodGap) {
            $content .= self::drawText($marginLeft, $currentY, 14, $title);
            $currentY -= $titleGap;
            $content .= self::drawText($marginLeft, $currentY, 11, $period);
            $currentY -= $periodGap;
        };

        $newPage = function () use (&$pages, &$content, &$currentY, $pageHeight, $marginTop, $appendPageHeader) {
            if ($content !== '') {
                $pages[] = $content;
            }

            $content = '';
            $currentY = $pageHeight - $marginTop;
            $appendPageHeader();
        };

        $ensureSpace = function (float $requiredHeight) use (&$currentY, $marginBottom, $newPage) {
            if (($currentY - $requiredHeight) < $marginBottom) {
                $newPage();
            }
        };

        $drawTableHeader = function (array $columnWidths) use (&$content, &$currentY, $headers, $marginLeft, $rowHeight) {
            $x = $marginLeft;
            foreach ($headers as $index => $header) {
                $width = $columnWidths[$index] ?? ($columnWidths[count($columnWidths) - 1] ?? 0.0);
                $content .= self::drawRect($x, $currentY - $rowHeight, $width, $rowHeight);
                $content .= self::drawText($x + 4, $currentY - 15, 10, self::truncateToWidth($header, $width - 8));
                $x += $width;
            }
            $currentY -= $rowHeight;
        };

        $newPage();

        foreach ($sections as $sectionIndex => $section) {
            if ($sectionIndex > 0) {
                $ensureSpace($sectionGap);
                $currentY -= $sectionGap;
            }

            if ($section['title'] !== '') {
                $ensureSpace($sectionTitleGap);
                $content .= self::drawText($marginLeft, $currentY, 11, $section['title']);
                $currentY -= $sectionTitleGap;
            }

            $weights = $section['column_widths'];
            if (count($weights) !== $colCount || array_sum($weights) <= 0) {
                $weights = array_fill(0, $colCount, 1.0);
            }
            $weightSum = array_sum($weights);
            $columnWidths = array_map(fn ($weight) => ($tableWidth * $weight) / $weightSum, $weights);

            $ensureSpace($rowHeight);
            $drawTableHeader($columnWidths);

            if (count($section['rows']) === 0) {
                $ensureSpace(16.0);
                $content .= self::drawText($marginLeft, $currentY - 16, 10, 'Tidak ada data.');
                $currentY -= 20.0;
            }

            foreach ($section['rows'] as $row) {
                $ensureSpace($rowHeight);

                $x = $marginLeft;
                for ($i = 0; $i < $colCount; $i++) {
                    $cell = $row[$i] ?? '';
                    $width = $columnWidths[$i] ?? ($columnWidths[count($columnWidths) - 1] ?? 0.0);
                    $content .= self::drawRect($x, $currentY - $rowHeight, $width, $rowHeight);
                    $content .= self::drawText($x + 4, $currentY - 15, 10, self::truncateToWidth($cell, $width - 8));
                    $x += $width;
                }

                $currentY -= $rowHeight;
            }

            foreach ($section['footer_lines'] as $lineIndex => $line) {
                $ensureSpace($footerGap);
                $fontSize = $lineIndex === 0 ? 10 : 9;
                $content .= self::drawText($marginLeft, $currentY - 12, $fontSize, $line);
                $currentY -= $footerGap;
            }
        }

        if ($content !== '') {
            $pages[] = $content;
        }

        return self::buildPdfDocument($pages, $pageWidth, $pageHeight);
    }

    /**
     * @param  array<int, string>  $pageContents
     */
    protected static function buildPdfDocument(array $pageContents, float $pageWidth = 612.0, float $pageHeight = 842.0): string
    {
        $objects = [];
        $fontObjectId = 1;
        $pagesObjectId = 2;
        $nextObjectId = 3;

        $objects[$fontObjectId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

        $pageObjectIds = [];

        foreach ($pageContents as $pageContent) {
            $contentObjectId = $nextObjectId++;
            $objects[$contentObjectId] = "<< /Length " . strlen($pageContent) . " >>\nstream\n{$pageContent}\nendstream";

            $pageObjectId = $nextObjectId++;
            $pageObjectIds[] = $pageObjectId;
            $objects[$pageObjectId] = "<< /Type /Page /Parent {$pagesObjectId} 0 R /MediaBox [0 0 {$pageWidth} {$pageHeight}] /Resources << /Font << /F1 {$fontObjectId} 0 R >> >> /Contents {$contentObjectId} 0 R >>";
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

    protected static function drawRect(float $x, float $y, float $w, float $h): string
    {
        return sprintf("%.2f %.2f %.2f %.2f re S\n", $x, $y, $w, $h);
    }

    protected static function drawText(float $x, float $y, int $size, string $text): string
    {
        return sprintf(
            "BT\n/F1 %d Tf\n1 0 0 1 %.2f %.2f Tm\n(%s) Tj\nET\n",
            $size,
            $x,
            $y,
            self::escapePdfText(self::normalizeText($text))
        );
    }

    protected static function truncateToWidth(string $value, float $usableWidth): string
    {
        $approxCharWidth = 5.1;
        $maxChars = max((int) floor($usableWidth / $approxCharWidth), 1);

        return mb_strimwidth($value, 0, $maxChars, '...');
    }

    protected static function normalizeCell(string $value): string
    {
        return preg_replace('/\s+/', ' ', trim($value)) ?? '';
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
