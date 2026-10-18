# Meme'd Campaign Payout Tracker

A full-stack web application for managing influencer marketing campaigns, tracking creator submissions, and calculating payouts based on view milestones while enforcing campaign budget limits.

## Live Demo

- **Frontend:** https://memed-payout-frontend.vercel.app/
- **Backend:** https://memed-payout-backend.onrender.com

The backend may take a little time to respond after inactivity because it runs on Render's free plan.

## Features

### Authentication
- Brand and creator signup and login.
- Password hashing with bcrypt.
- JWT-based authentication and role-based authorization.

### Brand Dashboard
- Create Instagram and YouTube campaigns.
- Configure campaign budgets and view-based payout milestones.
- Track campaign spending and remaining budget.
- View campaigns even after their budgets are exhausted.

### Creator Dashboard
- Browse campaigns with available budgets.
- Submit social media post URLs.
- Track submission views and calculated payouts.

### Payout Management
- Calculate the highest eligible milestone payout.
- Pay only the additional amount when a creator reaches a higher milestone.
- Prevent payouts from exceeding the remaining campaign budget.
- Avoid duplicate payouts when the same view count is submitted repeatedly.
- Update submission and campaign budget data within a database transaction.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB Atlas, Mongoose
- **Authentication:** JWT, bcrypt
- **Testing:** Jest, ts-jest

## Project Structure

```text
memed-payout-tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── app/
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js and npm
- A MongoDB database
- Git

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/pragatisaste0021/memed-payout-tracker
cd memed-payout-tracker
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and fill in your MongoDB credentials and a strong JWT secret.

Example environment variables:

```dotenv
PORT=5000
MONGODB_USERNAME=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password
MONGODB_CLUSTER=your_cluster.mongodb.net
MONGODB_DATABASE=memed_payout_tracker
JWT_SECRET=your_private_random_secret
```

Start the backend:

```bash
npm run dev
```

The backend runs on `http://localhost:5000`.

### 3. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `.env.local` using `.env.example` as a reference:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/campaigns` | List campaigns based on user role |
| POST | `/api/campaigns` | Create a campaign (brand only) |
| POST | `/api/submissions` | Submit a post (creator only) |
| GET | `/api/submissions/mine` | List the creator's submissions |
| PATCH | `/api/submissions/:id/views` | Update views and recalculate payout |

Protected endpoints require a bearer JWT unless otherwise configured by the API.

## Payout Logic

Each campaign defines milestones containing a view threshold and a payout amount.

For example:

| Views |  Eligible total payout |
|---:   |     ---:|
| 100   |     10 |
| 500   |     40 |
| 1,000 |     75 |

If a submission reaches 500 views, its eligible total payout is 40. If the submission previously earned 10, only an additional 30 is paid.

The additional payout is calculated as:

```text
additionalEligiblePayout =
    max(0, eligiblePayout - existingPayout)

actualAdditionalPayout =
    min(additionalEligiblePayout, remainingBudget)
```

The campaign's spent and remaining budget values are updated along with the submission's payout.

## Business Rules and Edge-Case Decisions

### 1. Multiple milestones crossed in a single update

When a submission's view count crosses multiple milestones in one update, the system uses the highest eligible milestone payout rather than adding the payouts of every crossed milestone.

For example, if the milestones are 100 views → 10 and 500 views → 40, a submission that jumps directly to 600 views has an eligible total payout of 40, not 50.

This avoids double-counting milestone rewards.

### 2. Campaign budget exhausted during a payout

If the eligible additional payout exceeds the campaign's remaining budget, the system pays only the remaining amount.

For example, if the eligible additional payout is 40 but the campaign has only 15 remaining, the actual additional payout is 15. The campaign's remaining budget becomes zero, and it is no longer available for new creator submissions.

### 3. Repeated view updates

When the same view count is submitted repeatedly, the system does not pay the same milestone reward again. It calculates the difference between the eligible total payout and the submission's existing payout before applying the remaining-budget cap.

### 4. Payout accounting

The submission payout represents the cumulative amount allocated to that submission, while the campaign's spent amount tracks the total budget allocated across submissions. Campaign spending must never exceed the campaign budget.

### 5. Concurrent Payout Updates

Payout updates run inside a MongoDB transaction so that submission payout changes and campaign budget changes are committed together. Campaign budget updates use a conditional atomic update that checks whether sufficient budget remains before allocating a payout.

When concurrent requests compete for the same campaign budget, the transaction and conditional atomic update help prevent overspending. A request may fail because of a temporary database conflict; the client can retry it. Repeating the same view count does not allocate the same milestone payout twice.

### 6. Payout Testing

The payout logic was tested with the following scenarios:

- **Budget cap:** An eligible payout was limited to the campaign's remaining budget.
- **Concurrent requests:** Two submissions competed for a campaign budget of 15. The combined payout was 15, and the remaining budget became zero.
- **Repeated updates:** Sending the same view count twice did not allocate the same milestone payout again.
- **Increasing view counts:** Updating a submission from 500 to 1,000 views increased its cumulative payout from 40 to 75, allocating only the additional 35.

These tests validate the scenarios described above but do not guarantee correctness under every possible concurrency condition.

## Testing

Run the backend unit tests:

```bash
cd backend
npm test
```

Compile the backend TypeScript:

```bash
npm run build
```

The payout utility tests cover milestone selection, incremental payouts, budget limits, repeated updates, and exhausted budgets.

## Security Notes

- Never commit `.env` or `.env.local` files.
- Use strong secrets and restrict database access.
- Validate and authorize all protected API operations.
- The current frontend stores its JWT in session storage for this assignment demo. A production deployment should consider secure HttpOnly cookies and additional security controls.
- View counts are updated through an API endpoint for simulation; they are not independently verified against Instagram or YouTube.

## Future Improvements

- Integrate Instagram and YouTube APIs to verify actual post views.
- Add campaign analytics and payout history.
- Add integration tests for concurrent payout requests.
- Add rate limiting and monitoring for production use.
