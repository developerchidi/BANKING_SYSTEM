const fs = require('fs');
const path = require('path');

// Disable Hermes in Android build.gradle
const androidBuildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (fs.existsSync(androidBuildGradlePath)) {
  let buildGradleContent = fs.readFileSync(androidBuildGradlePath, 'utf8');
  buildGradleContent = buildGradleContent.replace(
    /enableHermes:\s*true/g,
    'enableHermes: false'
  );
  fs.writeFileSync(androidBuildGradlePath, buildGradleContent);
  console.log('✅ Disabled Hermes in Android build.gradle');
}

// Set JSC engine in app.json
const appJsonPath = path.join(__dirname, '..', 'app.json');
if (fs.existsSync(appJsonPath)) {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  appJson.expo.jsEngine = 'jsc';
  if (appJson.expo.android) {
    appJson.expo.android.jsEngine = 'jsc';
    appJson.expo.android.enableHermes = false;
  }
  if (appJson.expo.ios) {
    appJson.expo.ios.jsEngine = 'jsc';
  }
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
  console.log('✅ Set JSC engine in app.json');
}

console.log('🎉 Hermes has been disabled successfully!'); 