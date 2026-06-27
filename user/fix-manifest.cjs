const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.log('❌ File AndroidManifest.xml belum ada. Silakan jalankan "npm run build" lalu "npx cap add android" terlebih dahulu.');
  process.exit(1);
}

try {
  let content = fs.readFileSync(manifestPath, 'utf8');

  // Check if usesCleartextTraffic is already present
  if (content.includes('android:usesCleartextTraffic')) {
    console.log('ℹ️ android:usesCleartextTraffic sudah terkonfigurasi di AndroidManifest.xml.');
  } else {
    // Inject android:usesCleartextTraffic="true" inside <application ...> tag
    const searchPattern = '<application';
    const replacement = '<application\n        android:usesCleartextTraffic="true"';

    content = content.replace(searchPattern, replacement);
    console.log('✅ BERHASIL: usesCleartextTraffic="true" telah otomatis ditambahkan ke AndroidManifest.xml!');
  }

  const requiredPermissions = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION'
  ];

  requiredPermissions.forEach((permission) => {
    if (content.includes(`android:name="${permission}"`)) {
      console.log(`ℹ️ Permission ${permission} sudah terkonfigurasi di AndroidManifest.xml.`);
      return;
    }

    const permissionLine = `    <uses-permission android:name="${permission}" />\n`;
    if (content.includes('</manifest>')) {
      content = content.replace('</manifest>', `${permissionLine}</manifest>`);
      console.log(`✅ BERHASIL: Permission ${permission} telah ditambahkan ke AndroidManifest.xml!`);
    }
  });

  fs.writeFileSync(manifestPath, content, 'utf8');
} catch (error) {
  console.error('❌ Gagal mengubah AndroidManifest.xml:', error.message);
}
