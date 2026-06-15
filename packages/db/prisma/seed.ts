import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const activities = [
  // Travel
  {
    title: 'Weekend Road Trip to a New Town',
    description:
      'Pick a town within a few hours drive that neither of you has visited. Explore local shops, try a new restaurant, and find one unexpected attraction.',
    category: 'Travel',
    difficulty: 'EASY' as const,
    estimatedDuration: '2 days',
  },
  {
    title: 'International Cooking Vacation',
    description:
      'Book a week-long trip centered around a cooking school abroad — Tuscany, Oaxaca, or Thailand. Learn regional techniques and bring recipes home.',
    category: 'Travel',
    difficulty: 'CHALLENGING' as const,
    estimatedDuration: '7 days',
  },
  // Fitness
  {
    title: 'Couples Morning Walk Challenge',
    description:
      'Commit to a 30-day streak of morning walks together. Track your distance and gradually increase pace or length each week.',
    category: 'Fitness',
    difficulty: 'EASY' as const,
    estimatedDuration: '30 days',
  },
  {
    title: 'Learn Partner Dancing',
    description:
      'Sign up for a beginner ballroom, salsa, or swing dance class series. Great cardio and a new shared skill you can use anywhere.',
    category: 'Fitness',
    difficulty: 'MODERATE' as const,
    estimatedDuration: '8 weeks',
  },
  // Creative
  {
    title: 'Watercolor Painting Date Nights',
    description:
      'Set up a weekly painting session at home. Follow along with a tutorial or paint the same subject side by side, then compare your interpretations.',
    category: 'Creative',
    difficulty: 'EASY' as const,
    estimatedDuration: '2 hours',
  },
  {
    title: 'Write and Record a Podcast Episode',
    description:
      'Pick a topic you both care about — your story, a hobby, life lessons — and produce one polished podcast episode together from script to final edit.',
    category: 'Creative',
    difficulty: 'CHALLENGING' as const,
    estimatedDuration: '2 weeks',
  },
  // Social
  {
    title: 'Host a Themed Dinner Party',
    description:
      'Invite friends for a themed dinner — a decade, a country, a color. Cook together, decorate, and create a playlist that matches the theme.',
    category: 'Social',
    difficulty: 'MODERATE' as const,
    estimatedDuration: '1 day',
  },
  {
    title: 'Start a Couples Book Club',
    description:
      'Recruit two or three other couples and pick a book each month. Rotate hosting duties and pair each discussion with a meal.',
    category: 'Social',
    difficulty: 'EASY' as const,
    estimatedDuration: 'Ongoing',
  },
  // Learning
  {
    title: 'Learn a Language Together',
    description:
      'Choose a language and commit to daily 20-minute practice sessions. Use apps, flashcards, or a tutor — quiz each other over dinner.',
    category: 'Learning',
    difficulty: 'CHALLENGING' as const,
    estimatedDuration: '6 months',
  },
  {
    title: 'Take an Online Course as a Pair',
    description:
      'Find a course on astronomy, history, philosophy, or photography. Watch lectures together and discuss what you learned on your evening walks.',
    category: 'Learning',
    difficulty: 'MODERATE' as const,
    estimatedDuration: '6 weeks',
  },
  // Outdoor
  {
    title: 'Sunrise Hike at a State Park',
    description:
      'Wake up early and hit a local trail in time for sunrise. Pack coffee and breakfast to enjoy at the summit or a scenic overlook.',
    category: 'Outdoor',
    difficulty: 'MODERATE' as const,
    estimatedDuration: '4 hours',
  },
  {
    title: 'Multi-Day Backpacking Trip',
    description:
      'Plan a 3-day backcountry route with overnight camping. Requires gear prep, fitness, and navigation — a true team adventure.',
    category: 'Outdoor',
    difficulty: 'EXTREME' as const,
    estimatedDuration: '3 days',
  },
  {
    title: 'Build a Backyard Garden',
    description:
      'Design and build raised beds together. Choose vegetables, herbs, or flowers and tend them through the season — harvest dinner ingredients by summer.',
    category: 'Outdoor',
    difficulty: 'MODERATE' as const,
    estimatedDuration: '1 season',
  },
  // Culinary
  {
    title: 'Master Homemade Pasta',
    description:
      'Spend an afternoon learning to make fresh pasta from scratch — fettuccine, ravioli, or filled tortellini. Pair with a homemade sauce and good wine.',
    category: 'Culinary',
    difficulty: 'MODERATE' as const,
    estimatedDuration: '3 hours',
  },
  {
    title: 'Fermentation Project',
    description:
      'Start a fermentation hobby together — sourdough, kombucha, kimchi, or hot sauce. Track your experiments and refine recipes over weeks.',
    category: 'Culinary',
    difficulty: 'CHALLENGING' as const,
    estimatedDuration: '4 weeks',
  },
  // Wellness
  {
    title: 'Morning Meditation Practice',
    description:
      'Begin each day with a 10-minute guided meditation together. Start with an app and build toward unguided sessions over 30 days.',
    category: 'Wellness',
    difficulty: 'EASY' as const,
    estimatedDuration: '30 days',
  },
  {
    title: 'Digital Detox Weekend',
    description:
      'Spend an entire weekend screen-free. Plan analog activities in advance — board games, cooking, reading aloud, long walks, and conversation.',
    category: 'Wellness',
    difficulty: 'MODERATE' as const,
    estimatedDuration: '2 days',
  },
  {
    title: 'Couples Yoga Challenge',
    description:
      'Follow a 30-day partner yoga program. Build flexibility, trust, and a daily routine that keeps you both grounded and connected.',
    category: 'Wellness',
    difficulty: 'MODERATE' as const,
    estimatedDuration: '30 days',
  },
]

async function main() {
  console.log('Seeding database...')

  // Clear system-seeded activities (those not submitted by a user)
  const deleted = await prisma.activity.deleteMany({
    where: { submittedById: null },
  })
  console.log(`Cleared ${deleted.count} existing system activities.`)

  // Seed activities
  const created = await prisma.activity.createMany({
    data: activities.map((a) => ({
      title: a.title,
      description: a.description,
      category: a.category,
      difficulty: a.difficulty,
      estimatedDuration: a.estimatedDuration,
      status: 'APPROVED' as const,
      submittedById: null,
    })),
  })
  console.log(`Seeded ${created.count} activities.`)

  console.log('Seeding complete.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
