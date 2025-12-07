<?php
/**
 * Project: PC Builder (CITEd.gr VLE)
 * Author: Γεωργαλάς Αθανάσιος-Αντώνιος (Θάνος) — info@cited.gr
 * Copyright: © 2019–2025 CITEd.gr
 * License: MIT
 * Description: Εκπαιδευτικό εργαλείο συμβατότητας PC — UI/UX για επιλογή εξαρτημάτων, έλεγχοι συμβατότητας και κόστος/απόδοση.
 */
// api/auto_fetch_images.php
// Admin endpoint: auto-search images for items in data/components.json and cache them locally.
// Requires ADMIN_KEY in config.php (same as upload_components.php).
// Usage: POST admin_key=... (optionally ?dry=1 for dry-run)
// WARNING: remove or protect this file in production if not needed.

require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$provided = $_POST['admin_key'] ?? $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
if ($provided !== ADMIN_KEY) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Invalid admin key']);
    exit;
}

$dry = isset($_GET['dry']) && $_GET['dry'] == '1';
$projectRoot = realpath(__DIR__ . '/..');
$dataFile = $projectRoot . '/data/components.json';
$imagesDir = $projectRoot . '/static/images';
if (!file_exists($dataFile)) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'components.json missing']);
    exit;
}
$raw = file_get_contents($dataFile);
$components = json_decode($raw, true);
if (!is_array($components)) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'Invalid components.json']);
    exit;
}

// Optional: PIXABAY_KEY in config.php for additional provider
$pixabayKey = defined('PIXABAY_KEY') ? PIXABAY_KEY : null;

// helper: sanitize filename
function sanitize_filename($s) {
    $s = preg_replace('/[^a-zA-Z0-9\-_\.]/','_', $s);
    $s = preg_replace('/_+/', '_', $s);
    return $s;
}

// helper: download image with size limit and content-type check (similar to previous)
function download_image_stream($url, $destPath, $maxBytes = 2*1024*1024) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_FAILONERROR, true);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_BUFFERSIZE, 16384);

    $fh = fopen($destPath . '.tmp', 'w');
    if ($fh === false) {
        curl_close($ch);
        return ['ok'=>false,'error'=>'Cannot open temp file'];
    }

    $bytes = 0;
    $contentType = null;
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $data) use (&$bytes, $maxBytes, $fh) {
        $bytes += strlen($data);
        if ($bytes > $maxBytes) return 0; // abort
        return fwrite($fh, $data);
    });
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($ch, $header) use (&$contentType) {
        if (stripos($header, 'Content-Type:') === 0) {
            $parts = explode(':', $header, 2);
            $contentType = trim($parts[1]);
        }
        return strlen($header);
    });

    $ok = curl_exec($ch);
    $err = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    fclose($fh);

    if (!$ok || $httpCode >= 400) {
        @unlink($destPath . '.tmp');
        return ['ok'=>false,'error'=>'HTTP error or curl failed: ' . $err . ' code:' . $httpCode];
    }
    if (!$contentType || stripos($contentType, 'image/') !== 0) {
        @unlink($destPath . '.tmp');
        return ['ok'=>false,'error'=>'Not an image (Content-Type: ' . ($contentType ?: 'unknown') . ')'];
    }
    if (!rename($destPath . '.tmp', $destPath)) {
        @unlink($destPath . '.tmp');
        return ['ok'=>false,'error'=>'Failed to rename temp file'];
    }
    @chmod($destPath, 0664);
    return ['ok'=>true,'path'=>$destPath,'content_type'=>$contentType];
}

// provider: Wikimedia Commons search (no key)
// returns [ 'ok'=>true, 'url'=> 'https://...' ] or ['ok'=>false,'error'=>...]
function search_wikimedia($query) {
    $base = 'https://commons.wikimedia.org/w/api.php';
    $qs = http_build_query([
        'action' => 'query',
        'format' => 'json',
        'generator' => 'search',
        'gsrsearch' => $query,
        'gsrlimit' => 3,
        'gsrnamespace' => 6, // namespace 6 = File
        'prop' => 'imageinfo',
        'iiprop' => 'url',
        'formatversion' => 2
    ]);
    $url = $base . '?' . $qs;
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_USERAGENT => 'pcbuilder-image-fetcher/1.0 (yourdomain)'
    ];
    $ch = curl_init($url);
    curl_setopt_array($ch, $opts);
    $res = curl_exec($ch);
    $err = curl_error($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($res === false || $http >= 400) return ['ok'=>false,'error'=>'Wikimedia request failed: '.$err.' code:'.$http];
    $json = json_decode($res, true);
    if (!isset($json['query']['pages']) || !is_array($json['query']['pages'])) return ['ok'=>false,'error'=>'No results'];
    // pages may contain imageinfo.url
    foreach ($json['query']['pages'] as $p) {
        if (isset($p['imageinfo'][0]['url'])) return ['ok'=>true,'url'=>$p['imageinfo'][0]['url']];
    }
    return ['ok'=>false,'error'=>'No image url found'];
}

