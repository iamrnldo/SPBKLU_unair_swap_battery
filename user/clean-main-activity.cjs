const fs = require('fs');
const path = require('path');

function findMainActivity(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const found = findMainActivity(fullPath);
      if (found) return found;
    } else if (file === 'MainActivity.java') {
      return fullPath;
    }
  }
  return null;
}

const javaDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'java');
const mainActivityPath = findMainActivity(javaDir);

if (!mainActivityPath) {
  console.log('❌ File MainActivity.java tidak ditemukan.');
  process.exit(1);
}

try {
  // Read package name from the file
  const fileContent = fs.readFileSync(mainActivityPath, 'utf8');
  const packageLine = fileContent.split('\n').find(line => line.trim().startsWith('package '));
  const packageName = packageLine ? packageLine.trim() : 'package com.spbklu.userapp;';

  // Standard clean MainActivity.java for Capacitor 6
  const cleanContent = `${packageName}

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
`;

  fs.writeFileSync(mainActivityPath, cleanContent, 'utf8');
  console.log('✅ BERHASIL: MainActivity.java telah dikembalikan ke kondisi bersih/default Capacitor 6!');
} catch (error) {
  console.error('❌ Gagal membersihkan MainActivity.java:', error.message);
}
