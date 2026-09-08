async function main() {
  console.log('🚀 Sending POST request to https://voxify.space/api/setup to run all SQL migrations on production...');
  try {
    const res = await fetch('https://voxify.space/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    console.log(`HTTP Status: ${res.status}`);
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Error triggering live setup:', err);
  }
}

main();
