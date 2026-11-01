<?php
// Inquiry form handler for /contact/. Disabled until INQUIRY_TO is set.
// To enable: set INQUIRY_TO and INQUIRY_FROM below, then set inquiryEndpoint: "/contact.php" in /assets/config.js.

const INQUIRY_TO = '';    // where inquiries are delivered, e.g. 'hello@thecreatorsaga.com'
const INQUIRY_FROM = '';  // a mailbox on this domain the host is allowed to send from, e.g. 'website@thecreatorsaga.com'

const OPTIONS = [
    'business_type'    => ['Creator or personal brand', 'Podcast', 'Coach or educator', 'Business or agency'],
    'frequency'        => ['Rarely or inconsistently', '1 to 2 times per week', '3 to 5 times per week', 'Daily or more'],
    'challenge'        => ['Editing and production', 'Consistency and workflow', 'Content strategy and packaging', 'Growing the audience'],
    'existing_content' => ['Existing long-form videos', 'Short-form raw footage', 'Need help planning and producing content'],
    'budget'           => ['Under $500', '$500 to $1,000', '$1,000 to $2,500', '$2,500 or more', 'Not sure yet'],
];

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(int $code, string $error = ''): void {
    global $wantsJson;
    http_response_code($code);
    if ($wantsJson) {
        header('Content-Type: application/json');
        echo json_encode($error ? ['error' => $error] : ['ok' => true]);
    } else {
        header('Location: /contact/?' . ($error ? 'error=1' : 'sent=1') . '#inquiry', true, 303);
    }
    exit;
}

// Single line, no control characters, bounded length.
function clean(string $key, int $max): string {
    $v = trim((string)($_POST[$key] ?? ''));
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v) ?? '';
    return mb_substr($v, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') respond(405, 'Method not allowed.');
if (INQUIRY_TO === '' || INQUIRY_FROM === '') respond(503, 'The inquiry form is not available right now.');
if (!empty($_POST['company'])) respond(200); // honeypot: pretend success to bots

$name  = clean('name', 120);
$email = clean('email', 200);
$link  = clean('link', 300);
if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) respond(422, 'Please enter your name and a valid email address.');
if ($link !== '' && !preg_match('#^https?://#i', $link)) $link = 'https://' . $link;
if ($link !== '' && !filter_var($link, FILTER_VALIDATE_URL)) $link = '';

$answers = [];
foreach (OPTIONS as $key => $allowed) {
    $v = clean($key, 80);
    $answers[$key] = in_array($v, $allowed, true) ? $v : '';
}
if ($answers['business_type'] === '') respond(422, 'Please tell us what best describes you.');

// Multi-line message: strip control chars except newlines/tabs.
$message = preg_replace('/[^\P{C}\n\t]+/u', '', mb_substr(trim((string)($_POST['message'] ?? '')), 0, 3000)) ?? '';

$attribution = [];
foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'landing_page'] as $k) {
    $v = clean($k, 150);
    if ($v !== '') $attribution[] = "$k: $v";
}

$body = "New inquiry from thecreatorsaga.com\n\n"
    . "Name: $name\nEmail: $email\nWebsite/channel: " . ($link ?: '-') . "\n\n"
    . "Describes them: {$answers['business_type']}\n"
    . "Publishing frequency: " . ($answers['frequency'] ?: '-') . "\n"
    . "Biggest challenge: " . ($answers['challenge'] ?: '-') . "\n"
    . "Existing content: " . ($answers['existing_content'] ?: '-') . "\n"
    . "Monthly budget: " . ($answers['budget'] ?: '-') . "\n\n"
    . "Message:\n" . ($message ?: '-') . "\n\n"
    . "Attribution:\n" . ($attribution ? implode("\n", $attribution) : 'none') . "\n";

// $email passed filter_var, which rejects CR/LF, so it is safe in Reply-To.
$headers = "From: Creator Saga Website <" . INQUIRY_FROM . ">\r\n"
    . "Reply-To: $email\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n";
$subject = '=?UTF-8?B?' . base64_encode("Website inquiry: $name ({$answers['business_type']})") . '?=';

if (!mail(INQUIRY_TO, $subject, $body, $headers)) respond(500, 'We could not send your message.');
respond(200);
