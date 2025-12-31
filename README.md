
# KDS QwikPlan 🚀

A next-generation AI-powered Marketing Strategy Generator built for modern creators and businesses. This application leverages the power of AI to generate comprehensive marketing plans in seconds based on niche, audience, platform, and goals.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-3ECFF8?logo=supabase&logoColor=white)

## 🌟 Features

-   **AI-Powered Strategy Generation:** Instantly creates marketing plans using advanced AI logic.
-   **User Authentication:** Secure sign-up and login system using Supabase Auth.
-   **Usage Tracking & Limits:** Built-in dashboard to monitor monthly credit usage (Free Tier: 10 credits).
-   **Responsive UI:** Beautiful, mobile-first design built with Tailwind CSS.
-   **Interactive Components:** Includes Toast notifications, Result Modals, and Welcome Animations.
-   **Smart Filtering:** Generate strategies tailored for Instagram, Facebook, LinkedIn, or Twitter.

## 🛠 Tech Stack

-   **Frontend:** Next.js 14 (App Router), React
-   **Styling:** Tailwind CSS
-   **Backend/Database:** Supabase (PostgreSQL & Auth)
-   **Icons:** Lucide React (implied usage of icons)

## 📸 Screenshots

<!-- Add screenshots here if you have them -->
<!-- 
![Dashboard](/path/to/screenshot.png) 
-->

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js installed on your machine.
-   A Supabase project (Create one at [supabase.com](https://supabase.com)).
-   An OpenAI API Key (Optional, if your API backend requires it).

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/seenuraj2007/kds_qwikplan.git
    ```

2.  **Install NPM packages**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Run the Development Server**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```bash
kds_qwikplan/
├── app/
│   ├── components/       # Reusable components (UsageCard, ResultModal)
│   ├── dashboard/        # Main dashboard page
│   └── layout.tsx        # Root layout
├── public/               # Static assets
├── .env.local            # Environment variables
└── README.md
```

## ⚙️ API Routes

The application uses a secure API route (`/api/generate`) to handle generation requests. It validates the user's session via the Authorization header before deducting usage credits.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👤 Author

**Seenuraj2007** - [GitHub](https://github.com/seenuraj2007)
