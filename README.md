# ByteLearn

**Reels-style micro-learning for AI and technology.**

ByteLearn turns technical concepts into short, animated, swipeable lessons.

## MVP

- Vertical Reels-style learning feed
- Animated scenes instead of prerecorded videos
- AI, programming, cloud and system-design lessons
- Interactive quizzes and XP
- Likes and saved lessons
- Search and topic exploration
- Daily streaks
- Local persistence for the prototype
- Premium/paywall-ready profile

## Run

Requires Node.js 20+.

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go.

## Production roadmap

1. Supabase Auth + database
2. Remote lesson CMS
3. Analytics
4. AdMob for free users
5. Google Play Billing for ByteLearn Pro
6. EAS Android builds and Play Store release

The repository is intentionally free of secrets. Copy `.env.example` to your local environment and add your own credentials.
