const fs = require('fs');
const path = require('path');

const stringsPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');

if (!fs.existsSync(stringsPath)) {
  console.log('❌ File strings.xml belum ada. Silakan jalankan "npm run build" lalu "npx cap add android" terlebih dahulu.');
  process.exit(1);
}

try {
  let content = fs.readFileSync(stringsPath, 'utf8');

  // Check if server_client_id is already present
  if (content.includes('server_client_id')) {
    console.log('ℹ️ server_client_id sudah terkonfigurasi di strings.xml.');
  } else {
    // Inject server_client_id inside <resources> tag
    const clientId = '58586788358-f5b1ig0vnnmp34mudo6j6ftrcmr00n0k.apps.googleusercontent.com';
    const searchPattern = '<resources>';
    const replacement = `<resources>\n    <string name="server_client_id">${clientId}</string>`;
    
    content = content.replace(searchPattern, replacement);
    fs.writeFileSync(stringsPath, content, 'utf8');
    console.log('✅ BERHASIL: server_client_id Google OAuth telah otomatis ditambahkan ke strings.xml!');
  }
} catch (error) {
  console.error('❌ Gagal mengubah strings.xml:', error.message);
}
