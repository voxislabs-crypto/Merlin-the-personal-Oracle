/**
 * Self pillar — who the user is in this life weather.
 * @see docs/TWO_PILLARS.md
 */

export {
  buildIdentityPacket,
  resolveSelfMbtiType,
  type BuildIdentityPacketInput,
} from '@/lib/self/identity-packet';
export {
  buildOperatingSystemProfile,
  type BuildOperatingSystemInput,
  type OperatingSystemTrait,
} from '@/lib/self/operating-system';
export { buildEdgeTakeaway, type EdgeTakeaway } from '@/lib/self/edge-takeaway';
export type * from '@/lib/self/types';
