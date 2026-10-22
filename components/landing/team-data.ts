export type TeamMember = {
  id: string;
  name?: string;
  role?: string;
  image?: string;
  website?: string;
  linkedin?: string;
};

export const coreTeam: TeamMember[] = [
  { id: '01', name: 'Kartik', role: 'Sensors & Embedded Software', image: '/team/01-kartik-v2.jpeg' },
  { id: '02', name: 'Kartikey', role: 'Web Dashboard & LoRa Gateway', image: '/team/02-kartikey.jpeg' },
  { id: '03', name: 'Jashan', role: 'Machine Learning & Mechanical Design', image: '/team/03-jashan.jpeg' },
  { id: '04', name: 'Ritisha', role: 'LoRa Gateway & Edge Computing', image: '/team/04-ritisha.jpeg' },
  { id: '06', name: 'Priyanka', role: 'CAD Modelling & Edge Computing', image: '/team/06-priyanka.jpeg' },
  { id: '07', name: 'Arjun', role: 'Electrical Systems & CAD Design', image: '/team/07-arjun.jpeg' },
];
