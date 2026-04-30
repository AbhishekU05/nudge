import { POST } from "./app/api/cron/send-reminders/route";

async function test() {
  const req = new Request("http://localhost:3000/api/cron/send-reminders", {
    method: "POST",
    headers: {
      "authorization": `Bearer OypNzWMlmld6L8r55PGPniBcUxZL6RgN77Z7+`
    }
  });

  const res = await POST(req);
  console.log(res.status);
  const json = await res.json();
  console.log(json);
}

test().catch(console.error);
