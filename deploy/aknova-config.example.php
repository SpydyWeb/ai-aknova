<?php
// Settings for the admin panel's API (public/api/index.php) on PHP hosting.
//
// Put a copy named aknova-config.php ONE FOLDER ABOVE the website folder, so the web can never
// read it. On MilesWeb that is your home folder:
//
//   ~/aknova-config.php        <- this file, filled in
//   ~/aknovatech.com/          <- the website (index.html, api/, assets/ ...)
//
// Never commit the filled-in copy.
return [
    // What you sign in to /admin with.
    'admin_email' => '',
    // Either the password itself, or (better) a hash of it made with:
    //   php -r 'echo password_hash("your password", PASSWORD_DEFAULT), PHP_EOL;'
    // Changing it signs every device out.
    'admin_password' => '',

    // A fine-grained GitHub token with "Contents: read and write" on this one repository only.
    // Each save in the admin panel becomes a commit, and GitHub rebuilds and uploads the site.
    'github_token' => '',
    'github_repo' => 'SpydyWeb/ai-aknova',
    'github_branch' => 'main',
];
