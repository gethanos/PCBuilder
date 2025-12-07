<?php
/**
 * Project: PC Builder (CITEd.gr VLE)
 * Author: Γεωργαλάς Αθανάσιος-Αντώνιος (Θάνος) — info@cited.gr
 * Copyright: © 2019–2025 CITEd.gr
 * License: MIT
 * Description: Εκπαιδευτικό εργαλείο συμβατότητας PC — UI/UX για επιλογή εξαρτημάτων, έλεγχοι συμβατότητας και κόστος/απόδοση.
 */
// api/get_components.php — serve your dataset as JSON
header('Content-Type: application/json; charset=utf-8');
$root = realpath(__DIR__ . '/..');
$file = $root . '/data/components.json';
if (!file_exists($file)) {
  http_response_code(404);
  echo json_encode(['error'=>'dataset not found']);
  exit;
}
$raw = file_get_contents($file);
echo $raw;
