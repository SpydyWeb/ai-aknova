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

    // The MySQL database that holds the site content. Create it in cPanel > MySQL Databases,
    // add a user to it with ALL PRIVILEGES, and copy the names here. The table is made on first use.
    'db_host' => 'localhost',
    'db_name' => '',
    'db_user' => '',
    'db_pass' => '',

    // Optional. After each save, GitHub rebuilds the pages so search engines see the new text.
    // A fine-grained token on this one repository with "Actions: read and write".
    'github_token' => '',
    'github_repo' => 'SpydyWeb/ai-aknova',
    'github_branch' => 'main',
];
