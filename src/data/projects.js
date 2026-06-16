// projects.js
// Single source of truth for all portfolio projects.
// Sourced from context.txt — do not duplicate content elsewhere.
// category: 'featured' | 'hackathon' | 'more'

export const projects = [
  {
    id: 'lumo',
    title: 'Lumo',
    category: 'featured',
    hook: 'Kids have questions all day. Parents can\'t always pause everything — but they shouldn\'t have to hand trust to a black-box AI either.',
    what: 'A parent-controlled voice app for children ages 4–12. Built for honesty: no stored audio, no habit-forming design, full session visibility for parents.',
    why: 'Most voice AI was never designed around the constraints a child-facing product actually needs. Lumo rethinks what it should optimize for.',
    stack: ['FastAPI', 'WebSockets', 'React', 'Docker', 'TTS', 'VAD'],
    cta: 'Explore product →',
    links: {
      live: 'https://lumo.shreyas.space/',
      repo: null,
    },
    color: '#e8d5b0',
  },
  {
    id: 'cuse-rank',
    title: 'Cuse-Rank',
    category: 'featured',
    hook: 'Judging a research event sounds easy until fairness, expertise, and scheduling all collide at once.',
    what: 'A research poster evaluation system that assigns judges by expertise, balances workloads, and keeps rankings updating in real time.',
    why: 'We treated it as what it really was — part product, part optimization problem, part infrastructure challenge. Won first place.',
    stack: ['Angular', 'NestJS', 'FastAPI', 'OR-Tools', 'Sentence Transformers', 'Redis', 'PostgreSQL'],
    cta: 'See how I solved this →',
    links: {
      live: null,
      repo: 'https://github.com/melvin1117/ecs-reseach-day-poster-evaluation',
    },
    color: '#d4e8c8',
  },
  {
    id: 'oracc-assist',
    title: 'ORACC Assist',
    category: 'featured',
    hook: 'Ancient language corpora don\'t arrive clean, searchable, or ready for modern AI workflows.',
    what: 'Built the data, retrieval, and serving layers for an NLP research pipeline on Akkadian texts — 500K+ tokens, hybrid BM25 + dense search, LoRA fine-tuning.',
    why: 'Good AI work often starts long before generation. This project was about building the rails so the model could do anything at all.',
    stack: ['Python', 'HuggingFace', 'LoRA', 'BM25', 'FastAPI', 'Docker', 'GitHub Actions'],
    cta: 'Under the hood →',
    links: {
      live: null,
      repo: null,
    },
    color: '#e0d4ec',
  },
  {
    id: 'agrovision',
    title: 'AgroVision',
    category: 'hackathon',
    hook: 'Farm decisions are rarely made from one clean signal — soil, weather, drone footage, and on-ground conditions all tell part of the story.',
    what: 'A smart farming platform that unifies drone footage, IoT sensor data, and live weather context into a single actionable dashboard.',
    why: 'Not just another dashboard — an attempt to turn fragmented physical-world data into something a person could actually act on. 2nd place, Ag-Tech category.',
    stack: ['Next.js', 'FastAPI', 'MongoDB', 'Gemini AI', 'Celery', 'Docker'],
    cta: 'Deep dive →',
    links: {
      live: null,
      repo: 'https://github.com/melvin1117/ag-tech-hack-merced',
    },
    color: '#d4e8d0',
  },
  {
    id: 'report-xplain',
    title: 'Report Xplain',
    category: 'hackathon',
    hook: 'Medical reports carry real answers. But patients often receive them in a language that feels closed off.',
    what: 'Transforms uploaded lab reports into plain-language dashboards with visual summaries and practical recommendations — powered by Gemini.',
    why: 'The value wasn\'t just extraction. It was reducing the distance between a person and information that was already theirs.',
    stack: ['Angular', 'NestJS', 'PostgreSQL', 'Gemini AI', 'MinIO', 'Docker'],
    cta: 'See how I solved this →',
    links: {
      live: null,
      repo: 'https://github.com/melvin1117/report-xplain',
    },
    color: '#e8d4d4',
  },
  {
    id: 'hcl-netbanking',
    title: 'HCL Net Banking',
    category: 'more',
    hook: 'For an HCL Tech hackathon: build a net banking backend where reliability and structure matter more than flashy demos.',
    what: 'A clean, layered Spring Boot + MongoDB backend with structured service design, health endpoints, and a Docker deployment path.',
    why: 'Useful evidence of range — enterprise backend patterns outside the AI-heavy part of the portfolio.',
    stack: ['Java 17', 'Spring Boot', 'MongoDB', 'Docker', 'Maven'],
    cta: 'Explore this project →',
    links: {
      live: null,
      repo: 'https://github.com/Shreyas0Kumar/hclTech-Hackathon',
    },
    color: '#d8dce8',
  },
]

export const getFeatured   = () => projects.filter(p => p.category === 'featured')
export const getHackathons = () => projects.filter(p => p.category === 'hackathon')
export const getMore       = () => projects.filter(p => p.category === 'more')
