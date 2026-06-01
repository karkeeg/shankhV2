const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const JWT_SECRET = "karkee6046";

async function main() {
  const users = await prisma.user.findMany({ take: 1 });
  if (users.length === 0) {
    console.log("No users found in database.");
    return;
  }
  const user = users[0];
  console.log("User:", user.email, "ID:", user.id);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  console.log("Generated token:", token);

  const lessonId = "7bb05451-c448-4b59-b77a-38fb40815724";

  // Let's test the endpoint via local http request
  const url = `http://localhost:4000/api/v1/activities/${lessonId}`;
  console.log("Fetching url:", url);
  try {
    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    console.log("HTTP status:", res.status);
    const text = await res.text();
    console.log("HTTP response body:", text);
  } catch (err) {
    console.error("HTTP request failed:", err.message);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
