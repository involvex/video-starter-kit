console.log("Testing various Electron module paths:");

async function testPaths() {
  // Test different module paths
  const testPaths = [
    "electron",
    "electron/main",
    "electron/main/api",
    "electron/main/api/app",
    "electron/renderer",
    "electron/common",
    "electron/common/api",
    "electron/common/api/app",
  ];

  for (const path of testPaths) {
    try {
      const module = await import(path);
      console.log(`${path}:`, {
        type: typeof module,
        hasDefault: "default" in module,
        defaultType: typeof module.default,
        keys: Object.keys(module).slice(0, 5),
        defaultKeys: Object.keys(module.default || {}).slice(0, 5),
      });
    } catch (error) {
      console.log(`${path}: ERROR - ${error.message}`);
    }
  }

  console.log("Done testing paths");
}

testPaths().catch(console.error);
