export interface Feature {
  id: string;
  value: string;
  label: string;
}

export const features: Feature[] = [
  {
    id: '1',
    value: '100%',
    label: 'PLANT-DERIVED',
  },
  {
    id: '2',
    value: '0',
    label: 'SULFATES · PARABENS',
  },
  {
    id: '3',
    value: 'pH',
    label: 'BALANCED',
  },
  {
    id: '4',
    value: 'Vegan',
    label: '& CRUELTY FREE',
  },
];
