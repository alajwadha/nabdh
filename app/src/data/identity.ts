import { useAuth } from '../auth/AuthProvider';
import { DEMO_IDENTITY } from '../integrations/demo';

export type Identity = {
  firstName: string;
  fullName: string;
  initial: string;
  goal: string;
  foodStreakDays: number;
};

/**
 * Single source for the displayed user identity. Uses the signed-in profile's
 * name when available, otherwise the demo identity (e.g. in __DEV__). Replaces
 * the "Ali" / "A" literals that were scattered across screens.
 */
export function useIdentity(): Identity {
  const { profile } = useAuth();
  const displayName = (profile as { displayName?: string } | null)?.displayName?.trim();
  if (displayName) {
    const first = displayName.split(/\s+/)[0];
    return {
      firstName: first,
      fullName: displayName,
      initial: (first.charAt(0) || DEMO_IDENTITY.initial).toUpperCase(),
      goal: DEMO_IDENTITY.goal,
      foodStreakDays: DEMO_IDENTITY.foodStreakDays,
    };
  }
  return { ...DEMO_IDENTITY };
}
