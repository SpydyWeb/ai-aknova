<?php
// The admin panel's API for plain PHP hosting (MilesWeb, cPanel and the like). No Node server.
// The content is kept in a MySQL database, so pushing code to GitHub can never overwrite it.
// It answers the same addresses as server/core.mjs, so src/admin needs no changes:
//
//   GET  /api/admin/me            who is signed in, and what this host can do
//   POST /api/admin/login|logout  sign in and out (email + password from the config file)
//   GET  /api/content             the site content (the newest row in the database)
//   PUT  /api/content             save it, and ask GitHub to rebuild the pages for search engines
//   GET  /api/backups             earlier saves (the 30 rows before it)
//   POST /api/backups/restore     put an earlier save back
//   GET|POST|DELETE /api/media    photos and videos in the website's uploads/ folder
//
// Settings live in aknova-config.php, one folder ABOVE the website folder, so the web can never
// read them. See deploy/aknova-config.example.php in the repository.

declare(strict_types=1);

const UPLOADS = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'mp4', 'm4v', 'webm', 'mov', 'pdf'];
const TYPES = [
    'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp',
    'avif' => 'image/avif', 'gif' => 'image/gif', 'svg' => 'image/svg+xml', 'mp4' => 'video/mp4',
    'm4v' => 'video/mp4', 'webm' => 'video/webm', 'mov' => 'video/quicktime', 'pdf' => 'application/pdf',
];
const COOKIE = 'aknova_admin';
const WEEK = 604800;
const MAX_UPLOAD = 300 * 1048576;
const MAX_JSON = 6 * 1048576;

final class StoreError extends Exception {}
final class Answer extends Exception
{
    public function __construct(public int $status, public array $body) { parent::__construct(''); }
}

/* ---------------- settings ---------------- */

function config(): array
{
    static $c = null;
    if ($c !== null) return $c;
    $file = getenv('AKNOVA_CONFIG') ?: dirname(__DIR__, 2) . '/aknova-config.php';
    $c = is_file($file) ? (array) (require $file) : [];
    $c += ['admin_email' => '', 'admin_password' => '', 'db_host' => 'localhost', 'db_name' => '', 'db_user' => '', 'db_pass' => '', 'db_dsn' => '', 'github_token' => '', 'github_repo' => '', 'github_branch' => 'main', 'github_api' => 'https://api.github.com'];
    return $c;
}
function tidy(?string $email): string { return strtolower(trim((string) $email)); }
function valid_email(string $e): bool { return strlen($e) <= 200 && (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $e); }
function has_password(): bool { $c = config(); return $c['admin_password'] !== '' && valid_email(tidy($c['admin_email'])); }
function ready(): bool { $c = config(); return $c['db_dsn'] !== '' || ($c['db_name'] !== '' && $c['db_user'] !== ''); }
// A password hash ($2y$… or $argon2…) or, simpler to set up, the password itself.
function check_password(string $given): bool
{
    $stored = (string) config()['admin_password'];
    if ($stored === '') return false;
    if (preg_match('/^\$(2y|argon2)/', $stored)) return password_verify($given, $stored);
    return hash_equals(hash('sha256', $stored), hash('sha256', $given));
}
function state_dir(): string
{
    $dir = dirname(__DIR__, 2) . '/.aknova-state';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir;
}

/* ---------------- answers ---------------- */

function answer(int $status, array $body): never { throw new Answer($status, $body); }
function fail(int $status, string $message): never { answer($status, ['error' => $message]); }
function send(int $status, array $body): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}
function body_json(): array
{
    $raw = file_get_contents('php://input', false, null, 0, MAX_JSON + 1);
    if ($raw === false) fail(400, 'The request could not be read.');
    if (strlen($raw) > MAX_JSON) fail(413, 'That is too much to save at once.');
    if ($raw === '') return [];
    try {
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        fail(400, 'The request could not be read.');
    }
    return is_array($data) ? $data : [];
}

/* ---------------- sign-in ---------------- */

