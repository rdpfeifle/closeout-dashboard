import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROJECTS = [
  {
    id: "6f4cf6f0-c36a-4c0d-9ff4-7dc73e2f7f0d",
    name: "Harbor Point Tower",
    address: "412 Wharf St, Oakland CA",
    gc: "Northshore Builders",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90),
  },
  {
    id: "2efe786c-79f5-4d7e-b2e5-b0896cd01953",
    name: "Mission Flats Phase II",
    address: "2900 Mission St, San Francisco CA",
    gc: "Coast Range Construction",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
  },
  {
    id: "41a5d95a-1299-4d2c-8618-89d99f6ea0e8",
    name: "Cedar Grove Schoolhouse",
    address: "78 Cedar Ln, Berkeley CA",
    gc: "Northshore Builders",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
];

const LOCATIONS_BY_PROJECT = {
  "6f4cf6f0-c36a-4c0d-9ff4-7dc73e2f7f0d": ["L1 Lobby", "L2 Corridor", "L3 Corridor", "Unit 304", "Unit 312 Bath", "Unit 405", "Roof Deck", "Mech Room", "Garage P1"],
  "2efe786c-79f5-4d7e-b2e5-b0896cd01953": ["Lobby", "L2 Amenity", "Unit 201", "Unit 207 Kitchen", "Unit 210 Bath", "Courtyard", "Bike Room"],
  "41a5d95a-1299-4d2c-8618-89d99f6ea0e8": ["Classroom 101", "Classroom 102", "Library", "Gymnasium", "Cafeteria", "Admin Office", "Restroom A"],
};

const ASSIGNEE_IDS = ["u1", "u2", "u3", "u4", "u5", "u6", "u7"];
const TRADES = ["Drywall", "Paint", "MEP", "Millwork", "Tile", "Flooring", "Glazing", "HVAC"];
const STATUSES = ["open", "open", "open", "in_progress", "in_progress", "pending", "complete", "complete", "reopened"];
const PRIORITIES = ["low", "med", "med", "high", "high", "crit"];
const DESCRIPTIONS = [
  "Touch up paint at door jamb, scuff visible from corridor",
  "Misaligned base trim at corner, gap > 1/8\"",
  "Outlet cover plate missing in hall closet",
  "Grout haze on tile floor near threshold",
  "Cabinet door rubs frame, needs hinge adjustment",
  "Caulk pulling away from countertop backsplash",
  "Drywall ding above light switch",
  "Diffuser uneven in ceiling grid, needs centering",
  "Door sweep not installed",
  "Loose handrail bracket at landing",
  "Missing fire-rated label on door frame",
  "Crack in window sealant at sill",
  "Floor transition strip lifting",
  "Light fixture flickers under load",
  "Smoke detector cover damaged",
  "Closet shelf bracket loose",
  "Toilet rocking, requires shimming and re-caulk",
  "Mirror clip missing at top corner",
  "Mech room - label all valves per spec",
  "Sprinkler head escutcheon missing",
  "Paint overspray on hardware",
  "Sliding door track binds at midpoint",
  "Carpet seam fraying near doorway",
  "Thermostat reads 4°F low - recalibrate",
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function formatCode(sequence) {
  return `PL-${String(sequence).padStart(3, "0")}`;
}

function buildPunchItems() {
  const items = [];
  let counter = 100;
  let codeSequence = 1;
  const usedItemKeys = new Set();

  for (const [projectIndex, project] of PROJECTS.entries()) {
    const locations = LOCATIONS_BY_PROJECT[project.id];
    const count = projectIndex === 0 ? 38 : projectIndex === 1 ? 26 : 20;
    const usedDescKeys = new Set();
    let descCursor = 0;

    for (let i = 0; i < count; i += 1) {
      const status = pick(STATUSES, i + counter);
      const priority = pick(PRIORITIES, i * 3 + counter);
      const trade = pick(TRADES, i + counter);
      const location = pick(locations, i);

      let description = "";
      for (let attempt = 0; attempt < DESCRIPTIONS.length; attempt += 1) {
        const candidate = DESCRIPTIONS[(descCursor + attempt) % DESCRIPTIONS.length];
        const key = `${candidate}@@${location}`;
        if (!usedDescKeys.has(key)) {
          description = candidate;
          usedDescKeys.add(key);
          descCursor = (descCursor + attempt + 1) % DESCRIPTIONS.length;
          break;
        }
      }
      if (!description) description = `${DESCRIPTIONS[i % DESCRIPTIONS.length]} (${location})`;

      let uniqueDescription = description;
      let dedupeN = 2;
      while (usedItemKeys.has(`${project.id}@@${location}@@${uniqueDescription}`)) {
        uniqueDescription = `${description} (${dedupeN})`;
        dedupeN += 1;
      }
      usedItemKeys.add(`${project.id}@@${location}@@${uniqueDescription}`);

      const assignedTo = i % 7 === 0 ? null : pick(ASSIGNEE_IDS, i + counter);
      const createdAt = new Date(Date.now() - 1000 * 60 * 60 * 24 * ((i % 30) + 1));
      const activity = [
        { id: `${project.id}-${counter}-a0`, ts: createdAt.getTime(), actor: "System", type: "create", message: "Item seeded" },
      ];

      items.push({
        code: formatCode(codeSequence),
        projectId: project.id,
        location,
        trade,
        description: uniqueDescription,
        status,
        priority,
        assignedTo,
        photo: null,
        dueAt: null,
        activity,
        createdAt,
      });

      counter += 1;
      codeSequence += 1;
    }
  }

  return items;
}

async function main() {
  const items = buildPunchItems();

  await prisma.punchItem.deleteMany();
  await prisma.project.deleteMany();

  await prisma.project.createMany({
    data: PROJECTS.map((project) => ({
      id: project.id,
      name: project.name,
      address: project.address,
      gc: project.gc,
      status: "active",
      createdAt: project.createdAt,
    })),
  });

  await prisma.punchItem.createMany({
    data: items,
  });

  console.log(`Seeded ${PROJECTS.length} projects and ${items.length} punch items.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
