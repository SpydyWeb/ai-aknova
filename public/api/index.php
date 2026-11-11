<?php
// The admin panel's API for plain PHP hosting (MilesWeb, cPanel and the like). No Node server.
// It answers the same addresses as server/core.mjs, so src/admin needs no changes:
//
//   GET  /api/admin/me            who is signed in, and what this host can do
//   POST /api/admin/login|logout  sign in and out (email + password from the config file)
//   GET  /api/content             the site content (content/site.json in the GitHub repository)
//   PUT  /api/content             save it: a commit, which makes GitHub rebuild and upload the site
//   GET  /api/backups             earlier saves (earlier commits of site.json)
//   POST /api/backups/restore     put an earlier save back
//   GET|POST|DELETE /api/media    photos and videos in content/uploads
//   GET  /uploads/<name>          (through .htaccess) an upload that is newer than the last rebuild
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
const SITE_FILE = 'content/site.json';
const UPLOAD_DIR = 'content/uploads';
const COOKIE = 'aknova_admin';
const WEEK = 604800;
// GitHub's contents API takes files as base64 inside JSON; past ~25 MB that becomes unreliable.
const MAX_UPLOAD = 25 * 1048576;
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
    $c += ['admin_email' => '', 'admin_password' => '', 'github_token' => '', 'github_repo' => '', 'github_branch' => 'main', 'github_dir' => '', 'github_api' => 'https://api.github.com'];
    return $c;
}
function tidy(?string $email): string { return strtolower(trim((string) $email)); }
function valid_email(string $e): bool { return strlen($e) <= 200 && (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $e); }
function has_password(): bool { $c = config(); return $c['admin_password'] !== '' && valid_email(tidy($c['admin_email'])); }
function ready(): bool { $c = config(); return $c['github_token'] !== '' && $c['github_repo'] !== ''; }
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

/* ---------------- GitHub: where the content is kept (mirrors server/github.mjs) ---------------- */