// Changing the email or password changes the secret, which signs every device out.
function secret(): string
{
    $c = config();
    return hash_hmac('sha256', 'aknova-session:' . tidy($c['admin_email']), (string) $c['admin_password']);
}
function sign(string $exp): string { return hash_hmac('sha256', $exp, secret()); }
function signed_in(): bool
{
    $v = $_COOKIE[COOKIE] ?? '';
    if (!is_string($v) || !preg_match('/^(\d+)\.([a-f0-9]{64})$/', $v, $m)) return false;
    return (int) $m[1] > time() && hash_equals(sign($m[1]), $m[2]);
}
function https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}
function set_cookie(int $exp): void
{
    setcookie(COOKIE, $exp ? $exp . '.' . sign((string) $exp) : '', [
        'expires' => $exp ? $exp : time() - 3600, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Strict',
    ]);
}
// Five wrong passwords lock that address out for ten minutes. Kept in a file, since PHP keeps no memory between requests.
function client_ip(): string { return (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'); }
function tries_file(): string { return state_dir() . '/login-' . hash('sha256', client_ip()) . '.json'; }
function locked(): bool
{
    $t = @json_decode((string) @file_get_contents(tries_file()), true);
    return is_array($t) && ($t['count'] ?? 0) >= 5 && ($t['until'] ?? 0) > time();
}
function missed(): void
{
    $t = @json_decode((string) @file_get_contents(tries_file()), true);
    $fresh = !is_array($t) || ($t['until'] ?? 0) < time();
    @file_put_contents(tries_file(), json_encode(['count' => $fresh ? 1 : ($t['count'] + 1), 'until' => time() + 600]), LOCK_EX);
}

/* ---------------- the database: where the content is kept ---------------- */

// One row per save. The newest row is the live content; the 30 before it are the "earlier versions".
function db(): PDO
{
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = config();
    $dsn = $c['db_dsn'] !== '' ? $c['db_dsn'] : "mysql:host={$c['db_host']};dbname={$c['db_name']};charset=utf8mb4";
    try {
        $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    } catch (PDOException) {
        throw new StoreError('The database could not be reached. Check db_host, db_name, db_user and db_pass in aknova-config.php.');
    }
    $id = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'INT AUTO_INCREMENT PRIMARY KEY';
    $pdo->exec("CREATE TABLE IF NOT EXISTS aknova_content (id $id, data LONGTEXT NOT NULL, saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    return $pdo;
}
function read_content(?int $id = null): ?array
{
    $q = $id === null
        ? db()->query('SELECT data FROM aknova_content ORDER BY id DESC LIMIT 1')
        : db()->prepare('SELECT data FROM aknova_content WHERE id = ?');
    if ($id !== null) $q->execute([$id]);
    $raw = $q->fetchColumn();
    if ($raw === false) {
        if ($id !== null) return null;
        // First run: the table starts with the content the site was last built from.
        $seed = @json_decode((string) @file_get_contents(__DIR__ . '/seed.json'), true);
        if (!looks_right($seed)) throw new StoreError('The database is empty and api/seed.json is missing. Rebuild and upload the site once.');
        write_content($seed);
        return $seed;
    }
    $data = json_decode((string) $raw, true);
    if (!is_array($data)) throw new StoreError('The saved content in the database could not be read.');
    return $data;
}
function write_content(array $data): void
{
    $pdo = db();
    // Times are written in UTC by PHP, so the database's own time zone never matters.
    $pdo->prepare('INSERT INTO aknova_content (data, saved_at) VALUES (?, ?)')->execute([json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), gmdate('Y-m-d H:i:s')]);
    // Keep the live row and the 30 before it.
    $pdo->exec('DELETE FROM aknova_content WHERE id < (SELECT id FROM (SELECT id FROM aknova_content ORDER BY id DESC LIMIT 1 OFFSET 30) AS keep)');
}
function looks_right($d): bool
{
    if (!is_array($d) || ($d !== [] && array_is_list($d)) || !is_array($d['site'] ?? null) || !is_array($d['pages'] ?? null) || !array_is_list($d['pages'])) return false;
    foreach ($d['pages'] as $p) if (is_array($p) && ($p['path'] ?? null) === '/') return true;
    return false;
}
function backups(): array
{
    $rows = db()->query('SELECT id, saved_at FROM aknova_content ORDER BY id DESC LIMIT 30 OFFSET 1')->fetchAll(PDO::FETCH_ASSOC);
    return array_map(fn ($r) => ['name' => (string) $r['id'], 'time' => (strtotime($r['saved_at'] . ' UTC') ?: 0) * 1000], $rows);
}

// Pages are rebuilt by GitHub so search engines see the new titles and text. The visible content
// is already live, since every page reads it from the database, so a failure here only delays SEO.
function rebuild(): void
{
    $c = config();
    if ($c['github_token'] === '' || $c['github_repo'] === '') return;
    $ch = curl_init(rtrim((string) $c['github_api'], '/') . '/repos/' . $c['github_repo'] . '/actions/workflows/deploy.yml/dispatches');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $c['github_token'], 'Accept: application/vnd.github+json', 'X-GitHub-Api-Version: 2022-11-28', 'User-Agent: aknova-admin', 'Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode(['ref' => (string) $c['github_branch']]),
    ]);
    if (curl_exec($ch) === false || curl_getinfo($ch, CURLINFO_RESPONSE_CODE) >= 300) error_log('aknova api: the rebuild could not be started on GitHub');
}

