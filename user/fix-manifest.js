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
    fs.writeFileSync(manifestPath, content, 'utf8');
    console.log('✅ BERHASIL: usesCleartextTraffic="true" telah otomatis ditambahkan ke AndroidManifest.xml!');
  }
} catch (error) {
  console.error('❌ Gagal mengubah AndroidManifest.xml:', error.message);
}
