export type TeamMember = {
  id: string;
  name?: string;
  role?: string;
  image?: string;
  website?: string;
  linkedin?: string;
};

export const coreTeam: TeamMember[] = [
  { id: '01' },
  { id: '02' },
  { id: '03' },
  { id: '04' },
  { id: '05' },
  { id: '06' },
  { id: '07' },
];