/* ---------------- photos and videos: files in the website's uploads folder ---------------- */

// shortcut: uploads live in the website's own uploads/ folder. The FTP deploy only replaces files it
// uploaded itself, so these survive. Turning on its "clean slate" option would delete them.
function upload_dir(): string
{
    $dir = dirname(__DIR__) . '/uploads';
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    return $dir;
}
function ext_of(string $name): string { return strtolower(pathinfo($name, PATHINFO_EXTENSION)); }
function kind(string $name): string { return explode('/', TYPES[ext_of($name)] ?? '')[0]; }
function media(): array
{
    $files = [];
    foreach (scandir(upload_dir()) ?: [] as $name) {
        $path = upload_dir() . '/' . $name;
        if ($name[0] === '.' || !is_file($path) || !in_array(ext_of($name), UPLOADS, true)) continue;
        $files[] = ['name' => $name, 'url' => '/uploads/' . $name, 'size' => filesize($path), 'time' => filemtime($path) * 1000, 'type' => kind($name)];
    }
    usort($files, fn ($a, $b) => $b['time'] <=> $a['time']);
    return $files;
}
function safe_name(string $raw, array $taken): ?string
{
    $ext = ext_of($raw);
    if (!in_array($ext, UPLOADS, true)) return null;
    $stem = trim((string) preg_replace('/[^a-z0-9]+/', '-', strtolower(pathinfo($raw, PATHINFO_FILENAME))), '-');
    $stem = substr($stem, 0, 60) ?: 'file';
    $name = "$stem.$ext";
    for ($n = 2; in_array($name, $taken, true); $n++) $name = "$stem-$n.$ext";
    return $name;
}
function upload_limit(): int
{
    $v = trim((string) ini_get('post_max_size'));
    $n = (int) $v;
    $post = match (strtolower(substr($v, -1))) { 'g' => $n << 30, 'm' => $n << 20, 'k' => $n << 10, default => $n };
    return $post > 0 ? min(MAX_UPLOAD, $post) : MAX_UPLOAD;
}
// Streams the request body to disk, so a large video never has to fit in PHP's memory.
function receive_upload(string $name): int
{
    $limit = upload_limit();
    $tmp = upload_dir() . "/.$name.part";
    $in = fopen('php://input', 'rb');
    $out = fopen($tmp, 'wb');
    $size = $in && $out ? stream_copy_to_stream($in, $out, $limit + 1) : false;
    if ($in) fclose($in);
    if ($out) fclose($out);
    if ($size === false || $size === 0 || $size > $limit) {
        @unlink($tmp);
        if ($size > $limit) fail(413, 'That file is larger than ' . round($limit / 1048576) . ' MB.');
        fail(400, 'The upload did not finish. Try again.');
    }
    rename($tmp, upload_dir() . "/$name");
    return (int) $size;
}

function not_found(): void
{
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
}

/* ---------------- the API ---------------- */

