/**
 * Trial Logic Service
 * Prevents dashboard access before trial requirements are met
 */

import { User } from '@clerk/nextjs/server';

export interface TrialStatus {
  isActive: boolean;
  daysRemaining: number;
  daysUsed: number;
  canAccessDashboard: boolean;
  requiresAction: 'none' | 'complete-onboarding' | 'upgrade' | 'verify-email';
  message?: string;
}

const TRIAL_DURATION_DAYS = 14;
const REQUIRED_CHARTS_BEFORE_UPGRADE = 3;

/**
 * Get user's trial status from Clerk metadata
 */
export function getTrialStatus(user: User | null): TrialStatus {
  if (!user) {
    return {
      isActive: false,
      daysRemaining: 0,
      daysUsed: 0,
      canAccessDashboard: false,
      requiresAction: 'none',
      message: 'User not authenticated'
    };
  }

  // Check metadata
  const metadata = user.publicMetadata as Record<string, any>;
  const trialStartDate = metadata?.trialStartDate ? new Date(metadata.trialStartDate) : null;
  const chartsGenerated = metadata?.chartsGenerated || 0;
  const hasPaidSubscription = metadata?.subscription === 'active';

  // If no trial start date, initialize one
  if (!trialStartDate && !hasPaidSubscription) {
    return {
      isActive: true,
      daysRemaining: TRIAL_DURATION_DAYS,
      daysUsed: 0,
      canAccessDashboard: true,
      requiresAction: 'none',
      message: 'Trial just started. You have 14 days to explore.'
    };
  }

  // Check if user has paid subscription
  if (hasPaidSubscription) {
    return {
      isActive: false,
      daysRemaining: 0,
      daysUsed: 0,
      canAccessDashboard: true,
      requiresAction: 'none',
      message: 'Premium subscriber'
    };
  }

  // Calculate trial progress
  if (trialStartDate) {
    const now = new Date();
    const daysUsed = Math.floor((now.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - daysUsed);

    // Check if trial is expired
    if (daysRemaining <= 0) {
      return {
        isActive: false,
        daysRemaining: 0,
        daysUsed: TRIAL_DURATION_DAYS,
        canAccessDashboard: false,
        requiresAction: 'upgrade',
        message: 'Your trial has expired. Upgrade to continue.'
      };
    }

    // Check if email is verified
    const emailVerified = user.emailAddresses?.some(e => e.verification?.status === 'verified') || false;
    if (!emailVerified) {
      return {
        isActive: true,
        daysRemaining,
        daysUsed,
        canAccessDashboard: false,
        requiresAction: 'verify-email',
        message: 'Please verify your email to access the dashboard.'
      };
    }

    // Check onboarding status
    const onboardingComplete = metadata?.onboardingComplete === true;
    if (!onboardingComplete) {
      return {
        isActive: true,
        daysRemaining,
        daysUsed,
        canAccessDashboard: true, // Can access but will see onboarding modal
        requiresAction: 'complete-onboarding',
        message: 'Complete your profile to get personalized insights.'
      };
    }

    return {
      isActive: true,
      daysRemaining,
      daysUsed,
      canAccessDashboard: true,
      requiresAction: 'none',
      message: `${daysRemaining} days remaining in your trial`
    };
  }

  return {
    isActive: false,
    daysRemaining: 0,
    daysUsed: 0,
    canAccessDashboard: false,
    requiresAction: 'upgrade',
    message: 'Trial information not available'
  };
}

/**
 * Check if user can skip trial and go to upgrade
 * Returns false if user hasn't generated enough charts
 */
export function canSkipTrial(user: User | null): boolean {
  if (!user) return false;

  const metadata = user.publicMetadata as Record<string, any>;
  const chartsGenerated = metadata?.chartsGenerated || 0;
  
  // User must generate at least one chart before they can upgrade
  // (Otherwise they're just skipping the experience)
  return chartsGenerated >= 1;
}

/**
 * Log chart generation for trial tracking
 * This should be called after every successful chart calculation
 */
export async function logChartGeneration(userId: string): Promise<void> {
  try {
    const response = await fetch('/api/trial/log-chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      console.warn('[Trial] Failed to log chart generation');
    }
  } catch (error) {
    console.error('[Trial] Error logging chart:', error);
  }
}

/**
 * Initialize trial on first login
 */
export async function initializeTrial(userId: string): Promise<void> {
  try {
    const response = await fetch('/api/trial/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      console.warn('[Trial] Failed to initialize trial');
    }
  } catch (error) {
    console.error('[Trial] Error initializing trial:', error);
  }
}
