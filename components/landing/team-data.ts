export type TeamMember = {
  id: string;
  name?: string;
  role?: string;
  image?: string;
  website?: string;
  linkedin?: string;
};

export const coreTeam: TeamMember[] = [
  { id: '01', name: 'Kartik', role: 'Sensors / Software', image: '/team/01-kartik.jpeg' },
  { id: '02', name: 'Kartikey', role: 'Webdev / Gateway', image: '/team/02-kartikey.jpeg' },
  { id: '03', name: 'Jashan', role: 'ML / Mechanical', image: '/team/03-jashan.jpeg' },
  { id: '04', name: 'Ritisha', role: 'Gateway / Edge', image: '/team/04-ritisha.jpeg' },
  { id: '06', name: 'Priyanka', role: 'CAD / Edge', image: '/team/06-priyanka.jpeg' },
  { id: '07', name: 'Arjun', role: 'Electrical / CAD', image: '/team/07-arjun.jpeg' },
];