function api(string $method, string $path): void
{
    $is = fn (string $m, string $p) => $method === $m && $path === $p;
    $c = config();

    if ($is('GET', '/api/admin/me')) {
        $in = has_password() && signed_in();
        $me = [
            'stuck' => !ready(), 'remote' => false, 'maxUpload' => upload_limit(), 'hasPassword' => has_password(),
            'needsEmail' => false, 'canSetup' => false, 'signedIn' => $in, 'fixed' => true,
            'hint' => 'The admin panel cannot save yet. In cPanel create a MySQL database and user, then add db_name, db_user and db_pass to aknova-config.php in your home folder (one level above the website).',
        ];
        if ($in) $me['email'] = tidy($c['admin_email']);
        answer(200, $me);
    }
    if (!ready()) fail(503, 'This host has nowhere to save yet. Fill in the database settings in aknova-config.php.');
    if ($is('GET', '/api/content')) answer(200, read_content());

    // Anything that changes something must come from the admin panel itself, not another website.
    if ($method !== 'GET' && ($_SERVER['HTTP_X_ADMIN'] ?? '') !== '1') fail(403, 'This request did not come from the admin panel.');

    if ($is('POST', '/api/admin/setup')) fail(403, 'Set admin_email and admin_password in aknova-config.php on the server.');
    if ($is('POST', '/api/admin/login')) {
        if (locked()) fail(429, 'Too many wrong attempts. Wait ten minutes and try again.');
        $b = body_json();
        $email = is_string($b['email'] ?? null) ? $b['email'] : '';
        $password = is_string($b['password'] ?? null) ? $b['password'] : '';
        // Both are always checked, so the answer never reveals which of the two was wrong.
        $okPassword = has_password() && check_password($password);
        $okEmail = hash_equals(hash('sha256', tidy($c['admin_email'])), hash('sha256', tidy($email)));
        if (!$okPassword || !$okEmail) {
            missed();
            usleep(600000);
            fail(401, 'The email or password is not right.');
        }
        @unlink(tries_file());
        set_cookie(time() + WEEK);
        answer(200, ['ok' => true]);
    }
    if ($is('POST', '/api/admin/logout')) {
        set_cookie(0);
        answer(200, ['ok' => true]);
    }

    if (!has_password() || !signed_in()) fail(401, 'Sign in to the admin panel first.');

    if ($is('POST', '/api/admin/account')) fail(409, 'This account is set on the server in aknova-config.php. Change it there.');
    if ($is('PUT', '/api/content')) {
        $data = body_json();
        if (!looks_right($data)) fail(400, 'That does not look like the site content, so nothing was saved.');
        write_content($data);
        rebuild();
        answer(200, ['ok' => true]);
    }
    if ($is('GET', '/api/backups')) answer(200, backups());
    if ($is('POST', '/api/backups/restore')) {
        $name = (string) (body_json()['name'] ?? '');
        $data = ctype_digit($name) ? read_content((int) $name) : null;
        if ($data === null) fail(404, 'That saved version no longer exists.');
        if (!looks_right($data)) fail(400, 'That saved version is damaged.');
        write_content($data);
        rebuild();
        answer(200, $data);
    }
    if ($is('GET', '/api/media')) answer(200, media());
    if ($is('POST', '/api/media')) {
        $name = safe_name((string) ($_GET['name'] ?? ''), array_column(media(), 'name'));
        if ($name === null) fail(400, 'That kind of file cannot be uploaded. Use .' . implode(', .', UPLOADS) . '.');
        $size = receive_upload($name);
        answer(200, ['name' => $name, 'url' => "/uploads/$name", 'size' => $size, 'time' => time() * 1000, 'type' => kind($name)]);
    }
    if ($is('DELETE', '/api/media')) {
        $name = basename((string) ($_GET['name'] ?? ''));
        if ($name === '' || $name[0] === '.' || !is_file(upload_dir() . "/$name")) fail(404, 'That file is not in the library.');
        unlink(upload_dir() . "/$name");
        answer(200, ['ok' => true]);
    }
    fail(404, 'Not found.');
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$path = '/' . ltrim((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH), '/');
try {
    if (str_starts_with($path, '/uploads/')) {
        not_found();
        exit;
    }
    api($method, rtrim($path, '/') ?: '/');
} catch (Answer $a) {
    send($a->status, $a->body);
} catch (StoreError $e) {
    send(502, ['error' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('aknova api: ' . $e);
    send(500, ['error' => 'Something went wrong on the server.']);
}
