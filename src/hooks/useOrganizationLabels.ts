import { useMemo } from 'react';

export type OrganizationType = 'school' | 'charity' | 'nonprofit' | 'community';

interface OrganizationLabels {
  participant: string;
  participants: string;
  participantRole: string;
}

export function useOrganizationLabels(organizationType?: string): OrganizationLabels {
  return useMemo(() => {
    switch (organizationType) {
      case 'charity':
      case 'nonprofit':
        return {
          participant: 'Volunteer',
          participants: 'Volunteers',
          participantRole: 'volunteer'
        };
      case 'community':
        return {
          participant: 'Member',
          participants: 'Members',
          participantRole: 'member'
        };
      case 'school':
      default:
        return {
          participant: 'Student',
          participants: 'Students',
          participantRole: 'student'
        };
    }
  }, [organizationType]);
}
