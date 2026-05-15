import fetch from 'node-fetch';

async function test() {
  const backendUrl = 'http://localhost:3001'; // Assuming it's 3001 or check from env
  try {
    const plansRes = await fetch(`${backendUrl}/api/v1/study-plans`);
    const plansJson = await plansRes.json();
    const plans = plansJson.data;
    if (!plans || plans.length === 0) {
      console.log('No plans found');
      return;
    }
    const targetPlan = plans[0];
    const treeRes = await fetch(`${backendUrl}/api/v1/study-plans/${targetPlan.id}/tree`);
    const treeJson = await treeRes.json();
    console.log(JSON.stringify(treeJson.data.modules[0], null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
