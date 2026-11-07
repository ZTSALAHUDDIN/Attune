Attune – Emotion-Based Learning Companion

An AI-powered learning companion that makes online learning more interactive and personalized through facial-expression analysis, intelligent study assistance, and progress tracking.

Overview

Attune brings learning assistance, self-assessment, motivation, and revision together in one platform. It helps students understand difficult concepts, evaluate their knowledge, maintain productive study habits, and track their learning progress.

Features

* Facial-Expression Analysis: Uses MediaPipe to analyze facial-expression patterns locally in the browser and provide contextual study suggestions.
* AI Study Tutor: Provides AI-powered explanations and assistance for difficult concepts using Gemini API.
* Smart Quiz Generation: Generates MCQs from available YouTube video transcripts.
* Personalized Recommendations: Suggests study breaks, AI tutor support, alternative learning resources, and motivational encouragement.
* Pomodoro Timer: Supports customizable focus and break intervals.
* Spaced Repetition: Schedules incorrectly answered questions for future revision using the SM-2 algorithm.
* Learning Dashboard: Tracks study duration, quiz performance, expression summaries, and daily streaks.
* Motivational Sticky Notes: Allows students to create and save personalized motivational reminders.

Tech Stack

Category	Technologies
Frontend	React 19, TypeScript
Framework	TanStack Start
Routing	TanStack Router
Data Fetching	TanStack Query
Styling	Tailwind CSS
Computer Vision	MediaPipe Tasks Vision
Generative AI	Gemini API, Vercel AI SDK
Backend & Database	Supabase, PostgreSQL
Validation	Zod
Video Integration	YouTube IFrame API

How It Works

1. Students log in and start a study session.
2. They select an educational YouTube video.
3. Attune attempts to retrieve the video’s available transcript.
4. Gemini generates quizzes based on the retrieved content.
5. MediaPipe analyzes facial-expression patterns locally in the browser.
6. The recommendation engine provides contextual study suggestions.
7. Quiz results and session details are saved to Supabase.
8. Students monitor their progress and revise incorrect answers through the dashboard.

Privacy

* Facial-expression analysis is performed locally in the browser.
* Webcam frames are not uploaded to the server or recorded.
* Camera access requires user permission.
* Learning data is stored using Supabase with authentication and Row-Level Security.

Getting Started

Prerequisites

* Node.js
* npm
* Supabase account
* Gemini API key

Installation

1. Clone the repository:

git clone https://github.com/ZTSALAHUDDIN/Attune.git

2. Navigate to the project directory:

cd Attune

3. Install dependencies:

npm install

4. Configure the required environment variables in a .env file using the variable names expected by the application.
5. Start the development server:

npm run dev

6. Open the local development URL displayed in your terminal.

Future Enhancements

* Adaptive quiz difficulty based on learning performance.
* More personalized study recommendations.
* Enhanced learning analytics.
* Improved expression-analysis accuracy through validation and evaluation.

Acknowledgements

Built using React, MediaPipe, Gemini API, and Supabase to explore AI-powered personalized education.