// provider: Pixabay (optional) - must define PIXABAY_KEY in config.php
function search_pixabay($query) {
    if (!defined('PIXABAY_KEY') || !PIXABAY_KEY) return ['ok'=>false,'error'=>'No pixabay key'];
    $base = 'https://pixabay.com/api/';
    $qs = http_build_query([
        'key' => PIXABAY_KEY,
        'q' => $query,
        'image_type' => 'photo',
        'per_page' => 3,
    ]);
    $url = $base . '?' . $qs;
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_USERAGENT => 'pcbuilder-image-fetcher/1.0 (yourdomain)'
    ]);
    $res = curl_exec($ch);
    $err = curl_error($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($res === false || $http >= 400) return ['ok'=>false,'error'=>'Pixabay request failed: '.$err.' code:'.$http];
    $json = json_decode($res, true);
    if (isset($json['hits'][0]['largeImageURL'])) return ['ok'=>true,'url'=>$json['hits'][0]['largeImageURL']];
    return ['ok'=>false,'error'=>'No pixabay hits'];
}

// main loop
$report = ['total'=>count($components),'updated'=>0,'skipped'=>0,'errors'=>[]];
if (!$dry && !is_dir($imagesDir)) {
    if (!mkdir($imagesDir, 0775, true)) {
        http_response_code(500);
        echo json_encode(['ok'=>false,'error'=>'Failed to create images dir']);
        exit;
    }
}

foreach ($components as $i => &$c) {
    // skip if already local (starts with static/images/) and file exists
    if (!empty($c['image']) && strpos($c['image'], 'static/images/') === 0) {
        $report['skipped']++;
        continue;
    }
    $queryParts = [];
    if (!empty($c['name'])) $queryParts[] = $c['name'];
    if (!empty($c['category'])) $queryParts[] = $c['category'];
    $query = implode(' ', $queryParts) ?: ($c['name'] ?? 'computer part');

    $found = false;
    $tries = [];

    // 1) Wikimedia
    $wm = search_wikimedia($query);
    $tries[] = ['provider'=>'wikimedia','res'=>$wm];
    if ($wm['ok']) {
        $url = $wm['url'];
        $ext = pathinfo(parse_url($url, PHP_URL_PATH), PATHINFO_EXTENSION) ?: 'jpg';
        $fname = 'comp_' . intval($c['id']) . '_' . sanitize_filename(basename($url));
        $dest = $imagesDir . '/' . $fname;
        if (!$dry) {
            $dl = download_image_stream($url, $dest, 2*1024*1024);
            if ($dl['ok']) {
                $c['image'] = 'static/images/' . basename($dest);
                $report['updated']++;
                $found = true;
                // optionally store attribution
                $c['attribution'] = $wm['url'];
            } else {
                $report['errors'][] = ['id'=>$c['id'],'provider'=>'wikimedia','error'=>$dl['error']];
            }
        } else {
            $report['would'][] = ['id'=>$c['id'],'provider'=>'wikimedia','url'=>$url];
            $found = true;
        }
    }

    if ($found) continue;

    // 2) Pixabay if configured
    if ($pixabayKey) {
        $px = search_pixabay($query);
        $tries[] = ['provider'=>'pixabay','res'=>$px];
        if ($px['ok']) {
            $url = $px['url'];
            $fname = 'comp_' . intval($c['id']) . '_' . sanitize_filename(basename(parse_url($url, PHP_URL_PATH)));
            $dest = $imagesDir . '/' . $fname;
            if (!$dry) {
                $dl = download_image_stream($url, $dest, 2*1024*1024);
                if ($dl['ok']) {
                    $c['image'] = 'static/images/' . basename($dest);
                    $report['updated']++;
                    $found = true;
                    $c['attribution'] = 'pixabay';
                } else {
                    $report['errors'][] = ['id'=>$c['id'],'provider'=>'pixabay','error'=>$dl['error']];
                }
            } else {
                $report['would'][] = ['id'=>$c['id'],'provider'=>'pixabay','url'=>$url];
                $found = true;
            }
        }
    }

    // Could add other providers (Unsplash/Bing) here if keys are available

    // if none found, skip
    if (!$found) {
        $report['errors'][] = ['id'=>$c['id'],'error'=>'No image found by providers','tries'=>$tries];
    }

    // small delay to avoid hammering providers
    usleep(150000); // 150ms
}
unset($c);

// save modified components.json
if (!$dry) {
    $backup = $projectRoot . '/data/components.json.bak.' . time();
    copy($dataFile, $backup);
    $ok = file_put_contents($dataFile, json_encode($components, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    if ($ok === false) {
        http_response_code(500);
        echo json_encode(['ok'=>false,'error'=>'Failed to write components.json', 'report'=>$report]);
        exit;
    }
}

echo json_encode(['ok'=>true, 'dry'=>$dry, 'report'=>$report]);
