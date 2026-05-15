async function test() {
  const backendUrl = 'http://localhost:4000';
  
  console.log('Testing /api/v1/study-plan-tree (singular)...');
  try {
    const res = await fetch(`${backendUrl}/api/v1/study-plan-tree`);
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Data modules length:', json.data?.modules?.length || 0);
    if (json.data) {
      console.log('Plan title:', json.data.title);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