function repo_path(string $p): string
{
    $dir = trim((string) config()['github_dir'], '/');
    return ltrim(($dir !== '' ? $dir . '/' : '') . $p, '/');
}
function api_base(): string
{
    $c = config();
    return rtrim((string) $c['github_api'], '/') . '/repos/' . $c['github_repo'];
}
function contents_url(string $p): string
{
    return api_base() . '/contents/' . implode('/', array_map('rawurlencode', explode('/', repo_path($p))));
}
/** @return array{0:int,1:string} */
function gh(string $url, string $method = 'GET', ?array $body = null, bool $raw = false): array
{
    $ch = curl_init($url);
    $headers = [
        'Authorization: Bearer ' . config()['github_token'],
        'Accept: ' . ($raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json'),
        'X-GitHub-Api-Version: 2022-11-28',
        'User-Agent: aknova-admin',
    ];
    if ($body !== null) $headers[] = 'Content-Type: application/json';
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_SLASHES));
    $out = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    if ($out === false || $status === 0) throw new StoreError('GitHub could not be reached. Try again in a moment.');
    if ($status === 404) return [404, ''];
    if ($status === 401 || $status === 403) throw new StoreError('GitHub refused the access token. Check that github_token in aknova-config.php is current and has "Contents: read and write" on the repository.');
    if ($status === 409 || $status === 422) throw new StoreError('The content changed somewhere else while you were editing. Reload the admin panel and try again.');
    if ($status >= 400) throw new StoreError("GitHub answered with an error ($status). Try again in a moment.");
    return [$status, (string) $out];
}
function branch(): string { return (string) config()['github_branch']; }
function sha_of(string $p): ?string
{
    [$s, $out] = gh(contents_url($p) . '?ref=' . rawurlencode(branch()));
    if ($s === 404) return null;
    $sha = json_decode($out, true)['sha'] ?? null;
    return is_string($sha) ? $sha : null;
}
function put_file(string $p, string $bytes, string $message): void
{
    $body = ['message' => $message, 'branch' => branch(), 'content' => base64_encode($bytes)];
    $sha = sha_of($p);
    if ($sha) $body['sha'] = $sha;
    [$s] = gh(contents_url($p), 'PUT', $body);
    if ($s === 404) throw new StoreError('The repository ' . config()['github_repo'] . ' or its branch ' . branch() . ' was not found. Check github_repo and github_branch.');
}
function read_content(?string $ref = null): array
{
    [$s, $out] = gh(contents_url(SITE_FILE) . '?ref=' . rawurlencode($ref ?? branch()), 'GET', null, true);
    if ($s === 404) throw new StoreError('content/site.json was not found in ' . config()['github_repo'] . '. Check github_repo, github_branch and github_dir.');
    $data = json_decode($out, true);
    if (!is_array($data)) throw new StoreError('content/site.json in the repository could not be read.');
    return $data;
}
function write_content(array $data, string $message = 'Update site content from the admin panel'): void
{
    put_file(SITE_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n", $message);
}
function looks_right($d): bool
{
    if (!is_array($d) || ($d !== [] && array_is_list($d)) || !is_array($d['site'] ?? null) || !is_array($d['pages'] ?? null) || !array_is_list($d['pages'])) return false;
    foreach ($d['pages'] as $p) if (is_array($p) && ($p['path'] ?? null) === '/') return true;
    return false;
}
function backups(): array
{
    $url = api_base() . '/commits?sha=' . rawurlencode(branch()) . '&path=' . rawurlencode(repo_path(SITE_FILE)) . '&per_page=31';
    [$s, $out] = gh($url);
    $list = $s === 404 ? [] : (json_decode($out, true) ?: []);
    return array_map(fn ($c) => [
        'name' => $c['sha'],
        'time' => (strtotime($c['commit']['committer']['date'] ?? $c['commit']['author']['date'] ?? '') ?: 0) * 1000,
    ], array_slice(is_array($list) ? $list : [], 1));
}
function ext_of(string $name): string { return strtolower(pathinfo($name, PATHINFO_EXTENSION)); }
function kind(string $name): string { return explode('/', TYPES[ext_of($name)] ?? '')[0]; }
function media(): array
{
    [$s, $out] = gh(contents_url(UPLOAD_DIR) . '?ref=' . rawurlencode(branch()));
    $list = $s === 404 ? [] : (json_decode($out, true) ?: []);
    $files = [];
    foreach (is_array($list) && array_is_list($list) ? $list : [] as $f) {
        if (($f['type'] ?? '') !== 'file' || !in_array(ext_of($f['name']), UPLOADS, true)) continue;
        $files[] = ['name' => $f['name'], 'url' => '/uploads/' . $f['name'], 'size' => $f['size'], 'time' => 0, 'type' => kind($f['name'])];
    }
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

/* ---------------- an upload that is newer than the last rebuild ---------------- */

function not_found(): void
{
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
}
function serve_upload(string $name): void
{
    $name = basename($name);
    $ext = ext_of($name);
    if ($name === '' || $name[0] === '.' || !in_array($ext, UPLOADS, true) || !ready()) {
        not_found();
        return;
    }
    [$s, $bytes] = gh(contents_url(UPLOAD_DIR . '/' . $name) . '?ref=' . rawurlencode(branch()), 'GET', null, true);
    if ($s === 404) {
        not_found();
        return;
    }
    header('Content-Type: ' . TYPES[$ext]);
    header('Content-Length: ' . strlen($bytes));
    header('Cache-Control: public, max-age=300');
    header('X-Content-Type-Options: nosniff');
    // An uploaded SVG opened on its own must not be able to run scripts.
    if ($ext === 'svg') header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox");
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') echo $bytes;
}

/* ---------------- the API ---------------- */

function api(string $method, string $path): void
{
    $is = fn (string $m, string $p) => $method === $m && $path === $p;
    $c = config();

    if ($is('GET', '/api/admin/me')) {
        $in = has_password() && signed_in();
        $me = [
            'stuck' => !ready(), 'remote' => true, 'maxUpload' => upload_limit(), 'hasPassword' => has_password(),
            'needsEmail' => false, 'canSetup' => false, 'signedIn' => $in, 'fixed' => true,
        ];
        if ($in) $me['email'] = tidy($c['admin_email']);
        answer(200, $me);
    }
    if (!ready()) fail(503, 'This host has nowhere to save yet. Fill in github_token and github_repo in aknova-config.php.');
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
        answer(200, ['ok' => true]);
    }
    if ($is('GET', '/api/backups')) answer(200, backups());
    if ($is('POST', '/api/backups/restore')) {
        $name = (string) (body_json()['name'] ?? '');
        if (!preg_match('/^[0-9a-f]{40}$/', $name)) fail(404, 'That saved version no longer exists.');
        $data = read_content($name);
        if (!looks_right($data)) fail(400, 'That saved version is damaged.');
        write_content($data, 'Restore an earlier version from the admin panel');
        answer(200, $data);
    }
    if ($is('GET', '/api/media')) answer(200, media());
    if ($is('POST', '/api/media')) {
        $name = safe_name((string) ($_GET['name'] ?? ''), array_column(media(), 'name'));
        if ($name === null) fail(400, 'That kind of file cannot be uploaded. Use .' . implode(', .', UPLOADS) . '.');
        $limit = upload_limit();
        $bytes = file_get_contents('php://input', false, null, 0, $limit + 1);
        if ($bytes === false || $bytes === '') fail(400, 'The upload did not finish. Try again.');
        if (strlen($bytes) > $limit) fail(413, 'That file is larger than ' . round($limit / 1048576) . ' MB.');
        put_file(UPLOAD_DIR . '/' . $name, $bytes, "Add $name from the admin panel");
        answer(200, ['name' => $name, 'url' => "/uploads/$name", 'size' => strlen($bytes), 'time' => time() * 1000, 'type' => kind($name)]);
    }
    if ($is('DELETE', '/api/media')) {
        $name = basename((string) ($_GET['name'] ?? ''));
        $sha = $name !== '' ? sha_of(UPLOAD_DIR . '/' . $name) : null;
        if (!$sha) fail(404, 'That file is not in the library.');
        gh(contents_url(UPLOAD_DIR . '/' . $name), 'DELETE', ['message' => "Remove $name from the admin panel", 'branch' => branch(), 'sha' => $sha]);
        answer(200, ['ok' => true]);
    }
    fail(404, 'Not found.');
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$path = '/' . ltrim((string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH), '/');
try {
    if (str_starts_with($path, '/uploads/')) {
        serve_upload(rawurldecode(substr($path, 9)));
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
