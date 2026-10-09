// Production guard — must be the very first thing that runs, before dotenv
// or any database code, so there is zero chance of wiping production data.
if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: Seed script cannot run in a production environment.')
  process.exit(1)
}

require('dotenv').config()

const mongoose = require('mongoose')
const connectDB = require('../config/db')
const Startup = require('../models/Startup')

// 15 realistic sample startups.
// Coverage:
//   Industries:     Technology, Healthcare, Finance, Education, E-commerce,
//                   SaaS, Consumer, Deep Tech, Climate Tech, Other  (all 10)
//   Funding stages: Pre-seed, Seed, Series A, Series B+             (all 4)
const samples = [
  {
    name: 'NovaMed AI',
    tagline: 'AI-powered diagnostics for underserved communities',
    description:
      'NovaMed AI uses computer vision and machine learning to assist clinicians in low-resource settings with rapid, accurate diagnosis of infectious diseases and chronic conditions. Our mobile-first platform works offline and integrates with existing hospital workflows.',
    industry: 'Healthcare',
    fundingStage: 'Series A',
    fundingRequired: 4500000,
    location: 'Nairobi, Kenya',
    website: 'https://novamed.ai',
  },
  {
    name: 'ClearLedger',
    tagline: 'Real-time bookkeeping for freelancers and micro-businesses',
    description:
      'ClearLedger connects to bank accounts, card processors and invoicing tools to produce live profit-and-loss statements with no manual data entry. Tax export is one click. Built for business owners who are not accountants.',
    industry: 'Finance',
    fundingStage: 'Seed',
    fundingRequired: 1200000,
    location: 'Dublin, Ireland',
    website: 'https://clearledger.io',
  },
  {
    name: 'Learnly',
    tagline: 'Adaptive micro-courses for professional upskilling',
    description:
      'Learnly delivers 10-minute daily learning modules personalised to each user\'s skill gaps and career goals. Content is created by industry practitioners and continuously updated based on learner outcomes. Trusted by over 80 companies for employee development.',
    industry: 'Education',
    fundingStage: 'Series B+',
    fundingRequired: 12000000,
    location: 'Toronto, Canada',
    website: 'https://learnly.com',
  },
  {
    name: 'ShelfSync',
    tagline: 'Inventory intelligence for independent retailers',
    description:
      'ShelfSync combines IoT shelf sensors with demand forecasting to help independent shops eliminate stockouts and overstock. The platform integrates with major POS systems and provides weekly reorder recommendations via a simple dashboard.',
    industry: 'E-commerce',
    fundingStage: 'Pre-seed',
    fundingRequired: 350000,
    location: 'Manchester, UK',
    website: 'https://shelfsync.co',
  },
  {
    name: 'Orbita',
    tagline: 'Launch and iterate SaaS products in weeks, not months',
    description:
      'Orbita is a low-code platform for product teams to build, test and ship internal tools and customer-facing features without engineering bottlenecks. Visual workflows connect to any REST or GraphQL API. Built for agile teams of 5–50 people.',
    industry: 'SaaS',
    fundingStage: 'Seed',
    fundingRequired: 900000,
    location: 'Berlin, Germany',
    website: 'https://orbita.dev',
  },
  {
    name: 'Rootsy',
    tagline: 'Farm-to-door subscription boxes from local growers',
    description:
      'Rootsy partners with small-scale farmers within 150 km of each city to deliver weekly boxes of seasonal produce directly to households. Our route optimisation reduces food miles by 60% compared with supermarket supply chains.',
    industry: 'Consumer',
    fundingStage: 'Pre-seed',
    fundingRequired: 200000,
    location: 'São Paulo, Brazil',
    website: 'https://rootsy.com.br',
  },
  {
    name: 'QuantumBridge',
    tagline: 'Post-quantum encryption as a service',
    description:
      'QuantumBridge provides a drop-in API for organisations to replace RSA and ECC cryptography with NIST-approved post-quantum algorithms. Designed for financial institutions and government agencies preparing for the cryptography transition over the next decade.',
    industry: 'Deep Tech',
    fundingStage: 'Series A',
    fundingRequired: 8000000,
    location: 'Singapore',
    website: 'https://quantumbridge.io',
  },
  {
    name: 'CarbonPath',
    tagline: 'Verified carbon credits from regenerative agriculture',
    description:
      'CarbonPath works with farmers to measure, verify and sell carbon sequestration credits generated through soil health practices. Our end-to-end platform handles baseline measurement, annual monitoring and credit issuance on a transparent registry.',
    industry: 'Climate Tech',
    fundingStage: 'Series B+',
    fundingRequired: 25000000,
    location: 'Melbourne, Australia',
    website: 'https://carbonpath.earth',
  },
  {
    name: 'PetConnect',
    tagline: 'Marketplace and community for independent pet care providers',
    description:
      'PetConnect lets pet owners discover, book and review local dog walkers, sitters and groomers. Providers manage availability and payments through the app. Background checks and insurance coverage are included in every booking.',
    industry: 'Other',
    fundingStage: 'Seed',
    fundingRequired: 750000,
    location: 'Austin, TX, USA',
    website: 'https://petconnect.app',
  },
  {
    name: 'GridFlux',
    tagline: 'Smart demand response for commercial energy consumers',
    description:
      'GridFlux integrates with building management systems to automatically shift non-critical loads away from peak grid periods, reducing energy bills by 20–35% and earning utility incentives. Supports ESG reporting with real-time emissions data.',
    industry: 'Climate Tech',
    fundingStage: 'Series A',
    fundingRequired: 6500000,
    location: 'Amsterdam, Netherlands',
    website: 'https://gridflux.energy',
  },
  {
    name: 'DevPulse',
    tagline: 'Engineering analytics that improve delivery without surveillance',
    description:
      'DevPulse analyses git activity, PR reviews and deployment frequency to surface bottlenecks and forecast delivery dates. Dashboards are visible to the whole team, not just managers, fostering transparency rather than micromanagement.',
    industry: 'Technology',
    fundingStage: 'Seed',
    fundingRequired: 1800000,
    location: 'San Francisco, CA, USA',
    website: 'https://devpulse.io',
  },
  {
    name: 'MindBridge',
    tagline: 'Workplace mental health support for distributed teams',
    description:
      'MindBridge provides on-demand text and video sessions with licensed therapists, structured wellness programmes and anonymous team mood tracking. Designed for remote-first companies that want to support employee wellbeing at scale.',
    industry: 'Healthcare',
    fundingStage: 'Pre-seed',
    fundingRequired: 500000,
    location: 'London, UK',
    website: 'https://mindbridgehealth.com',
  },
  {
    name: 'TalentLoop',
    tagline: 'Structured hiring workflows for fast-growing startups',
    description:
      'TalentLoop replaces scattered spreadsheets and email threads with a lightweight ATS built for companies hiring their first 50 people. Includes scorecard templates, interview scheduling, offer management and basic onboarding checklists.',
    industry: 'SaaS',
    fundingStage: 'Series B+',
    fundingRequired: 18000000,
    location: 'New York, NY, USA',
    website: 'https://talentloop.co',
  },
  {
    name: 'Vaultly',
    tagline: 'Expense management and spend visibility for SMEs',
    description:
      'Vaultly issues virtual and physical cards to employees with pre-approved budgets and real-time spend alerts. Finance teams see every transaction the moment it happens and can set category-level rules without waiting for month-end reports.',
    industry: 'Finance',
    fundingStage: 'Pre-seed',
    fundingRequired: 650000,
    location: 'Lagos, Nigeria',
    website: 'https://vaultly.africa',
  },
  {
    name: 'NanoFab Labs',
    tagline: 'Accessible nanomaterial synthesis for research institutions',
    description:
      'NanoFab Labs produces precision-engineered nanomaterials to order for university and corporate R&D labs. Our automated synthesis platform cuts lead times from months to days and reduces per-unit cost by 70%, accelerating research in medicine, energy and materials science.',
    industry: 'Deep Tech',
    fundingStage: 'Seed',
    fundingRequired: 3200000,
    location: 'Zürich, Switzerland',
    website: 'https://nanofablabs.com',
  },
]

async function seed() {
  await connectDB()

  // Delete all existing startups so the seed is idempotent —
  // running it twice produces the same result as running it once.
  await Startup.deleteMany({})
  console.log('Cleared existing startups.')

  await Startup.insertMany(samples)
  console.log(`Inserted ${samples.length} sample startups.`)

  // Disconnect cleanly so the Node process exits on its own.
  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
