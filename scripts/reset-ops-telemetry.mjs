import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OPS_EVENT_TYPES = [
  'ops_scorecard_v1',
  'ops_phase_gate_v1',
  'ops_trust_calibration_v1',
  'ops_rollback_event_v1',
];

async function main() {
  const result = await prisma.userInteractionEvent.deleteMany({
    where: {
      type: {
        in: OPS_EVENT_TYPES,
      },
    },
  });

  console.log(`Reset complete: deleted ${result.count} ops telemetry events.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
