<?php
/**
 * Project: PC Builder (CITEd.gr VLE)
 * Author: Γεωργαλάς Αθανάσιος-Αντώνιος (Θάνος) — info@cited.gr
 * Copyright: © 2019–2025 CITEd.gr
 * License: MIT
 * Description: Εκπαιδευτικό εργαλείο συμβατότητας PC — UI/UX για επιλογή εξαρτημάτων, έλεγχοι συμβατότητας και κόστος/απόδοση.
 */
// api/submit_build.php
// Validates a submitted PC build against rules and appends attempt to data/progress.json
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

$user = isset($input['user']) ? preg_replace('/[^a-zA-Z0-9_\-]/','', $input['user']) : 'anonymous';
$motherboard_id = isset($input['motherboard']) ? intval($input['motherboard']) : 0;
$cpu_id = isset($input['cpu']) ? intval($input['cpu']) : 0;
$ram_ids = isset($input['ram']) && is_array($input['ram']) ? array_map('intval',$input['ram']) : [];
$gpu_id = isset($input['gpu']) ? intval($input['gpu']) : 0;
$storage_ids = isset($input['storage']) && is_array($input['storage']) ? array_map('intval',$input['storage']) : [];

$componentsFile = __DIR__ . '/../data/components.json';
if (!file_exists($componentsFile)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'components not initialized']);
    exit;
}

$components = json_decode(file_get_contents($componentsFile), true);
if (!is_array($components)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'invalid components data']);
    exit;
}

// index by id for quick lookup
$map = [];
foreach ($components as $c) $map[intval($c['id'])] = $c;

$errors = [];
$warnings = [];

// Helper to get component safely
$get = function($id) use ($map) { return isset($map[$id]) ? $map[$id] : null; };

$mb = $get($motherboard_id);
$cpu = $get($cpu_id);
$gpus = $gpu_id ? $get($gpu_id) : null;
$rams = array_map($get, $ram_ids);
$storages = array_map($get, $storage_ids);

// basic existence checks
if (!$mb) $errors[] = "Motherboard not selected or unknown.";
if (!$cpu) $errors[] = "CPU not selected or unknown.";
if (!$gpus) $errors[] = "GPU not selected or unknown.";

// Compatibility rules (expandable)
if ($mb && $cpu) {
    if (isset($mb['socket']) && isset($cpu['socket']) && $mb['socket'] !== $cpu['socket']) {
        $errors[] = "CPU socket mismatch: motherboard {$mb['socket']} vs CPU {$cpu['socket']}.";
    }
}

if ($mb) {
    // RAM type and slots
    $mb_ram_type = isset($mb['ram_type']) ? $mb['ram_type'] : null;
    $mb_slots = isset($mb['ram_slots']) ? intval($mb['ram_slots']) : 4;
    $mb_max = isset($mb['max_ram_gb']) ? intval($mb['max_ram_gb']) : 128;

    if (count($rams) > $mb_slots) {
        $errors[] = "Too many RAM sticks: motherboard has {$mb_slots} slots, you selected " . count($rams) . ".";
    }

    $totalRam = 0;
    foreach ($rams as $r) {
        if (!$r) {
            $errors[] = "One of the selected RAM sticks is unknown.";
            continue;
        }
        if ($mb_ram_type && isset($r['type']) && $r['type'] !== $mb_ram_type) {
            $errors[] = "RAM type mismatch: motherboard supports {$mb_ram_type} but selected RAM is {$r['type']}.";
        }
        $totalRam += isset($r['size_gb']) ? intval($r['size_gb']) : 0;
    }
    if ($totalRam > $mb_max) {
        $errors[] = "Total RAM {$totalRam}GB exceeds motherboard maximum {$mb_max}GB.";
    }
}

if ($mb) {
    // Storage: check M.2 count vs motherboard m2_slots, check SATA support
    $m2_count = 0;
    $nvme_count = 0;
    $sata_count = 0;
    foreach ($storages as $s) {
        if (!$s) {
            $errors[] = "One of the selected storage devices is unknown.";
            continue;
        }
        if (isset($s['interface']) && stripos($s['interface'],'m.2') !== false) {
            $m2_count++;
            if (isset($s['protocol']) && stripos($s['protocol'],'nvme') !== false) $nvme_count++;
        } else if (isset($s['interface']) && stripos($s['interface'],'sata') !== false) {
            $sata_count++;
        }
    }
    $mb_m2 = isset($mb['m2_slots']) ? intval($mb['m2_slots']) : 0;
    if ($m2_count > $mb_m2) {
        $errors[] = "Too many M.2 devices ({$m2_count}) for motherboard M.2 slots ({$mb_m2}).";
    }
}

if ($mb && $gpus) {
    // simple PCIe slot compatibility: motherboard pcie_version vs gpu pcie_version
    if (isset($mb['pcie_version']) && isset($gpus['pcie_version'])) {
        // GPU will work backwards-compatible usually, we warn if GPU requires newer PCIe major version
        $mb_ver = floatval($mb['pcie_version']);
        $gpu_ver = floatval($gpus['pcie_version']);
        if ($gpu_ver > $mb_ver) {
            $warnings[] = "GPU PCIe version {$gpus['pcie_version']} is newer than motherboard PCIe {$mb['pcie_version']}. It may work at reduced bandwidth.";
        }
    }
}

// Final result
$ok = count($errors) === 0;
$record = [
    'timestamp' => date('c'),
    'user' => $user,
    'motherboard' => $motherboard_id,
    'cpu' => $cpu_id,
    'ram' => $ram_ids,
    'gpu' => $gpu_id,
    'storage' => $storage_ids,
    'ok' => $ok,
    'errors' => $errors,
    'warnings' => $warnings
];

// append to data/progress.json
$dir = __DIR__ . '/../data';
$progressFile = $dir . '/progress.json';
if (!is_dir($dir)) mkdir($dir, 0775, true);

$data = [];
if (file_exists($progressFile)) {
    $raw = file_get_contents($progressFile);
    if ($raw !== false && strlen($raw) > 0) {
        $json = json_decode($raw, true);
        if (is_array($json)) $data = $json;
    }
}
$data[] = $record;
file_put_contents($progressFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(['ok' => $ok, 'errors' => $errors, 'warnings' => $warnings, 'record' => $record]);
