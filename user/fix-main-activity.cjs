const fs = require('fs');
const path = require('path');

const mainActivityPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'java', 'com', 'spbklu', 'userapp', 'MainActivity.java');

if (!fs.existsSync(mainActivityPath)) {
  console.log('❌ File MainActivity.java belum ada. Silakan jalankan "npm run build" lalu "npx cap add android" terlebih dahulu.');
  process.exit(1);
}

try {
  let content = fs.readFileSync(mainActivityPath, 'utf8');

  // Check if GoogleAuth import is already present
  if (content.includes('com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth')) {
    console.log('ℹ️ GoogleAuth sudah terdaftar secara manual di MainActivity.java.');
  } else {
    // 1. Inject import statement
    const importStatement = 'import com.getcapacitor.BridgeActivity;';
    const importWithGoogleAuth = `${importStatement}\nimport com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth;\nimport android.os.Bundle;`;
    content = content.replace(importStatement, importWithGoogleAuth);

    // 2. Inject onCreate and registerPlugin
    const classOpening = 'public class MainActivity extends BridgeActivity {}';
    const classWithRegistration = `public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(GoogleAuth.class);
    }
}`;
    
    // Fallback if class has a body or is slightly different
    if (content.includes('public class MainActivity extends BridgeActivity {') && !content.includes('registerPlugin')) {
      const targetPattern = 'public class MainActivity extends BridgeActivity {';
      const replacement = `public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(GoogleAuth.class);
    }
`;
      content = content.replace(targetPattern, replacement);
    } else {
      content = content.replace(classOpening, classWithRegistration);
    }

    fs.writeFileSync(mainActivityPath, content, 'utf8');
    console.log('✅ BERHASIL: GoogleAuth plugin telah diregistrasikan secara manual di MainActivity.java!');
  }
} catch (error) {
  console.error('❌ Gagal mengubah MainActivity.java:', error.message);
}
