import { NextResponse } from 'next/server';

// Pokemon types are static - no need to fetch from external API
const POKEMON_TYPES = [
  'Colorless',
  'Darkness',
  'Dragon',
  'Fairy',
  'Fighting',
  'Fire',
  'Grass',
  'Lightning',
  'Metal',
  'Psychic',
  'Water',
];

export async function GET() {
  return NextResponse.json({
    data: POKEMON_TYPES,
  });
}
