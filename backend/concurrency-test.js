// const API_URL = "http://localhost:5000/api";

// // Fill in your creator's JWT and the two submission IDs.
// const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWQwOGUzNWZlYjUyNzhhNTZjOGQ0ZjciLCJyb2xlIjoiY3JlYXRvciIsImlhdCI6MTc5MjA1Mzc0NSwiZXhwIjoxNzkyMTQwMTQ1fQ.pWuoYxu74hhY-pn8u3LtQ40LcVdLEBiuzdlc6tUJNWY";
// const SUBMISSION_A = "6ad08e48feb5278a56c8d500";
// const SUBMISSION_B = "6ad08e5afeb5278a56c8d50d";

// async function updateViews(id) {
//   const response = await fetch(`${API_URL}/submissions/${id}/views`, {
//     method: "PATCH",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${TOKEN}`,
//     },
//     body: JSON.stringify({ views: 100 }),
//   });

//   return {
//     submissionId: id,
//     status: response.status,
//     body: await response.json(),
//   };
// }

// async function main() {
//   // Start both requests without waiting for either to finish.
//   const results = await Promise.all([
//     updateViews(SUBMISSION_A),
//     updateViews(SUBMISSION_B),
//   ]);

//   console.log(JSON.stringify(results, null, 2));
// }

// main().catch(console.error);


const API_URL = "http://localhost:5000/api";

// Use your fresh creator JWT and the submission that received the payout.
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2YWQwOGUzNWZlYjUyNzhhNTZjOGQ0ZjciLCJyb2xlIjoiY3JlYXRvciIsImlhdCI6MTc5MjA1Mzc0NSwiZXhwIjoxNzkyMTQwMTQ1fQ.pWuoYxu74hhY-pn8u3LtQ40LcVdLEBiuzdlc6tUJNWY";
const SUBMISSION_ID = "6ad08e48feb5278a56c8d500";

async function updateViews() {
  const response = await fetch(
    `${API_URL}/submissions/${SUBMISSION_ID}/views`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ views: 100 }),
    }
  );

  return {
    status: response.status,
    body: await response.json(),
  };
}

async function main() {
  console.log("First update:");
  console.log(JSON.stringify(await updateViews(), null, 2));

  console.log("\nSecond update with the same view count:");
  console.log(JSON.stringify(await updateViews(), null, 2));
}

main().catch(console.error);